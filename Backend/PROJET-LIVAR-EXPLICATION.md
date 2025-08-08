# PROJET LIVAR - ANALYSE COMPLÈTE BASÉE SUR LE CODE

## ARCHITECTURE TECHNIQUE : 12 CONTRATS

### CONTRAT PRINCIPAL : DivarProxy.sol
**Type :** Proxy UUPS Upgradeable avec Ownable et Pausable
**Rôle :** Usine de création de campagnes

**Fonctions principales :**
- `createCampaign()` : Déploie un nouveau contrat Campaign via CREATE2
- `setCampaignBytecode()` : Configure le bytecode des campagnes (onlyOwner)
- `getCampaignCreationFeeETH()` : Calcule les frais en ETH (85 USD via oracle)
- `getAllCampaigns()` : Liste toutes les campagnes créées
- `togglePause()` : Active/désactive la plateforme

**Données stockées :**
- Registry de toutes les campagnes par adresse
- Campagnes par créateur 
- Campagnes par catégorie
- Référence au campaignKeeper et priceConsumer

### CONTRAT DE STOCKAGE : DivarStorage.sol
**Constantes du système :**
- CAMPAIGN_CREATION_FEE_USD = 8500 (85 USD)
- PLATFORM_COMMISSION_PERCENT = 15 (15%)

**Structure CampaignInfo :**
- campaignAddress, creator, creationTime
- targetAmount, category, isActive
- name, metadata, logo, escrowAddress

### CONTRAT D'ÉVÉNEMENTS : DivarEvents.sol
**Événements trackés :**
- CampaignCreated
- TreasuryUpdated
- PlatformStatusChanged
- PriceConsumerUpdated

---

## CONTRAT PRINCIPAL : Campaign.sol
**Type :** ERC721 + ERC721Enumerable + ERC721Royalty + Ownable + AccessControl + ReentrancyGuard
**Rôle :** Campagne individuelle de financement

### SYSTÈME DE ROUNDS
**Structure Round :**
- roundNumber, sharePrice, targetAmount
- fundsRaised, sharesSold, startTime, endTime
- isActive, isFinalized

**Fonctions de round :**
- `buyShares()` : Acheter des NFTs parts (15% commission, 85% en escrow)
- `finalizeRound()` : Finalise quand objectif atteint ou temps écoulé (onlyKeeper)
- `getCurrentRound()` : Info du round actuel

### SYSTÈME DAO LIVE (FONCTIONNALITÉS UNIQUES)

**Structure LiveSession :**
- schedulingDeadline (15 jours après finalisation)
- scheduledTimestamp, actualTimestamp, completedTimestamp
- claimDeadline (24h après live), withdrawDeadline (48h)
- isScheduled, isStarted, isCompleted
- streamUrl, description, minimumDuration (15 min)

**Fonctions DAO Live :**
- `scheduleLiveSession()` : Programmer live dans 15 jours (onlyStartup)
- `startLiveSession()` : Démarrer live (onlyStartup)  
- `completeLiveSession()` : Terminer live après 15 min minimum (onlyStartup)
- `swapNFTsAfterLive()` : Investisseurs échangent NFTs contre ETH dans 24h
- `emergencyRefundAll()` : Remboursement si pas de live programmé après 15 jours

### SYSTÈME DE DIVIDENDES
**Fonctions :**
- `distributeDividends()` : Startup distribue profits (onlyStartup)
- `claimDividends()` : Investisseurs récupèrent dividendes
- Mapping unclaimedDividends par investisseur

### SYSTÈME DE REMBOURSEMENTS
**Fonctions :**
- `refundShares()` : Remboursement pendant campagne active
- `swapNFTsAfterLive()` : "Vote" post-live via échange NFT/ETH
- `emergencyRefundAll()` : Protection anti-rug pull

**Structure Escrow :**
- amount (fonds sécurisés), releaseTime, isReleased
- `claimEscrow()` : Startup récupère fonds après délais (onlyStartup)

### SYSTÈME NFT AVANCÉ
**Génération de TokenID :** round * 1_000_000 + numéro séquentiel
**Métadonnées :** JSON on-chain avec nom, description, attributs
**Fonction `tokenURI()`** : Retourne JSON Base64 encodé

---

## CONTRAT AUTOMATION : CampaignKeeper.sol
**Type :** AutomationCompatibleInterface (Chainlink)
**Rôle :** Finalisation automatique des rounds

**Fonctions Chainlink :**
- `checkUpkeep()` : Vérifie si rounds doivent être finalisés
- `performUpkeep()` : Finalise automatiquement + brûle NFTs non vendus
- `registerCampaign()` : Enregistre campagne pour automation

**Conditions de finalisation :**
- Round actif ET non finalisé
- ET (temps écoulé OU objectif atteint)

---

## CONTRAT ORACLE : PriceConsumerV3.sol
**Rôle :** Conversion USD/ETH via Chainlink

**Adresse Price Feed :** 0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1 (Base Sepolia ETH/USD)

**Fonctions :**
- `getLatestPrice()` : Prix ETH/USD avec validations
- `convertUSDToETH()` : Convertit cents USD en wei ETH
- `convertETHToUSD()` : Convertit wei ETH en cents USD

**Sécurité :** Vérification staleness (3600s), prix positif, round valide

---

## CONTRAT VISUAL : NFTRenderer.sol
**Rôle :** Génération SVG des NFTs

**Structure NFTVisualConfig :**
- backgroundColor, primaryColor, secondaryColor, textColor
- logoUrl, logoData
- hasRewardBadges, dividendsEnabled, airdropsEnabled, revenueSplitEnabled
- tier (niveau rareté)

**Fonctions principales :**
- `generateNFTSVG()` : SVG animé avec glass morphism
- `generateTokenURI()` : JSON complet avec SVG encodé Base64
- `getRoundName()` : Angel, MVP, Pre-Seed, Seed, Series A/B/C

**Éléments visuels :**
- Animations CSS, gradients, filtres glass effect
- Badges de récompenses conditionnels
- Logo intégré, infos deployer/contrat

---

## CONTRATS DE DONNÉES

### SharesStorage.sol
**Constantes temps :**
- SCHEDULE_DEADLINE = 15 days
- SCHEDULE_NOTICE = 48 hours  
- CLAIM_PERIOD = 24 hours
- WITHDRAW_DELAY = 48 hours

**Structures principales :**
- Round, Investment, Escrow, LiveSession, NFTVisualConfig
- SocialLinks (website, twitter, github, discord, telegram, medium)

### SharesEvents.sol
**Événements DAO Live :**
- LiveSessionScheduled, LiveSessionStarted, LiveSessionCompleted
- NFTsSwappedAfterLive, EmergencyRefundActivated
- LiveSessionDeadlinePassed

---

## INTERFACES CHAINLINK

### AggregatorV3Interface.sol
**Fonctions standard Chainlink :**
- `latestRoundData()` : Données prix actuelles
- `getRoundData()` : Données round spécifique
- decimals(), description(), version()

### IKeeperRegistry.sol
**Interface automation Chainlink :**
- `registerUpkeep()` : Enregistre tâche automatique
- `addFunds()`, `cancelUpkeep()`, `pauseUpkeep()`

---

## FLUX COMPLET DU SYSTÈME

### 1. CRÉATION CAMPAGNE
1. DivarProxy.createCampaign() avec frais 85 USD
2. Déploiement Campaign via CREATE2 
3. Enregistrement automatique dans CampaignKeeper
4. Émission événement CampaignCreated

### 2. FINANCEMENT
1. buyShares() : 15% commission → treasury, 85% → contrat
2. Mint NFT avec TokenID unique (round * 1M + numéro)
3. CampaignKeeper surveille conditions finalisation
4. Finalisation automatique → création Escrow

### 3. DAO LIVE (SYSTÈME UNIQUE)
1. scheduleLiveSession() dans 15 jours max
2. startLiveSession() à l'heure programmée  
3. completeLiveSession() après 15 min minimum
4. swapNFTsAfterLive() pendant 24h = "vote" des investisseurs
5. claimEscrow() par startup après 48h de délai

### 4. PROTECTIONS
- Emergency refund si pas de live programmé (15 jours)
- Remboursement pendant campagne active
- Vote post-live via échange NFT/ETH
- Dividendes pour fidéliser investisseurs

## INNOVATION TECHNIQUE

**CREATE2 :** Adresses prévisibles des campagnes
**UUPS Proxy :** Système upgradeable
**Chainlink :** Automation + Prix temps réel  
**ERC721 Avancé :** NFTs avec métadonnées on-chain et visuels SVG
**DAO Live :** Système de vote post-présentation unique
**Anti-Rug Pull :** Triple protection automatisée