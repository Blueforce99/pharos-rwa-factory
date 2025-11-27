// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IIdentityRegistry.sol";

contract RWAToken is ERC20, Ownable {
    IIdentityRegistry public identityRegistry;

    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address _registry,
        address _issuer
    ) ERC20(name, symbol) Ownable(_issuer) {
        identityRegistry = IIdentityRegistry(_registry);
        _mint(_issuer, initialSupply * 10**decimals());
    }

    // THE COMPLIANCE HOOK
    // This runs before ANY transfer. If receiver is not KYC'd, it fails.
    function _update(address from, address to, uint256 value) internal override {
        if (from != address(0) && to != address(0)) { // Skip checks for mint/burn
            require(identityRegistry.isVerified(to), "Pharos Compliance: Receiver not verified");
        }
        super._update(from, to, value);
    }
}