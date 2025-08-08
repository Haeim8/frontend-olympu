// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SharesStorage
 * @dev Contrat de stockage pour la gestion des parts, des investissements et des dividendes.
 */
contract SharesStorage {
    // Constants
    uint256 public constant PLATFORM_COMMISSION_PERCENT = 15;
   
    address public campaignKeeper;

constructor(address _campaignKeeper) {
    campaignKeeper = _campaignKeeper;
}
    
    // Structures
    struct Round {
        uint256 roundNumber;
        uint256 sharePrice;
        uint256 targetAmount;
        uint256 fundsRaised;
        uint256 sharesSold;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool isFinalized;
    }

    struct Investment {
        address investor;
        uint256 amount;
        uint256 shares;
        uint256 timestamp;
        uint256[] tokenIds;
        uint256 roundNumber;
    }

    struct Escrow {
        uint256 amount;          // Montant total à libérer
        uint256 releaseTime;     // Temps de libération (24h après finalisation)
        bool isReleased; 
    }

    Escrow public escrow;

    // Informations de base
    address public startup;
    string public campaignName;
    address public treasury;
    string public metadata;

    // Variables financières
    uint256 public currentRound;
    uint256 public totalFundsRaised;
    bool public canReceiveDividends;

    // Mappings
    mapping(uint256 => Round) public rounds;
    mapping(address => Investment[]) public investmentsByAddress;
    mapping(address => uint256) public sharesOwned;
    mapping(address => uint256) public unclaimedDividends; // Dividendes non réclamés par chaque investisseur
    mapping(address => bool) public isInvestor;
    mapping(uint256 => bool) public tokenBurned; // Pour éviter les double-burns lors de refunds

    // Arrays
    address[] public investors;
    Investment[] public allInvestments;
    address[] public allCampaigns;
}
