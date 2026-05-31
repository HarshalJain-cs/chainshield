// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IInsurancePool.sol";
import "./LPToken.sol";
import "./ChainShieldToken.sol";

contract InsurancePool is AccessControl, ReentrancyGuard, IInsurancePool {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant TRUSTED_CONTRACT_ROLE = keccak256("TRUSTED_CONTRACT_ROLE"); // PolicyManager, ClaimsProcessor

    ChainShieldToken public cstToken;

    // List of registered poolIds
    string[] private _poolIdsList;
    
    // Mapping from poolId to PoolInfo struct
    mapping(string => PoolInfo) private _pools;

    // Underlaying asset token address for each pool (e.g., USDC address)
    mapping(string => address) public poolUnderlyingToken;

    // LP Staking rewards data structure
    struct LPStaker {
        uint256 amount;          // Deposited amount
        uint256 rewardDebt;      // Reward debt
        uint256 pendingRewards;  // Accumulated pending rewards
        uint256 lastUpdateBlock; // Last block where rewards were updated
    }

    // Mapping: poolId => userAddress => LPStaker details
    mapping(string => mapping(address => LPStaker)) public stakers;

    // Staking parameters per pool
    mapping(string => uint256) public accRewardPerShare;
    mapping(string => uint256) public lastRewardBlock;
    
    // Emissions rate: CST minted per block for LPs
    uint256 public rewardPerBlock = 1 * 10**17; // 0.1 CST per block default

    constructor(address initialAdmin, address cstAddress) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(ADMIN_ROLE, initialAdmin);
        _grantRole(TRUSTED_CONTRACT_ROLE, initialAdmin);

        cstToken = ChainShieldToken(cstAddress);
    }

    function createPool(
        string calldata poolId,
        string calldata productId,
        string calldata name,
        string calldata poolType,
        uint256 apyBps,
        uint256 lockPeriodDays,
        address underlyingToken
    ) external onlyRole(ADMIN_ROLE) {
        require(_pools[poolId].lpTokenAddress == address(0), "InsurancePool: Pool already exists");

        // Dynamically deploy a new LP Token for this pool
        LPToken newLpToken = new LPToken(
            string(abi.encodePacked("ChainShield LP - ", name)),
            string(abi.encodePacked("CS-LP-", poolId)),
            address(this)
        );

        _pools[poolId] = PoolInfo({
            poolId: poolId,
            productId: productId,
            name: name,
            poolType: poolType,
            apyBasisPoints: apyBps,
            tvlUsd: 0,
            utilizationPct: 0,
            lockPeriodDays: lockPeriodDays,
            lpTokenAddress: address(newLpToken),
            isActive: true,
            isAcceptingDeposits: true
        });

        poolUnderlyingToken[poolId] = underlyingToken;
        _poolIdsList.push(poolId);
        
        lastRewardBlock[poolId] = block.number;
        accRewardPerShare[poolId] = 0;
    }

    function setRewardPerBlock(uint256 rate) external onlyRole(ADMIN_ROLE) {
        rewardPerBlock = rate;
    }

    function updateStakingPool(string memory poolId) public {
        if (block.number <= lastRewardBlock[poolId]) {
            return;
        }
        PoolInfo storage pool = _pools[poolId];
        if (pool.tvlUsd == 0) {
            lastRewardBlock[poolId] = block.number;
            return;
        }
        uint256 multiplier = block.number - lastRewardBlock[poolId];
        uint256 cstReward = multiplier * rewardPerBlock;

        // Mint reward tokens to this pool manager contract (requires MINTER_ROLE on CST)
        cstToken.mint(address(this), cstReward);

        accRewardPerShare[poolId] += (cstReward * 1e12) / pool.tvlUsd;
        lastRewardBlock[poolId] = block.number;
    }

    /**
     * @dev Liquidity provider deposits assets into the underwriting pool.
     */
    function deposit(string calldata poolId, uint256 amount) 
        external 
        override 
        nonReentrant 
        returns (uint256 lpShares) 
    {
        PoolInfo storage pool = _pools[poolId];
        require(pool.isActive && pool.isAcceptingDeposits, "InsurancePool: Pool not accepting deposits");
        require(amount > 0, "InsurancePool: Deposit must exceed 0");

        address token = poolUnderlyingToken[poolId];
        require(token != address(0), "InsurancePool: Token not initialized");

        // Staking update
        updateStakingPool(poolId);
        LPStaker storage staker = stakers[poolId][msg.sender];
        if (staker.amount > 0) {
            uint256 pending = ((staker.amount * accRewardPerShare[poolId]) / 1e12) - staker.rewardDebt;
            if (pending > 0) {
                staker.pendingRewards += pending;
            }
        }

        // Transfer funds from provider to this pool contract
        require(
            IERC20(token).transferFrom(msg.sender, address(this), amount),
            "InsurancePool: Token transfer failed"
        );

        // Standard shares math: 1 share = 1 unit of token initially
        // Otherwise proportional to current pool ratio
        uint256 lpSharesToMint = amount;
        LPToken lp = LPToken(pool.lpTokenAddress);
        uint256 totalShares = lp.totalSupply();
        if (totalShares > 0 && pool.tvlUsd > 0) {
            lpSharesToMint = (amount * totalShares) / pool.tvlUsd;
        }

        lp.mint(msg.sender, lpSharesToMint);
        pool.tvlUsd += amount;

        staker.amount += amount;
        staker.rewardDebt = (staker.amount * accRewardPerShare[poolId]) / 1e12;
        staker.lastUpdateBlock = block.number;

        emit LiquidityAdded(poolId, msg.sender, amount, lpSharesToMint);
        return lpSharesToMint;
    }

    /**
     * @dev LP withdraws assets from underwriting pool.
     */
    function withdraw(string calldata poolId, uint256 lpShares) 
        external 
        override 
        nonReentrant 
        returns (uint256 amountReturned) 
    {
        PoolInfo storage pool = _pools[poolId];
        require(pool.isActive, "InsurancePool: Pool is inactive");
        require(lpShares > 0, "InsurancePool: Shares must exceed 0");

        LPToken lp = LPToken(pool.lpTokenAddress);
        require(lp.balanceOf(msg.sender) >= lpShares, "InsurancePool: Insufficient shares");

        // Staking update
        updateStakingPool(poolId);
        LPStaker storage staker = stakers[poolId][msg.sender];
        uint256 pending = ((staker.amount * accRewardPerShare[poolId]) / 1e12) - staker.rewardDebt;
        if (pending > 0) {
            staker.pendingRewards += pending;
        }

        uint256 totalShares = lp.totalSupply();
        uint256 cashAmount = (lpShares * pool.tvlUsd) / totalShares;
        
        // Safety checks for staker mapping sync
        if (cashAmount > staker.amount) {
            cashAmount = staker.amount;
        }

        lp.burn(msg.sender, lpShares);
        pool.tvlUsd -= cashAmount;

        staker.amount -= cashAmount;
        staker.rewardDebt = (staker.amount * accRewardPerShare[poolId]) / 1e12;

        address token = poolUnderlyingToken[poolId];
        require(IERC20(token).transfer(msg.sender, cashAmount), "InsurancePool: Transfer failed");

        emit LiquidityRemoved(poolId, msg.sender, cashAmount, lpShares);
        return cashAmount;
    }

    /**
     * @dev Claim accrued CST token staking rewards.
     */
    function claimRewards(string calldata poolId) external nonReentrant {
        updateStakingPool(poolId);
        LPStaker storage staker = stakers[poolId][msg.sender];
        uint256 pending = ((staker.amount * accRewardPerShare[poolId]) / 1e12) - staker.rewardDebt;
        uint256 totalRewards = staker.pendingRewards + pending;

        require(totalRewards > 0, "InsurancePool: No rewards accrued");

        staker.pendingRewards = 0;
        staker.rewardDebt = (staker.amount * accRewardPerShare[poolId]) / 1e12;

        require(cstToken.transfer(msg.sender, totalRewards), "InsurancePool: CST transfer failed");
    }

    /**
     * @dev Triggered by claims processor on claim approval. Pays out from underwriter pool.
     */
    function payoutClaim(
        address payable claimant,
        uint256 amount,
        string calldata poolId
    ) external override onlyRole(TRUSTED_CONTRACT_ROLE) nonReentrant {
        PoolInfo storage pool = _pools[poolId];
        require(pool.tvlUsd >= amount, "InsurancePool: Insufficient pool liquidity");

        pool.tvlUsd -= amount;

        // Recalculate utilization percentage based on payouts
        _recalculateUtilization(poolId);

        address token = poolUnderlyingToken[poolId];
        require(IERC20(token).transfer(claimant, amount), "InsurancePool: Payout transfer failed");

        emit ClaimPaid(poolId, claimant, amount);
    }

    /**
     * @dev Recovers premium collected by the PolicyManager and increments pool TVL.
     */
    function collectPremium(
        string calldata poolId,
        uint256 amount
    ) external override onlyRole(TRUSTED_CONTRACT_ROLE) {
        PoolInfo storage pool = _pools[poolId];
        pool.tvlUsd += amount;
        _recalculateUtilization(poolId);

        emit PremiumCollected(poolId, msg.sender, amount);
    }

    function distributeYieldExternal(string calldata poolId, uint256 amount) external onlyRole(ADMIN_ROLE) {
        PoolInfo storage pool = _pools[poolId];
        pool.tvlUsd += amount;
        emit YieldDistributed(poolId, amount);
    }

    function _recalculateUtilization(string memory poolId) internal {
        PoolInfo storage pool = _pools[poolId];
        if (pool.tvlUsd == 0) {
            pool.utilizationPct = 0;
            return;
        }
        // Mock utilization representation based on active claims vs TVL ratio
        // Real utilization incorporates active underwritten coverage vs TVL.
        // For development we compute utilizationPct basis points.
        pool.utilizationPct = 50; // default standard utilization target
    }

    function getPool(string calldata poolId) external view override returns (PoolInfo memory) {
        require(_pools[poolId].lpTokenAddress != address(0), "InsurancePool: Pool does not exist");
        return _pools[poolId];
    }

    function getPoolUtilization(string calldata poolId) public view override returns (uint256) {
        return _pools[poolId].utilizationPct;
    }

    function getPoolIds() external view returns (string[] memory) {
        return _poolIdsList;
    }

    function pendingCstRewards(string calldata poolId, address user) external view returns (uint256) {
        LPStaker memory staker = stakers[poolId][user];
        uint256 lpAccRewardPerShare = accRewardPerShare[poolId];
        PoolInfo memory pool = _pools[poolId];
        if (block.number > lastRewardBlock[poolId] && pool.tvlUsd > 0) {
            uint256 multiplier = block.number - lastRewardBlock[poolId];
            uint256 cstReward = multiplier * rewardPerBlock;
            lpAccRewardPerShare += (cstReward * 1e12) / pool.tvlUsd;
        }
        return (staker.amount * lpAccRewardPerShare) / 1e12 - staker.rewardDebt + staker.pendingRewards;
    }
}
