// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "./SharesStorage.sol";

/**
 * @title NFTRenderer
 * @dev Contrat séparé pour la génération des SVG des NFTs de campagne
 */
contract NFTRenderer {
    using Strings for uint256;
    using Base64 for bytes;

    /**
     * @dev Génère le SVG du NFT avec effet glass morphism et animation liquide
     * @param tokenId ID du token pour lequel générer le SVG
     * @param campaignName Nom de la campagne
     * @param startup Adresse de la startup
     * @param nftConfig Configuration visuelle du NFT
     * @return SVG complet encodé
     */
    function generateNFTSVG(
        uint256 tokenId,
        string memory campaignName,
        address startup,
        SharesStorage.NFTVisualConfig memory nftConfig
    ) public view returns (string memory) {
        (uint256 round, uint256 number) = getNFTInfo(tokenId);
        
        return string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" style="background:',
            nftConfig.backgroundColor, '">',
            
            // Définitions des gradients et animations
            '<defs>',
                '<linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">',
                    '<stop offset="0%" stop-color="#667eea" stop-opacity="0.8">',
                        '<animate attributeName="stop-opacity" values="0.8;1;0.8" dur="3s" repeatCount="indefinite"/>',
                    '</stop>',
                    '<stop offset="50%" stop-color="#764ba2" stop-opacity="0.6">',
                        '<animate attributeName="stop-opacity" values="0.6;0.9;0.6" dur="4s" repeatCount="indefinite"/>',
                    '</stop>',
                    '<stop offset="100%" stop-color="#f093fb" stop-opacity="0.4">',
                        '<animate attributeName="stop-opacity" values="0.4;0.7;0.4" dur="5s" repeatCount="indefinite"/>',
                    '</stop>',
                '</linearGradient>',
                
                '<linearGradient id="liquidGlass" x1="0%" y1="0%" x2="100%" y2="100%">',
                    '<stop offset="0%" stop-color="#ffffff" stop-opacity="0.2">',
                        '<animate attributeName="stop-opacity" values="0.2;0.4;0.2" dur="3s" repeatCount="indefinite"/>',
                    '</stop>',
                    '<stop offset="50%" stop-color="#64ffda" stop-opacity="0.3">',
                        '<animate attributeName="stop-opacity" values="0.3;0.5;0.3" dur="4s" repeatCount="indefinite"/>',
                    '</stop>',
                    '<stop offset="100%" stop-color="#ff6b6b" stop-opacity="0.1"/>',
                '</linearGradient>',
                
                '<radialGradient id="circleGlow" cx="50%" cy="50%" r="50%">',
                    '<stop offset="0%" stop-color="#4facfe" stop-opacity="0.6"/>',
                    '<stop offset="100%" stop-color="#00f2fe" stop-opacity="0.2"/>',
                '</radialGradient>',
                
                '<filter id="glass" x="-50%" y="-50%" width="200%" height="200%">',
                    '<feGaussianBlur in="SourceGraphic" stdDeviation="2"/>',
                    '<feOffset dx="0" dy="4" result="offset"/>',
                    '<feFlood flood-color="#ffffff" flood-opacity="0.3"/>',
                    '<feComposite in2="offset" operator="over"/>',
                '</filter>',
                
                '<filter id="glow">',
                    '<feGaussianBlur stdDeviation="3" result="coloredBlur"/>',
                    '<feMerge>',
                        '<feMergeNode in="coloredBlur"/>',
                        '<feMergeNode in="SourceGraphic"/>',
                    '</feMerge>',
                '</filter>',
            '</defs>',
            
            // Background principal avec gradient
            '<rect width="400" height="600" fill="url(#primaryGradient)" opacity="0.9"/>',
            '<rect width="400" height="600" fill="url(#liquidGlass)" opacity="0.6"/>',
            
            // Bulles animées stylées
            '<circle cx="80" cy="120" r="12" fill="url(#circleGlow)" opacity="0.7">',
                '<animateTransform attributeName="transform" type="translate" values="0,0;25,-15;0,0" dur="7s" repeatCount="indefinite"/>',
                '<animate attributeName="opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite"/>',
            '</circle>',
            '<circle cx="320" cy="450" r="18" fill="url(#circleGlow)" opacity="0.5">',
                '<animateTransform attributeName="transform" type="translate" values="0,0;-20,12;0,0" dur="9s" repeatCount="indefinite"/>',
                '<animate attributeName="opacity" values="0.5;0.9;0.5" dur="4s" repeatCount="indefinite"/>',
            '</circle>',
            '<circle cx="50" cy="500" r="8" fill="#ff6b6b" opacity="0.6">',
                '<animateTransform attributeName="transform" type="translate" values="0,0;15,-8;0,0" dur="5s" repeatCount="indefinite"/>',
            '</circle>',
            '<circle cx="350" cy="180" r="10" fill="#4facfe" opacity="0.4">',
                '<animateTransform attributeName="transform" type="translate" values="0,0;-12,20;0,0" dur="8s" repeatCount="indefinite"/>',
            '</circle>',
            
            // Header avec glass effect
            '<rect x="20" y="30" width="360" height="100" rx="20" fill="', nftConfig.backgroundColor, '" fill-opacity="0.3" filter="url(#glass)"/>',
            '<text x="200" y="70" text-anchor="middle" fill="', nftConfig.textColor, '" font-size="24" font-weight="bold" font-family="Arial">',
                campaignName,
            '</text>',
            '<text x="200" y="95" text-anchor="middle" fill="', nftConfig.textColor, '" font-size="16" font-family="Arial" opacity="0.8">Investment Share</text>',
            
            // Logo circle avec effets stylés
            '<circle cx="200" cy="200" r="48" fill="url(#circleGlow)" opacity="0.3" filter="url(#glow)">',
                '<animate attributeName="r" values="48;52;48" dur="4s" repeatCount="indefinite"/>',
            '</circle>',
            '<circle cx="200" cy="200" r="42" fill="', nftConfig.backgroundColor, '" fill-opacity="0.9" filter="url(#glass)"/>',
            '<circle cx="200" cy="200" r="40" stroke="url(#primaryGradient)" stroke-width="3" fill="none" opacity="0.8">',
                '<animate attributeName="stroke-width" values="3;5;3" dur="3s" repeatCount="indefinite"/>',
            '</circle>',
            
            // Logo ou placeholder
            generateLogoElement(nftConfig),
            
            // Info panel avec glass effect
            '<rect x="30" y="280" width="340" height="220" rx="15" fill="', nftConfig.backgroundColor, '" fill-opacity="0.2" filter="url(#glass)"/>',
            
            // Informations du NFT
            '<text x="50" y="310" fill="', nftConfig.textColor, '" font-size="14" font-family="Arial" font-weight="600">Deployer:</text>',
            '<text x="50" y="330" fill="', nftConfig.textColor, '" font-size="12" font-family="monospace">',
                toAsciiString(startup),
            '</text>',
            
            '<text x="50" y="360" fill="', nftConfig.textColor, '" font-size="14" font-family="Arial" font-weight="600">Token ID:</text>',
            '<text x="150" y="360" fill="', nftConfig.textColor, '" font-size="14" font-family="Arial">', Strings.toString(tokenId), '</text>',
            
            '<text x="50" y="390" fill="', nftConfig.textColor, '" font-size="14" font-family="Arial" font-weight="600">Stage:</text>',
            '<text x="110" y="390" fill="', nftConfig.textColor, '" font-size="14" font-family="Arial">', getRoundName(round), '</text>',
            
            '<text x="200" y="390" fill="', nftConfig.textColor, '" font-size="14" font-family="Arial" font-weight="600">Share:</text>',
            '<text x="250" y="390" fill="', nftConfig.textColor, '" font-size="14" font-family="Arial">', Strings.toString(number), '</text>',
            
            '<text x="50" y="420" fill="', nftConfig.textColor, '" font-size="14" font-family="Arial" font-weight="600">Contract:</text>',
            '<text x="50" y="440" fill="', nftConfig.textColor, '" font-size="10" font-family="monospace">',
                toAsciiString(msg.sender),
            '</text>',
            
            // Reward badges si activés
            generateRewardBadges(nftConfig),
            
            // Signature Livar stylée
            '<rect x="140" y="525" width="120" height="35" rx="18" fill="url(#primaryGradient)" opacity="0.8" filter="url(#glass)">',
                '<animate attributeName="opacity" values="0.8;1;0.8" dur="4s" repeatCount="indefinite"/>',
            '</rect>',
            '<text x="200" y="548" text-anchor="middle" fill="#ffffff" font-size="14" font-family="Arial" font-weight="bold" filter="url(#glow)">Livar</text>',
            '<text x="200" y="548" text-anchor="middle" fill="url(#circleGlow)" font-size="14" font-family="Arial" font-weight="bold" opacity="0.3">Livar</text>',
            
            '</svg>'
        );
    }

    /**
     * @dev Génère l'élément logo (image ou placeholder)
     * @param nftConfig Configuration visuelle du NFT
     * @return SVG du logo
     */
    function generateLogoElement(SharesStorage.NFTVisualConfig memory nftConfig) internal pure returns (string memory) {
        if (bytes(nftConfig.logoData).length > 0) {
            return string.concat('<image x="170" y="170" width="60" height="60" href="', nftConfig.logoData, '" clip-path="circle(30px at 30px 30px)"/>');
        } else {
            return string.concat('<circle cx="200" cy="200" r="15" fill="', nftConfig.textColor, '" opacity="0.3"/>');
        }
    }

    /**
     * @dev Génère les badges de récompenses selon la configuration
     * @param nftConfig Configuration visuelle du NFT
     * @return SVG des badges
     */
    function generateRewardBadges(SharesStorage.NFTVisualConfig memory nftConfig) internal pure returns (string memory) {
        string memory badges = "";
        uint256 yPos = 470;
        uint256 xPos = 50;
        
        if (nftConfig.dividendsEnabled) {
            badges = string.concat(badges, 
                '<rect x="', Strings.toString(xPos), '" y="', Strings.toString(yPos), 
                '" width="80" height="20" rx="10" fill="', nftConfig.textColor, 
                '" fill-opacity="0.1" stroke="', nftConfig.textColor, '" stroke-width="1"/>',
                '<text x="', Strings.toString(xPos + 40), '" y="', Strings.toString(yPos + 14), 
                '" text-anchor="middle" fill="', nftConfig.textColor, '" font-size="10" font-family="Arial">Dividends</text>'
            );
            xPos += 90;
        }
        
        if (nftConfig.airdropsEnabled && xPos <= 270) {
            badges = string.concat(badges,
                '<rect x="', Strings.toString(xPos), '" y="', Strings.toString(yPos), 
                '" width="70" height="20" rx="10" fill="', nftConfig.textColor, 
                '" fill-opacity="0.1" stroke="', nftConfig.textColor, '" stroke-width="1"/>',
                '<text x="', Strings.toString(xPos + 35), '" y="', Strings.toString(yPos + 14), 
                '" text-anchor="middle" fill="', nftConfig.textColor, '" font-size="10" font-family="Arial">Airdrops</text>'
            );
            xPos += 80;
        }
        
        if (nftConfig.revenueSplitEnabled && xPos <= 280) {
            badges = string.concat(badges,
                '<rect x="', Strings.toString(xPos), '" y="', Strings.toString(yPos), 
                '" width="90" height="20" rx="10" fill="', nftConfig.textColor, 
                '" fill-opacity="0.1" stroke="', nftConfig.textColor, '" stroke-width="1"/>',
                '<text x="', Strings.toString(xPos + 45), '" y="', Strings.toString(yPos + 14), 
                '" text-anchor="middle" fill="', nftConfig.textColor, '" font-size="9" font-family="Arial">Revenue</text>'
            );
        }
        
        return badges;
    }

    /**
     * @dev Convertit une adresse en string ASCII
     * @param addr Adresse à convertir
     * @return String de l'adresse
     */
    function toAsciiString(address addr) internal pure returns (string memory) {
        bytes memory data = abi.encodePacked(addr);
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < data.length; i++) {
            str[2 + i * 2] = alphabet[uint256(uint8(data[i] >> 4))];
            str[3 + i * 2] = alphabet[uint256(uint8(data[i] & 0x0f))];
        }
        return string(str);
    }

    /**
     * @dev Retourne les informations détaillées d'un NFT basées sur son ID
     * @param tokenId L'identifiant unique du NFT
     * @return round Le numéro du round dans lequel le NFT a été créé
     * @return number Le numéro séquentiel du NFT dans son round
     */
    function getNFTInfo(uint256 tokenId) public pure returns (uint256 round, uint256 number) {
        round = tokenId / 1_000_000;
        number = tokenId % 1_000_000;
        return (round, number);
    }

    /**
     * @dev Convertit un numéro de round en nom de financement
     * @param roundNumber Numéro du round
     * @return Nom du round de financement
     */
    function getRoundName(uint256 roundNumber) internal pure returns (string memory) {
        if (roundNumber == 1) return "Angel";
        if (roundNumber == 2) return "MVP";
        if (roundNumber == 3) return "Pre-Seed";
        if (roundNumber == 4) return "Seed";
        if (roundNumber == 5) return "Series A";
        if (roundNumber == 6) return "Series B";
        if (roundNumber == 7) return "Series C";
        
        // Pour les rounds > 7, on retourne "Round X"
        return string.concat("Round ", Strings.toString(roundNumber));
    }

    /**
     * @dev Génère le JSON complet pour tokenURI
     * @param tokenId ID du token
     * @param campaignName Nom de la campagne 
     * @param startup Adresse de la startup
     * @param nftConfig Configuration visuelle du NFT
     * @return JSON encodé en base64
     */
    function generateTokenURI(
        uint256 tokenId,
        string memory campaignName,
        address startup,
        SharesStorage.NFTVisualConfig memory nftConfig
    ) external view returns (string memory) {
        string memory svg = generateNFTSVG(tokenId, campaignName, startup, nftConfig);
        (uint256 round, uint256 number) = getNFTInfo(tokenId);
        
        string memory json = string.concat(
            '{"name":"', campaignName, ' Share #', Strings.toString(tokenId),
            '","description":"Investment share #', Strings.toString(number), ' from ', getRoundName(round), ' stage',
            ' of ', campaignName, '. This NFT represents ownership and provides access to dividends and governance rights.",',
            '"image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg)),
            '","attributes":[',
                '{"trait_type":"Campaign","value":"', campaignName, '"},',
                '{"trait_type":"Funding Stage","value":"', getRoundName(round), '"},',
                '{"trait_type":"Round Number","value":', Strings.toString(round), '},',
                '{"trait_type":"Share Number","value":', Strings.toString(number), '},',
                '{"trait_type":"Creator","value":"', toAsciiString(startup), '"},',
                '{"trait_type":"Background Color","value":"', nftConfig.backgroundColor, '"},',
                '{"trait_type":"Text Color","value":"', nftConfig.textColor, '"},',
                '{"trait_type":"Dividends","value":"', nftConfig.dividendsEnabled ? 'true' : 'false', '"},',
                '{"trait_type":"Airdrops","value":"', nftConfig.airdropsEnabled ? 'true' : 'false', '"},',
                '{"trait_type":"Revenue Split","value":"', nftConfig.revenueSplitEnabled ? 'true' : 'false', '"}',
            ']}'
        );
        
        return string.concat(
            "data:application/json;base64,",
            Base64.encode(bytes(json))
        );
    }
}