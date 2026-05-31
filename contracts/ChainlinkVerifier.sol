// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

interface IClaimsProcessorCallback {
    function fulfillOracleExploitCheck(uint256 claimId, bool confirmed, uint256 verifiedAmount) external;
}

contract ChainlinkVerifier is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    address public claimsProcessor;
    address public routerAddress; // Chainlink Functions Router Address

    // Maps requestId to claimId
    mapping(bytes32 => uint256) public requestToClaimId;

    // Maps claimId to requestId
    mapping(uint256 => bytes32) public claimToRequestId;

    // Chainlink Functions parameters
    uint64 public subscriptionId;
    uint32 public gasLimit = 300000;
    bytes32 public donId; // DON ID for Chainlink Functions

    // JavaScript source code to execute off-chain in Chainlink DON
    string public oracleSourceCode = 
        "const protocol = args[0];"
        "const txHash = args[1];"
        "const response = await Functions.makeHttpRequest({"
        "  url: `https://api.llama.fi/protocol/${protocol}`"
        "});"
        "const data = response.data;"
        "const hackFound = data && data.description && data.description.toLowerCase().includes('exploit');"
        "return Functions.encodeUint256(hackFound ? 1 : 0);";

    event OracleRequestSent(bytes32 indexed requestId, uint256 indexed claimId, string protocolName, string txHash);
    event OracleResponseReceived(bytes32 indexed requestId, uint256 indexed claimId, bool confirmed, bytes response, bytes err);
    event OracleSourceCodeUpdated(string newSourceCode);

    constructor(address initialAdmin, address claimsProcessorAddress) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(ADMIN_ROLE, initialAdmin);
        _grantRole(ORACLE_ROLE, initialAdmin);

        claimsProcessor = claimsProcessorAddress;
        // Sepolia Router Address placeholder
        routerAddress = 0xb83E47C2bC239B3bf370bc41e1459A34b41238D0;
        donId = 0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000; // fun-ethereum-sepolia-1
    }

    function setClaimsProcessor(address processor) external onlyRole(ADMIN_ROLE) {
        claimsProcessor = processor;
    }

    function setRouter(address router, bytes32 newDonId) external onlyRole(ADMIN_ROLE) {
        routerAddress = router;
        donId = newDonId;
    }

    function setSubscriptionId(uint64 subId) external onlyRole(ADMIN_ROLE) {
        subscriptionId = subId;
    }

    function setSourceCode(string calldata code) external onlyRole(ADMIN_ROLE) {
        oracleSourceCode = code;
        emit OracleSourceCodeUpdated(code);
    }

    /**
     * @dev Called by the ClaimsProcessor to initiate a Chainlink Functions query.
     */
    function requestExploitCheck(
        uint256 claimId,
        string calldata protocolName,
        string calldata incidentTxHash
    ) external onlyRole(ORACLE_ROLE) returns (bytes32 requestId) {
        require(claimsProcessor != address(0), "Verifier: Claims processor not configured");
        
        // Generate a deterministic pseudo-random request ID since we are bypassing 
        // the external router call if subscription is not active.
        // In full production, this calls FunctionsClient.sendRequest(...)
        bytes32 reqId = keccak256(abi.encodePacked(block.timestamp, claimId, protocolName, incidentTxHash));
        
        requestToClaimId[reqId] = claimId;
        claimToRequestId[claimId] = reqId;

        emit OracleRequestSent(reqId, claimId, protocolName, incidentTxHash);
        return reqId;
    }

    /**
     * @dev Callback method executed by the Chainlink Functions Router when the computation is done.
     * Inherited from standard FunctionsClient.
     */
    function handleOracleFulfillment(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) external {
        // Restricted to Chainlink Router Address or custom admin triggers
        require(
            msg.sender == routerAddress || hasRole(ADMIN_ROLE, msg.sender),
            "Verifier: Caller must be router or admin"
        );

        uint256 claimId = requestToClaimId[requestId];
        require(claimId != 0, "Verifier: Request ID not found");

        bool confirmed = false;
        uint256 verifiedAmount = 0;

        if (response.length > 0 && err.length == 0) {
            uint256 result = abi.decode(response, (uint256));
            confirmed = (result == 1);
            if (confirmed) {
                // Fetch claim details via interface
                // Assume full requested amount verified if pass
                verifiedAmount = 5000; // Demo fallback payout limit
            }
        }

        emit OracleResponseReceived(requestId, claimId, confirmed, response, err);

        // Callback to ClaimsProcessor
        IClaimsProcessorCallback(claimsProcessor).fulfillOracleExploitCheck(claimId, confirmed, verifiedAmount);
    }

    /**
     * @dev Administrative mock route: enables developers to manually seed oracle responses
     * on local testing or testnets without requiring active LINK subscriptions.
     */
    function simulateOracleFulfillment(
        uint256 claimId,
        bool confirmed,
        uint256 verifiedAmount
    ) external onlyRole(ADMIN_ROLE) {
        bytes32 reqId = claimToRequestId[claimId];
        if (reqId == bytes32(0)) {
            reqId = keccak256(abi.encodePacked(block.timestamp, claimId));
            requestToClaimId[reqId] = claimId;
            claimToRequestId[claimId] = reqId;
        }

        emit OracleResponseReceived(reqId, claimId, confirmed, abi.encode(confirmed ? 1 : 0), "");

        IClaimsProcessorCallback(claimsProcessor).fulfillOracleExploitCheck(claimId, confirmed, verifiedAmount);
    }
}
