// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract LPToken is ERC20, AccessControl {
    bytes32 public constant POOL_ROLE = keccak256("POOL_ROLE");

    constructor(
        string memory name,
        string memory symbol,
        address poolAddress
    ) ERC20(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, poolAddress);
        _grantRole(POOL_ROLE, poolAddress);
    }

    /**
     * @dev Mint new LP share tokens on liquidity deposit.
     */
    function mint(address to, uint256 amount) external onlyRole(POOL_ROLE) {
        _mint(to, amount);
    }

    /**
     * @dev Burn LP share tokens on liquidity withdrawal.
     */
    function burn(address from, uint256 amount) external onlyRole(POOL_ROLE) {
        _burn(from, amount);
    }
}
