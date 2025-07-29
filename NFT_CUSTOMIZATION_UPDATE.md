# 🎨 Mise à jour - Customisation des NFTs

## 📋 Résumé

Correction majeure du système de génération des NFTs pour permettre la customisation complète (couleurs, logos) depuis le frontend vers les smart contracts.

**Problème identifié :** Les NFTs étaient générés avec des couleurs fixes (#ffffff, #000000) même si l'utilisateur choisissait des couleurs personnalisées dans le frontend.

**Solution :** Ajout d'une fonction `updateNFTConfig()` dans les smart contracts et intégration complète frontend ↔ blockchain.

---

## 🔧 Modifications Smart Contracts

### 1. **Campaign.sol** - Ajout de la fonction de configuration NFT

```solidity
/**
 * @dev Permet à la startup de configurer l'apparence des NFTs
 */
function updateNFTConfig(
    string memory _backgroundColor,
    string memory _textColor,
    string memory _logoData,
    bool _dividendsEnabled,
    bool _airdropsEnabled,
    bool _revenueSplitEnabled,
    bool _customRewardEnabled,
    string memory _customRewardName
) external onlyStartup {
    nftConfig.backgroundColor = _backgroundColor;
    nftConfig.textColor = _textColor;
    nftConfig.logoData = _logoData;
    nftConfig.dividendsEnabled = _dividendsEnabled;
    nftConfig.airdropsEnabled = _airdropsEnabled;
    nftConfig.revenueSplitEnabled = _revenueSplitEnabled;
    nftConfig.customRewardEnabled = _customRewardEnabled;
    nftConfig.customRewardName = _customRewardName;

    emit NFTConfigUpdated(_backgroundColor, _textColor, _logoData);
}
```

**Impact :** Maintenant les startups peuvent modifier l'apparence de leurs NFTs après création de campagne.

### 2. **SharesEvents.sol** - Nouvel événement

```solidity
event NFTConfigUpdated(
    string backgroundColor,
    string textColor,
    string logoData
);
```

**Impact :** Traçabilité des modifications de style NFT sur la blockchain.

### 3. **DivarProxy.sol** - Configuration automatique lors de la création

```solidity
// Si un logo est fourni, configurer le NFT après création
if (bytes(_logo).length > 0) {
    try Campaign(payable(campaignAddress)).updateNFTConfig(
        "#ffffff",  // backgroundColor par défaut
        "#000000",  // textColor par défaut  
        _logo,      // logoData depuis IPFS
        true,       // dividendsEnabled par défaut
        true,       // airdropsEnabled par défaut
        false,      // revenueSplitEnabled par défaut
        false,      // customRewardEnabled par défaut
        ""          // customRewardName vide
    ) {
        // Configuration NFT réussie
    } catch {
        // Continue même si la configuration échoue
    }
}
```

**Impact :** Configuration automatique du logo IPFS dès la création de campagne.

### 4. **NFTRenderer.sol** - Utilisation des couleurs dynamiques

Le contrat NFTRenderer utilise déjà `nftConfig.backgroundColor` et `nftConfig.textColor` pour générer les SVG, donc **aucune modification nécessaire**.

```solidity
// Dans generateNFTSVG()
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" style="background:',
nftConfig.backgroundColor, '">',
```

**Impact :** Les SVG sont maintenant générés avec les vraies couleurs.

---

## 🌐 Modifications Frontend

### 1. **api-manager.js** - Nouvelle méthode

```javascript
// === MÉTHODES POUR LA CONFIGURATION NFT ===

async updateCampaignNFTConfig(campaignAddress, nftConfig) {
  try {
    const { getContract } = await import('@thirdweb-dev/sdk');
    const contract = await getContract(campaignAddress);
    
    const receipt = await contract.call("updateNFTConfig", [
      nftConfig.backgroundColor || "#ffffff",
      nftConfig.textColor || "#000000", 
      nftConfig.logoData || "",
      nftConfig.dividendsEnabled || true,
      nftConfig.airdropsEnabled || true,
      nftConfig.revenueSplitEnabled || false,
      nftConfig.customRewardEnabled || false,
      nftConfig.customRewardName || ""
    ]);
    
    return receipt;
  } catch (error) {
    console.error('Erreur lors de la configuration NFT:', error);
    throw error;
  }
}
```

**Impact :** Interface centralisée pour configurer les NFTs depuis le frontend.

### 2. **CampaignModal.jsx** - Configuration post-création

```javascript
// Configurer le style NFT avec les couleurs choisies
if (campaignAddress) {
  try {
    console.log('Configuration du style NFT avec les couleurs:', formData.nftCustomization);
    await apiManager.updateCampaignNFTConfig(campaignAddress, {
      backgroundColor: formData.nftCustomization.backgroundColor,
      textColor: formData.nftCustomization.textColor,
      logoData: formData.nftCustomization.logo ? `ipfs://${ipfsResult.ipfsHash}/${campaignFolderName}/logo.${formData.nftCustomization.logo.type.split('/')[1]}` : "",
      dividendsEnabled: true,
      airdropsEnabled: true,
      revenueSplitEnabled: false,
      customRewardEnabled: false,
      customRewardName: ""
    });
    console.log('Configuration NFT réussie !');
  } catch (configError) {
    console.warn('Erreur lors de la configuration NFT (campagne créée quand même):', configError);
  }
}
```

**Impact :** Après création de campagne, les couleurs choisies dans le preview sont transmises au smart contract.

### 3. **CampaignNFTPreview.jsx** - Validation des logos

```javascript
const handleLogoUpload = (e) => {
  const file = e.target.files?.[0];
  if (file) {
    // Vérifier le format et la taille
    const validFormats = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!validFormats.includes(file.type)) {
      alert('Format non supporté. Utilisez PNG, JPG, SVG ou WebP.');
      return;
    }
    
    if (file.size > maxSize) {
      alert('Fichier trop volumineux. Maximum 5MB.');
      return;
    }
    
    onCustomizationChange({
      ...formData.nftCustomization,
      logo: file
    });
  }
};
```

**Impact :** Validation stricte des formats de logos pour éviter les erreurs.

### 4. **CompanySharesNFTCard.jsx** - Preview plus réaliste

```javascript
// Ajout de props manquantes pour un preview plus fidèle
const CompanySharesNFTCard = ({
  name,
  creatorAddress,
  tokenId,
  sector,        // NOUVEAU
  sharePrice,    // NOUVEAU
  backgroundColor = '#ffffff',
  textColor = '#000000',
  logoUrl,
  // ... 
}) => {
```

**Impact :** Le preview dans le frontend est maintenant identique au NFT final généré.

---

## 🚀 Processus de Déploiement

### 1. **Compilation**
```bash
npx hardhat compile
```

### 2. **Upgrade (sans redéploiement)**
```bash
npx hardhat run scripts/upgradeDivar.js --network sepoliaBase
```

**Résultats :**
- ✅ DivarProxy upgradé : `0x66e7c12F7b235dd81AFC7D2c2cdBe9157Cfc894F`
- ✅ Nouveau NFTRenderer : `0x0DBCd894f06b5502dE54ad9562E0755D30f91B67`
- ✅ Bytecode Campaign mis à jour avec `updateNFTConfig()`

### 3. **Mise à jour des ABI**
```bash
cp artifacts/contracts/Campaign.sol/Campaign.json ../frontend/ABI/CampaignABI.json
cp artifacts/contracts/DivarProxy.sol/DivarProxy.json ../frontend/ABI/DivarProxyABI.json
cp artifacts/contracts/NFTRenderer.sol/NFTRenderer.json ../frontend/ABI/NFTRendererABI.json
```

---

## 📊 Métadonnées IPFS Enrichies

### Nouvelles métadonnées NFT

```javascript
const nftMetadata = {
  name: campaignData.name,
  description: campaignData.description || "",
  image: `ipfs://${campaignFolderName}/nft-card.png`,
  external_url: `https://livar.io/campaign/${campaignFolderName}`,
  attributes: [
    { trait_type: "Sector", value: campaignData.sector },
    { trait_type: "Background Color", value: campaignData.nftCustomization.backgroundColor },
    { trait_type: "Text Color", value: campaignData.nftCustomization.textColor },
    { trait_type: "Share Price", value: `${campaignData.sharePrice} ETH` },
    { trait_type: "Total Shares", value: campaignData.numberOfShares },
    { trait_type: "Creator", value: campaignData.creatorAddress },
    { trait_type: "Campaign Type", value: "Equity Token" },
    { trait_type: "Royalty Fee", value: `${campaignData.royaltyFee}%` }
  ],
  // Données de style pour la génération dynamique
  style: {
    backgroundColor: campaignData.nftCustomization.backgroundColor,
    textColor: campaignData.nftCustomization.textColor,
    hasLogo: !!campaignData.nftCustomization.logo,
    texture: campaignData.nftCustomization.texture || 'default'
  }
};
```

### Métadonnées de campagne complètes

```javascript
const contractMetadata = {
  name: campaignData.name,
  symbol: campaignData.symbol,
  description: campaignData.description,
  sharePrice: campaignData.sharePrice,
  numberOfShares: campaignData.numberOfShares,
  targetAmount: (parseFloat(campaignData.sharePrice) * parseFloat(campaignData.numberOfShares)).toString(),
  endTime: Math.floor(new Date(campaignData.endDate).getTime() / 1000),
  sector: campaignData.sector === 'Autre' ? campaignData.otherSector : campaignData.sector,
  royaltyFee: campaignData.royaltyFee,
  socials: campaignData.socials,
  teamMembers: campaignData.teamMembers,
  // Données de style NFT pour le contrat
  nftStyle: {
    backgroundColor: campaignData.nftCustomization.backgroundColor,
    textColor: campaignData.nftCustomization.textColor,
    logoPath: campaignData.nftCustomization.logo ? `${campaignFolderName}/logo.${campaignData.nftCustomization.logo.type.split('/')[1]}` : null,
    texture: campaignData.nftCustomization.texture
  },
  createdAt: new Date().toISOString(),
  version: "1.0"
};
```

---

## ✅ Résultat Final

### Avant la mise à jour ❌
- Tous les NFTs étaient **blancs avec texte noir** 
- Les couleurs du frontend étaient **ignorées**
- Aucun moyen de personnaliser après création

### Après la mise à jour ✅
- Les NFTs respectent les **couleurs choisies** dans le frontend
- **Configuration automatique** du logo IPFS
- **Fonction `updateNFTConfig()`** pour modifications futures
- **Preview identique** au NFT final
- **Validation stricte** des formats de logos

---

## 📋 Formats de Logos Supportés

```
Formats acceptés: PNG, JPG, SVG, WebP
Taille maximale: 5MB  
Dimensions recommandées: 400x400px (carré)
Fond transparent: PNG ou SVG recommandé
```

---

## 🧪 Comment Tester

1. **Créer une nouvelle campagne**
2. **Personnaliser les couleurs** dans l'étape 4 (preview NFT)
3. **Uploader un logo** (PNG/SVG recommandé)
4. **Finaliser la création**
5. **Vérifier que le NFT généré** utilise les bonnes couleurs

---

**Date :** 29 Juillet 2025  
**Version :** 2.0  
**Statut :** ✅ Déployé sur Base Sepolia Testnet