// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DivarEvents {
    event UserRegistered(
        address indexed user,
        uint256 timestamp,
        uint256 registrationFee
    );
    
    event CampaignCreated(
        address indexed campaignAddress,
        address indexed creator,
        string name,
        uint256 timestamp
    );

    event TreasuryUpdated(
        address indexed oldTreasury,
        address indexed newTreasury
    );

    event PlatformStatusChanged(
        bool isPaused
    );

    event CategoryAdded(
        string category, 
        address indexed campaignAddress
    );

    event CampaignMetricsUpdated(
     address indexed campaignAddress,
     uint256 totalInvestors,
     uint256 totalFundsRaised,
     uint256 timestamp
    );

    event RoundProgressUpdated(
     address indexed campaignAddress,
     uint256 indexed roundNumber, 
     uint256 currentFunding,
     uint256 remainingTime
    );
      event PriceConsumerUpdated(
        address indexed newPriceConsumer
    ); 
}