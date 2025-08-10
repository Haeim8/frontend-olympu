// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./Campaign.sol";
import "./LiveSessionManager.sol";

/**
 * @title CampaignDAO
 * @dev Système DAO Live qui gère la phase post-finalisation avec sessions live obligatoires
 * Phase DAO se déclenche automatiquement après finalisation Chainlink
 * Permet échanges NFT → fonds pendant 24h après live
 * Double protection : délai programmation + durée minimum live
 */
contract CampaignDAO is AccessControl, ReentrancyGuard {
    using Address for address payable;

    // Rôles
    bytes32 public constant CAMPAIGN_ROLE = keccak256("CAMPAIGN_ROLE");
    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");

    // État de la DAO
    enum DAOPhase {
        INACTIVE,           // Phase DAO pas encore démarrée
        WAITING_FOR_LIVE,   // En attente de programmation du live
        LIVE_SCHEDULED,     // Live programmé, en attente
        LIVE_ACTIVE,        // Live en cours
        EXCHANGE_PERIOD,    // Période d'échange 24h après live
        COMPLETED,          // Phase DAO terminée
        EMERGENCY           // Mode remboursement automatique
    }

    // Structure de session live
    struct LiveSession {
        uint256 scheduledTime;      // Quand le live est programmé
        uint256 startTime;          // Quand le live a commencé  
        uint256 endTime;            // Quand le live s'est terminé
        bool isValid;               // Live valide (>= 15 min)
        bool hasStarted;            // Live a commencé
        bool hasEnded;              // Live terminé
        uint256 viewersCount;       // Nombre de spectateurs
        string streamUrl;           // URL du stream
    }

    // Variables d'état
    Campaign public immutable campaignContract;
    LiveSessionManager public immutable liveManager;
    address public founder;
    
    DAOPhase public currentPhase;
    uint256 public daoPhaseStartTime;
    uint256 public exchangeDeadline;
    
    LiveSession public currentSession;
    
    // Constantes de temps
    uint256 public constant SCHEDULING_DEADLINE = 15 days;  // 🔥 15 jours pour programmer (corrigé)
    uint256 public constant MINIMUM_LIVE_DURATION = 15 minutes;  // 15 min minimum
    uint256 public constant MAXIMUM_LIVE_DURATION = 1 hours + 45 minutes;  // 🆕 1h45 maximum
    uint256 public constant EXCHANGE_PERIOD_DURATION = 24 hours;  // 24h pour échanger

    // Mappings
    mapping(uint256 => bool) public nftExchanged;  // NFTs déjà échangés
    mapping(address => uint256[]) public userExchanges;  // Historique échanges par user

    // Événements
    event DAOPhaseStarted(address indexed campaign, uint256 timestamp);
    event LiveSessionScheduled(uint256 scheduledTime, string streamUrl);
    event LiveSessionStarted(uint256 startTime, uint256 viewersCount);
    event LiveSessionEnded(uint256 endTime, bool isValid, uint256 duration);
    event ExchangePeriodStarted(uint256 deadline);
    event NFTExchangedForFunds(address indexed user, uint256 tokenId, uint256 refundAmount);
    event EmergencyWithdrawEnabled(string reason);
    event DAOPhaseCompleted(uint256 totalExchanged, uint256 fundsRemaining);

    constructor(
        address payable _campaignContract,
        address _liveManager,
        address _founder
    ) {
        require(_campaignContract != address(0), "Invalid campaign address");
        require(_liveManager != address(0), "Invalid live manager address");
        require(_founder != address(0), "Invalid founder address");

        campaignContract = Campaign(_campaignContract);
        liveManager = LiveSessionManager(_liveManager);
        founder = _founder;
        currentPhase = DAOPhase.INACTIVE;

        // Accorder les rôles
        _grantRole(DEFAULT_ADMIN_ROLE, _founder);
        _grantRole(CAMPAIGN_ROLE, _campaignContract);
        
        // 🆕 Le Campaign connaît son keeper, on lui accorde le rôle DAO
        address campaignKeeper = Campaign(_campaignContract).campaignKeeper();
        _grantRole(KEEPER_ROLE, campaignKeeper);
    }

    modifier onlyFounder() {
        require(msg.sender == founder, "Only founder can call");
        _;
    }

    modifier onlyInPhase(DAOPhase phase) {
        require(currentPhase == phase, "Invalid phase for this action");
        _;
    }

    /**
     * @dev Démarre la phase DAO après finalisation de campagne
     * Appelé automatiquement par CampaignKeeper après finalisation
     */
    function startDAOPhase() external onlyRole(CAMPAIGN_ROLE) {
        require(currentPhase == DAOPhase.INACTIVE, "DAO phase already started");
        
        currentPhase = DAOPhase.WAITING_FOR_LIVE;
        daoPhaseStartTime = block.timestamp;
        
        emit DAOPhaseStarted(address(campaignContract), block.timestamp);
    }

    /**
     * @dev Fondateur programme sa session live obligatoire
     */
    function scheduleLiveSession(
        uint256 _scheduledTime,
        string memory _streamUrl
    ) external onlyFounder onlyInPhase(DAOPhase.WAITING_FOR_LIVE) {
        require(_scheduledTime > block.timestamp, "Cannot schedule in the past");
        require(_scheduledTime <= block.timestamp + SCHEDULING_DEADLINE, "Cannot schedule beyond deadline");
        require(bytes(_streamUrl).length > 0, "Stream URL required");

        // Vérifier qu'on est dans le délai de programmation
        require(
            block.timestamp <= daoPhaseStartTime + SCHEDULING_DEADLINE,
            "Scheduling deadline exceeded"
        );

        currentSession = LiveSession({
            scheduledTime: _scheduledTime,
            startTime: 0,
            endTime: 0,
            isValid: false,
            hasStarted: false,
            hasEnded: false,
            viewersCount: 0,
            streamUrl: _streamUrl
        });

        currentPhase = DAOPhase.LIVE_SCHEDULED;
        emit LiveSessionScheduled(_scheduledTime, _streamUrl);
    }

    /**
     * @dev Fondateur démarre sa session live
     */
    function startLiveSession() external onlyFounder onlyInPhase(DAOPhase.LIVE_SCHEDULED) {
        require(
            block.timestamp >= currentSession.scheduledTime,
            "Too early to start live"
        );
        require(
            block.timestamp <= currentSession.scheduledTime + 1 hours,
            "Too late to start live (max 1h delay)"
        );

        currentSession.startTime = block.timestamp;
        currentSession.hasStarted = true;
        currentPhase = DAOPhase.LIVE_ACTIVE;

        emit LiveSessionStarted(block.timestamp, 0);
    }

    /**
     * @dev Termine la session live et valide la durée
     */
    function endLiveSession(uint256 _viewersCount) external onlyFounder onlyInPhase(DAOPhase.LIVE_ACTIVE) {
        require(currentSession.hasStarted, "Live session not started");
        
        currentSession.endTime = block.timestamp;
        currentSession.hasEnded = true;
        currentSession.viewersCount = _viewersCount;

        uint256 duration = currentSession.endTime - currentSession.startTime;
        // 🔥 VALIDATION DURÉE : Entre 15 min et 1h45
        currentSession.isValid = duration >= MINIMUM_LIVE_DURATION && duration <= MAXIMUM_LIVE_DURATION;

        if (currentSession.isValid) {
            // Live valide → Démarrer période d'échange
            currentPhase = DAOPhase.EXCHANGE_PERIOD;
            exchangeDeadline = block.timestamp + EXCHANGE_PERIOD_DURATION;
            emit ExchangePeriodStarted(exchangeDeadline);
        } else {
            // Live invalide → Mode remboursement d'urgence
            currentPhase = DAOPhase.EMERGENCY;
            emit EmergencyWithdrawEnabled("Live session too short");
        }

        emit LiveSessionEnded(block.timestamp, currentSession.isValid, duration);
    }

    /**
     * @dev Échange NFT contre fonds pendant la période normale
     */
    function exchangeNFTForFunds(uint256 tokenId) external nonReentrant onlyInPhase(DAOPhase.EXCHANGE_PERIOD) {
        require(block.timestamp <= exchangeDeadline, "Exchange period ended");
        _executeNFTExchange(tokenId);
    }

    /**
     * @dev Remboursement d'urgence si problème avec le live
     */
    function emergencyWithdraw(uint256 tokenId) external nonReentrant onlyInPhase(DAOPhase.EMERGENCY) {
        _executeNFTExchange(tokenId);
    }

    /**
     * @dev Auto-remboursement si fondateur ne programme pas le live à temps
     */
    function enableEmergencyMode() external {
        require(currentPhase == DAOPhase.WAITING_FOR_LIVE, "Not waiting for live");
        require(
            block.timestamp > daoPhaseStartTime + SCHEDULING_DEADLINE,
            "Scheduling deadline not exceeded"
        );

        currentPhase = DAOPhase.EMERGENCY;
        emit EmergencyWithdrawEnabled("Founder failed to schedule live session");
    }

    /**
     * @dev Logique commune pour l'échange NFT → fonds
     */
    function _executeNFTExchange(uint256 tokenId) internal {
        // Vérifications de sécurité
        require(campaignContract.ownerOf(tokenId) == msg.sender, "Not your NFT");
        require(!nftExchanged[tokenId], "NFT already exchanged");

        // 🆕 REMBOURSEMENT ÉQUITABLE : Prix d'achat original du NFT (pas le round actuel)
        uint256 originalPrice = campaignContract.getTokenPurchasePrice(tokenId);
        require(originalPrice > 0, "Invalid token purchase price");
        
        uint256 platformCommission = campaignContract.platformCommissionPercent();
        uint256 refundAmount = (originalPrice * (100 - platformCommission)) / 100;

        // Sécurité : Marquer comme échangé AVANT le burn
        nftExchanged[tokenId] = true;
        userExchanges[msg.sender].push(tokenId);

        // Brûler le NFT ET Campaign envoie les fonds directement
        campaignContract.burnNFTForExchange(tokenId, msg.sender, refundAmount);

        emit NFTExchangedForFunds(msg.sender, tokenId, refundAmount);
    }

    /**
     * @dev 🆕 Clôture automatique de la phase DAO par Chainlink Keeper
     * Remplace releaseEscrowToFounder() pour automatisation complète
     */
    function closeDAOPhase() external onlyRole(KEEPER_ROLE) nonReentrant {
        require(
            currentPhase == DAOPhase.EXCHANGE_PERIOD && block.timestamp > exchangeDeadline,
            "Exchange period not finished"
        );

        currentPhase = DAOPhase.COMPLETED;
        
        // Libérer automatiquement l'escrow au founder
        campaignContract.claimEscrow();

        emit DAOPhaseCompleted(
            getTotalExchanges(),
            address(campaignContract).balance
        );
    }

    /**
     * @dev Fondateur peut toujours libérer manuellement (backup)
     */
    function releaseEscrowToFounder() external onlyFounder nonReentrant {
        require(
            currentPhase == DAOPhase.EXCHANGE_PERIOD && block.timestamp > exchangeDeadline,
            "Exchange period not finished"
        );

        currentPhase = DAOPhase.COMPLETED;
        
        // Autoriser le founder à claim l'escrow dans Campaign.sol
        campaignContract.claimEscrow();

        emit DAOPhaseCompleted(
            getTotalExchanges(),
            address(campaignContract).balance
        );
    }

    // ===== FONCTIONS DE LECTURE =====

    function getCurrentPhase() external view returns (DAOPhase) {
        return currentPhase;
    }

    function getSessionInfo() external view returns (
        uint256 scheduledTime,
        uint256 startTime,
        uint256 endTime,
        bool isValid,
        uint256 viewersCount,
        string memory streamUrl
    ) {
        return (
            currentSession.scheduledTime,
            currentSession.startTime,
            currentSession.endTime,
            currentSession.isValid,
            currentSession.viewersCount,
            currentSession.streamUrl
        );
    }

    function getTimeRemaining() external view returns (uint256) {
        if (currentPhase == DAOPhase.WAITING_FOR_LIVE) {
            uint256 deadline = daoPhaseStartTime + SCHEDULING_DEADLINE;
            return deadline > block.timestamp ? deadline - block.timestamp : 0;
        }
        if (currentPhase == DAOPhase.EXCHANGE_PERIOD) {
            return exchangeDeadline > block.timestamp ? exchangeDeadline - block.timestamp : 0;
        }
        return 0;
    }

    function getUserExchanges(address user) external view returns (uint256[] memory) {
        return userExchanges[user];
    }
    
    function getTotalExchanges() public pure returns (uint256) {
        // Simplification pour l'instant - retourne 0
        // TODO: Implémenter le vrai comptage des échanges
        return 0;
    }

    // Fonction de secours pour récupérer les ETH bloqués
    receive() external payable {}
    
    function emergencyWithdrawETH() external onlyFounder {
        require(currentPhase == DAOPhase.COMPLETED, "DAO phase not completed");
        payable(founder).sendValue(address(this).balance);
    }
}