// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./AggregatorV3Interface.sol";

contract PriceConsumerV3 {
    AggregatorV3Interface internal immutable priceFeed;
    uint256 private constant STALENESS_PERIOD = 3600;
    uint256 private constant ETH_DECIMALS = 18;
    
    constructor() {
        priceFeed = AggregatorV3Interface(0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1);
    }
    
    function getLatestPrice() public view returns (int) {
        try priceFeed.latestRoundData() returns (
            uint80 roundID,
            int price,
            uint256 /*startedAt*/,  // Unused parameter
            uint256 updatedAt,
            uint80 answeredInRound
        ) {
            require(price > 0, "Negative ETH/USD price");
            require(updatedAt != 0, "Round not complete");
            require(answeredInRound >= roundID, "Stale price");
            require(block.timestamp - updatedAt <= STALENESS_PERIOD, "Stale price feed");
            
            return price;
        } catch Error(string memory reason) {
            revert(string(abi.encodePacked("Price feed error: ", reason)));
        } catch {
            revert("Failed to get price feed data");
        }
    }
    
    function convertUSDToETH(uint256 usdAmount) public view returns (uint256) {
    int256 ethPrice = getLatestPrice();
    require(ethPrice > 0, "Invalid ETH price");
    
    uint256 ethPriceUint = uint256(ethPrice);
    
    
    uint256 usdInDollars = usdAmount / 100;
    
 
    uint256 ethAmount = (usdInDollars * (10**26)) / ethPriceUint;
    
    return ethAmount;
}
    
    function convertETHToUSD(uint256 ethAmount) public view returns (uint256) {
    int256 ethPrice = getLatestPrice();
    require(ethPrice > 0, "Invalid ETH price");
    
    uint256 ethPriceUint = uint256(ethPrice);
    

    uint256 usdAmount = (ethAmount * ethPriceUint) / (10**18);
    
    return usdAmount;
}

    /**
     * @dev Fonction utilitaire pour obtenir un prix en ETH avec fallback pour tests locaux
     * @param usdCents Prix en cents USD (ex: 8500 pour 85$)
     * @param testEthPrice Prix fixe en ETH pour tests locaux (chainid 31337)
     */
    function getETHPriceWithTestFallback(uint256 usdCents, uint256 testEthPrice) public view returns (uint256) {
        if (block.chainid == 31337) {
            return testEthPrice;
        }
        return convertUSDToETH(usdCents);
    }
}