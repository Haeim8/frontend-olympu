// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./PriceConsumerV3.sol";

interface IRecProxy {
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
    
    function getCampaignRegistry(address _campaign) external view returns (CampaignInfo memory);
}

interface IRecCampaign {
    function startup() external view returns (address);
    function currentRound() external view returns (uint256);
    function getCurrentRound() external view returns (
        uint256 roundNumber,
        uint256 sharePrice,
        uint256 targetAmount,
        uint256 fundsRaised,
        uint256 sharesSold,
        uint256 endTime,
        bool isActive,
        bool isFinalized
    );
}

/**
 * @title RecPromotionManager
 * @dev Contrat pour gérer les promotions payantes des campagnes REC
 */
contract RecPromotionManager is Ownable, ReentrancyGuard {
    using Address for address payable;

    modifier validAddress(address _addr) {
        require(_addr != address(0), "Invalid address");
        _;
    }

    // ========== CONSTANTS ==========
    
    // Prix des boosts en cents USD (pour PriceConsumer)
    uint256 public constant FEATURED_PRICE_USD_CENTS = 15000;  // 150 USD = 15000 cents
    uint256 public constant TRENDING_PRICE_USD_CENTS = 45000;  // 450 USD = 45000 cents  
    uint256 public constant SPOTLIGHT_PRICE_USD_CENTS = 120000; // 1200 USD = 120000 cents

    // Durées des boosts en secondes
    uint256 public constant FEATURED_DURATION = 1 days;      // 24h
    uint256 public constant TRENDING_DURATION = 7 days;      // 7 jours
    uint256 public constant SPOTLIGHT_DURATION = 30 days;    // 30 jours

    // ========== STATE VARIABLES ==========
    
    address public recProxy;
    address public priceConsumer;
    address public treasury;

    // ========== STRUCTS ==========
    
    enum BoostType { FEATURED, TRENDING, SPOTLIGHT }
    
    struct CampaignPromotion {
        address campaignAddress;
        address creator;
        BoostType boostType;
        uint256 roundNumber;
        uint256 ethAmount;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        string txHash;
    }

    // ========== MAPPINGS & ARRAYS ==========
    
    // Mapping : campaign + round => promotion active
    mapping(address => mapping(uint256 => CampaignPromotion)) public campaignPromotions;
    
    // Mapping : campaign => all promotions history
    mapping(address => CampaignPromotion[]) public campaignPromotionHistory;
    
    // Array de toutes les promotions actives (pour le frontend)
    CampaignPromotion[] public activePromotions;
    
    // Mapping pour vérifier si une promotion est active
    mapping(address => mapping(uint256 => bool)) public hasActivePromotion;

    // ========== EVENTS ==========
    
    event CampaignPromoted(
        address indexed campaignAddress,
        address indexed creator,
        BoostType boostType,
        uint256 roundNumber,
        uint256 ethAmount,
        uint256 startTime,
        uint256 endTime,
        uint256 timestamp
    );
    
    event PromotionExpired(
        address indexed campaignAddress,
        uint256 roundNumber,
        BoostType boostType,
        uint256 timestamp
    );
    
    event TreasuryUpdated(address oldTreasury, address newTreasury);
    event PriceConsumerUpdated(address oldPriceConsumer, address newPriceConsumer);
    event RecProxyUpdated(address oldRecProxy, address newRecProxy);

    // ========== CONSTRUCTOR ==========
    
    constructor(
        address _recProxy,
        address _priceConsumer,
        address _treasury
    ) validAddress(_recProxy) validAddress(_priceConsumer) validAddress(_treasury) {
        recProxy = _recProxy;
        priceConsumer = _priceConsumer;
        treasury = _treasury;
    }

    // ========== EXTERNAL FUNCTIONS ==========
    
    /**
     * @dev Fonction principale pour promouvoir une campagne
     * @param campaignAddress Adresse de la campagne à promouvoir
     * @param boostType Type de boost (0=FEATURED, 1=TRENDING, 2=SPOTLIGHT)
     */
    function promoteCampaign(
        address campaignAddress,
        BoostType boostType
    ) external payable nonReentrant validAddress(campaignAddress) {
        // Validation de base
        
        // Vérifier que la campagne existe dans RecProxy
        IRecProxy.CampaignInfo memory campaignInfo = IRecProxy(recProxy).getCampaignRegistry(campaignAddress);
        require(campaignInfo.campaignAddress != address(0), "Campaign not registered");
        require(campaignInfo.creator == msg.sender, "Only campaign creator can promote");
        
        // Récupérer le round actuel
        uint256 currentRound = IRecCampaign(campaignAddress).currentRound();
        require(currentRound > 0, "Invalid campaign round");
        
        // Vérifier qu'il n'y a pas déjà une promotion active pour ce round
        require(!hasActivePromotion[campaignAddress][currentRound], "Promotion already active for this round");
        
        // Vérifier que le round est actif
        (,,,,,, bool isActive,) = IRecCampaign(campaignAddress).getCurrentRound();
        require(isActive, "Campaign round is not active");
        
        // Calculer les durées
        uint256 duration = _getBoostDuration(boostType);
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + duration;
        
        // Créer la promotion
        CampaignPromotion memory promotion = CampaignPromotion({
            campaignAddress: campaignAddress,
            creator: msg.sender,
            boostType: boostType,
            roundNumber: currentRound,
            ethAmount: msg.value,
            startTime: startTime,
            endTime: endTime,
            isActive: true,
            txHash: ""
        });
        
        // Sauvegarder la promotion
        campaignPromotions[campaignAddress][currentRound] = promotion;
        campaignPromotionHistory[campaignAddress].push(promotion);
        activePromotions.push(promotion);
        hasActivePromotion[campaignAddress][currentRound] = true;
        
        // Transférer les fonds au treasury
        payable(treasury).sendValue(msg.value);
        
        // Émettre l'événement pour le backend
        emit CampaignPromoted(
            campaignAddress,
            msg.sender,
            boostType,
            currentRound,
            msg.value,
            startTime,
            endTime,
            block.timestamp
        );
    }

    // ========== VIEW FUNCTIONS ==========
    
    /**
     * @dev Obtenir le prix d'un boost en ETH
     */
    function getBoostPriceInETH(BoostType boostType) external view returns (uint256) {
        return _getBoostPriceInETH(boostType);
    }
    
    /**
     * @dev Obtenir la promotion active d'une campagne pour un round
     */
    function getActivePromotion(address campaignAddress, uint256 roundNumber) 
        external view returns (CampaignPromotion memory) {
        return campaignPromotions[campaignAddress][roundNumber];
    }
    
    /**
     * @dev Obtenir l'historique des promotions d'une campagne
     */
    function getCampaignPromotionHistory(address campaignAddress) 
        external view returns (CampaignPromotion[] memory) {
        return campaignPromotionHistory[campaignAddress];
    }
    
    /**
     * @dev Obtenir toutes les promotions actives
     */
    function getActivePromotions() external view returns (CampaignPromotion[] memory) {
        // Filtrer les promotions expirées
        uint256 activeCount = 0;
        for (uint256 i = 0; i < activePromotions.length; i++) {
            if (activePromotions[i].isActive && block.timestamp <= activePromotions[i].endTime) {
                activeCount++;
            }
        }
        
        CampaignPromotion[] memory active = new CampaignPromotion[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < activePromotions.length; i++) {
            if (activePromotions[i].isActive && block.timestamp <= activePromotions[i].endTime) {
                active[index] = activePromotions[i];
                index++;
            }
        }
        
        return active;
    }
    
    /**
     * @dev Vérifier si une campagne a une promotion active
     */
    function isPromotionActive(address campaignAddress, uint256 roundNumber) 
        external view returns (bool) {
        if (!hasActivePromotion[campaignAddress][roundNumber]) {
            return false;
        }
        
        CampaignPromotion memory promotion = campaignPromotions[campaignAddress][roundNumber];
        return promotion.isActive && block.timestamp <= promotion.endTime;
    }
    
    /**
     * @dev Obtenir les informations de pricing pour tous les boosts
     */
    function getAllBoostPrices() external view returns (
        uint256 featuredETH,
        uint256 trendingETH, 
        uint256 spotlightETH
    ) {
        return (
            _getBoostPriceInETH(BoostType.FEATURED),
            _getBoostPriceInETH(BoostType.TRENDING),
            _getBoostPriceInETH(BoostType.SPOTLIGHT)
        );
    }

    // ========== INTERNAL FUNCTIONS ==========
    
    /**
     * @dev Calculer le prix d'un boost en ETH via PriceConsumer
     */
    function _getBoostPriceInETH(BoostType boostType) internal view returns (uint256) {
        if (boostType == BoostType.FEATURED) {
            return PriceConsumerV3(priceConsumer).getETHPriceWithTestFallback(FEATURED_PRICE_USD_CENTS, 0.01 ether);
        } else if (boostType == BoostType.TRENDING) {
            return PriceConsumerV3(priceConsumer).getETHPriceWithTestFallback(TRENDING_PRICE_USD_CENTS, 0.03 ether);
        } else if (boostType == BoostType.SPOTLIGHT) {
            return PriceConsumerV3(priceConsumer).getETHPriceWithTestFallback(SPOTLIGHT_PRICE_USD_CENTS, 0.08 ether);
        } else {
            revert("Invalid boost type");
        }
    }
    
    /**
     * @dev Obtenir la durée d'un boost
     */
    function _getBoostDuration(BoostType boostType) internal pure returns (uint256) {
        if (boostType == BoostType.FEATURED) {
            return FEATURED_DURATION;
        } else if (boostType == BoostType.TRENDING) {
            return TRENDING_DURATION;
        } else if (boostType == BoostType.SPOTLIGHT) {
            return SPOTLIGHT_DURATION;
        } else {
            revert("Invalid boost type");
        }
    }

    // ========== ADMIN FUNCTIONS ==========
    
    /**
     * @dev Nettoyer les promotions expirées (fonction d'entretien)
     */
    function cleanupExpiredPromotions() external onlyOwner {
        for (uint256 i = 0; i < activePromotions.length; i++) {
            if (activePromotions[i].isActive && block.timestamp > activePromotions[i].endTime) {
                activePromotions[i].isActive = false;
                hasActivePromotion[activePromotions[i].campaignAddress][activePromotions[i].roundNumber] = false;
                
                emit PromotionExpired(
                    activePromotions[i].campaignAddress,
                    activePromotions[i].roundNumber,
                    activePromotions[i].boostType,
                    block.timestamp
                );
            }
        }
    }
    
    /**
     * @dev Mettre à jour l'adresse du treasury
     */
    function updateTreasury(address _newTreasury) external onlyOwner validAddress(_newTreasury) {
        address oldTreasury = treasury;
        treasury = _newTreasury;
        emit TreasuryUpdated(oldTreasury, _newTreasury);
    }
    
    /**
     * @dev Mettre à jour l'adresse du PriceConsumer
     */
    function updatePriceConsumer(address _newPriceConsumer) external onlyOwner validAddress(_newPriceConsumer) {
        address oldPriceConsumer = priceConsumer;
        priceConsumer = _newPriceConsumer;
        emit PriceConsumerUpdated(oldPriceConsumer, _newPriceConsumer);
    }
    
    /**
     * @dev Mettre à jour l'adresse du RecProxy
     */
    function updateRecProxy(address _newRecProxy) external onlyOwner validAddress(_newRecProxy) {
        address oldRecProxy = recProxy;
        recProxy = _newRecProxy;
        emit RecProxyUpdated(oldRecProxy, _newRecProxy);
    }

    // ========== FALLBACK FUNCTIONS ==========
    
    receive() external payable {
        revert("Direct transfers not accepted");
    }

    fallback() external payable {
        revert("Function does not exist");
    }
}