// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IClaimsProcessor {
    enum ClaimStatus { OracleChecking, ManualReview, Approved, Rejected, Paid, Appealed }
    enum OracleVerdict { Pending, Pass, Fail, NA }

    struct Claim {
        uint256 claimId;
        uint256 policyId;
        address claimant;
        string incidentType;
        string description;
        uint256 requestedAmountUsd;
        ClaimStatus status;
        OracleVerdict oracleVerdict;
        string[] evidenceCids;
        string incidentTxHash;
        uint256 createdAt;
        uint256 updatedAt;
    }

    event ClaimSubmitted(uint256 indexed claimId, uint256 indexed policyId, address indexed claimant, uint256 amount);
    event ClaimApproved(uint256 indexed claimId, uint256 approvedAmount, string decisionReason);
    event ClaimRejected(uint256 indexed claimId, string decisionReason);
    event ClaimPaid(uint256 indexed claimId, address indexed claimant, uint256 payoutAmount);
    event ClaimAppealed(uint256 indexed claimId, string newEvidenceCid);

    function submitClaim(
        uint256 policyId,
        uint256 amountUsd,
        string calldata incidentType,
        string calldata description,
        string[] memory evidenceCids,
        string calldata incidentTxHash
    ) external returns (uint256);

    function reviewClaim(
        uint256 claimId,
        bool approved,
        uint256 approvedAmount,
        string calldata decisionReason
    ) external;

    function appealClaim(uint256 claimId, string calldata newEvidenceCid) external;
    function getClaim(uint256 claimId) external view returns (Claim memory);
}
