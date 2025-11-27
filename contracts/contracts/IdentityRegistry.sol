// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IIdentityRegistry.sol";

contract IdentityRegistry is IIdentityRegistry {
    mapping(address => bool) public whitelist;
    address public admin;

    constructor() {
        admin = msg.sender;
    }

    // In production, this would verify a ZK Proof from PharosID
    function register(address _user) external {
        // For Hackathon demo: Anyone can register themselves or Admin adds them
        whitelist[_user] = true;
    }

    function isVerified(address _user) external view override returns (bool) {
        return whitelist[_user];
    }
}