// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";
import "./DivarProxy.sol";
import "./Campaign.sol";

contract CampaignKeeper is AutomationCompatibleInterface {
    // 🆕 Événements standardisés avec timestamps
    event CampaignFinalized(
        address indexed campaign, 
        uint256 indexed roundNumber, 
        bool success,
        uint256 timestamp
    );
    
    modifier validAddress(address _addr) {
        require(_addr != address(0), "Invalid address");
        _;
    }
    
    DivarProxy public immutable divarProxy;
    mapping(address => bool) public registeredCampaigns;
    
    uint256 public lastCheckTime;
    uint256 public constant CHECK_INTERVAL = 1 hours;
    
    constructor(address payable _divarProxy) validAddress(_divarProxy) {
        divarProxy = DivarProxy(_divarProxy);
        lastCheckTime = block.timestamp;
    }

    function checkUpkeep(bytes calldata /* checkData */)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        address[] memory campaigns = divarProxy.getAllCampaigns();
        
        // 🆕 VÉRIFICATION UNIFIÉE : Campagnes à finaliser OU DAOs à clôturer
        for(uint i = 0; i < campaigns.length; i++) {
            if(campaigns[i] != address(0) && registeredCampaigns[campaigns[i]]) {
                Campaign campaign = Campaign(payable(campaigns[i]));
                
                // ÉTAPE 1: Vérifier si campagne doit être finalisée
                try campaign.getCurrentRound() returns (
                    uint256 roundNumber,
                    uint256 /* sharePrice */,
                    uint256 targetAmount,
                    uint256 fundsRaised,
                    uint256 /* sharesSold */,
                    uint256 endTime,
                    bool isActive,
                    bool isFinalized
                ) {
                    if (isActive && !isFinalized && 
                        (block.timestamp > endTime || fundsRaised >= targetAmount)) {
                        return (true, abi.encode("FINALIZE", campaigns[i], roundNumber));
                    }
                } catch {
                    // Continue si erreur
                }
                
            }
        }
        
        return (false, "");
    }
    
    function performUpkeep(bytes calldata performData) external override {
        lastCheckTime = block.timestamp;
        
        // 🆕 Décoder le type d'action en premier
        string memory actionType;
        
        // Essayer de décoder comme FINALIZE
        try this.decodeFinalize(performData) returns (string memory action, address campaignAddr, uint256 roundNumber) {
            actionType = action;
            if(keccak256(bytes(actionType)) == keccak256(bytes("FINALIZE"))) {
                _finalizeCampaign(campaignAddr, roundNumber);
                return;
            }
        } catch {}
        
    }
    
    // 🆕 Fonctions de décodage externes (pour try/catch)
    function decodeFinalize(bytes calldata data) external pure returns (string memory, address, uint256) {
        return abi.decode(data, (string, address, uint256));
    }
    
    
    // 🆕 FINALISER UNE CAMPAGNE (lance automatiquement la phase DAO)
    function _finalizeCampaign(address campaignAddress, uint256 roundNumber) internal validAddress(campaignAddress) {
        require(registeredCampaigns[campaignAddress], "KEEPER: Campaign not registered");
        
        Campaign campaign = Campaign(payable(campaignAddress));
        
        try campaign.finalizeRound() {
            emit CampaignFinalized(campaignAddress, roundNumber, true, block.timestamp);
        } catch {
            emit CampaignFinalized(campaignAddress, roundNumber, false, block.timestamp);
        }
    }
    

    function registerCampaign(address campaign) external validAddress(campaign) {
        require(msg.sender == address(divarProxy), "KEEPER: Only DivarProxy can register");
        registeredCampaigns[campaign] = true;
    }
    
    // 🆕 Vérifier si une campagne est enregistrée
    function isCampaignRegistered(address campaign) external view returns (bool) {
        return registeredCampaigns[campaign];
    }
}