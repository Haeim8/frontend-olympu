# ARCHITECTURE COMPLÈTE DU PROJET LIVAR

## OVERVIEW
Livar est une plateforme de crowdfunding décentralisée basée sur des NFTs ERC721, avec un système DAO obligatoire et des sessions live intégrées. Le projet combine financement participatif, gouvernance décentralisée et streaming en direct.

## 1. CONTRATS PRINCIPAUX

### Campaign.sol (756 lignes)
**Rôle**: Contrat central de crowdfunding NFT avec système de rounds
**Fonctions clés**:
- `buyShares(uint256 _numShares)` - Achat de parts (mint NFTs)
- `getCurrentRound()` - Retourne 8 valeurs: roundNumber, sharePrice, targetAmount, fundsRaised, sharesSold, endTime, isActive, isFinalized
- `finalizeRound()` - Finalisation manuelle d'un round
- `refundInvestor(address investor)` - Remboursement des investisseurs
- `distributeDividends()` - Distribution des dividendes
- `claimDividends()` - Réclamation des dividendes par investisseur

**Mécanismes**:
- Auto-finalisation à 88% du target via CampaignKeeper
- Commission fixe 12% (PLATFORM_COMMISSION_PERCENT)
- Escrow automatique 24h après finalisation
- NFTs ERC721 représentant les parts d'investissement

### CampaignDAO.sol (350 lignes)
**Rôle**: Gestion des phases DAO et sessions live obligatoires
**Phases DAO**:
```solidity
enum DAOPhase {
    INACTIVE,           // DAO non activé
    WAITING_FOR_LIVE,   // En attente de session live
    LIVE_SCHEDULED,     // Session programmée
    LIVE_ACTIVE,        // Session en cours
    EXCHANGE_PERIOD,    // Période d'échange post-live
    COMPLETED,          // DAO terminé
    EMERGENCY           // Urgence
}
```

**Fonctions clés**:
- `activateDAO()` - Active le DAO après finalisation campagne
- `scheduleSession(uint256 timestamp, string streamUrl)` - Programme session live
- `startLiveSession()` - Démarre session live
- `endLiveSession()` - Termine session live
- `getCurrentPhase()` - Phase DAO actuelle
- `getSessionInfo()` - Informations session live

**RÈGLE CRITIQUE**: Session live de 15min minimum OBLIGATOIRE pour validation DAO

### DivarProxy.sol (274 lignes)
**Rôle**: Factory pattern CREATE2 pour déploiement déterministe
**Fonctions clés**:
- `createCampaign()` - Déploie Campaign + DAO via CREATE2
- `predictCampaignAddress()` - Calcule adresse avant déploiement
- `campaignRegistry` - Mapping des campagnes créées

### CampaignKeeper.sol (207 lignes)
**Rôle**: Automation Chainlink pour finalisation automatique
**Mécanismes**:
- `checkUpkeep()` - Vérifie si finalisation nécessaire (88% atteint)
- `performUpkeep()` - Execute finalisation automatique
- Intégration avec Chainlink Automation

## 2. CONTRATS DE GOUVERNANCE

### CampaignGovernance.sol (446 lignes)
**Rôle**: Système de vote inspiré Cosmos ATOM
**Types de propositions**:
- PARAMETER_CHANGE - Changement de paramètres
- DIVIDEND_DISTRIBUTION - Distribution dividendes
- STRATEGIC_DECISION - Décision stratégique
- EMERGENCY_ACTION - Action d'urgence
- PLATFORM_UPGRADE - Mise à niveau

**Mécanisme de vote**:
- Poids = nombre de NFTs possédés
- Quorum configurable (défaut 30%)
- Majorité configurable (51% simple, 67% super)
- Période de vote: 7 jours
- Délai d'exécution: 2 jours

### LiveSessionManager.sol (331 lignes)
**Rôle**: Gestionnaire centralisé des sessions live
**États des sessions**:
```solidity
enum SessionStatus {
    SCHEDULED,   // Programmée
    LIVE,        // En direct
    ENDED,       // Terminée
    CANCELLED,   // Annulée
    INVALID      // Invalide (< 15min)
}
```

**Fonctions clés**:
- `scheduleSession()` - Programme session live
- `startSession()` - Démarre session
- `sendHeartbeat()` - Maintien activité fondateur
- `endSession()` - Termine session
- `checkHeartbeat()` - Vérification automatique activité

**Règles importantes**:
- Durée minimum: 15 minutes
- Timeout heartbeat: 5 minutes
- Max programmation: 15 jours à l'avance

## 3. CONTRATS DE STOCKAGE ET ÉVÉNEMENTS

### SharesStorage.sol (72 lignes)
**Structures de données principales**:
```solidity
struct Round {
    uint256 roundNumber;
    uint256 sharePrice;
    uint256 targetAmount;
    uint256 fundsRaised;
    uint256 sharesSold;
    uint256 endTime;
    bool isActive;
    bool isFinalized;
}

struct Investment {
    address investor;
    uint256 amount;
    uint256 shares;
    uint256 timestamp;
    uint256[] tokenIds;
    uint256 roundNumber;
}

struct Escrow {
    uint256 amount;
    uint256 releaseTime;
    bool isReleased;
}
```

### SharesEvents.sol (74 lignes)
**Événements système shares**:
- `SharesPurchased(address investor, uint256 numShares, uint256 roundNumber)`
- `SharesRefunded(address investor, uint256 numShares, uint256 refundAmount)`
- `RoundFinalized(uint256 roundNumber, bool success)`
- `DividendsDistributed(uint256 amount, uint256 timestamp)`

### DivarStorage.sol (43 lignes)
**Configuration plateforme**:
- Commission fixe: 12% (PLATFORM_COMMISSION_PERCENT)
- Adresse treasury
- Registry des campagnes
- Mappings par créateur et catégorie

## 4. INTÉGRATIONS EXTERNES

### PriceConsumerV3.sol (61 lignes)
**Oracle Chainlink ETH/USD**:
- Adresse oracle: 0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1
- Période de fraîcheur: 1 heure
- Fonctions: `getLatestPrice()`, `convertUSDToETH()`, `convertETHToUSD()`

### Interfaces
- **AggregatorV3Interface.sol**: Interface oracle Chainlink
- **IKeeperRegistry.sol**: Interface automation Chainlink

## 5. FLOW COMPLET DU SYSTÈME

### Étape 1: Création de campagne
1. Utilisateur appelle `DivarProxy.createCampaign()`
2. Déploiement déterministe via CREATE2:
   - Campaign.sol (crowdfunding + NFTs)
   - CampaignDAO.sol (gouvernance + live)
3. Enregistrement dans campaignRegistry
4. DAO en phase INACTIVE

### Étape 2: Phase de financement
1. Investisseurs appellent `Campaign.buyShares(numShares)`
2. Vérification: `sharesSold + numShares <= targetAmount / sharePrice`
3. Mint automatique NFTs ERC721 proportionnels
4. Événement `SharesPurchased` émis
5. Surveillance par CampaignKeeper pour auto-finalisation

### Étape 3: Finalisation automatique
1. CampaignKeeper détecte 88% du target atteint
2. Appel automatique `Campaign.finalizeRound()`
3. Passage escrow avec délai 24h sécurité
4. **DAO activé automatiquement** → phase WAITING_FOR_LIVE

### Étape 4: Session live OBLIGATOIRE
1. DAO en WAITING_FOR_LIVE
2. Fondateur doit programmer session via `CampaignDAO.scheduleSession()`
3. DAO → LIVE_SCHEDULED
4. Fondateur démarre `startLiveSession()` → LIVE_ACTIVE
5. **Durée minimum 15 minutes requise**
6. Fin session → EXCHANGE_PERIOD puis COMPLETED

### Étape 5: Gouvernance continue
1. Fondateur peut créer propositions via CampaignGovernance
2. Détenteurs NFTs votent (poids = nombre NFTs)
3. Exécution automatique si quorum + majorité atteints
4. Distribution dividendes possible

## 6. SÉCURITÉS ET VALIDATIONS

### Vérifications critiques
- Target minimum/maximum configurables
- Limite de shares par round: `targetAmount / sharePrice`
- Validation durée session live (≥ 15min)
- Heartbeat obligatoire pendant live (5min timeout)
- Escrow 24h post-finalisation
- Remboursements équitables basés sur prix d'achat

### Mécanismes anti-fraude
- Adresses prédictibles mais sécurisées (CREATE2)
- Commission fixe non modifiable (12%)
- Automation Chainlink pour finalisation objective
- Validation temporelle des sessions live
- Système de rôles AccessControl

## 7. ÉVÉNEMENTS PRINCIPAUX

### Campaign
- `SharesPurchased` - Achat de parts
- `SharesRefunded` - Remboursement
- `RoundFinalized` - Finalisation round
- `DividendsDistributed` - Distribution dividendes

### DAO
- `DAOActivated` - Activation DAO
- `SessionScheduled` - Session programmée
- `SessionStarted` - Début session live
- `SessionEnded` - Fin session
- `PhaseChanged` - Changement phase DAO

### Governance
- `ProposalCreated` - Nouvelle proposition
- `VoteCast` - Vote émis
- `ProposalExecuted` - Proposition exécutée

## 8. PARAMÈTRES CONFIGURABLES

### Campagne
- Target amount (min/max)
- Share price
- Round duration
- Commission percentage (fixe 12%)

### DAO
- Session live minimum (15min)
- Délai programmation session (15 jours max)
- Heartbeat timeout (5min)

### Gouvernance
- Période de vote (7 jours)
- Délai exécution (2 jours)
- Quorum requis (30% défaut)
- Majorité requise (51%/67%)

## 9. INTÉGRATION FRONTEND

### ABIs générés
- CampaignABI.json
- CampaignDAOABI.json
- CampaignKeeperABI.json
- CampaignGovernanceABI.json
- LiveSessionManagerABI.json

### Adresses contrats
- Stockées dans contractAddresses.json
- Déploiement via scripts Hardhat
- Configuration par réseau (testnet/mainnet)

---

Cette architecture garantit un système de crowdfunding robuste, transparent et décentralisé avec gouvernance intégrée et validation par sessions live obligatoires.