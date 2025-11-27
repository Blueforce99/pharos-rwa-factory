// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RWAToken.sol";
import "./IdentityRegistry.sol";

contract AssetFactory {
    // Stores all tokens created by this factory
    struct Asset {
        address tokenAddress;
        address registryAddress;
        string name;
        address owner;
    }

    Asset[] public deployedAssets;

    event AssetDeployed(address indexed owner, address tokenAddress, address registryAddress);

    function deployRWA(string memory _name, string memory _symbol, uint256 _supply) external {
        // 1. Deploy a fresh Identity Registry for this asset
        IdentityRegistry newRegistry = new IdentityRegistry();
        
        // 2. Deploy the Token, linking it to the Registry
        RWAToken newToken = new RWAToken(_name, _symbol, _supply, address(newRegistry), msg.sender);

        // 3. Register the issuer (user) so they can hold the initial supply
        newRegistry.register(msg.sender);

        deployedAssets.push(Asset({
            tokenAddress: address(newToken),
            registryAddress: address(newRegistry),
            name: _name,
            owner: msg.sender
        }));

        emit AssetDeployed(msg.sender, address(newToken), address(newRegistry));
    }

    function getAssets() external view returns (Asset[] memory) {
        return deployedAssets;
    }
}