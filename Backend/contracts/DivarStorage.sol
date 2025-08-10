// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract DivarStorage is Initializable {
    // Platform settings - now variable instead of constant
    uint256 public platformCommissionPercent = 15;



    struct CampaignInfo {
        address campaignAddress;
        address creator;
        uint256 creationTime;
        uint256 targetAmount;
        string category;
        bool isActive;
        string name;
        string metadata;
        string logo;
        address escrowAddress;
    }

   
    address public treasury;
    address public priceConsumer;
    mapping(address => CampaignInfo) public campaignRegistry;
    mapping(address => address[]) public campaignsByCreator;
    mapping(string => address[]) public campaignsByCategory;
    
    address[] public allCampaigns;
   
    function _initializeStorage(address _treasury, address _priceConsumer) internal onlyInitializing {
        require(_treasury != address(0), "DIVAR: Invalid treasury");
        require(_priceConsumer != address(0), "DIVAR: Invalid price consumer");
        treasury = _treasury;
        priceConsumer = _priceConsumer;
    }
    
    uint256[48] private __gap;

}