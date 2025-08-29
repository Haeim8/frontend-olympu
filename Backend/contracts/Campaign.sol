// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./SharesStorage.sol";
import "./SharesEvents.sol";

interface INFTRenderer {
    struct NFTCustomization {
        string backgroundColor;
        string textColor;
        string logoUrl;
        string companyName;
        string sector;
    }
    
    function generateTokenURI(
        uint256 tokenId,
        address contractAddress,
        NFTCustomization memory customization,
        uint256 round,
        uint256 number
    ) external pure returns (string memory);
}

/**
 * @title Campaign
 * @dev Contrat représentant une campagne de financement participatif avec des parts sous forme de NFTs.
 */

contract Campaign is ERC721, ERC721Enumerable, ERC721URIStorage, ERC721Royalty, Ownable, SharesEvents, SharesStorage, ReentrancyGuard {
    
    struct CampaignParams {
        address startup;
        string name;
        string symbol;
        uint256 targetAmount;
        uint256 sharePrice;
        uint256 endTime;
        address treasury;
        uint96 royaltyFee;
        address royaltyReceiver;
        string metadata;
        address divarProxy;
        address campaignKeeper;
    }
    
    struct NFTParams {
        address nftRenderer;
        string nftBackgroundColor;
        string nftTextColor;
        string nftLogoUrl;
        string nftSector;
    }
    using Strings for uint256;
    using Address for address payable;
    address public immutable divarProxy;
    bool public isRegisteredForUpkeep;
    
    modifier validAddress(address _addr) {
        require(_addr != address(0), "Invalid address");
        _;
    }
    
    
    
    modifier onlyKeeper() {
     require(msg.sender == campaignKeeper, "Caller is not a keeper");
     _;
    } 


    /**
     * @dev Modificateur pour restreindre l'accès aux fonctions réservées à la startup.
     */
    modifier onlyStartup() {
        require(msg.sender == startup, "Only startup can call");
        _;
    }


    /**
     * @dev Constructeur du contrat Campaign.
     * @param params Structure contenant les paramètres de base de la campagne.
     * @param nftParams Structure contenant les paramètres de customisation NFT.
     */
   constructor(
        CampaignParams memory params,
        NFTParams memory nftParams
    ) ERC721(params.name, params.symbol) SharesStorage(params.campaignKeeper) 
      validAddress(params.startup) validAddress(params.treasury) validAddress(params.divarProxy) validAddress(params.campaignKeeper) {

        require(params.sharePrice > 0, "CAMPAIGN: Share price must be greater than zero");
        require(params.targetAmount > 0, "CAMPAIGN: Target amount must be greater than zero");
        require(params.endTime > block.timestamp, "CAMPAIGN: End time must be in the future");
        isRegisteredForUpkeep = false;
        
      
        startup = params.startup;
        campaignName = params.name;
        treasury = params.treasury;
        metadata = params.metadata;
        divarProxy = params.divarProxy;
        
        // Configuration NFT
        nftRenderer = nftParams.nftRenderer;
        nftBackgroundColor = nftParams.nftBackgroundColor;
        nftTextColor = nftParams.nftTextColor;
        nftLogoUrl = nftParams.nftLogoUrl;
        nftSector = nftParams.nftSector;
       

        rounds[1] = Round({
            roundNumber: 1,
            sharePrice: params.sharePrice,
            targetAmount: params.targetAmount,
            fundsRaised: 0,
            sharesSold: 0,
            endTime: params.endTime,
            isActive: true,
            isFinalized: false
        });
        currentRound = 1;
        
        _setDefaultRoyalty(params.royaltyReceiver, params.royaltyFee);
        

        
        _transferOwnership(params.startup);
    }
    
    /**
     * @dev 🔧 Met à jour le statut d'enregistrement Chainlink
     */
    function setRegisteredForUpkeep(bool _isRegistered) external {
        require(msg.sender == divarProxy, "CAMPAIGN: Only DivarProxy can update upkeep status");
        isRegisteredForUpkeep = _isRegistered;
    }




    function tokenURI(uint256 tokenId) public view virtual override(ERC721, ERC721URIStorage) returns (string memory) {
        require(_exists(tokenId), "URI query for nonexistent token");
        
        if (nftRenderer == address(0)) {
            return super.tokenURI(tokenId);
        }
        
        (uint256 round, uint256 number) = getNFTInfo(tokenId);
        
        INFTRenderer.NFTCustomization memory customization = INFTRenderer.NFTCustomization({
            backgroundColor: nftBackgroundColor,
            textColor: nftTextColor,
            logoUrl: nftLogoUrl,
            companyName: campaignName,
            sector: nftSector
        });
        
        return INFTRenderer(nftRenderer).generateTokenURI(
            tokenId,
            address(this),
            customization,
            round,
            number
        );
    }

    /**
     * @dev Fonction permettant à un utilisateur d'acheter des parts (shares) sous forme de NFTs.
     * @param _numShares Nombre de parts à acheter.
     */
    function buyShares(uint256 _numShares) external payable nonReentrant {
        Round storage round = rounds[currentRound];
        require(round.isActive, "CAMPAIGN: Round not active");
        require(block.timestamp <= round.endTime, "CAMPAIGN: Round has ended");
        require(!round.isFinalized, "Round is finalized");
        require(round.sharesSold + _numShares <= round.targetAmount / round.sharePrice, "Not enough shares");
        require(msg.value == _numShares * round.sharePrice, "Incorrect ETH amount");
        require(msg.sender != startup, "Startup cannot buy shares");
        require(round.targetAmount > 0 && round.sharePrice > 0, "Invalid round configuration");

        // Calcul des commissions et du montant net
        uint256 commission = (msg.value * PLATFORM_COMMISSION_PERCENT) / 100;
        uint256 netAmount = msg.value - commission;  

        // Vérification que le montant net ne dépasse pas l'objectif
        require(round.fundsRaised + netAmount <= round.targetAmount, "Exceeds target amount");     

        // Transfert de la commission au trésor
        payable(treasury).sendValue(commission);
        emit CommissionPaid(treasury, commission);

        // Mise à jour des fonds levés et des parts vendues
        round.fundsRaised += netAmount;  
        round.sharesSold += _numShares;
        
        // Mise à jour des parts possédées par l'investisseur
        sharesOwned[msg.sender] += _numShares;
        totalSharesIssued += _numShares;
        
        // Création et mint des NFTs représentant les parts avec ID séquentiel
        uint256[] memory tokenIds = new uint256[](_numShares);

        for(uint256 i = 0; i < _numShares; i++) {
         uint256 tokenId = nextTokenId++;
         _mint(msg.sender, tokenId);
         tokenIds[i] = tokenId;
         
         // 🆕 ENREGISTRER LE PRIX D'ACHAT ET LE ROUND pour remboursement équitable
         tokenPurchasePrice[tokenId] = round.sharePrice;
         tokenRound[tokenId] = currentRound;
         
        }

        // Enregistrement de l'investissement
        Investment memory inv = Investment({
            investor: msg.sender,
            amount: msg.value,
            shares: _numShares,
            timestamp: block.timestamp,
            tokenIds: tokenIds,
            roundNumber: currentRound
        });

        investmentsByAddress[msg.sender].push(inv);
        emit SharesPurchased(msg.sender, _numShares, currentRound);
        
        // Vérification et finalisation du round si l'objectif est atteint
        if(round.fundsRaised >= (round.targetAmount * (100 - PLATFORM_COMMISSION_PERCENT) / 100)) {
        _finalizeRoundInternal();
        }
    }

function _finalizeRoundInternal() private {
    Round storage round = rounds[currentRound];
    require(!round.isFinalized, "Already finalized");
    require(
        block.timestamp > round.endTime || 
        round.fundsRaised >= (round.targetAmount * (100 - PLATFORM_COMMISSION_PERCENT) / 100),
        "Cannot finalize yet"
    );

    round.isActive = false;
    round.isFinalized = true;
    
    escrow = Escrow({
        amount: address(this).balance,
        releaseTime: block.timestamp + 60 hours,
        isReleased: false
    });


    emit RoundFinalized(currentRound, true);
    emit EscrowSetup(escrow.amount, escrow.releaseTime);
}

     function finalizeRound() external onlyKeeper {
    _finalizeRoundInternal();
    }    


    /**
     * @dev Retourne les informations détaillées d'un NFT basées sur son ID
     * @param tokenId L'identifiant unique du NFT
     * @return round Le numéro du round dans lequel le NFT a été créé
     * @return number Le numéro séquentiel du NFT dans son round
     */
    function getNFTInfo(uint256 tokenId) public view returns (uint256 round, uint256 number) {
     round = tokenRound[tokenId];
     number = tokenId;
     return (round, number);
    }

    /**
     * @dev Fonction permettant à la startup de réclamer les fonds de l'escrow après le délai.
     * 🆕 MODIFIÉ : Bloqué si phase DAO active, autorisé seulement après validation DAO
     */
    function claimEscrow() external nonReentrant {
        require(escrow.amount > 0, "No funds in escrow");
        require(!escrow.isReleased, "Funds already released");
        require(block.timestamp >= escrow.releaseTime, "Release time not reached");
        
        require(msg.sender == startup, "Only startup can call");
        
        escrow.isReleased = true;
        payable(startup).sendValue(escrow.amount);
        emit EscrowReleased(escrow.amount, block.timestamp);
        emit FundsTransferred(startup, escrow.amount);
    }

    /**
     * @dev Fonction pour obtenir les informations sur l'escrow.
     * @return amount Montant total de l'escrow.
     * @return releaseTime Timestamp de libération de l'escrow.
     * @return timeRemaining Temps restant avant la libération.
     * @return isReleased Indique si l'escrow a été libéré.
     */
    function getEscrowInfo() external view returns (
        uint256 amount,
        uint256 releaseTime,
        uint256 timeRemaining,
        bool isReleased
    ) {
        return (
            escrow.amount,
            escrow.releaseTime,
            escrow.releaseTime > block.timestamp ? escrow.releaseTime - block.timestamp : 0,
            escrow.isReleased
        );
    }
    
    /**
     * @dev 🔥 NOUVELLE LOGIQUE - Remboursement avec vérifications de phase et fonds
     * @param tokenIds Tableau des IDs des tokens à rembourser.
     */
    function refundShares(uint256[] memory tokenIds) external nonReentrant {
        uint256 totalRefundAmount = 0;
        uint256 refundedShares = 0;
        
        for(uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(ownerOf(tokenId) == msg.sender, "Not token owner");
            require(!tokenBurned[tokenId], "Token already burned");
            
            // 🆕 VÉRIFICATION INTELLIGENTE DES RÈGLES DE REMBOURSEMENT
            require(_canRefundToken(tokenId), _getRefundErrorMessage(tokenId));
            
            // 🆕 REMBOURSEMENT ÉQUITABLE : Prix d'achat original
            uint256 originalPrice = tokenPurchasePrice[tokenId];
            require(originalPrice > 0, "Invalid token purchase price");
            uint256 refundAmount = (originalPrice * (100 - PLATFORM_COMMISSION_PERCENT)) / 100;
            totalRefundAmount += refundAmount;
            refundedShares++;
        }
        
        require(refundedShares > 0, "No tokens to refund");
        
        // 🔥 VÉRIFICATION FONDS AVANT BURN (protection contre bank run)
        require(totalRefundAmount <= address(this).balance, 
                string(abi.encodePacked("Insufficient funds: need ", 
                       Strings.toString(totalRefundAmount / 1e18), " ETH, available ", 
                       Strings.toString(address(this).balance / 1e18), " ETH")));
        
        // Burn des tokens après toutes les vérifications
        for(uint256 i = 0; i < tokenIds.length; i++) {
            _burn(tokenIds[i]);
            tokenBurned[tokenIds[i]] = true;
        }
        
        // Mise à jour des stats si nécessaire (round actuel uniquement)
        if (_isCurrentRoundToken(tokenIds[0])) {
            Round storage round = rounds[currentRound];
            round.sharesSold -= refundedShares;
            if (sharesOwned[msg.sender] >= refundedShares) {
                sharesOwned[msg.sender] -= refundedShares;
                totalSharesIssued -= refundedShares;
            }
        }
        
        // Transfert du montant remboursé
        payable(msg.sender).sendValue(totalRefundAmount);
        
        emit SharesRefunded(msg.sender, refundedShares, totalRefundAmount);
    }

    /**
     * @dev Fonction permettant à la startup de démarrer un nouveau round de financement.
     * @param _targetAmount Nouveau montant cible.
     * @param _sharePrice Nouveau prix par part.
     * @param _duration Durée du nouveau round en secondes.
     */
    function startNewRound(
        uint256 _targetAmount,
        uint256 _sharePrice,
        uint256 _duration
    ) external onlyStartup {
        require(rounds[currentRound].isFinalized, "Current round not finalized");
        require(_sharePrice > rounds[currentRound].sharePrice, "New price must be higher");
        require(_sharePrice <= rounds[currentRound].sharePrice * 300 / 100, "Price cannot increase more than 200%");
        
        currentRound++;
        rounds[currentRound] = Round({
            roundNumber: currentRound,
            sharePrice: _sharePrice,
            targetAmount: _targetAmount,
            fundsRaised: 0,
            sharesSold: 0,
            endTime: block.timestamp + _duration,
            isActive: true,
            isFinalized: false
        });

        emit RoundStarted(currentRound, _sharePrice, _targetAmount);
    }
    
    /**
     * @dev Fonction permettant à la startup de distribuer des dividendes aux investisseurs.
     * @param amount Montant total des dividendes à distribuer.
     */
    function distributeDividends(uint256 amount) external onlyStartup payable nonReentrant {
        require(amount > 0, "Amount must be greater than zero");
        require(msg.value == amount, "Incorrect ETH value sent");
        require(totalSharesIssued > 0, "No shares exist");

        totalDividendsDeposited += amount;
        dividendsPerShare = totalDividendsDeposited / totalSharesIssued;
        
        emit DividendsDistributed(amount, block.timestamp);
        emit DividendDetailsUpdated(dividendsPerShare);
    }

    /**
     * @dev Fonction permettant à un investisseur de réclamer ses dividendes.
     */
    function claimDividends() external nonReentrant {
        require(sharesOwned[msg.sender] > 0, "No shares owned");
        
        uint256 totalOwed = dividendsPerShare * sharesOwned[msg.sender];
        uint256 amount = totalOwed - unclaimedDividends[msg.sender];
        require(amount > 0, "No dividends to claim");

        // Mettre à jour les dividendes réclamés
        unclaimedDividends[msg.sender] = totalOwed;
        payable(msg.sender).sendValue(amount);
        emit FundsTransferred(msg.sender, amount);
        emit DividendsClaimed(msg.sender, amount, block.timestamp);
    }


    /**
     * @dev Fonction pour obtenir les détails du round actuel.
     * @return roundNumber Numéro du round.
     * @return sharePrice Prix par part.
     * @return targetAmount Montant cible.
     * @return fundsRaised Fonds levés.
     * @return sharesSold Parts vendues.
     * @return endTime Timestamp de fin.
     * @return isActive Indique si le round est actif.
     * @return isFinalized Indique si le round est finalisé.
     */
    function getCurrentRound() external view returns (
        uint256 roundNumber,
        uint256 sharePrice,
        uint256 targetAmount,
        uint256 fundsRaised,
        uint256 sharesSold,
        uint256 endTime,
        bool isActive,
        bool isFinalized
    ) {
        Round storage round = rounds[currentRound];
        return (
            round.roundNumber,
            round.sharePrice,
            round.targetAmount,
            round.fundsRaised,
            round.sharesSold,
            round.endTime,
            round.isActive,
            round.isFinalized
        );
    }

    /**
     * @dev Fonction pour obtenir les investissements d'un investisseur spécifique.
     * @param investor Adresse de l'investisseur.
     * @return Array des investissements de l'investisseur.
     */
    function getInvestments(address investor) external view returns (Investment[] memory) {
        return investmentsByAddress[investor];
    }


    /**
     * @dev 🆕 Récupérer le prix d'achat original d'un NFT (pour remboursement équitable)
     */
    function getTokenPurchasePrice(uint256 tokenId) external view returns (uint256) {
        return tokenPurchasePrice[tokenId];
    }
    
    // 🔥 NOUVELLES FONCTIONS UTILITAIRES POUR REMBOURSEMENT
    
    
    /**
     * @dev Vérifier si un token appartient au round actuel
     */
    function _isCurrentRoundToken(uint256 tokenId) internal view returns (bool) {
        return tokenRound[tokenId] == currentRound;
    }
    
    /**
     * @dev RÈGLES DE REMBOURSEMENT - Vérifier si un token peut être remboursé
     */
    function _canRefundToken(uint256 tokenId) internal view returns (bool) {
        uint256 tokenRoundNum = tokenRound[tokenId];
        
        // 🆕 RÈGLE 1: NFTs du round actuel → Remboursables si round actif OU pendant échange DAO
        if (tokenRoundNum == currentRound) {
            Round storage round = rounds[currentRound];
            
            // Si round actif → OK
            if (round.isActive && block.timestamp <= round.endTime) {
                return true;
            }
            
            return false;
        }
        
        // NFTs des rounds précédents → 36h après finalisation
        if (tokenRoundNum < currentRound) {
            Round storage currentRoundData = rounds[currentRound];
            if (currentRoundData.isFinalized && 
                block.timestamp <= (escrow.releaseTime - 24 hours)) {
                return true;
            }
            return false;
        }
        
        // NFTs de rounds futurs = impossible
        return false;
    }
    
    /**
     * @dev Messages d'erreur explicatifs pour le remboursement
     */
    function _getRefundErrorMessage(uint256 tokenId) internal view returns (string memory) {
        uint256 tokenRoundNum = tokenRound[tokenId];
        
        if (tokenRoundNum == currentRound) {
            Round storage round = rounds[currentRound];
            if (!round.isActive) {
                return "Current round is not active";
            }
            if (block.timestamp > round.endTime) {
                return "Current round has ended";
            }
            return "Current round token should be refundable";
        }
        
        if (tokenRoundNum < currentRound) {
            return string(abi.encodePacked("NFT from round ", Strings.toString(tokenRoundNum), 
                   " cannot be refunded - previous rounds are final"));
        }
        
        return "Invalid token round";
    }
    
    // 🔥 FONCTIONS PUBLIQUES POUR UIs ET DEBUGGING

    /**
     * @dev Vérifier si un token peut être remboursé (fonction publique)
     */
    function canRefundToken(uint256 tokenId) external view returns (bool, string memory) {
        bool canRefund = _canRefundToken(tokenId);
        string memory message = canRefund ? "Token can be refunded" : _getRefundErrorMessage(tokenId);
        return (canRefund, message);
    }
    
    /**
     * @dev Calculer le montant de remboursement pour un token
     */
    function getRefundAmount(uint256 tokenId) external view returns (uint256) {
        uint256 originalPrice = tokenPurchasePrice[tokenId];
        if (originalPrice == 0) return 0;
        return (originalPrice * (100 - PLATFORM_COMMISSION_PERCENT)) / 100;
    }

    /**
     * @dev Fonction interne appelée avant chaque transfert de token pour intégrer ERC721Enumerable.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    /**
     * @dev Fonction interne pour brûler un token, intégrant ERC721Royalty et ERC721URIStorage.
     */
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage, ERC721Royalty) {
        super._burn(tokenId);
    }

    /**
     * @dev Fonction pour vérifier si une interface est supportée.
     * @param interfaceId ID de l'interface.
     * @return bool Indique si l'interface est supportée.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage, ERC721Royalty)
        returns (bool)
   {
        return super.supportsInterface(interfaceId);
 }
}
