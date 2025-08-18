// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./SharesStorage.sol";
import "./SharesEvents.sol";

/**
 * @title Campaign
 * @dev Contrat représentant une campagne de financement participatif avec des parts sous forme de NFTs.
 */

contract Campaign is ERC721, ERC721Enumerable, ERC721URIStorage, ERC721Royalty, Ownable, SharesEvents, SharesStorage, ReentrancyGuard, AccessControl {
    using Strings for uint256;
    using Address for address payable;
    address public immutable divarProxy;
    bool public isRegisteredForUpkeep;
    
    
    
    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");
    modifier onlyKeeper() {
     require(hasRole(KEEPER_ROLE, msg.sender), "Caller is not a keeper");
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
     * @param _startup Adresse de la startup qui crée la campagne.
     * @param _name Nom de la campagne.
     * @param _symbol Symbole du token ERC721.
     * @param _targetAmount Montant cible à lever.
     * @param _sharePrice Prix d'une part.
     * @param _endTime Temps de fin de la campagne.
     * @param _treasury Adresse du trésor où les fonds sont transférés.
     * @param _royaltyFee Pourcentage de royalties pour les NFTs.
     * @param _royaltyReceiver Adresse recevant les royalties.
     * @param _metadata Métadonnées de la campagne.
     * @param _divarProxy Adresse du proxy Divar.
     * @param _campaignKeeper Adresse du keeper de la campagne.
     */
   constructor(
        address _startup,
        string memory _name,
        string memory _symbol,
        uint256 _targetAmount,
        uint256 _sharePrice,
        uint256 _endTime,
        address _treasury,
        uint96 _royaltyFee,
        address _royaltyReceiver,
        string memory _metadata,
        address _divarProxy,
        address _campaignKeeper
    ) ERC721(_name, _symbol) SharesStorage(_campaignKeeper) AccessControl() {

        require(_startup != address(0), "CAMPAIGN: Invalid startup address");
        require(_treasury != address(0), "CAMPAIGN: Invalid treasury address");
        require(_sharePrice > 0, "CAMPAIGN: Share price must be greater than zero");
        require(_targetAmount > 0, "CAMPAIGN: Target amount must be greater than zero");
        require(_endTime > block.timestamp, "CAMPAIGN: End time must be in the future");
        require(_divarProxy != address(0), "CAMPAIGN: Invalid proxy address"); // Ajout ici !
        require(_campaignKeeper != address(0), "CAMPAIGN: Invalid CampaignKeeper address");
        isRegisteredForUpkeep = false;
        _grantRole(DEFAULT_ADMIN_ROLE, _startup);
        _grantRole(KEEPER_ROLE, _campaignKeeper);
        
      
        startup = _startup;
        campaignName = _name;
        treasury = _treasury;
        metadata = _metadata;
        canReceiveDividends = false;
        divarProxy = _divarProxy;
       

        rounds[1] = Round({
            roundNumber: 1,
            sharePrice: _sharePrice,
            targetAmount: _targetAmount,
            fundsRaised: 0,
            sharesSold: 0,
            endTime: _endTime,
            isActive: true,
            isFinalized: false
        });
        currentRound = 1;
        
        if (_royaltyReceiver != address(0)) {
            _setDefaultRoyalty(_royaltyReceiver, _royaltyFee);
        }
        

        
        _transferOwnership(_startup);
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
        return super.tokenURI(tokenId);
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
        
        // Ajout de l'investisseur unique si ce n'est pas déjà fait
        if (!isInvestor[msg.sender]) {
            investors.push(msg.sender);
            isInvestor[msg.sender] = true;
        }

        // Mise à jour des parts possédées par l'investisseur
        sharesOwned[msg.sender] += _numShares;
        
        // Création et mint des NFTs représentant les parts avec ID basé sur le round
        uint256[] memory tokenIds = new uint256[](_numShares);
        uint256 startTokenId = (currentRound * 1_000_000) + round.sharesSold - _numShares + 1;

        for(uint256 i = 0; i < _numShares; i++) {
         uint256 tokenId = startTokenId + i;
         _mint(msg.sender, tokenId);
         tokenIds[i] = tokenId;
         
         // 🆕 ENREGISTRER LE PRIX D'ACHAT pour remboursement équitable
         tokenPurchasePrice[tokenId] = round.sharePrice;
         
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
        allInvestments.push(inv);
        emit SharesPurchased(msg.sender, _numShares, currentRound);
        
        // Vérification et finalisation du round si l'objectif est atteint
        if(round.fundsRaised >= (round.targetAmount * (100 - PLATFORM_COMMISSION_PERCENT) / 100)) {
        _autoFinalize();
        }
    }


   function _autoFinalize() internal {
    if(msg.sender == startup || msg.sender == address(divarProxy)) {
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
    function getNFTInfo(uint256 tokenId) public pure returns (uint256 round, uint256 number) {
     round = tokenId / 1_000_000;
     number = tokenId % 1_000_000;
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
                       _formatEth(totalRefundAmount), " ETH, available ", 
                       _formatEth(address(this).balance), " ETH")));
        
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
        require(_sharePrice >= rounds[currentRound].sharePrice * 85 / 100, "Price cannot decrease more than 15%");
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
        require(totalSupply() > 0, "No shares exist");

        uint256 amountPerShare = amount / totalSupply();
        
        // Parcourir les investisseurs uniques et distribuer les dividendes
        for (uint256 i = 0; i < investors.length; i++) {
            address investor = investors[i];
            if (sharesOwned[investor] > 0) {
                unclaimedDividends[investor] += amountPerShare * sharesOwned[investor];
            }
        }

        canReceiveDividends = true;
        emit DividendsDistributed(amount, block.timestamp);
        emit DividendDetailsUpdated(amountPerShare);
    }

    /**
     * @dev Fonction permettant à un investisseur de réclamer ses dividendes.
     */
    function claimDividends() external nonReentrant {
        require(canReceiveDividends, "No dividends available");
        require(balanceOf(msg.sender) > 0, "No shares owned");

        uint256 amount = unclaimedDividends[msg.sender];
        require(amount > 0, "No dividends to claim");

        // Réinitialiser les dividendes non réclamés avant le transfert
        unclaimedDividends[msg.sender] = 0;
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

    // 🗳️ GOVERNANCE FUNCTIONS


    /**
     * @dev 🆕 Récupérer le prix d'achat original d'un NFT (pour remboursement équitable)
     */
    function getTokenPurchasePrice(uint256 tokenId) external view returns (uint256) {
        return tokenPurchasePrice[tokenId];
    }
    
    // 🔥 NOUVELLES FONCTIONS UTILITAIRES POUR REMBOURSEMENT
    
    /**
     * @dev Identifier le round d'un NFT à partir de son ID
     */
    function getNFTRound(uint256 tokenId) public pure returns (uint256) {
        return tokenId / 1_000_000;
    }
    
    /**
     * @dev Vérifier si un token appartient au round actuel
     */
    function _isCurrentRoundToken(uint256 tokenId) internal view returns (bool) {
        return getNFTRound(tokenId) == currentRound;
    }
    
    /**
     * @dev RÈGLES DE REMBOURSEMENT - Vérifier si un token peut être remboursé
     */
    function _canRefundToken(uint256 tokenId) internal view returns (bool) {
        uint256 tokenRound = getNFTRound(tokenId);
        
        // 🆕 RÈGLE 1: NFTs du round actuel → Remboursables si round actif OU pendant échange DAO
        if (tokenRound == currentRound) {
            Round storage round = rounds[currentRound];
            
            // Si round actif → OK
            if (round.isActive && block.timestamp <= round.endTime) {
                return true;
            }
            
            return false;
        }
        
        // NFTs des rounds précédents → 36h après finalisation
        if (tokenRound < currentRound) {
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
        uint256 tokenRound = getNFTRound(tokenId);
        
        if (tokenRound == currentRound) {
            Round storage round = rounds[currentRound];
            if (!round.isActive) {
                return "Current round is not active";
            }
            if (block.timestamp > round.endTime) {
                return "Current round has ended";
            }
            return "Current round token should be refundable";
        }
        
        if (tokenRound < currentRound) {
            return string(abi.encodePacked("NFT from round ", _toString(tokenRound), 
                   " cannot be refunded - previous rounds are final"));
        }
        
        return "Invalid token round";
    }
    
    /**
     * @dev Formater ETH pour les messages d'erreur
     */
    function _formatEth(uint256 amount) internal pure returns (string memory) {
        return string(abi.encodePacked(_toString(amount / 1e18), ".", 
                     _toString((amount % 1e18) / 1e15), " ETH"));
    }
    
    /**
     * @dev Convertir uint256 en string
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
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
        override(ERC721, ERC721Enumerable, ERC721URIStorage, ERC721Royalty, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /// @dev Fonction pour recevoir des ETH
    receive() external payable {}

    /// @dev Fonction de fallback pour gérer les appels non existants
    fallback() external payable {
        revert("Function not found in Campaign contract");
    }
    
    }
