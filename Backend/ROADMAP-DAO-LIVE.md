# 🚀 ROADMAP - Système DAO Live pour Smart Contract Campaign

## 📋 **RÉSUMÉ EXÉCUTIF**

### **🎯 Objectif**
Transformer notre plateforme de crowdfunding classique en système révolutionnaire de **DAO Live** où les créateurs doivent faire des sessions live obligatoires pour débloquer leurs fonds, et où les investisseurs peuvent récupérer leur argent s'ils ne sont pas convaincus.

### **💡 Innovation**
- **Sessions live obligatoires** de 15 minutes minimum
- **Gouvernance démocratique** : 1 NFT = 1 vote
- **Protection investisseurs** : 85% récupérable dans les 24h après live
- **Anti-rug pull** : Créateur ne peut récupérer qu'après 48h

---

## 🏗️ **ÉTAT ACTUEL DU SMART CONTRACT**

### ✅ **Ce qui fonctionne déjà parfaitement :**

1. **💰 Commission 15% automatique**
   - Dès l'achat d'un NFT, 15% vont à la plateforme
   - 85% restent en escrow dans le contrat

2. **⏰ Escrow avec délai**
   - Après finalisation : fonds bloqués 24h
   - Créateur peut récupérer après ce délai

3. **🔄 Système de remboursement**
   - Pendant le round actif : possibilité d'échanger NFT contre 85% du prix
   - Burn automatique du NFT lors du remboursement

### 🚧 **Ce qui doit être modifié :**

Le système actuel permet au créateur de récupérer les fonds **automatiquement** après 24h, sans obligation de faire un live. C'est ce qu'on va changer !

---

## 🛠️ **MODIFICATIONS NÉCESSAIRES**

### **1. 📺 Ajout du système Live Session**

#### **Nouvelles variables à ajouter :**
```solidity
struct LiveSession {
    uint256 scheduledTimestamp;    // Quand le live est programmé
    uint256 actualTimestamp;       // Quand le live a eu lieu
    uint256 claimDeadline;         // 24h après le live pour échanger
    uint256 withdrawDeadline;      // 48h après le live pour récupérer
    bool isScheduled;              // Live programmé ou pas
    bool isCompleted;              // Live fait ou pas
    string streamUrl;              // URL du stream (optionnel)
}

LiveSession public liveSession;
uint256 public constant SCHEDULE_DEADLINE = 15 days;  // 15 jours max pour programmer
uint256 public constant SCHEDULE_NOTICE = 48 hours;   // 48h minimum d'annonce
```

#### **Ce que ça change :**
- **Avant** : Finalisation → 24h → Créateur récupère tout
- **Après** : Finalisation → Live obligatoire → 24h pour voter → 48h pour récupérer

---

### **2. ⏰ Nouvelle timeline obligatoire**

#### **Étape 1 : Après finalisation de Chainlink**
```solidity
function afterChainlinkFinalization() internal {
    // L'escrow est créé MAIS pas accessible tout de suite
    escrow = Escrow({
        amount: address(this).balance,
        releaseTime: 0,  // ❌ PAS DE DÉLAI AUTOMATIQUE
        isReleased: false
    });
    
    // Créateur a 15 jours pour programmer un live
    liveSession.schedulingDeadline = block.timestamp + SCHEDULE_DEADLINE;
}
```

#### **Étape 2 : Programmer le live (par le créateur)**
```solidity
function scheduleLiveSession(uint256 _scheduledTime, string memory _streamUrl) 
    external onlyStartup {
    
    require(!liveSession.isScheduled, "Live already scheduled");
    require(block.timestamp <= liveSession.schedulingDeadline, "Too late to schedule");
    require(_scheduledTime >= block.timestamp + SCHEDULE_NOTICE, "Need 48h notice");
    require(_scheduledTime <= liveSession.schedulingDeadline, "Must be within 15 days");
    
    liveSession.scheduledTimestamp = _scheduledTime;
    liveSession.isScheduled = true;
    liveSession.streamUrl = _streamUrl;
    
    emit LiveSessionScheduled(_scheduledTime, _streamUrl);
}
```

#### **Étape 3 : Démarrer le live (par le créateur)**
```solidity
function startLiveSession() external onlyStartup {
    require(liveSession.isScheduled, "Live not scheduled");
    require(!liveSession.isCompleted, "Live already completed");
    require(block.timestamp >= liveSession.scheduledTimestamp, "Too early");
    require(block.timestamp <= liveSession.scheduledTimestamp + 2 hours, "Too late");
    
    liveSession.actualTimestamp = block.timestamp;
    liveSession.claimDeadline = block.timestamp + 24 hours;
    liveSession.withdrawDeadline = block.timestamp + 48 hours;
    
    emit LiveSessionStarted(block.timestamp);
}

function completeLiveSession() external onlyStartup {
    require(liveSession.actualTimestamp > 0, "Live not started");
    require(!liveSession.isCompleted, "Already completed");
    
    liveSession.isCompleted = true;
    
    // MAINTENANT on peut définir quand l'escrow sera libérable
    escrow.releaseTime = liveSession.withdrawDeadline;
    
    emit LiveSessionCompleted(block.timestamp);
}
```

---

### **3. 🗳️ Nouveau système d'échange post-live**

#### **Fonction d'échange après live :**
```solidity
function swapNFTsAfterLive(uint256[] memory tokenIds) external nonReentrant {
    require(liveSession.isCompleted, "Live session not completed");
    require(block.timestamp <= liveSession.claimDeadline, "Claim period expired");
    
    uint256 totalRefund = 0;
    
    for(uint256 i = 0; i < tokenIds.length; i++) {
        require(ownerOf(tokenIds[i]) == msg.sender, "Not token owner");
        
        // 1 ETH par NFT (prix fixe, pas de calcul complexe)
        totalRefund += 1 ether;
        
        // Burn le NFT
        _burn(tokenIds[i]);
        tokenBurned[tokenIds[i]] = true;
    }
    
    // Transférer 1 ETH par NFT échangé
    payable(msg.sender).transfer(totalRefund);
    
    emit NFTsSwappedAfterLive(msg.sender, tokenIds.length, totalRefund);
}
```

#### **Ce que ça change :**
- **Avant** : Échange possible seulement pendant le round
- **Après** : **NOUVEAU** échange possible 24h après chaque live

---

### **4. 🔒 Sécurités anti-fraude**

#### **Récupération d'urgence si pas de live :**
```solidity
function emergencyRefundAll() external {
    require(block.timestamp > liveSession.schedulingDeadline, "Still time to schedule");
    require(!liveSession.isScheduled, "Live is scheduled");
    
    // Si pas de live programmé après 15 jours → tout le monde récupère
    // Fonction d'urgence pour les investisseurs
    
    uint256 refundAmount = balanceOf(msg.sender) * 1 ether;
    require(refundAmount > 0, "No NFTs to refund");
    require(address(this).balance >= refundAmount, "Insufficient balance");
    
    // Burn tous les NFTs de l'utilisateur
    uint256 userBalance = balanceOf(msg.sender);
    for(uint256 i = 0; i < userBalance; i++) {
        uint256 tokenId = tokenOfOwnerByIndex(msg.sender, 0);
        _burn(tokenId);
    }
    
    payable(msg.sender).transfer(refundAmount);
    
    emit EmergencyRefund(msg.sender, userBalance, refundAmount);
}
```

#### **Récupération créateur (modifiée) :**
```solidity
function claimEscrow() external onlyStartup nonReentrant {
    require(escrow.amount > 0, "No funds in escrow");
    require(!escrow.isReleased, "Funds already released");
    require(liveSession.isCompleted, "Live session not completed"); // ✅ NOUVEAU
    require(block.timestamp >= escrow.releaseTime, "Release time not reached");
    
    escrow.isReleased = true;
    payable(startup).sendValue(escrow.amount);
    emit EscrowReleased(escrow.amount, block.timestamp);
}
```

---

## 📊 **NOUVEAUX ÉVÉNEMENTS À AJOUTER**

```solidity
event LiveSessionScheduled(uint256 scheduledTime, string streamUrl);
event LiveSessionStarted(uint256 timestamp);
event LiveSessionCompleted(uint256 timestamp);
event NFTsSwappedAfterLive(address indexed investor, uint256 nftCount, uint256 refund);
event EmergencyRefund(address indexed investor, uint256 nftCount, uint256 refund);
```

---

## 🎯 **RÉSUMÉ DES CHANGEMENTS COMPORTEMENTAUX**

### **👨‍💼 Pour le CRÉATEUR :**

#### **Avant :**
1. Campagne finalisée par Chainlink
2. Attendre 24h
3. Récupérer tous les fonds

#### **Après :**
1. Campagne finalisée par Chainlink  
2. **📅 DOIT programmer un live (max 15 jours)**
3. **⏰ DOIT annoncer 48h à l'avance minimum**
4. **🔴 DOIT faire le live (min 15 minutes)**
5. **⏳ DOIT attendre 48h après le live**
6. Récupérer les fonds restants (si investisseurs convaincus)

### **👥 Pour les INVESTISSEURS :**

#### **Avant :**
1. Acheter des NFTs
2. Si pas content pendant le round → remboursement 85%
3. Sinon attendre les dividendes/profits

#### **Après :**
1. Acheter des NFTs
2. **🔴 Regarder le live obligatoire**
3. **🗳️ Si pas convaincu → 24h pour échanger contre 1 ETH/NFT**
4. **⭐ Si convaincu → garder NFTs pour récompenses futures**
5. **🚨 Si créateur fait pas de live → récupération d'urgence après 15 jours**

---

## ⚡ **AVANTAGES DU NOUVEAU SYSTÈME**

### **🛡️ Protection maximale des investisseurs :**
- **Aucun risque de rug pull** (créateur ne peut pas partir avec l'argent immédiatement)
- **Transparence forcée** (obligation de montrer l'avancement en live)
- **Sortie possible** (24h pour récupérer si pas convaincu)

### **🎯 Qualité des projets :**
- **Créateurs sérieux seulement** (les fraudeurs éviteront cette contrainte)
- **Projets bien préparés** (obligation de présenter publiquement)
- **Engagement réel** (15 jours max pour s'organiser)

### **⚖️ Gouvernance équitable :**
- **1 NFT = 1 vote** (pas de baleines qui dominent)
- **Décisions collectives** (majorité décide)
- **Récompenses pour la confiance** (early adopters gagnent plus)

---

## 🗓️ **PLANNING D'IMPLÉMENTATION**

### **Phase 1 : Ajout des structures (1-2 jours)**
- Ajouter `LiveSession` struct
- Ajouter nouvelles constantes
- Ajouter nouveaux events

### **Phase 2 : Modification du flow principal (2-3 jours)**
- Modifier `_finalizeRoundInternal()`
- Ajouter `scheduleLiveSession()`
- Ajouter `startLiveSession()` et `completeLiveSession()`

### **Phase 3 : Nouveau système d'échange (1-2 jours)**
- Créer `swapNFTsAfterLive()`
- Modifier `claimEscrow()` avec nouvelles conditions

### **Phase 4 : Sécurités et edge cases (1-2 jours)**
- Ajouter `emergencyRefundAll()`
- Tests de sécurité
- Vérification gas costs

### **Phase 5 : Tests et déploiement (2-3 jours)**
- Tests unitaires complets
- Tests d'intégration
- Déploiement testnet
- Audit de sécurité

---

## 💰 **IMPACT ÉCONOMIQUE**

### **💵 Revenus plateforme :**
- **Maintenus** : 15% sur chaque achat NFT
- **Nouveaux** : Possibles frais sur les lives (sponsoring, publicité)

### **🎁 Incitations investisseurs :**
- **Early adopters** : Plus de récompenses s'ils gardent leurs NFTs
- **Risk/Reward équilibré** : Peuvent sortir s'ils veulent

### **⚖️ Équilibre créateur/investisseur :**
- Créateurs motivés pour faire de bons projets
- Investisseurs protégés mais incités à faire confiance

---

**🚀 Ce système transforme notre plateforme en véritable innovation Web3 avec gouvernance décentralisée réelle !**