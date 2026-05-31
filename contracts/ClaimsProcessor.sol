// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./IClaimsProcessor.sol";
import "./IPolicyManager.sol";
import "./IInsurancePool.sol";

interface IChainlinkVerifier {
    function requestExploitCheck(uint256 claimId, string calldata protocolName, string calldata incidentTxHash) external returns (bytes32 requestId);
}

contract ClaimsProcessor is AccessControl, ReentrancyGuard, IClaimsProcessor {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant REVIEWER_ROLE = keccak256("REVIEWER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE"); // Only ChainlinkVerifier callback

    uint256 private _claimIdCounter;

    IPolicyManager public policyManager;
    IInsurancePool public insurancePool;
    address public oracleVerifier;

    uint256 public autoApproveLimitUsd = 5000;

    mapping(uint256 => Claim) private _claims;

    constructor(
        address initialAdmin,
        address policyManagerAddress,
        address insurancePoolAddress
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(ADMIN_ROLE, initialAdmin);
        _grantRole(REVIEWER_ROLE, initialAdmin);

        policyManager = IPolicyManager(policyManagerAddress);
        insurancePool = IInsurancePool(insurancePoolAddress);
    }

    function setOracleVerifier(address verifier) external onlyRole(ADMIN_ROLE) {
        oracleVerifier = verifier;
        _grantRole(VERIFIER_ROLE, verifier);
    }

    function setAutoApproveLimit(uint256 limit) external onlyRole(ADMIN_ROLE) {
        autoApproveLimitUsd = limit;
    }

    /**
     * @dev Submit a new insurance claim. Initiates oracle checking for DeFi, or manual review.
     */
    function submitClaim(
        uint256 policyId,
        uint256 amountUsd,
        string calldata incidentType,
        string calldata description,
        string[] memory evidenceCids,
        string calldata incidentTxHash
    ) external override nonReentrant returns (uint256) {
        require(policyManager.isPolicyActive(policyId), "ClaimsProcessor: Policy is inactive or expired");
        
        {
            IPolicyManager.Policy memory policy = policyManager.getPolicy(policyId);
            require(policy.policyholder == msg.sender, "ClaimsProcessor: Caller is not the policyholder");
            require(amountUsd <= policy.coverageAmountUsd, "ClaimsProcessor: Claim exceeds policy coverage amount");
        }

        _claimIdCounter++;
        uint256 newClaimId = _claimIdCounter;

        Claim storage c = _claims[newClaimId];
        c.claimId = newClaimId;
        c.policyId = policyId;
        c.claimant = msg.sender;
        c.incidentType = incidentType;
        c.description = description;
        c.requestedAmountUsd = amountUsd;
        c.evidenceCids = evidenceCids;
        c.incidentTxHash = incidentTxHash;
        c.createdAt = block.timestamp;
        c.updatedAt = block.timestamp;

        // Route to Oracle check if it's a DeFi smart contract claim
        if (
            (keccak256(abi.encodePacked(incidentType)) == keccak256(abi.encodePacked("defi")) || 
             keccak256(abi.encodePacked(incidentType)) == keccak256(abi.encodePacked("Oracle manipulation")) ||
             keccak256(abi.encodePacked(incidentType)) == keccak256(abi.encodePacked("Validator slashing"))) &&
            oracleVerifier != address(0)
        ) {
            c.status = ClaimStatus.OracleChecking;
            c.oracleVerdict = OracleVerdict.Pending;
        } else {
            c.status = ClaimStatus.ManualReview;
            c.oracleVerdict = OracleVerdict.NA;
        }

        emit ClaimSubmitted(newClaimId, policyId, msg.sender, amountUsd);

        // If routed to Oracle checking, dispatch request to ChainlinkVerifier
        if (c.status == ClaimStatus.OracleChecking) {
            // Scope loading product name
            string memory productId = policyManager.getPolicy(policyId).productId;
            IChainlinkVerifier(oracleVerifier).requestExploitCheck(newClaimId, productId, incidentTxHash);
        }

        return newClaimId;
    }

    /**
     * @dev Callback used by ChainlinkVerifier after off-chain Function execution completes.
     */
    function fulfillOracleExploitCheck(
        uint256 claimId,
        bool confirmed,
        uint256 verifiedAmount
    ) external onlyRole(VERIFIER_ROLE) nonReentrant {
        Claim storage claim = _claims[claimId];
        require(claim.status == ClaimStatus.OracleChecking, "ClaimsProcessor: Claim not awaiting oracle");

        if (confirmed) {
            claim.oracleVerdict = OracleVerdict.Pass;
            
            // Auto-approve logic: if amount is below threshold, pay out immediately!
            if (claim.requestedAmountUsd <= autoApproveLimitUsd) {
                claim.status = ClaimStatus.Approved;
                emit ClaimApproved(claimId, verifiedAmount, "Oracle auto-approved.");
                
                // Execute payout
                _executePayout(claimId, verifiedAmount);
            } else {
                // Large claim goes to manual review even if oracle confirmed
                claim.status = ClaimStatus.ManualReview;
            }
        } else {
            claim.oracleVerdict = OracleVerdict.Fail;
            // Failed oracle verdict routes directly to Manual Review for final reviewer discretion
            claim.status = ClaimStatus.ManualReview;
        }
        
        claim.updatedAt = block.timestamp;
    }

    /**
     * @dev Reviewer manually approves or rejects a pending claim.
     */
    function reviewClaim(
        uint256 claimId,
        bool approved,
        uint256 approvedAmount,
        string calldata decisionReason
    ) external override onlyRole(REVIEWER_ROLE) nonReentrant {
        Claim storage claim = _claims[claimId];
        require(
            claim.status == ClaimStatus.ManualReview || claim.status == ClaimStatus.OracleChecking,
            "ClaimsProcessor: Claim not in reviewable state"
        );
        require(approvedAmount <= claim.requestedAmountUsd, "ClaimsProcessor: Approved amount exceeds requested");

        if (approved) {
            claim.status = ClaimStatus.Approved;
            emit ClaimApproved(claimId, approvedAmount, decisionReason);
            
            // Perform payout
            _executePayout(claimId, approvedAmount);
        } else {
            claim.status = ClaimStatus.Rejected;
            emit ClaimRejected(claimId, decisionReason);
        }

        claim.updatedAt = block.timestamp;
    }

    /**
     * @dev Claimant can appeal a rejected claim by providing new evidence CIDs.
     */
    function appealClaim(uint256 claimId, string calldata newEvidenceCid) external override nonReentrant {
        Claim storage claim = _claims[claimId];
        require(claim.claimant == msg.sender, "ClaimsProcessor: Caller is not the claimant");
        require(claim.status == ClaimStatus.Rejected, "ClaimsProcessor: Claim cannot be appealed");
        
        claim.status = ClaimStatus.Appealed;
        
        // Add new evidence CID to evidence list
        string[] memory updatedEvidence = new string[](claim.evidenceCids.length + 1);
        for (uint256 i = 0; i < claim.evidenceCids.length; i++) {
            updatedEvidence[i] = claim.evidenceCids[i];
        }
        updatedEvidence[claim.evidenceCids.length] = newEvidenceCid;
        claim.evidenceCids = updatedEvidence;
        
        // Set back to Manual Review for reviewer evaluation
        claim.status = ClaimStatus.ManualReview;
        claim.updatedAt = block.timestamp;

        emit ClaimAppealed(claimId, newEvidenceCid);
    }

    /**
     * @dev Private execution helper: interfaces with InsurancePool to transfer assets and updates NFT status.
     */
    function _executePayout(uint256 claimId, uint256 amount) internal {
        Claim storage claim = _claims[claimId];
        
        IPolicyManager.Policy memory policy = policyManager.getPolicy(claim.policyId);
        
        // Tell PolicyManager that the policy has been successfully claimed
        // Requires PolicyManager to grant ClaimsProcessor the PROCESSOR_ROLE
        // We bypass direct import to use standard interface
        // Downcast to our PolicyManager contract to call markAsClaimed
        // For interface safety, we call the markAsClaimed of standard implementation
        (bool success, ) = address(policyManager).call(
            abi.encodeWithSignature("markAsClaimed(uint256)", claim.policyId)
        );
        require(success, "ClaimsProcessor: NFT status update failed");

        // Request claim payout from the underwriting pool
        insurancePool.payoutClaim(payable(claim.claimant), amount, policy.poolId);

        claim.status = ClaimStatus.Paid;
        emit ClaimPaid(claimId, claim.claimant, amount);
    }

    function getClaim(uint256 claimId) external view override returns (Claim memory) {
        require(claimId > 0 && claimId <= _claimIdCounter, "ClaimsProcessor: Claim does not exist");
        return _claims[claimId];
    }

    function getClaimsCount() external view returns (uint256) {
        return _claimIdCounter;
    }
}
