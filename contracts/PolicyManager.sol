// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IPolicyManager.sol";
import "./IInsurancePool.sol";

contract PolicyManager is ERC721Enumerable, AccessControl, ReentrancyGuard, IPolicyManager {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PROCESSOR_ROLE = keccak256("PROCESSOR_ROLE"); // ClaimsProcessor

    uint256 private _policyIdCounter;

    IInsurancePool public insurancePool;

    // Mapping from policyId to Policy struct
    mapping(uint256 => Policy) private _policies;

    // Mapping from productId to its base premium in basis points (e.g. 210 = 2.1%)
    mapping(string => uint256) public basePremiumBps;

    // Mapping from policy NFT to its IPFS metadata URI
    mapping(uint256 => string) private _tokenURIs;

    constructor(address initialAdmin) ERC721("ChainShield Policy Certificate", "CSP-NFT") {
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(ADMIN_ROLE, initialAdmin);

        // Seed some default base premiums in basis points
        basePremiumBps["aave"] = 210;         // 2.1%
        basePremiumBps["uniswap"] = 180;      // 1.8%
        basePremiumBps["lido"] = 260;         // 2.6%
        basePremiumBps["health-std"] = 60;    // 0.6%
        basePremiumBps["auto-full"] = 47;     // 0.47%
        basePremiumBps["life-term-20"] = 9;   // 0.09%
        basePremiumBps["travel-basic"] = 450; // 4.5%
        basePremiumBps["travel-medical"] = 120;// 1.2%
    }

    function setInsurancePool(address poolAddress) external onlyRole(ADMIN_ROLE) {
        insurancePool = IInsurancePool(poolAddress);
    }

    function setBasePremiumBps(string calldata productId, uint256 bps) external onlyRole(ADMIN_ROLE) {
        basePremiumBps[productId] = bps;
    }

    /**
     * @dev Calculate dynamic premium based on base rates and pool utilization.
     */
    function calculatePremium(
        string memory productId,
        uint256 coverageAmount,
        string memory poolId
    ) public view returns (uint256) {
        uint256 bps = basePremiumBps[productId];
        if (bps == 0) bps = 200; // Default 2.0% base premium if not seeded

        uint256 basePremium = (coverageAmount * bps) / 10000;

        if (address(insurancePool) != address(0)) {
            // Adjust premium upwards if pool utilization is high (surging demand)
            uint256 utilization = insurancePool.getPoolUtilization(poolId); // e.g., 75 for 75%
            if (utilization > 50) {
                // Utilization surcharge up to +50% of the base premium
                uint256 surchargeFactor = (utilization - 50); // e.g., 25% surcharge
                basePremium += (basePremium * surchargeFactor) / 100;
            }
        }
        return basePremium;
    }

    /**
     * @dev Buy an insurance policy. Transfers ERC-20 premium to pool and mints NFT.
     */
    function purchasePolicy(
        address policyholder,
        string calldata productId,
        uint256 coverageAmount,
        uint256 durationDays,
        address premiumToken,
        string calldata poolId
    ) external override nonReentrant returns (uint256) {
        require(address(insurancePool) != address(0), "PolicyManager: Pool not configured");
        require(coverageAmount > 0, "PolicyManager: Coverage amount must exceed 0");
        require(durationDays >= 1, "PolicyManager: Invalid duration");

        uint256 premiumAmount = calculatePremium(productId, coverageAmount, poolId);

        // Transfer premium from policyholder (requires approval) to the InsurancePool
        require(
            IERC20(premiumToken).transferFrom(msg.sender, address(insurancePool), premiumAmount),
            "PolicyManager: Premium payment failed"
        );

        // Tell InsurancePool to record the premium collection
        insurancePool.collectPremium(poolId, premiumAmount);

        _policyIdCounter++;
        uint256 newPolicyId = _policyIdCounter;

        _safeMint(policyholder, newPolicyId);

        uint256 startDate = block.timestamp;
        uint256 endDate = block.timestamp + (durationDays * 1 days);

        _policies[newPolicyId] = Policy({
            policyholder: policyholder,
            productId: productId,
            coverageAmountUsd: coverageAmount,
            premiumAmountUsd: premiumAmount,
            startDate: startDate,
            endDate: endDate,
            status: PolicyStatus.Active,
            ipfsDocumentCid: "",
            poolId: poolId
        });

        emit PolicyCreated(
            newPolicyId,
            policyholder,
            productId,
            coverageAmount,
            premiumAmount,
            endDate
        );

        return newPolicyId;
    }

    /**
     * @dev Renew an existing active policy by paying an extension premium.
     */
    function renewPolicy(uint256 policyId, uint256 extensionDurationDays) external override nonReentrant {
        require(_ownerOf(policyId) != address(0), "PolicyManager: Policy does not exist");
        Policy storage policy = _policies[policyId];
        require(policy.status == PolicyStatus.Active, "PolicyManager: Policy is inactive");
        require(block.timestamp <= policy.endDate, "PolicyManager: Policy already expired");
        require(extensionDurationDays >= 1, "PolicyManager: Invalid extension duration");

        // Dynamic premium for the renewal extension
        uint256 renewalPremium = calculatePremium(policy.productId, policy.coverageAmountUsd, "pool-mixed");

        // We assume USDC or generic payment token is approved
        // In real terms we'd fetch premiumToken address, here we use USDC/DAI as specified by caller.
        // We'll require transferFrom caller to pool.
        // For simplicity, we assume caller pays the premium.
        // We can query the premiumToken from the parent pool.
        IInsurancePool.PoolInfo memory pool = insurancePool.getPool("pool-mixed");
        address premiumToken = pool.lpTokenAddress; // Demo placeholder: in real it's USDC/DAI address

        require(
            IERC20(premiumToken).transferFrom(msg.sender, address(insurancePool), renewalPremium),
            "PolicyManager: Renewal payment failed"
        );

        insurancePool.collectPremium("pool-mixed", renewalPremium);

        policy.endDate += (extensionDurationDays * 1 days);
        policy.premiumAmountUsd += renewalPremium;

        emit PolicyRenewed(policyId, policy.endDate, renewalPremium);
    }

    /**
     * @dev Cancel policy. Partial refund of unused premium if cancelled early.
     */
    function cancelPolicy(uint256 policyId) external override nonReentrant {
        address owner = _ownerOf(policyId);
        require(owner == msg.sender || hasRole(ADMIN_ROLE, msg.sender), "PolicyManager: Unauthorized");
        
        Policy storage policy = _policies[policyId];
        require(policy.status == PolicyStatus.Active, "PolicyManager: Policy not active");
        require(block.timestamp < policy.endDate, "PolicyManager: Policy already expired");

        uint256 totalDuration = policy.endDate - policy.startDate;
        uint256 elapsed = block.timestamp - policy.startDate;
        uint256 unusedTime = totalDuration > elapsed ? totalDuration - elapsed : 0;
        
        uint256 refundAmount = (policy.premiumAmountUsd * unusedTime) / totalDuration;

        policy.status = PolicyStatus.Cancelled;

        // Perform partial refund if applicable
        if (refundAmount > 0) {
            // Trigger refund payout from mixed pool
            insurancePool.payoutClaim(payable(policy.policyholder), refundAmount, "pool-mixed");
        }

        emit PolicyCancelled(policyId, refundAmount);
        emit PolicyStatusChanged(policyId, PolicyStatus.Cancelled);
    }

    /**
     * @dev Sets an IPFS CID document for the policy. (Used by backend/claims processor)
     */
    function setIpfsDocumentCid(uint256 policyId, string calldata cid) external {
        require(
            hasRole(ADMIN_ROLE, msg.sender) || hasRole(PROCESSOR_ROLE, msg.sender),
            "PolicyManager: Unauthorized"
        );
        require(_ownerOf(policyId) != address(0), "PolicyManager: Policy does not exist");
        _policies[policyId].ipfsDocumentCid = cid;
        _tokenURIs[policyId] = string(abi.encodePacked("ipfs://", cid));
    }

    /**
     * @dev Triggered by claims processor when a claim is approved/payout.
     */
    function markAsClaimed(uint256 policyId) external onlyRole(PROCESSOR_ROLE) {
        require(_ownerOf(policyId) != address(0), "PolicyManager: Policy does not exist");
        _policies[policyId].status = PolicyStatus.Claimed;
        emit PolicyStatusChanged(policyId, PolicyStatus.Claimed);
    }

    function getPolicy(uint256 policyId) external view override returns (Policy memory) {
        require(_ownerOf(policyId) != address(0), "PolicyManager: Policy does not exist");
        return _policies[policyId];
    }

    function isPolicyActive(uint256 policyId) public view override returns (bool) {
        if (_ownerOf(policyId) == address(0)) return false;
        Policy memory policy = _policies[policyId];
        return (policy.status == PolicyStatus.Active && block.timestamp <= policy.endDate);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return _tokenURIs[tokenId];
    }

    // Required overrides for ERC721Enumerable
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
