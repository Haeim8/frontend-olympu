# RAPPORT D'ANALYSE DES SMART CONTRACTS - LIVAR

## 📋 RÉSUMÉ EXÉCUTIF

Le projet Livar est une plateforme de financement participatif décentralisée utilisant des NFTs pour représenter les parts d'investissement. L'architecture se compose de 9 contracts principaux organisés en modules logiques.

**Architecture générale :**
- **Proxy upgradeable** : DivarProxy (contrat principal)
- **Campagne** : Campaign (gestion des levées de fonds)
- **Automatisation** : CampaignKeeper (Chainlink Automation)
- **Stockage** : DivarStorage, SharesStorage
- **Événements** : DivarEvents, SharesEvents
- **Oracle prix** : PriceConsumerV3
- **Interface** : IKeeperRegistry

---

## 🏗️ ARCHITECTURE DES CONTRACTS

### 1. **DivarProxy.sol** - CONTRAT PRINCIPAL
**Type :** Proxy Upgradeable (UUPS)  
**Rôle :** Point d'entrée principal de la plateforme

#### 📝 Fonctions principales :

**🔐 Gestion des utilisateurs :**
- `registerUser()` - Inscription payante des utilisateurs (20$ en ETH)
- `isUserRegistered(address)` - Vérification du statut d'inscription

**🏭 Création de campagnes :**
- `createCampaign()` - Déploiement d'une nouvelle campagne (85$ en ETH)
  - Paramètres : nom, symbole, objectif, prix/part, durée, catégorie, métadonnées
  - Utilise CREATE2 pour des adresses déterministes
  - Enregistrement automatique dans CampaignKeeper

**📊 Getters :**
- `getAllCampaigns()` - Toutes les campagnes
- `getCampaignsByCreator(address)` - Campagnes par créateur
- `getCampaignsByCategory(string)` - Campagnes par catégorie
- `checkUserStatus(address)` - Statut et nombre de campagnes

**⚙️ Administration :**
- `updateTreasury(address)` - Changement du trésor
- `togglePause()` - Pause/reprise de la plateforme
- `setCampaignBytecode(bytes)` - Définition du bytecode Campaign
- `updatePriceConsumer(address)` - Mise à jour de l'oracle prix

---

### 2. **Campaign.sol** - GESTION DES CAMPAGNES
**Type :** ERC721 + Multi-héritage  
**Rôle :** Contrat de campagne individuelle

#### 📝 Fonctions principales :

**💰 Investissement :**
- `buyShares(uint256)` - Achat de parts (NFTs)
  - Commission plateforme : 15%
  - Vérifications : round actif, montant exact, limites
  - Mint de NFTs avec IDs basés sur le round (round * 1M + numéro)

**🔄 Remboursement :**
- `refundShares(uint256[])` - Remboursement avant fin du round
  - Remboursement à 85% du prix d'achat
  - Burn des NFTs remboursés

**⏳ Gestion des rounds :**
- `finalizeRound()` - Finalisation automatique/manuelle
- `startNewRound()` - Nouveau round avec prix ajustés (-15% à +200%)
- `getCurrentRound()` - Informations du round actuel

**💳 Escrow :**
- `claimEscrow()` - Récupération des fonds après 24h
- `getEscrowInfo()` - Informations sur l'escrow

**💎 Dividendes :**
- `distributeDividends(uint256)` - Distribution par la startup
- `claimDividends()` - Réclamation par les investisseurs

**🔥 Nettoyage :**
- `burnUnsoldNFTs()` - Brûlage des NFTs non vendus (keeper only)

**📊 Utilitaires :**
- `getNFTInfo(uint256)` - Round et numéro d'un NFT
- `getInvestments(address)` - Historique d'un investisseur
- `tokenURI(uint256)` - Métadonnées NFT en base64

---

### 3. **CampaignKeeper.sol** - AUTOMATISATION CHAINLINK
**Type :** Automation Compatible  
**Rôle :** Automatisation des finalisations de rounds

#### 📝 Fonctions principales :

**🤖 Automation Chainlink :**
- `checkUpkeep(bytes)` - Vérification des conditions
  - Vérifie tous les contrats enregistrés
  - Conditions : round actif + (temps écoulé OU objectif atteint)
- `performUpkeep(bytes)` - Exécution automatique
  - Finalise le round
  - Brûle les NFTs non vendus

**📋 Gestion :**
- `registerCampaign(address)` - Enregistrement (DivarProxy only)

---

### 4. **DivarStorage.sol** - STOCKAGE PRINCIPAL
**Type :** Upgradeable Storage  
**Rôle :** Variables et structures principales

#### 📊 Constantes :
- `REGISTRATION_FEE_USD` = 20$ (2000 centimes)
- `CAMPAIGN_CREATION_FEE_USD` = 85$ (8500 centimes)
- `PLATFORM_COMMISSION_PERCENT` = 15%

#### 🗃️ Structures :
```solidity
struct CampaignInfo {
    address campaignAddress;
    address creator;
    uint256 creationTime;
    uint256 targetAmount;
    string category;
    bool isActive;
    string name;
    string metadata;
    string logo;
    address escrowAddress;
}
```

#### 📝 Fonctions :
- `getRegistrationFeeETH()` - Frais d'inscription en ETH
- `getCampaignCreationFeeETH()` - Frais de création en ETH

---

### 5. **SharesStorage.sol** - STOCKAGE DES PARTS
**Type :** Storage Contract  
**Rôle :** Gestion des données de campagne

#### 🗃️ Structures principales :
```solidity
struct Round {
    uint256 roundNumber;
    uint256 sharePrice;
    uint256 targetAmount;
    uint256 fundsRaised;
    uint256 sharesSold;
    uint256 startTime;
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

---

### 6. **PriceConsumerV3.sol** - ORACLE PRIX
**Type :** Chainlink Price Feed  
**Rôle :** Conversion USD/ETH

#### 📝 Fonctions :
- `getLatestPrice()` - Prix ETH/USD actuel
- `convertUSDToETH(uint256)` - Conversion USD → ETH
- `convertETHToUSD(uint256)` - Conversion ETH → USD

**🔒 Sécurité :**
- Vérification de la fraîcheur (1h max)
- Validation des prix positifs
- Gestion des erreurs de l'oracle

---

### 7. **DivarEvents.sol** - ÉVÉNEMENTS PRINCIPAUX
**Type :** Events Library  
**Rôle :** Événements de la plateforme

#### 📢 Événements :
- `UserRegistered` - Inscription utilisateur
- `CampaignCreated` - Création de campagne
- `TreasuryUpdated` - Changement de trésor
- `PlatformStatusChanged` - Pause/reprise
- `PriceConsumerUpdated` - Mise à jour oracle

---

### 8. **SharesEvents.sol** - ÉVÉNEMENTS CAMPAGNES
**Type :** Events Library  
**Rôle :** Événements des campagnes

#### 📢 Événements :
- `RoundStarted/Finalized` - Gestion des rounds
- `SharesPurchased/Refunded` - Transactions de parts
- `DividendsDistributed/Claimed` - Gestion dividendes
- `EscrowSetup/Released` - Gestion escrow
- `NFTsBurned` - Nettoyage des NFTs

---

### 9. **IKeeperRegistry.sol** - INTERFACE CHAINLINK
**Type :** Interface  
**Rôle :** Intégration avec Chainlink Registry

---

## 🔐 SÉCURITÉ ET PERMISSIONS

### **Modifiers et contrôles d'accès :**
- `onlyOwner` - Administrateur principal
- `onlyStartup` - Créateur de la campagne
- `onlyKeeper` - Automatisation Chainlink
- `onlyRegisteredUser` - Utilisateurs inscrits
- `whenNotPaused` - Vérification pause plateforme

### **Protection ReentrancyGuard :**
- `buyShares()`
- `refundShares()`
- `claimEscrow()`
- `distributeDividends()`
- `claimDividends()`

### **Validations principales :**
- Adresses non nulles
- Montants positifs
- Temps futurs pour les deadlines
- Commission et limites de prix
- Escrow et périodes de grâce

---

## 💰 MODÈLE ÉCONOMIQUE

### **Frais plateforme :**
- Inscription : 20$ (payé une fois)
- Création campagne : 85$ (par campagne)
- Commission investissement : 15% (sur chaque achat)

### **Gestion des fonds :**
1. **Achat de parts** → 15% commission + 85% escrow campagne
2. **Finalisation** → Escrow 24h avant récupération startup
3. **Remboursement** → 85% du prix d'achat (avant finalisation)
4. **Dividendes** → Distribution proportionnelle aux parts détenues

---

## ⚠️ POINTS D'ATTENTION ET AMÉLIORATIONS

### **🔴 Problèmes identifiés :**

1. **Campaign.sol:201** - Variable `allInvestments` utilisée mais non déclarée localement
2. **Absence de pause** dans Campaign une fois déployé
3. **Prix oracle** - Pas de fallback si Chainlink échoue
4. **Limits de gas** - Boucles sans limitation sur le nombre d'investisseurs

### **🟡 Améliorations recommandées :**

1. **Gouvernance décentralisée** - DAO pour les décisions importantes
2. **Multi-signature** - Pour les fonctions critiques d'admin
3. **Timelock** - Pour les upgrades de contrats
4. **Circuit breaker** - Pause d'urgence décentralisée
5. **Tests de stress** - Simulation avec nombreux investisseurs
6. **Audit de sécurité** - Avant déploiement mainnet

### **🟢 Points forts :**
- Architecture modulaire et évolutive
- Utilisation des standards OpenZeppelin
- Intégration Chainlink pour prix et automation
- Système d'escrow pour la sécurité
- NFTs avec métadonnées complètes
- Gestion multi-rounds flexible

---

## 🔄 FLUX D'EXÉCUTION TYPES

### **Création d'une campagne :**
1. Utilisateur s'inscrit (`registerUser`)
2. Création campagne (`createCampaign`)
3. Enregistrement automatique dans Keeper
4. Round 1 démarre automatiquement

### **Cycle d'investissement :**
1. Investisseur achète des parts (`buyShares`)
2. Commission 15% → trésor, 85% → escrow campagne
3. NFTs créés et transférés
4. Si objectif atteint → finalisation automatique
5. Sinon → finalisation manuelle/automatique à l'échéance

### **Récupération des fonds :**
1. Round finalisé → escrow 24h activé
2. Startup peut récupérer après délai (`claimEscrow`)
3. Possibilité de lancer nouveau round (`startNewRound`)

---

**📅 Date du rapport :** $(date)  
**🔍 Analysé par :** Claude AI  
**📊 Nombre de contrats :** 9 fichiers principaux  
**⚡ Architecture :** Proxy Upgradeable + Factory Pattern