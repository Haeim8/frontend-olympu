// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./Campaign.sol";

/**
 * @title CampaignGovernance
 * @dev Système de gouvernance inspiré de Cosmos ATOM pour les campagnes
 * Permet aux créateurs de proposer des votes et aux détenteurs NFT de voter
 * Poids de vote basé sur le nombre de NFTs possédés (tous rounds confondus)
 */
contract CampaignGovernance is AccessControl, ReentrancyGuard {
    using Address for address payable;

    // Rôles
    bytes32 public constant CAMPAIGN_ROLE = keccak256("CAMPAIGN_ROLE");
    bytes32 public constant FOUNDER_ROLE = keccak256("FOUNDER_ROLE");

    // Types de propositions
    enum ProposalType {
        PARAMETER_CHANGE,      // Changement de paramètres
        DIVIDEND_DISTRIBUTION, // Distribution de dividendes
        STRATEGIC_DECISION,    // Décision stratégique
        EMERGENCY_ACTION,      // Action d'urgence
        PLATFORM_UPGRADE       // Mise à niveau
    }

    // Statut des propositions
    enum ProposalStatus {
        ACTIVE,      // Vote en cours
        PASSED,      // Acceptée
        REJECTED,    // Rejetée
        EXECUTED,    // Exécutée
        CANCELLED,   // Annulée
        EXPIRED      // Expirée
    }

    // Structure d'une proposition
    struct Proposal {
        uint256 id;
        address proposer;           // Créateur de la proposition (normalement founder)
        ProposalType proposalType;
        string title;               // Titre de la proposition
        string description;         // Description détaillée
        bytes executionData;        // Données pour l'exécution
        uint256 creationTime;       // Timestamp de création
        uint256 votingDeadline;     // Deadline pour voter
        uint256 executionDelay;     // Délai avant exécution
        ProposalStatus status;
        
        // Résultats du vote
        uint256 votesFor;          // Votes pour
        uint256 votesAgainst;      // Votes contre
        uint256 votesAbstain;      // Abstentions
        uint256 totalVotingPower;  // Pouvoir de vote total utilisé
        uint256 quorumRequired;    // Quorum requis (en pourcentage)
        uint256 majorityRequired;  // Majorité requise (en pourcentage)
    }

    // Structure d'un vote
    struct Vote {
        address voter;
        uint256 votingPower;    // Nombre de NFTs au moment du vote
        uint8 support;          // 0=Against, 1=For, 2=Abstain
        uint256 timestamp;
        string reason;          // Raison du vote (optionnel)
    }

    // Variables d'état
    Campaign public immutable campaignContract;
    address public founder;
    
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Vote)) public votes; // proposalId => voter => vote
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    
    // Configuration de gouvernance
    uint256 public constant VOTING_PERIOD = 7 days;        // Période de vote
    uint256 public constant EXECUTION_DELAY = 2 days;      // Délai avant exécution
    uint256 public constant DEFAULT_QUORUM = 30;           // 30% de quorum par défaut
    uint256 public constant SIMPLE_MAJORITY = 51;          // 51% pour majorité simple
    uint256 public constant SUPERMAJORITY = 67;            // 67% pour supermajorité
    
    // Événements
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        ProposalType proposalType,
        string title,
        string description,
        uint256 votingDeadline
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        uint8 support,
        uint256 votingPower,
        string reason
    );
    
    event ProposalExecuted(uint256 indexed proposalId, bytes result);
    event ProposalCancelled(uint256 indexed proposalId, string reason);
    
    constructor(
        address payable _campaignContract,
        address _founder
    ) {
        require(_campaignContract != address(0), "Invalid campaign address");
        require(_founder != address(0), "Invalid founder address");

        campaignContract = Campaign(_campaignContract);
        founder = _founder;

        // Accorder les rôles
        _grantRole(DEFAULT_ADMIN_ROLE, _founder);
        _grantRole(FOUNDER_ROLE, _founder);
        _grantRole(CAMPAIGN_ROLE, _campaignContract);
    }

    modifier onlyFounder() {
        require(msg.sender == founder, "Only founder can call");
        _;
    }

    modifier onlyNFTHolder() {
        require(campaignContract.balanceOf(msg.sender) > 0, "Must own campaign NFTs to vote");
        _;
    }

    /**
     * @dev Créer une nouvelle proposition (réservé au fondateur)
     */
    function createProposal(
        ProposalType _type,
        string memory _title,
        string memory _description,
        bytes memory _executionData,
        uint256 _quorum,
        uint256 _majority
    ) external onlyFounder returns (uint256 proposalId) {
        require(bytes(_title).length > 0, "Title required");
        require(bytes(_description).length > 0, "Description required");
        require(_quorum >= 10 && _quorum <= 100, "Invalid quorum (10-100%)");
        require(_majority >= 51 && _majority <= 100, "Invalid majority (51-100%)");

        proposalId = ++proposalCount;
        
        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.proposalType = _type;
        proposal.title = _title;
        proposal.description = _description;
        proposal.executionData = _executionData;
        proposal.creationTime = block.timestamp;
        proposal.votingDeadline = block.timestamp + VOTING_PERIOD;
        proposal.executionDelay = EXECUTION_DELAY;
        proposal.status = ProposalStatus.ACTIVE;
        proposal.quorumRequired = _quorum;
        proposal.majorityRequired = _majority;

        emit ProposalCreated(
            proposalId,
            msg.sender,
            _type,
            _title,
            _description,
            proposal.votingDeadline
        );

        return proposalId;
    }

    /**
     * @dev Voter sur une proposition (réservé aux détenteurs NFT)
     * @param proposalId ID de la proposition
     * @param support 0=Against, 1=For, 2=Abstain  
     * @param reason Raison du vote (optionnel)
     */
    function castVote(
        uint256 proposalId,
        uint8 support,
        string memory reason
    ) external onlyNFTHolder nonReentrant {
        require(proposalId <= proposalCount && proposalId > 0, "Invalid proposal ID");
        require(support <= 2, "Invalid vote type");
        require(!hasVoted[proposalId][msg.sender], "Already voted");
        
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.ACTIVE, "Proposal not active");
        require(block.timestamp <= proposal.votingDeadline, "Voting period ended");

        // 🔥 COSMOS STYLE : Poids de vote = nombre de NFTs possédés
        uint256 votingPower = campaignContract.balanceOf(msg.sender);
        require(votingPower > 0, "No voting power");

        // Enregistrer le vote
        votes[proposalId][msg.sender] = Vote({
            voter: msg.sender,
            votingPower: votingPower,
            support: support,
            timestamp: block.timestamp,
            reason: reason
        });

        hasVoted[proposalId][msg.sender] = true;

        // Mettre à jour les compteurs
        if (support == 0) {
            proposal.votesAgainst += votingPower;
        } else if (support == 1) {
            proposal.votesFor += votingPower;
        } else {
            proposal.votesAbstain += votingPower;
        }

        proposal.totalVotingPower += votingPower;

        emit VoteCast(proposalId, msg.sender, support, votingPower, reason);
    }

    /**
     * @dev Finaliser une proposition après la période de vote
     */
    function finalizeProposal(uint256 proposalId) external {
        require(proposalId <= proposalCount && proposalId > 0, "Invalid proposal ID");
        
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.ACTIVE, "Proposal not active");
        require(block.timestamp > proposal.votingDeadline, "Voting still active");

        // Calculer le pouvoir de vote total possible
        uint256 totalPossibleVotes = campaignContract.totalSupply();
        uint256 participationRate = (proposal.totalVotingPower * 100) / totalPossibleVotes;

        // Vérifier le quorum
        if (participationRate < proposal.quorumRequired) {
            proposal.status = ProposalStatus.REJECTED;
            return;
        }

        // Vérifier la majorité (votes For vs votes Against, abstentions non comptées)
        uint256 totalDecisiveVotes = proposal.votesFor + proposal.votesAgainst;
        if (totalDecisiveVotes == 0) {
            proposal.status = ProposalStatus.REJECTED;
            return;
        }

        uint256 supportRate = (proposal.votesFor * 100) / totalDecisiveVotes;
        
        if (supportRate >= proposal.majorityRequired) {
            proposal.status = ProposalStatus.PASSED;
        } else {
            proposal.status = ProposalStatus.REJECTED;
        }
    }

    /**
     * @dev Exécuter une proposition acceptée (après délai)
     */
    function executeProposal(uint256 proposalId) external nonReentrant {
        require(proposalId <= proposalCount && proposalId > 0, "Invalid proposal ID");
        
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.PASSED, "Proposal not passed");
        require(
            block.timestamp >= proposal.votingDeadline + proposal.executionDelay,
            "Execution delay not met"
        );

        proposal.status = ProposalStatus.EXECUTED;

        // Exécuter selon le type de proposition
        bytes memory result = _executeProposalAction(proposal);
        
        emit ProposalExecuted(proposalId, result);
    }

    /**
     * @dev Annuler une proposition (fondateur uniquement)
     */
    function cancelProposal(uint256 proposalId, string memory reason) external onlyFounder {
        require(proposalId <= proposalCount && proposalId > 0, "Invalid proposal ID");
        
        Proposal storage proposal = proposals[proposalId];
        require(
            proposal.status == ProposalStatus.ACTIVE || proposal.status == ProposalStatus.PASSED,
            "Cannot cancel this proposal"
        );

        proposal.status = ProposalStatus.CANCELLED;
        emit ProposalCancelled(proposalId, reason);
    }

    /**
     * @dev Logique d'exécution des propositions selon leur type
     */
    function _executeProposalAction(Proposal memory proposal) internal pure returns (bytes memory) {
        if (proposal.proposalType == ProposalType.PARAMETER_CHANGE) {
            return _executeParameterChange(proposal.executionData);
        } else if (proposal.proposalType == ProposalType.DIVIDEND_DISTRIBUTION) {
            return _executeDividendDistribution(proposal.executionData);
        } else if (proposal.proposalType == ProposalType.STRATEGIC_DECISION) {
            return _executeStrategicDecision(proposal.executionData);
        } else if (proposal.proposalType == ProposalType.EMERGENCY_ACTION) {
            return _executeEmergencyAction(proposal.executionData);
        } else {
            return "Proposal type not implemented";
        }
    }

    function _executeParameterChange(bytes memory /* data */) internal pure returns (bytes memory) {
        // TODO: Implémenter changement de paramètres
        return "Parameter change executed";
    }

    function _executeDividendDistribution(bytes memory /* data */) internal pure returns (bytes memory) {
        // TODO: Implémenter distribution dividendes via gouvernance
        return "Dividend distribution executed";
    }

    function _executeStrategicDecision(bytes memory /* data */) internal pure returns (bytes memory) {
        // TODO: Implémenter décisions stratégiques
        return "Strategic decision executed";
    }

    function _executeEmergencyAction(bytes memory /* data */) internal pure returns (bytes memory) {
        // TODO: Implémenter actions d'urgence
        return "Emergency action executed";
    }

    // ===== FONCTIONS DE LECTURE =====

    function getProposal(uint256 proposalId) external view returns (
        uint256 id,
        address proposer,
        ProposalType proposalType,
        string memory title,
        string memory description,
        uint256 creationTime,
        uint256 votingDeadline,
        ProposalStatus status,
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 votesAbstain,
        uint256 totalVotingPower
    ) {
        require(proposalId <= proposalCount && proposalId > 0, "Invalid proposal ID");
        Proposal storage proposal = proposals[proposalId];
        
        return (
            proposal.id,
            proposal.proposer,
            proposal.proposalType,
            proposal.title,
            proposal.description,
            proposal.creationTime,
            proposal.votingDeadline,
            proposal.status,
            proposal.votesFor,
            proposal.votesAgainst,
            proposal.votesAbstain,
            proposal.totalVotingPower
        );
    }

    function getVote(uint256 proposalId, address voter) external view returns (
        uint256 votingPower,
        uint8 support,
        uint256 timestamp,
        string memory reason
    ) {
        require(hasVoted[proposalId][voter], "Voter has not voted");
        Vote storage vote = votes[proposalId][voter];
        
        return (
            vote.votingPower,
            vote.support,
            vote.timestamp,
            vote.reason
        );
    }

    function getVotingPower(address account) external view returns (uint256) {
        return campaignContract.balanceOf(account);
    }

    function getProposalResults(uint256 proposalId) external view returns (
        uint256 totalSupply,
        uint256 participationRate,
        uint256 supportRate,
        bool quorumMet,
        bool majorityMet
    ) {
        require(proposalId <= proposalCount && proposalId > 0, "Invalid proposal ID");
        Proposal storage proposal = proposals[proposalId];
        
        totalSupply = campaignContract.totalSupply();
        participationRate = totalSupply > 0 ? (proposal.totalVotingPower * 100) / totalSupply : 0;
        
        uint256 totalDecisiveVotes = proposal.votesFor + proposal.votesAgainst;
        supportRate = totalDecisiveVotes > 0 ? (proposal.votesFor * 100) / totalDecisiveVotes : 0;
        
        quorumMet = participationRate >= proposal.quorumRequired;
        majorityMet = supportRate >= proposal.majorityRequired;
        
        return (totalSupply, participationRate, supportRate, quorumMet, majorityMet);
    }

    function getAllProposals() external view returns (uint256[] memory) {
        uint256[] memory proposalIds = new uint256[](proposalCount);
        for (uint256 i = 1; i <= proposalCount; i++) {
            proposalIds[i-1] = i;
        }
        return proposalIds;
    }

    function getActiveProposals() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        
        // Compter les propositions actives
        for (uint256 i = 1; i <= proposalCount; i++) {
            if (proposals[i].status == ProposalStatus.ACTIVE) {
                activeCount++;
            }
        }
        
        // Créer le tableau des propositions actives
        uint256[] memory activeProposals = new uint256[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= proposalCount; i++) {
            if (proposals[i].status == ProposalStatus.ACTIVE) {
                activeProposals[index] = i;
                index++;
            }
        }
        
        return activeProposals;
    }
}