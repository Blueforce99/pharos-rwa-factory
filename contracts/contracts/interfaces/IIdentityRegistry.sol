// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IIdentityRegistry {
    // Checks if a user is verified (KYC'd) to hold tokens
    function isVerified(address _user) external view returns (bool);
    function register(address _user) external;
}