// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title NFTRenderer
 * @dev Contrat séparé pour générer les SVG et métadonnées NFT
 * Évite le problème de bytecode trop long dans Campaign.sol
 */
contract NFTRenderer {
    using Strings for uint256;

    struct NFTCustomization {
        string backgroundColor;
        string textColor;
        string logoUrl;
        string companyName;
        string sector;
    }

    /**
     * @dev Génère le tokenURI complet pour un NFT
     */
    function generateTokenURI(
        uint256 tokenId,
        address contractAddress,
        NFTCustomization memory customization,
        uint256 round,
        uint256 number
    ) external pure returns (string memory) {
        string memory svg = _generateSVG(tokenId, customization, round, number);
        string memory json = _generateMetadata(tokenId, contractAddress, customization, svg, round, number);
        
        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(bytes(json))
        ));
    }

    /**
     * @dev Génère le SVG optimisé
     */
    function _generateSVG(
        uint256 tokenId,
        NFTCustomization memory custom,
        uint256 round,
        uint256 number
    ) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="700" viewBox="0 0 500 700">',
            _generateStyles(custom),
            _generateBackground(custom.backgroundColor),
            _generateHeader(custom.companyName, custom.textColor),
            _generateLogo(custom.logoUrl, custom.backgroundColor, custom.textColor),
            _generateInfo(tokenId, round, number, custom.textColor),
            _generateFooter(custom.sector, custom.textColor),
            '</svg>'
        ));
    }

    function _generateStyles(NFTCustomization memory custom) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<defs>',
            '<style>',
            '.title{font:bold 24px sans-serif;text-anchor:middle;fill:', custom.textColor, ';}',
            '.subtitle{font:16px sans-serif;text-anchor:middle;fill:', custom.textColor, ';}',
            '.info{font:12px monospace;fill:', custom.textColor, ';}',
            '.glow{filter:drop-shadow(0 0 8px rgba(255,255,255,0.3));}',
            '</style>',
            '</defs>'
        ));
    }

    function _generateBackground(string memory bgColor) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<rect width="500" height="700" fill="', bgColor, '"/>',
            '<rect x="10" y="10" width="480" height="680" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2" rx="20"/>'
        ));
    }

    function _generateHeader(string memory name, string memory textColor) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<text x="250" y="80" class="title">', name, '</text>',
            '<text x="250" y="110" class="subtitle">Tokenized Equity</text>',
            '<line x1="80" y1="140" x2="420" y2="140" stroke="', textColor, '" stroke-width="1" opacity="0.3"/>'
        ));
    }

    function _generateLogo(
        string memory logoUrl, 
        string memory bgColor,
        string memory textColor
    ) internal pure returns (string memory) {
        if (bytes(logoUrl).length > 0) {
            return string(abi.encodePacked(
                '<circle cx="250" cy="220" r="50" fill="', textColor, '" class="glow"/>',
                '<image x="210" y="180" width="80" height="80" href="', logoUrl, '" clip-path="circle(40px at 40px 40px)"/>'
            ));
        } else {
            return string(abi.encodePacked(
                '<circle cx="250" cy="220" r="50" fill="', textColor, '" class="glow"/>',
                '<path d="M225 200 L275 200 L275 240 L225 240 Z M230 210 L270 210 M230 220 L270 220 M230 230 L270 230" stroke="', bgColor, '" stroke-width="3" fill="none"/>'
            ));
        }
    }

    function _generateInfo(
        uint256 tokenId,
        uint256 round,
        uint256 number,
        string memory textColor
    ) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<rect x="50" y="320" width="400" height="200" fill="rgba(255,255,255,0.05)" rx="15"/>',
            '<text x="70" y="350" class="info" fill="', textColor, '">Token ID: #', tokenId.toString(), '</text>',
            '<text x="70" y="375" class="info" fill="', textColor, '">Round: ', round.toString(), '</text>',
            '<text x="70" y="400" class="info" fill="', textColor, '">Number: ', number.toString(), '</text>',
            '<text x="70" y="425" class="info" fill="', textColor, '">Type: Company Shares</text>',
            '<text x="70" y="450" class="info" fill="', textColor, '">Standard: ERC-721</text>',
            '<text x="70" y="475" class="info" fill="', textColor, '">Blockchain: Base</text>'
        ));
    }

    function _generateFooter(string memory sector, string memory textColor) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<rect x="50" y="580" width="400" height="80" fill="rgba(255,255,255,0.05)" rx="15"/>',
            '<text x="250" y="610" class="subtitle" fill="', textColor, '">Sector: ', sector, '</text>',
            '<text x="250" y="635" class="info" fill="', textColor, '">Powered by Livar Protocol</text>',
            '<circle cx="420" cy="620" r="8" fill="#10b981"/>',
            '<text x="450" y="625" class="info" fill="', textColor, '" style="font-size:10px;">LIVE</text>'
        ));
    }

    /**
     * @dev Génère les métadonnées JSON
     */
    function _generateMetadata(
        uint256 tokenId,
        address contractAddress,
        NFTCustomization memory custom,
        string memory svg,
        uint256 round,
        uint256 number
    ) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '{"name":"', custom.companyName, ' Share #', tokenId.toString(), '",',
            '"description":"Tokenized equity share representing ownership in ', custom.companyName, '",',
            '"image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '",',
            '"attributes":[',
            '{"trait_type":"Company","value":"', custom.companyName, '"},',
            '{"trait_type":"Sector","value":"', custom.sector, '"},',
            '{"trait_type":"Round","value":', round.toString(), '},',
            '{"trait_type":"Number","value":', number.toString(), '},',
            '{"trait_type":"Contract","value":"', Strings.toHexString(uint160(contractAddress), 20), '"}',
            ']}'
        ));
    }
}