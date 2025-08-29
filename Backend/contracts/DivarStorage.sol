// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract DivarStorage is Initializable {



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
    
    // ⚠️  NOUVELLES VARIABLES - TOUJOURS A LA FIN POUR UPGRADES !
    address public nftRenderer;
   
    function _initializeStorage(address _treasury, address _priceConsumer, address _nftRenderer) internal onlyInitializing {
        require(_treasury != address(0), "DIVAR: Invalid treasury");
        require(_priceConsumer != address(0), "DIVAR: Invalid price consumer");
        require(_nftRenderer != address(0), "DIVAR: Invalid nft renderer");
        treasury = _treasury;
        priceConsumer = _priceConsumer;
        nftRenderer = _nftRenderer;
    }
    
    uint256[47] private __gap; // Réduit car nftRenderer ajoute 1 slot

}