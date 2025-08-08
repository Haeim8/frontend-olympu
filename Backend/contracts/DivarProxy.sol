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

interface ICampaignKeeper {
    function registerCampaign(address campaign) external;
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
    
    

    function registerCampaignForUpkeep(address campaignAddress) internal {
     try ICampaignKeeper(campaignKeeper).registerCampaign(campaignAddress) {
        // Enregistrement réussi
     } catch {
        // Continue même si l'enregistrement échoue
     }
    }
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
    address _treasury,
    address _campaignKeeper,
    address _priceConsumer
) public initializer {
    require(_treasury != address(0), "DIVAR: Invalid treasury");
    require(_campaignKeeper != address(0), "DIVAR: Invalid keeper");
    require(_priceConsumer != address(0), "DIVAR: Invalid price consumer");
    
    __Ownable_init();
    _transferOwnership(_treasury);
    __UUPSUpgradeable_init();
    __Pausable_init();
    
    _initializeStorage(_treasury, _priceConsumer);
    campaignKeeper = _campaignKeeper;
}

    // Fonction pour définir le bytecode du contrat Campaign
    function setCampaignBytecode(bytes memory _bytecode) external onlyOwner {
        campaignBytecode = _bytecode;
    }

    function setCampaignKeeper(address _keeper) external onlyOwner {
     require(_keeper != address(0), "Invalid keeper address");
     campaignKeeper = _keeper;
    }
    
    function updateCampaignKeeper(address _newKeeper) external onlyOwner {
     require(_newKeeper != address(0), "Invalid keeper address");
     campaignKeeper = _newKeeper;
    }

    // Fonction pour calculer les frais en temps réel (85 USD en ETH)
    function getCampaignCreationFeeETH() public view returns (uint256) {
        uint256 feeInUSDCents = 8500; // 85 USD = 8500 cents
        // Pour test local - pas de Chainlink
        if (block.chainid == 31337) {
            return 0.001 ether; // Fee fixe pour hardhat local
        }
        return PriceConsumerV3(priceConsumer).convertUSDToETH(feeInUSDCents);
    }
    
    function updatePriceConsumer(address _newPriceConsumer) external onlyOwner {
        require(_newPriceConsumer != address(0), "Invalid price consumer address");
        priceConsumer = _newPriceConsumer;
        emit PriceConsumerUpdated(_newPriceConsumer);
    }



    
    function createCampaign(
    string memory _name,
    string memory _symbol,
    uint256 _targetAmount,
    uint256 _sharePrice,
    uint256 _endTime,
    string memory _category,
    string memory _metadata,
    uint96 _royaltyFee,
    string memory _logo
) external payable whenNotPaused {
    require(bytes(_name).length > 0, "DIVAR: Name required");
    require(_targetAmount > 0, "DIVAR: Invalid target");
    require(_sharePrice > 0, "DIVAR: Invalid price");
    require(_endTime > block.timestamp, "DIVAR: Invalid end time");
    uint256 requiredFee = getCampaignCreationFeeETH();
    require(msg.value >= requiredFee, "DIVAR: Incorrect fee");
    require(campaignBytecode.length > 0, "Campaign bytecode not set");

    payable(treasury).sendValue(msg.value);

   bytes memory constructorArgs = abi.encode(
    msg.sender,      // _startup
    _name,           // _name
    _symbol,         // _symbol
    _targetAmount,   // _targetAmount
    _sharePrice,     // _sharePrice
    _endTime,        // _endTime
    treasury,        // _treasury
    _royaltyFee,     // _royaltyFee
    treasury,        // _royaltyReceiver
    _metadata,       // _metadata
    address(this),   // _divarProxy
    campaignKeeper   // _campaignKeeper
);

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

     registerCampaignForUpkeep(campaignAddress);  // D'abord appeler la fonction
    emit CampaignCreated(                        // Ensuite émettre l'événement
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
    function updateTreasury(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "DIVAR: Invalid treasury address");
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