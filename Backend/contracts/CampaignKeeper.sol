// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";
import "./DivarProxy.sol";
import "./Campaign.sol";
import "./CampaignDAO.sol";

contract CampaignKeeper is AutomationCompatibleInterface {
    // 🆕 Nouveaux événements pour les 2 phases
    event CampaignFinalized(address indexed campaign, uint256 roundNumber, bool success);
    event DAOClosed(address indexed dao, address indexed campaign, bool success);
    
    DivarProxy public immutable divarProxy;
    mapping(address => bool) public registeredCampaigns;
    
    // 🆕 Tracking des DAOs actifs
    mapping(address => address) public campaignToDAO;  // campaign => DAO address
    mapping(address => bool) public activeDAOs;        // DAO => est actif
    
    uint256 public lastCheckTime;
    uint256 public constant CHECK_INTERVAL = 1 hours;
    
    constructor(address payable _divarProxy) {
        require(_divarProxy != address(0), "Invalid proxy address");
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
        
        // 🆕 PHASE 1: Vérifier les campagnes à finaliser
        for(uint i = 0; i < campaigns.length; i++) {
            if(campaigns[i] != address(0) && registeredCampaigns[campaigns[i]]) {
                Campaign campaign = Campaign(payable(campaigns[i]));
                
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
                    continue;
                }
            }
        }
        
        // 🆕 PHASE 2: Vérifier les DAOs à clôturer
        for(uint i = 0; i < campaigns.length; i++) {
            address campaignAddr = campaigns[i];
            address daoAddr = campaignToDAO[campaignAddr];
            
            if(daoAddr != address(0) && activeDAOs[daoAddr]) {
                try CampaignDAO(payable(daoAddr)).getCurrentPhase() returns (CampaignDAO.DAOPhase phase) {
                    if(phase == CampaignDAO.DAOPhase.EXCHANGE_PERIOD) {
                        try CampaignDAO(payable(daoAddr)).getTimeRemaining() returns (uint256 timeRemaining) {
                            if(timeRemaining == 0) {
                                return (true, abi.encode("CLOSE_DAO", campaignAddr, daoAddr));
                            }
                        } catch {
                            continue;
                        }
                    }
                } catch {
                    continue;
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
        
        // Essayer de décoder comme CLOSE_DAO
        try this.decodeCloseDAO(performData) returns (string memory action, address campaignAddr, address daoAddr) {
            actionType = action;
            if(keccak256(bytes(actionType)) == keccak256(bytes("CLOSE_DAO"))) {
                _closeDAO(campaignAddr, daoAddr);
                return;
            }
        } catch {}
    }
    
    // 🆕 Fonctions de décodage externes (pour try/catch)
    function decodeFinalize(bytes calldata data) external pure returns (string memory, address, uint256) {
        return abi.decode(data, (string, address, uint256));
    }
    
    function decodeCloseDAO(bytes calldata data) external pure returns (string memory, address, address) {
        return abi.decode(data, (string, address, address));
    }
    
    // 🆕 PHASE 1: Finaliser une campagne
    function _finalizeCampaign(address campaignAddress, uint256 roundNumber) internal {
        require(campaignAddress != address(0), "Invalid campaign address");
        require(registeredCampaigns[campaignAddress], "Campaign not registered");
        
        Campaign campaign = Campaign(payable(campaignAddress));
        
        try campaign.finalizeRound() {
            emit CampaignFinalized(campaignAddress, roundNumber, true);
            
            // 🆕 Après finalisation, checker si un DAO a été connecté
            try campaign.campaignDAO() returns (CampaignDAO dao) {
                if(address(dao) != address(0)) {
                    campaignToDAO[campaignAddress] = address(dao);
                    activeDAOs[address(dao)] = true;
                }
            } catch {}
            
        } catch {
            emit CampaignFinalized(campaignAddress, roundNumber, false);
        }
    }
    
    // 🆕 PHASE 2: Clôturer un DAO
    function _closeDAO(address campaignAddress, address daoAddress) internal {
        require(activeDAOs[daoAddress], "DAO not active");
        require(campaignToDAO[campaignAddress] == daoAddress, "DAO mismatch");
        
        CampaignDAO dao = CampaignDAO(payable(daoAddress));
        
        try dao.closeDAOPhase() {
            activeDAOs[daoAddress] = false;
            emit DAOClosed(daoAddress, campaignAddress, true);
        } catch {
            emit DAOClosed(daoAddress, campaignAddress, false);
        }
    }

    function registerCampaign(address campaign) external {
        require(msg.sender == address(divarProxy), "Only DivarProxy can register");
        require(campaign != address(0), "Invalid campaign address");
        registeredCampaigns[campaign] = true;
    }
    
    // 🆕 Pour les tests - enregistrer manuellement un DAO
    function registerDAO(address campaignAddress, address daoAddress) external {
        require(daoAddress != address(0), "Invalid DAO address");
        
        // En mode test, on enregistre automatiquement la campaign si pas encore fait
        if (!registeredCampaigns[campaignAddress]) {
            registeredCampaigns[campaignAddress] = true;
        }
        
        campaignToDAO[campaignAddress] = daoAddress;
        activeDAOs[daoAddress] = true;
    }
    
    // 🆕 Fonctions de lecture pour debugging
    function getDAOForCampaign(address campaign) external view returns (address) {
        return campaignToDAO[campaign];
    }
    
    function isDAOActive(address dao) external view returns (bool) {
        return activeDAOs[dao];
    }
}