// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IInsurancePool {
    struct PoolInfo {
        string poolId;
        string productId;
        string name;
        string poolType;
        uint256 apyBasisPoints; // APY in basis points (e.g., 920 = 9.2%)
        uint256 tvlUsd;
        uint256 utilizationPct;
        uint256 lockPeriodDays;
        address lpTokenAddress;
        bool isActive;
        bool isAcceptingDeposits;
    }

    event LiquidityAdded(string indexed poolId, address indexed provider, uint256 amount, uint256 lpSharesMinted);
    event LiquidityRemoved(string indexed poolId, address indexed provider, uint256 amount, uint256 lpSharesBurned);
    event ClaimPaid(string indexed poolId, address indexed claimant, uint256 amount);
    event PremiumCollected(string indexed poolId, address indexed payer, uint256 amount);
    event YieldDistributed(string indexed poolId, uint256 amount);

    function deposit(string calldata poolId, uint256 amount) external returns (uint256 lpShares);
    function withdraw(string calldata poolId, uint256 lpShares) external returns (uint256 amountReturned);
    function payoutClaim(address payable claimant, uint256 amount, string calldata poolId) external;
    function collectPremium(string calldata poolId, uint256 amount) external;
    function getPool(string calldata poolId) external view returns (PoolInfo memory);
    function getPoolUtilization(string calldata poolId) external view returns (uint256);
}
