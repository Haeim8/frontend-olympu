# 🔍 ANALYSE DÉTAILLÉE DE TOUTES LES FONCTIONS

## 🛠️ OUTILS À INSTALLER POUR TESTS

```bash
# 1. Outils d'analyse de sécurité
npm install --save-dev @openzeppelin/test-helpers
npm install --save-dev chai-as-promised
pip3 install slither-analyzer
pip3 install mythril

# 2. Outil de fuzzing  
curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/crytic/echidna/master/scripts/install-echidna-ubuntu.sh | sh

# 3. Outils de performance
npm install --save-dev gas-reporter
npm install --save-dev solidity-coverage

# 4. Tests de charge
npm install --save-dev lodash
npm install --save-dev async
```

---

## 📋 TOUTES LES FONCTIONS PAR CONTRAT

### 🏭 DivarProxy.sol - Factory de Campagnes

#### 1. `initialize(address _treasury, address _campaignKeeper, address _priceConsumer)`
**Logique :** Initialise le proxy upgradeable avec les adresses essentielles
**Test requis :** Vérifier que seul le owner peut initialiser, une seule fois
**Cas critique :** Adresses nulles, double initialisation

#### 2. `createCampaign(...params)`
**Logique :** N'importe qui peut créer une campagne directement, paie des frais de création, déploie via CREATE2
**Test requis :** Vérification paramètres, déploiement réussi, enregistrement Chainlink
**Cas critique :** Bytecode invalide, salt collision, échec déploiement

#### 3. `setCampaignBytecode(bytes _bytecode)`
**Logique :** Owner définit le bytecode du contrat Campaign pour déploiements futurs
**Test requis :** Seul owner, bytecode valide
**Cas critique :** Bytecode corrompu, accès non autorisé

#### 4. `updateTreasury(address _newTreasury)` 
**Logique :** Owner change l'adresse du trésor pour futurs paiements
**Test requis :** Seul owner, adresse valide, événement émis
**Cas critique :** Adresse nulle, perte d'accès aux fonds

#### 5. `togglePause()`
**Logique :** Owner peut pauser/dépausser la création de nouvelles campagnes
**Test requis :** Seul owner, état inversé, blocage des fonctions
**Cas critique :** Pause permanente, perte de contrôle

### 🚀 Campaign.sol - Contrat Principal de Campagne

#### 6. `constructor(...params)`  
**Logique :** Déploie une campagne avec paramètres validés, configure rôles et premier round
**Test requis :** Validation de tous les paramètres, rôles corrects, round initialisé
**Cas critique :** Paramètres invalides, configuration des rôles échouée

#### 7. `buyShares(uint256 _numShares)`
**Logique :** Investisseur achète des NFTs, commission 15% au trésor, reste en escrow
**Test requis :** Calcul commission exact, mint NFTs corrects, limites respectées
**Cas critique :** Overflow dans calculs, pas assez d'ETH, round inactif

#### 8. `finalizeRound()`
**Logique :** Chainlink finalise le round, crée escrow, initialise session live
**Test requis :** Seul keeper, conditions validées, escrow créé, délais configurés
**Cas critique :** Finalisation prématurée, escrow mal configuré

#### 10. `scheduleLiveSession(uint256 _timestamp, string _url, string _description)`
**Logique :** Créateur programme un live avec minimum 48h de préavis, dans les 15 jours
**Test requis :** Timing strict, seul créateur, dans les délais
**Cas critique :** Préavis insuffisant, deadline dépassée, déjà programmé

#### 11. `startLiveSession()`
**Logique :** Créateur démarre le live à l'heure programmée (±2h de tolérance)
**Test requis :** Timing exact, live programmé, pas déjà démarré
**Cas critique :** Trop tôt/tard, live non programmé, double démarrage

#### 12. `completeLiveSession()`
**Logique :** Créateur termine le live après durée minimum, active délais de vote/récupération
**Test requis :** Durée minimum respectée, délais configurés, escrow débloqué
**Cas critique :** Durée insuffisante, live non démarré, double completion

#### 13. `swapNFTsAfterLive(uint256[] tokenIds)`
**Logique :** Investisseur échange ses NFTs contre 1 ETH par NFT dans les 24h post-live
**Test requis :** Propriété NFTs, période valide, calcul remboursement, réduction escrow
**Cas critique :** NFTs pas possédés, période expirée, escrow insuffisant

#### 14. `claimEscrow()`
**Logique :** Créateur récupère les fonds restants 48h après completion du live
**Test requis :** Live complété, délai respecté, montant correct, seul créateur
**Cas critique :** Délai non écoulé, live non complété, double récupération

#### 15. `emergencyRefundAll()`
**Logique :** Si créateur ne programme pas de live en 15j, investisseurs récupèrent tout
**Test requis :** Deadline passée, live non programmé, calcul correct, burn NFTs
**Cas critique :** Live programmé, deadline non atteinte, balance insuffisante

#### 16. `refundShares(uint256[] tokenIds)`
**Logique :** Investisseur peut rembourser ses NFTs avant fin de round (85% du prix)
**Test requis :** Round actif, propriété NFTs, calcul 85%, burn tokens
**Cas critique :** Round terminé, tokens déjà burned, calcul incorrect

#### 17. `distributeDividends(uint256 amount)`
**Logique :** Créateur distribue des dividendes proportionnels aux détenteurs de NFTs
**Test requis :** Montant ETH correct, calcul par NFT, distribution aux détenteurs
**Cas critique :** Pas de NFTs existants, montant incorrect, calcul division par zéro

#### 18. `claimDividends()`
**Logique :** Détenteur de NFT récupère ses dividendes accumulés
**Test requis :** Dividendes disponibles, montant correct, reset après récupération
**Cas critique :** Pas de dividendes, double récupération, calcul incorrect

#### 19. `startNewRound(uint256 _target, uint256 _price, uint256 _duration)`
**Logique :** Créateur lance un nouveau round avec contraintes de prix (-15% à +200%)
**Test requis :** Round précédent finalisé, contraintes prix, nouveau round configuré
**Cas critique :** Prix hors limites, round actif, paramètres invalides

#### 20. `burnUnsoldNFTs()`
**Logique :** Chainlink brûle les NFTs non vendus après finalisation
**Test requis :** Round finalisé, seul keeper, tokens non existants brûlés
**Cas critique :** Round actif, tokens existants brûlés par erreur

### 🤖 CampaignKeeper.sol - Automation Chainlink

#### 21. `checkUpkeep(bytes calldata)`
**Logique :** Chainlink vérifie si des campagnes nécessitent finalisation
**Test requis :** Détection conditions (temps/montant), campagnes enregistrées
**Cas critique :** Faux positifs, campagnes non détectées

#### 22. `performUpkeep(bytes calldata performData)`
**Logique :** Chainlink exécute la finalisation et burn des NFTs non vendus
**Test requis :** Données valides, finalisation réussie, burn sécurisé
**Cas critique :** Données corrompues, échec finalisation, gas insuffisant

#### 23. `registerCampaign(address campaign)`
**Logique :** DivarProxy enregistre une nouvelle campagne pour monitoring
**Test requis :** Seul DivarProxy, adresse valide, ajout au registry
**Cas critique :** Accès non autorisé, adresse invalide, double enregistrement

### 🎨 NFTRenderer.sol - Génération Visuelle

#### 24. `generateNFTSVG(...params)`
**Logique :** Génère un SVG animé unique pour chaque NFT avec métadonnées
**Test requis :** SVG valide, métadonnées correctes, rendu unique
**Cas critique :** SVG malformé, données manquantes, taille excessive

#### 25. `generateTokenURI(...params)`
**Logique :** Crée l'URI complet JSON+SVG encodé en base64 pour le NFT
**Test requis :** JSON valide, encodage correct, métadonnées complètes
**Cas critique :** JSON malformé, encodage échoué, URI trop long

#### 26. `getNFTInfo(uint256 tokenId)`
**Logique :** Décode un token ID pour extraire le round et numéro de séquence
**Test requis :** Calcul exact (round = tokenId/1M, number = tokenId%1M)
**Cas critique :** Overflow, token ID invalide, calcul incorrect

---

## 🧪 TESTS SPÉCIFIQUES PAR FONCTION

### Tests Critiques Financiers
- **buyShares** : Edge cases avec 1 wei, montants max, calcul commission précis
- **swapNFTsAfterLive** : Vérification 1 ETH exact par NFT, réduction escrow
- **claimEscrow** : Montant exact après tous les swaps
- **distributeDividends** : Division précise, pas de perte de wei

### Tests Critiques Timing  
- **scheduleLiveSession** : Buffer timing exact, 48h précises
- **startLiveSession** : Fenêtre 2h, validation timestamp
- **completeLiveSession** : 15 minutes minimum exactes
- **emergencyRefundAll** : 15 jours exacts après finalisation

### Tests Critiques Sécurité
- **Tous** : Reentrancy, overflow, accès non autorisé
- **claimEscrow** : Double spending, validation propriétaire
- **finalizeRound** : Conditions de race, état inconsistant

### Tests Critiques Performance
- **buyShares** : 1000 investisseurs simultanés
- **swapNFTsAfterLive** : Gestion de 1000+ NFTs par utilisateur
- **checkUpkeep** : Scalabilité avec 100+ campagnes actives

---

## 🎯 ORDRE DE TEST RECOMMANDÉ

### Phase 1 : Fonctions Core
1. `registerUser` → `createCampaign` → `buyShares`
2. `finalizeRound` → `scheduleLiveSession`
3. `startLiveSession` → `completeLiveSession`

### Phase 2 : Fonctions Vote & Recovery  
4. `swapNFTsAfterLive` → `claimEscrow`
5. `emergencyRefundAll` → `refundShares`

### Phase 3 : Fonctions Avancées
6. `distributeDividends` → `claimDividends`
7. `startNewRound` → `burnUnsoldNFTs`

### Phase 4 : Automation & Rendering
8. `checkUpkeep` → `performUpkeep`
9. `generateNFTSVG` → `generateTokenURI`

Chaque fonction doit être testée avec ses cas normaux ET tous ses cas d'erreur critiques ! 🛡️