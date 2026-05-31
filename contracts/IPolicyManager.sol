// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPolicyManager {
    enum PolicyStatus { Active, Expired, Cancelled, Claimed }

    struct Policy {
        address policyholder;
        string productId;
        uint256 coverageAmountUsd;
        uint256 premiumAmountUsd;
        uint256 startDate;
        uint256 endDate;
        PolicyStatus status;
        string ipfsDocumentCid;
        string poolId;
    }

    event PolicyCreated(
        uint256 indexed policyId,
        address indexed policyholder,
        string productId,
        uint256 coverageAmount,
        uint256 premiumAmount,
        uint256 endDate
    );

    event PolicyRenewed(uint256 indexed policyId, uint256 newEndDate, uint256 premiumPaid);
    event PolicyCancelled(uint256 indexed policyId, uint256 refundAmount);
    event PolicyStatusChanged(uint256 indexed policyId, PolicyStatus newStatus);

    function purchasePolicy(
        address policyholder,
        string calldata productId,
        uint256 coverageAmount,
        uint256 durationDays,
        address premiumToken,
        string calldata poolId
    ) external returns (uint256);

    function renewPolicy(uint256 policyId, uint256 extensionDurationDays) external;
    function cancelPolicy(uint256 policyId) external;
    function getPolicy(uint256 policyId) external view returns (Policy memory);
    function isPolicyActive(uint256 policyId) external view returns (bool);
}
