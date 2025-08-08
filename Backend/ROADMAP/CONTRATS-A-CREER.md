# 🚀 ROADMAP - CONTRATS À CRÉER

## 📋 **RÉSUMÉ**

Après le déploiement de base, il faut créer 2 contrats essentiels pour compléter la plateforme LIVAR :

1. **NFTVisualGenerator.sol** - Générateur d'images NFT (style Uniswap V3)
2. **DivarDAO.sol** - Système de gouvernance et protection investisseurs

---

## 🎨 **CONTRAT 1 : NFTVisualGenerator.sol**

### **🎯 Objectif**
Créer automatiquement des NFTs visuels personnalisés pour chaque participation à une campagne, comme Uniswap V3 le fait pour les positions de liquidité.

### **🔧 Fonctionnalités**

#### **Génération Automatique**
- NFT créé automatiquement lors de l'achat de parts
- Design unique basé sur les données de la campagne
- Métadonnées riches et visuelles

#### **Éléments Visuels**
- **Logo de la campagne** intégré
- **Titre de propriété** avec montant investi
- **Informations du round** (Angel, MVP, Pre-Seed, etc.)
- **Date d'investissement** et numéro de série
- **Adresse de l'investisseur** (partiellement masquée)
- **Design thématique** selon la catégorie (Tech, Gaming, etc.)

#### **Format Technique**
```solidity
struct VisualConfig {
    string logoUrl;           // Logo de la campagne
    string backgroundColor;   // Couleur de fond personnalisée
    string primaryColor;      // Couleur principale
    string campaignName;      // Nom de la campagne
    uint256 investmentAmount; // Montant investi
    uint256 roundNumber;      // Numéro du round
    string roundName;         // Nom du round (Angel, MVP, etc.)
    uint256 tokenId;          // ID unique du NFT
    address investor;         // Adresse investisseur
    uint256 timestamp;        // Date d'achat
}
```

#### **Génération SVG On-Chain**
```solidity
function generateNFTSVG(VisualConfig memory config) public pure returns (string memory) {
    // Génère un SVG complet avec :
    // - Gradients et animations CSS
    // - Logo intégré (base64 ou URL)
    // - Texte formaté avec les données
    // - Effets visuels (glass morphism, etc.)
    // - QR code optionnel vers la campagne
}

function generateTokenURI(uint256 tokenId) public view returns (string memory) {
    // Retourne JSON complet avec :
    // - name, description, image (SVG base64)
    // - attributes détaillés
    // - external_url vers la campagne
}
```

### **🔗 Intégration**
- Hérite de `ERC721` et `ERC721URIStorage`
- Appelé automatiquement depuis `Campaign.buyShares()`
- Compatible OpenSea et marketplaces NFT
- Métadonnées dynamiques et évolutives

---

## 🏛️ **CONTRAT 2 : DivarDAO.sol**

### **🎯 Objectif**
Système de gouvernance décentralisée avec protection maximale des investisseurs et processus de validation des créateurs de campagnes.

### **📅 Timeline Complète**

#### **Phase 1 : Campagne Active**
- Achat de NFTs possible
- **PAS d'échange 85%** pendant cette phase
- Durée jusqu'à : `targetAmount` atteint OU `endTime` dépassé

#### **Phase 2 : Post-Campagne (15 jours)**
- Campagne finalisée par Chainlink
- **Échanges 85% ACTIVÉS** pour tous les investisseurs
- Créateur a **15 jours MAX** pour programmer un live
- Si pas de live programmé → **Remboursement automatique**

#### **Phase 3 : Live Obligatoire**
- Live programmé avec **48h de préavis minimum**
- **Durée minimum 15 minutes** obligatoire
- URL de stream fournie par le créateur
- Si live < 15 min → **Remboursement automatique**

#### **Phase 4 : Post-Live (24h)**
- **24h** après le live pour échanger les NFTs
- Les investisseurs "votent avec leurs pieds"
- Échange NFT → 85% du prix d'achat

#### **Phase 5 : Validation Documents**
- Créateur doit fournir **documents légaux** :
  - Scan KBIS (société française)
  - Justificatifs d'identité
  - Informations projet détaillées
- **Validation manuelle** par l'équipe avant déblocage

#### **Phase 6 : Déblocage Escrow**
- Après validation documents → Fonds libérés
- Créateur récupère les investissements restants
- Début du développement projet

### **🔧 Fonctionnalités Techniques**

#### **Structures de Données**
```solidity
struct LiveSession {
    uint256 schedulingDeadline;    // 15 jours après finalisation
    uint256 scheduledTimestamp;    // Quand le live est programmé
    uint256 actualStartTime;       // Début réel du live
    uint256 actualEndTime;         // Fin réelle du live
    uint256 claimDeadline;         // 24h après live pour échanger
    uint256 withdrawDeadline;      // 48h après live pour récupérer
    bool isScheduled;              // Live programmé
    bool isStarted;                // Live démarré
    bool isCompleted;              // Live terminé
    string streamUrl;              // URL du stream
    string description;            // Description du live
    uint256 minimumDuration;       // 15 minutes minimum
}

struct DocumentValidation {
    string kbisHash;               // Hash du document KBIS
    string identityHash;           // Hash pièce d'identité  
    string projectDetailsHash;     // Hash détails projet
    bool isSubmitted;              // Documents soumis
    bool isValidated;              // Validés par l'équipe
    uint256 submissionTime;        // Date soumission
    uint256 validationTime;        // Date validation
    address validator;             // Qui a validé
}
```

#### **Fonctions Principales**
```solidity
// Système Live
function scheduleLiveSession(uint256 _scheduledTime, string memory _streamUrl) external onlyStartup;
function startLiveSession() external onlyStartup;
function completeLiveSession() external onlyStartup;

// Échanges post-campagne et post-live
function swapNFTsPostCampaign(uint256[] memory tokenIds) external nonReentrant;
function swapNFTsAfterLive(uint256[] memory tokenIds) external nonReentrant;

// Remboursements d'urgence
function emergencyRefundNoLive() external nonReentrant;
function emergencyRefundShortLive() external nonReentrant;

// Validation documents
function submitDocuments(string memory _kbisHash, string memory _identityHash) external onlyStartup;
function validateDocuments(address campaignAddress, bool approved) external onlyOwner;

// Déblocage final
function claimEscrowAfterValidation() external onlyStartup nonReentrant;
```

### **🛡️ Protections Investisseurs**

#### **Triple Protection**
1. **Échange 85%** dès la fin de campagne
2. **Remboursement automatique** si pas de live ou live < 15 min
3. **Vote post-live** pendant 24h

#### **Sécurités Anti-Rug Pull**
- Impossible de récupérer les fonds sans live
- Validation documents obligatoire
- Délais de sécurité à chaque étape
- Remboursements automatiques

#### **Gouvernance Décentralisée**
- Investisseurs votent avec leurs actions (garder ou échanger NFTs)
- Pas de vote complexe, juste des actions concrètes
- Protection maximum avec liberté de choix

---

## 🔗 **INTÉGRATION AVEC L'EXISTANT**

### **Modifications Campaign.sol**
- Ajouter `LiveSession` et `DocumentValidation` structs
- Modifier `finalizeRound()` pour déclencher Phase 2
- Ajouter toutes les fonctions DAO Live
- Intégrer appels au `NFTVisualGenerator`

### **Modifications DivarProxy.sol**
- Ajouter référence aux nouveaux contrats
- Fonctions admin pour validation documents
- Gestion des remboursements d'urgence

### **Nouveaux Events**
```solidity
// Dans SharesEvents.sol
event LiveSessionScheduled(uint256 scheduledTime, string streamUrl);
event LiveSessionStarted(uint256 startTime);
event LiveSessionCompleted(uint256 duration);
event NFTsSwappedPostCampaign(address indexed investor, uint256 nftCount);
event NFTsSwappedAfterLive(address indexed investor, uint256 nftCount);
event DocumentsSubmitted(address indexed campaign, uint256 timestamp);
event DocumentsValidated(address indexed campaign, bool approved);
event EmergencyRefundActivated(string reason);
```

---

## 📈 **AVANTAGES BUSINESS**

### **Pour les Investisseurs**
✅ Protection maximale contre les arnaques  
✅ NFTs tradables sur OpenSea  
✅ Visuel professionnel et personnalisé  
✅ Multiple opportunités de sortie  
✅ Transparence totale du processus  

### **Pour les Créateurs**
✅ Crédibilité renforcée par les validations  
✅ Process structuré et professionnel  
✅ Marketing automatique via NFTs visuels  
✅ Réduction des refunds grâce à la confiance  

### **Pour la Plateforme**
✅ Différenciation concurrentielle majeure  
✅ Réduction des litiges et problèmes  
✅ Crédibilité institutionnelle  
✅ Expansion possible vers d'autres secteurs  

---

## 🛠️ **PLANNING DE DÉVELOPPEMENT**

### **Étape 1 : NFTVisualGenerator (5-7 jours)**
- Structure des données visuelles
- Génération SVG on-chain  
- Intégration avec Campaign.sol
- Tests et optimisations

### **Étape 2 : DivarDAO Phase 1 (7-10 jours)**
- Timeline et structures de données
- Système Live Session
- Échanges post-campagne et post-live

### **Étape 3 : DivarDAO Phase 2 (5-7 jours)**
- Validation documents
- Remboursements d'urgence
- Déblocage escrow sécurisé

### **Étape 4 : Tests et Intégration (3-5 jours)**
- Tests complets end-to-end
- Optimisations gas
- Déploiement testnet puis mainnet

---

**🎯 TOTAL : ~20-30 jours de développement pour un système révolutionnaire de crowdfunding Web3 !**