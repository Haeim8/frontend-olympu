// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SharesEvents
 * @dev Contrat contenant les événements utilisés dans le contrat Campaign.
 */
contract SharesEvents {
    event RoundStarted(
        uint256 indexed roundNumber, 
        uint256 sharePrice, 
        uint256 targetAmount
    );

    event RoundFinalized(
        uint256 indexed roundNumber, 
        bool success
    );

    event SharesPurchased(
        address indexed investor, 
        uint256 numShares, 
        uint256 roundNumber
    );

    event SharesRefunded(
        address indexed investor, 
        uint256 numShares, 
        uint256 refundAmount
    );

    event DividendsDistributed(
        uint256 amount, 
        uint256 timestamp
    );

    event DividendDetailsUpdated(
        uint256 amountPerShare
    );


    event MetadataUpdated(
        string newMetadata
    );

    event FundsTransferred(
        address indexed to, 
        uint256 amount
    );

    event CommissionPaid(
        address indexed treasury, 
        uint256 amount
    );
    
    event EscrowSetup(
        uint256 amount,
        uint256 releaseTime
    );
    
    event EscrowReleased(
        uint256 amount,
        uint256 timestamp
    );

    event DividendsClaimed(
        address indexed investor,
        uint256 amount,
        uint256 timestamp
    );

    // 🗳️ Governance Events
    event CommissionChanged(
        uint256 oldCommission,
        uint256 newCommission,
        uint256 timestamp
    );
}
