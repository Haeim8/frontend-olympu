// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IKeeperRegistry {
    function registerUpkeep(
        address target,
        uint32 gasLimit,
        address admin,
        bytes calldata checkData,
        bytes calldata offchainConfig
    ) external returns (uint256 id);

    function addFunds(uint256 id, uint96 amount) external;
    
    function cancelUpkeep(uint256 id) external;
    
    function pauseUpkeep(uint256 id) external;
    
    function unpauseUpkeep(uint256 id) external;
    
    event UpkeepRegistered(uint256 indexed id, uint32 executeGas, address admin);
    event UpkeepPerformed(
        uint256 indexed id,
        bool indexed success,
        address indexed from,
        uint96 payment,
        bytes performData
    );
}