// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";
import "./DivarProxy.sol";
import "./Campaign.sol";

contract CampaignKeeper is AutomationCompatibleInterface {
    event UpkeepPerformed(address indexed campaign, uint256 roundNumber, bool success);
    
    DivarProxy public immutable divarProxy;
    mapping(address => bool) public registeredCampaigns;
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
                        return (true, abi.encode(campaigns[i], roundNumber));
                    }
                } catch {
                    continue;
                }
            }
        }
        
        return (false, "");
    }
    
    function performUpkeep(bytes calldata performData) external override {
        (address campaignAddress, uint256 roundNumber) = abi.decode(
            performData,
            (address, uint256)
        );
        
        require(campaignAddress != address(0), "Invalid campaign address");
        require(registeredCampaigns[campaignAddress], "Campaign not registered");
        
        lastCheckTime = block.timestamp;
        Campaign campaign = Campaign(payable(campaignAddress));
        
        try campaign.finalizeRound() {
            emit UpkeepPerformed(campaignAddress, roundNumber, true);
            // Note: burnUnsoldNFTs removed - NFTs only exist when purchased
        } catch {
            emit UpkeepPerformed(campaignAddress, roundNumber, false);
        }
    }

    function registerCampaign(address campaign) external {
        require(msg.sender == address(divarProxy), "Only DivarProxy can register");
        require(campaign != address(0), "Invalid campaign address");
        registeredCampaigns[campaign] = true;
    }
}