// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./DivarStorage.sol";
import "./DivarEvents.sol";
import "./Campaign.sol";
import "./CampaignKeeper.sol";
import "./PriceConsumerV3.sol";

struct CampaignParams {
    address startup;
    string name;
    string symbol;
    uint256 targetAmount;
    uint256 sharePrice;
    uint256 endTime;
    address treasury;
    uint96 royaltyFee;
    address royaltyReceiver;
    string metadata;
    address divarProxy;
    address campaignKeeper;
}

struct NFTParams {
    address nftRenderer;
    string nftBackgroundColor;
    string nftTextColor;
    string nftLogoUrl;
    string nftSector;
}

interface ICampaignKeeper {
    function registerCampaign(address campaign) external;
    function isCampaignRegistered(address campaign) external view returns (bool);
    function checkUpkeep(bytes calldata checkData) external view returns (bool upkeepNeeded, bytes memory performData);
    function performUpkeep(bytes calldata performData) external;
}

/**
 * @title DivarProxy
 * @dev Version upgradeable de la plateforme Divar
 */
contract DivarProxy is DivarStorage, DivarEvents, OwnableUpgradeable, UUPSUpgradeable, PausableUpgradeable {
    using Address for address payable;

    // Factory bytecode de Campaign
    bytes public campaignBytecode;
    address public campaignKeeper;
    
    modifier validAddress(address _addr) {
        require(_addr != address(0), "Invalid address");
        _;
    }
    
    

    function registerCampaignForUpkeep(address campaignAddress) internal returns (bool success) {
     try ICampaignKeeper(campaignKeeper).registerCampaign(campaignAddress) {
        // Enregistrement réussi - mettre à jour la variable dans Campaign
        Campaign(payable(campaignAddress)).setRegisteredForUpkeep(true);
        emit CampaignRegisteredForUpkeep(campaignAddress, true);
        return true;
     } catch {
        // Échec enregistrement - garder trace
        emit CampaignRegisteredForUpkeep(campaignAddress, false);
        return false;
     }
    }
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
    address _treasury,
    address _campaignKeeper,
    address _priceConsumer,
    address _nftRenderer
) public initializer validAddress(_treasury) validAddress(_campaignKeeper) validAddress(_priceConsumer) validAddress(_nftRenderer) {
    
    _initializeStorage(_treasury, _priceConsumer, _nftRenderer);
    __Ownable_init();
    _transferOwnership(_treasury);
    __UUPSUpgradeable_init();
    __Pausable_init();
    
    campaignKeeper = _campaignKeeper;
}

    // Fonction pour définir le bytecode du contrat Campaign
    function setCampaignBytecode(bytes memory _bytecode) external onlyOwner {
        campaignBytecode = _bytecode;
    }

    function setCampaignKeeper(address _keeper) external onlyOwner validAddress(_keeper) {
     campaignKeeper = _keeper;
    }
    
    function setNFTRenderer(address _nftRenderer) external onlyOwner validAddress(_nftRenderer) {
        nftRenderer = _nftRenderer;
    }
    
    
    

    // Fonction pour calculer les frais en temps réel (85 USD en ETH)
    function getCampaignCreationFeeETH() public view returns (uint256) {
        return PriceConsumerV3(priceConsumer).getETHPriceWithTestFallback(8500, 0.001 ether);
    }
    
    function updatePriceConsumer(address _newPriceConsumer) external onlyOwner validAddress(_newPriceConsumer) {
        priceConsumer = _newPriceConsumer;
        emit PriceConsumerUpdated(_newPriceConsumer);
    }

    // Commission supprimée - désormais fixe à 12%



    
    function createCampaign(
    string memory _name,
    string memory _symbol,
    uint256 _targetAmount,
    uint256 _sharePrice,
    uint256 _endTime,
    string memory _category,
    string memory _metadata,
    uint96 _royaltyFee,
    string memory _logo,
    string memory _nftBackgroundColor,
    string memory _nftTextColor,
    string memory _nftLogoUrl,
    string memory _nftSector
) external payable whenNotPaused {
    require(bytes(_name).length > 0, "DIVAR: Name required");
    require(_targetAmount > 0, "DIVAR: Invalid target");
    require(_sharePrice > 0, "DIVAR: Invalid price");
    require(_endTime > block.timestamp, "DIVAR: Invalid end time");
    uint256 requiredFee = getCampaignCreationFeeETH();
    require(msg.value >= requiredFee, "DIVAR: Incorrect fee");
    require(campaignBytecode.length > 0, "Campaign bytecode not set");

    payable(treasury).sendValue(msg.value);

    // Créer les structs pour éviter "stack too deep"
    CampaignParams memory params = CampaignParams({
        startup: msg.sender,
        name: _name,
        symbol: _symbol,
        targetAmount: _targetAmount,
        sharePrice: _sharePrice,
        endTime: _endTime,
        treasury: treasury,
        royaltyFee: _royaltyFee,
        royaltyReceiver: msg.sender,
        metadata: _metadata,
        divarProxy: address(this),
        campaignKeeper: campaignKeeper
    });
    
    Campaign.NFTParams memory nftParams = Campaign.NFTParams({
        nftRenderer: nftRenderer,
        nftBackgroundColor: _nftBackgroundColor,
        nftTextColor: _nftTextColor,
        nftLogoUrl: _nftLogoUrl,
        nftSector: _nftSector
    });

   bytes memory constructorArgs = abi.encode(params, nftParams);

    bytes memory bytecode = abi.encodePacked(
        campaignBytecode,
        constructorArgs
    );

    bytes32 salt = keccak256(
        abi.encodePacked(
            msg.sender,
            _name,
            block.timestamp
        )
    );

    address campaignAddress;
    assembly {
        campaignAddress := create2(0, add(bytecode, 32), mload(bytecode), salt)
    }
    require(campaignAddress != address(0), "Campaign deployment failed");

    CampaignInfo memory info = CampaignInfo({
        campaignAddress: campaignAddress,
        creator: msg.sender,
        creationTime: block.timestamp,
        targetAmount: _targetAmount,
        category: _category,
        isActive: true,
        name: _name,
        metadata: _metadata,
        logo: _logo,
        escrowAddress: address(0)
    });

    campaignRegistry[campaignAddress] = info;
    campaignsByCreator[msg.sender].push(campaignAddress);
    campaignsByCategory[_category].push(campaignAddress);
    allCampaigns.push(campaignAddress);

    
    // Enregistrer pour automation
    registerCampaignForUpkeep(campaignAddress);
    
    emit CampaignCreated(
        campaignAddress,
        msg.sender,
        _name,
        block.timestamp
    );
}

   
    // Getters
    function getAllCampaigns() external view returns (address[] memory) {
        return allCampaigns;
    }

    function getCampaignsByCreator(address _creator) external view returns (address[] memory) {
        return campaignsByCreator[_creator];
    }

    function getCampaignsByCategory(string memory _category) external view returns (address[] memory) {
        return campaignsByCategory[_category];
    }

    function getCampaignRegistry(address _campaign) external view returns (CampaignInfo memory) {
        return campaignRegistry[_campaign];
    }

    function checkUserStatus(address _user) external view returns (
        uint256 campaignCount
    ) {
        campaignCount = campaignsByCreator[_user].length;
    }

    // Admin functions
    function updateTreasury(address _newTreasury) external onlyOwner validAddress(_newTreasury) {
        address oldTreasury = treasury;
        treasury = _newTreasury;
        emit TreasuryUpdated(oldTreasury, _newTreasury);
    }

    function togglePause() external onlyOwner {
        if (paused()) {
            _unpause();
        } else {
            _pause();
        }
        emit PlatformStatusChanged(paused());
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function getVersion() external pure returns (string memory) {
        return "1.0.0";
    }

    receive() external payable {
        revert("Direct transfers not accepted");
    }

    fallback() external payable {
        revert("Function does not exist");
    }

}