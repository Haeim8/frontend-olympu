// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title LiveSessionManager
 * @dev Gestionnaire centralisé des sessions live pour toutes les campagnes
 * Interface avec les solutions de streaming (LiveKit, WebRTC)
 * Gère la programmation, validation et heartbeat des streams
 */
contract LiveSessionManager is AccessControl, ReentrancyGuard {
    
    // Rôles
    bytes32 public constant DAO_ROLE = keccak256("DAO_ROLE");
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    // État des sessions
    enum SessionStatus {
        SCHEDULED,      // Programmée
        LIVE,          // En direct
        ENDED,         // Terminée  
        CANCELLED,     // Annulée
        INVALID        // Invalide (< 15min)
    }

    // Structure d'une session live
    struct LiveSession {
        address campaignDAO;        // Adresse du DAO de la campagne
        address founder;            // Fondateur qui fait le live
        uint256 scheduledTime;      // Heure programmée
        uint256 actualStartTime;    // Heure réelle de début
        uint256 endTime;           // Heure de fin
        SessionStatus status;       // Statut actuel
        string streamKey;          // Clé de stream unique
        string streamUrl;          // URL du stream
        uint256 viewersCount;      // Nombre de spectateurs
        uint256 lastHeartbeat;     // Dernière activité du fondateur
        bool isValid;              // Session valide (>= 15 min)
        mapping(address => bool) viewers; // Spectateurs connectés
    }

    // Variables de stockage
    mapping(bytes32 => LiveSession) public liveSessions;  // sessionId => session
    mapping(address => bytes32[]) public founderSessions;  // founder => sessionIds
    mapping(address => bytes32) public campaignToSession;  // campaign => sessionId actuel
    
    bytes32[] public allSessions;
    uint256 public totalSessions;

    // Constantes
    uint256 public constant MINIMUM_DURATION = 15 minutes;
    uint256 public constant HEARTBEAT_TIMEOUT = 5 minutes;
    uint256 public constant MAX_SCHEDULING_ADVANCE = 15 days;  // 🔥 Corrigé : 15 jours comme SCHEDULING_DEADLINE

    // Événements
    event SessionScheduled(
        bytes32 indexed sessionId,
        address indexed campaignDAO,
        address indexed founder,
        uint256 scheduledTime,
        string streamUrl
    );
    
    event SessionStarted(
        bytes32 indexed sessionId,
        uint256 actualStartTime,
        string streamKey
    );
    
    event SessionEnded(
        bytes32 indexed sessionId,
        uint256 endTime,
        uint256 duration,
        bool isValid
    );
    
    event ViewerJoined(bytes32 indexed sessionId, address viewer);
    event ViewerLeft(bytes32 indexed sessionId, address viewer);
    event HeartbeatReceived(bytes32 indexed sessionId, uint256 timestamp);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MODERATOR_ROLE, msg.sender);
    }

    /**
     * @dev Programme une nouvelle session live
     */
    function scheduleSession(
        address _campaignDAO,
        address _founder,
        uint256 _scheduledTime,
        string memory _streamUrl
    ) external onlyRole(DAO_ROLE) returns (bytes32 sessionId) {
        require(_scheduledTime > block.timestamp, "Cannot schedule in the past");
        require(
            _scheduledTime <= block.timestamp + MAX_SCHEDULING_ADVANCE,
            "Cannot schedule too far in advance"
        );
        require(bytes(_streamUrl).length > 0, "Stream URL required");

        // Générer un ID unique pour la session
        sessionId = keccak256(abi.encodePacked(
            _campaignDAO,
            _founder,
            _scheduledTime,
            block.timestamp
        ));

        // Vérifier qu'il n'y a pas déjà une session pour cette campagne
        require(
            campaignToSession[_campaignDAO] == bytes32(0),
            "Campaign already has an active session"
        );

        // Créer la session
        LiveSession storage session = liveSessions[sessionId];
        session.campaignDAO = _campaignDAO;
        session.founder = _founder;
        session.scheduledTime = _scheduledTime;
        session.status = SessionStatus.SCHEDULED;
        session.streamUrl = _streamUrl;
        session.streamKey = _generateStreamKey(sessionId);

        // Mettre à jour les mappings
        founderSessions[_founder].push(sessionId);
        campaignToSession[_campaignDAO] = sessionId;
        allSessions.push(sessionId);
        totalSessions++;

        emit SessionScheduled(sessionId, _campaignDAO, _founder, _scheduledTime, _streamUrl);
        
        return sessionId;
    }

    /**
     * @dev Démarre une session live
     */
    function startSession(bytes32 sessionId) external {
        LiveSession storage session = liveSessions[sessionId];
        require(session.founder == msg.sender, "Only founder can start");
        require(session.status == SessionStatus.SCHEDULED, "Session not scheduled");
        require(
            block.timestamp >= session.scheduledTime,
            "Too early to start"
        );
        require(
            block.timestamp <= session.scheduledTime + 1 hours,
            "Too late to start (max 1h delay)"
        );

        session.actualStartTime = block.timestamp;
        session.status = SessionStatus.LIVE;
        session.lastHeartbeat = block.timestamp;

        emit SessionStarted(sessionId, block.timestamp, session.streamKey);
    }

    /**
     * @dev Heartbeat du fondateur pendant le live
     */
    function sendHeartbeat(bytes32 sessionId) external {
        LiveSession storage session = liveSessions[sessionId];
        require(session.founder == msg.sender, "Only founder can send heartbeat");
        require(session.status == SessionStatus.LIVE, "Session not live");

        session.lastHeartbeat = block.timestamp;
        emit HeartbeatReceived(sessionId, block.timestamp);
    }

    /**
     * @dev Termine une session live
     */
    function endSession(bytes32 sessionId, uint256 _viewersCount) external {
        LiveSession storage session = liveSessions[sessionId];
        require(session.founder == msg.sender, "Only founder can end");
        require(session.status == SessionStatus.LIVE, "Session not live");

        session.endTime = block.timestamp;
        session.viewersCount = _viewersCount;

        uint256 duration = session.endTime - session.actualStartTime;
        session.isValid = duration >= MINIMUM_DURATION;

        if (session.isValid) {
            session.status = SessionStatus.ENDED;
        } else {
            session.status = SessionStatus.INVALID;
        }

        // Nettoyer le mapping de campagne active
        delete campaignToSession[session.campaignDAO];

        emit SessionEnded(sessionId, block.timestamp, duration, session.isValid);
    }

    /**
     * @dev Un spectateur rejoint le live
     */
    function joinAsViewer(bytes32 sessionId) external {
        LiveSession storage session = liveSessions[sessionId];
        require(session.status == SessionStatus.LIVE, "Session not live");
        require(!session.viewers[msg.sender], "Already joined");

        session.viewers[msg.sender] = true;
        emit ViewerJoined(sessionId, msg.sender);
    }

    /**
     * @dev Un spectateur quitte le live
     */
    function leaveAsViewer(bytes32 sessionId) external {
        LiveSession storage session = liveSessions[sessionId];
        require(session.viewers[msg.sender], "Not joined");

        session.viewers[msg.sender] = false;
        emit ViewerLeft(sessionId, msg.sender);
    }

    /**
     * @dev Vérification automatique du heartbeat
     * Appelé par Chainlink Automation ou manuellement
     */
    function checkHeartbeat(bytes32 sessionId) external {
        LiveSession storage session = liveSessions[sessionId];
        
        if (session.status == SessionStatus.LIVE) {
            if (block.timestamp > session.lastHeartbeat + HEARTBEAT_TIMEOUT) {
                // Fondateur inactif → Annuler la session
                session.status = SessionStatus.CANCELLED;
                session.endTime = block.timestamp;
                
                delete campaignToSession[session.campaignDAO];
                emit SessionEnded(sessionId, block.timestamp, 0, false);
            }
        }
    }

    /**
     * @dev Annuler une session (modérateurs seulement)
     */
    function cancelSession(bytes32 sessionId) external onlyRole(MODERATOR_ROLE) {
        LiveSession storage session = liveSessions[sessionId];
        require(
            session.status == SessionStatus.SCHEDULED || session.status == SessionStatus.LIVE,
            "Cannot cancel this session"
        );

        session.status = SessionStatus.CANCELLED;
        session.endTime = block.timestamp;
        
        delete campaignToSession[session.campaignDAO];
        emit SessionEnded(sessionId, block.timestamp, 0, false);
    }

    // ===== FONCTIONS DE LECTURE =====

    function getSession(bytes32 sessionId) external view returns (
        address campaignDAO,
        address founder,
        uint256 scheduledTime,
        uint256 actualStartTime,
        uint256 endTime,
        SessionStatus status,
        string memory streamUrl,
        uint256 viewersCount,
        bool isValid
    ) {
        LiveSession storage session = liveSessions[sessionId];
        return (
            session.campaignDAO,
            session.founder,
            session.scheduledTime,
            session.actualStartTime,
            session.endTime,
            session.status,
            session.streamUrl,
            session.viewersCount,
            session.isValid
        );
    }

    function getFounderSessions(address founder) external view returns (bytes32[] memory) {
        return founderSessions[founder];
    }

    function getCampaignActiveSession(address campaign) external view returns (bytes32) {
        return campaignToSession[campaign];
    }

    function getAllSessions() external view returns (bytes32[] memory) {
        return allSessions;
    }

    function isSessionLive(bytes32 sessionId) external view returns (bool) {
        return liveSessions[sessionId].status == SessionStatus.LIVE;
    }

    function isViewerConnected(bytes32 sessionId, address viewer) external view returns (bool) {
        return liveSessions[sessionId].viewers[viewer];
    }

    // ===== FONCTIONS INTERNES =====

    function _generateStreamKey(bytes32 sessionId) internal pure returns (string memory) {
        return string(abi.encodePacked(
            "livar_stream_",
            _toHexString(uint256(sessionId))
        ));
    }

    function _toHexString(uint256 value) internal pure returns (string memory) {
        bytes memory buffer = new bytes(64);
        for (uint256 i = 0; i < 64; i++) {
            buffer[63 - i] = bytes1(uint8(48 + uint256(value >> (4 * i)) % 16));
        }
        return string(buffer);
    }

    // ===== GESTION DES RÔLES =====

    function grantDAORole(address daoContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(DAO_ROLE, daoContract);
    }

    function grantModeratorRole(address moderator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(MODERATOR_ROLE, moderator);
    }
}