// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./PriceConsumerV3.sol";

contract DivarStorage is Initializable {
    uint256 public constant REGISTRATION_FEE_USD = 2000;
    uint256 public constant CAMPAIGN_CREATION_FEE_USD = 8500;
    uint256 public constant PLATFORM_COMMISSION_PERCENT = 15;

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
    mapping(address => bool) public registeredUsers;
    mapping(address => CampaignInfo) public campaignRegistry;
    mapping(address => address[]) public campaignsByCreator;
    mapping(string => address[]) campaignsByCategory;
    address[] public allCampaigns;
    PriceConsumerV3 public priceConsumer;

  function updatePriceConsumerAddress(address _priceConsumer) internal {
    require(_priceConsumer != address(0), "Invalid price consumer");
    priceConsumer = PriceConsumerV3(_priceConsumer);
} 

function initialize(address _treasury, address _priceConsumer) public virtual initializer {
    require(_treasury != address(0), "Invalid treasury");
    require(_priceConsumer != address(0), "Invalid price consumer");
    treasury = _treasury;
    priceConsumer = PriceConsumerV3(_priceConsumer);
}

    function getRegistrationFeeETH() public view returns (uint256) {
        return priceConsumer.convertUSDToETH(REGISTRATION_FEE_USD);
    }

    function getCampaignCreationFeeETH() public view returns (uint256) {
        return priceConsumer.convertUSDToETH(CAMPAIGN_CREATION_FEE_USD);
    }
    
    uint256[47] private __gap;
}