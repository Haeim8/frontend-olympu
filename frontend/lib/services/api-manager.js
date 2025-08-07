/**
 * Gestionnaire centralisé des appels API - Firebase + Blockchain
 */

import blockchainCache from './cache-manager.js';

class ApiManager {
  constructor() {
    this.cache = blockchainCache;
    
    // Adresses des contrats déployés sur Base Sepolia
    this.contractAddresses = {
      PriceConsumerV3: "0xa5050E4FC5F7115378Bbf8bAa17517298962bebE",
      DivarProxy: "0x89Eba0c82c1f16433473A9A06690BfaAC2c7a1b4",
      CampaignKeeper: "0x7BA165d19De799DA8070D3c1C061933551726D1E"
    };

    // Cache des ABIs
    this.abis = {};
    this.contracts = {};
    this.provider = null;
  }

  async initializeWeb3() {
    const { ethers } = await import('ethers');
    
    // Priorité au RPC public pour éviter les limites de rate
    const fallbackUrl = "https://sepolia.base.org";
    const quicknodeUrl = process.env.NEXT_PUBLIC_QUICKNODE_HTTP_URL;
    
    // Utiliser RPC public en priorité pour éviter 429 errors
    console.log('🌐 Utilisation du RPC public Base Sepolia');
    this.provider = new ethers.providers.JsonRpcProvider(fallbackUrl);
    return true;
    
    /* QuickNode désactivé temporairement - rate limit atteint
    if (quicknodeUrl) {
      console.log('🚀 Utilisation de QuickNode RPC');
      this.provider = new ethers.providers.JsonRpcProvider(quicknodeUrl);
      return true;
    } else if (typeof window !== 'undefined' && window.ethereum) {
      console.log('🦊 Utilisation du wallet MetaMask');
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      return true;
    } else {
      console.log('🌐 Utilisation du RPC public Base Sepolia');
      this.provider = new ethers.providers.JsonRpcProvider(fallbackUrl);
      return true;
    }
    */
  }

  async loadABIs() {
    if (Object.keys(this.abis).length > 0) return;

    try {
      // Import dynamique des ABIs
      const divarAbi = await import('../../ABI/DivarProxyABI.json');
      const campaignAbi = await import('../../ABI/CampaignABI.json');
      const keeperAbi = await import('../../ABI/CampaignKeeperABI.json');
      const priceAbi = await import('../../ABI/PriceConsumerV3ABI.json');

      this.abis = {
        DivarProxy: divarAbi.default,
        Campaign: campaignAbi.default,
        CampaignKeeper: keeperAbi.default,
        PriceConsumerV3: priceAbi.default
      };
    } catch (error) {
      console.error('Erreur chargement ABIs:', error);
    }
  }

  async getContract(contractName, address = null, needsSigner = false) {
    if (!this.provider) {
      await this.initializeWeb3();
    }

    if (!this.provider) {
      throw new Error('Web3 provider non disponible');
    }

    await this.loadABIs();

    const contractAddress = address || this.contractAddresses[contractName];
    const contractKey = `${contractName}_${contractAddress}${needsSigner ? '_signer' : ''}`;

    if (!this.contracts[contractKey]) {
      const { ethers } = await import('ethers');
      let providerOrSigner = this.provider;
      
      if (needsSigner) {
        // Pour les transactions, utiliser le wallet connecté
        if (typeof window !== 'undefined' && window.ethereum) {
          const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
          providerOrSigner = web3Provider.getSigner();
        } else {
          throw new Error('Wallet non connecté - requis pour les transactions');
        }
      }
      
      this.contracts[contractKey] = new ethers.Contract(
        contractAddress,
        this.abis[contractName],
        providerOrSigner
      );
    }

    return this.contracts[contractKey];
  }

  // === MÉTHODES POUR L'AUTHENTIFICATION ===

  async checkUserProfile(address) {
    try {
      const { db } = await import('@/lib/firebase/firebase');
      const { doc, getDoc } = await import('firebase/firestore');
      
      const docRef = doc(db, "users", address);
      const docSnap = await getDoc(docRef);
      
      return {
        exists: docSnap.exists(),
        data: docSnap.exists() ? docSnap.data() : null
      };
    } catch (error) {
      console.error('Erreur lors de la vérification du profil Firebase:', error);
      return { exists: false, data: null };
    }
  }

  async checkUserRegistration(address) {
    // Plus besoin de vérifier l'inscription - toujours true maintenant
    return { isRegistered: true };
  }

  // === MÉTHODES POUR LES CAMPAGNES ===
  
  async getAllCampaigns(useCache = true) {
    const cacheKey = this.cache.generateKey('all_campaigns', 'main');
    
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const divarProxy = await this.getContract('DivarProxy');
      const campaignAddresses = await divarProxy.getAllCampaigns();
      
      this.cache.set(cacheKey, campaignAddresses, this.cache.defaultTTL);
      return campaignAddresses;
    } catch (error) {
      console.error('Erreur getAllCampaigns:', error);
      return [];
    }
  }

  async getCampaignData(campaignAddress, useCache = true) {
    const cacheKey = this.cache.generateKey('campaign', campaignAddress);
    
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const campaign = await this.getContract('Campaign', campaignAddress);
      const divarProxy = await this.getContract('DivarProxy');
      
      const [
        name,
        symbol,
        currentRound,
        totalShares
      ] = await Promise.all([
        campaign.name(),
        campaign.symbol(),
        campaign.getCurrentRound(),
        campaign.totalSupply()
      ]);

      // Récupération du registry avec la VRAIE fonction getCampaignRegistry
      const registry = await divarProxy.getCampaignRegistry(campaignAddress);

      // Récupérer les données du round actuel avec gestion d'erreur  
      const currentRoundNumber = typeof currentRound === 'object' && currentRound.toNumber ? currentRound.toNumber() : parseInt(currentRound.toString());
      const roundData = await campaign.rounds(currentRoundNumber);

      // Validation que roundData est un array avec les bonnes propriétés
      if (!Array.isArray(roundData) || roundData.length < 9) {
        throw new Error(`Invalid roundData structure: ${JSON.stringify(roundData)}`);
      }

      // Le struct Round retourne un array : [roundNumber, sharePrice, targetAmount, fundsRaised, sharesSold, startTime, endTime, isActive, isFinalized]
      console.log('🔍 Debug roundData COMPLET:', {
        0: roundData[0]?.toString(),
        1: roundData[1]?.toString(),
        2: roundData[2]?.toString(),  
        3: roundData[3]?.toString(),
        4: roundData[4]?.toString(),
        5: `${roundData[5]?.toString()} (${new Date(parseInt(roundData[5]) * 1000).toLocaleString()})`, // startTime
        6: `${roundData[6]?.toString()} (${new Date(parseInt(roundData[6]) * 1000).toLocaleString()})`, // endTime
        7: roundData[7],  // isActive
        8: roundData[8],  // isFinalized
        currentTime: `${Math.floor(Date.now()/1000)} (${new Date().toLocaleString()})`,
        length: roundData.length
      });
      
      const campaignData = {
        // Propriétés principales
        address: campaignAddress,
        id: campaignAddress, // Pour la compatibilité avec CampaignCard
        name,
        symbol,
        currentRound: currentRound.toString(),
        totalShares: totalShares.toString(),
        
        // Données du round (en utilisant les index corrects)
        roundNumber: roundData[0].toString(),
        sharePrice: this.formatEthValue(roundData[1]),
        targetAmount: this.formatEthValue(roundData[2]),
        fundsRaised: this.formatEthValue(roundData[3]),
        sharesSold: roundData[4].toString(),
        startTime: roundData[5].toString(),
        endTime: roundData[6].toString(),
        isActive: roundData[7],
        isFinalized: roundData[8],
        
        // Données du registry
        creator: registry.creator,
        category: registry.category,
        metadata: registry.metadata,
        logo: registry.logo,
        
        // Récupération métadonnées IPFS
        ipfsHash: registry.metadata.replace('ipfs://', ''),
        
        // Propriétés OBLIGATOIRES pour CampaignCard
        goal: this.formatEthValue(roundData[2]), // targetAmount formaté
        raised: this.formatEthValue(roundData[3]), // fundsRaised formaté
        sector: registry.category, // catégorie
        endDate: new Date(parseInt(roundData[6]) * 1000).toISOString(), // endTime converti en date
        
        // Propriétés calculées
        progressPercentage: roundData[2].toString() !== '0' ? 
          (parseFloat(this.formatEthValue(roundData[3])) / parseFloat(this.formatEthValue(roundData[2]))) * 100 : 0,
        investors: parseInt(roundData[4]) || 0, // Nombre de shares vendues = nombre d'investisseurs approximatif
        isCertified: false // À implémenter plus tard
      };

      this.cache.set(cacheKey, campaignData, this.cache.defaultTTL);
      return campaignData;
    } catch (error) {
      console.error('Erreur getCampaignData:', error);
      return null;
    }
  }

  async getCampaignInvestors(campaignAddress, useCache = true) {
    const cacheKey = this.cache.generateKey('campaign_investors', campaignAddress);
    
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const campaign = await this.getContract('Campaign', campaignAddress);
      
      // Récupérer tous les holders de NFT (investisseurs)
      const totalSupply = await campaign.totalSupply();
      const investorMap = new Map();
      
      // Parcourir tous les tokens pour trouver les propriétaires
      for (let tokenId = 1; tokenId <= totalSupply; tokenId++) {
        try {
          const owner = await campaign.ownerOf(tokenId);
          if (investorMap.has(owner)) {
            investorMap.set(owner, investorMap.get(owner) + 1);
          } else {
            investorMap.set(owner, 1);
          }
        } catch (e) {
          // Token peut ne plus exister
          continue;
        }
      }
      
      // Convertir en tableau
      const investors = Array.from(investorMap.entries()).map(([address, shares]) => ({
        address,
        shares: shares.toString()
      }));

      this.cache.set(cacheKey, investors, this.cache.defaultTTL);
      return investors;
    } catch (error) {
      console.error('Erreur getCampaignInvestors:', error);
      return [];
    }
  }

  async getCampaignTransactions(campaignAddress, useCache = true) {
    const cacheKey = this.cache.generateKey('campaign_transactions', campaignAddress);
    
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const campaign = await this.getContract('Campaign', campaignAddress);
      const filter = campaign.filters.SharesPurchased();
      const events = await campaign.queryFilter(filter);
      
      const transactions = events.map(event => ({
        hash: event.transactionHash,
        blockNumber: event.blockNumber,
        investor: event.args.investor,
        amount: event.args.amount.toString(),
        shares: event.args.shares.toString(),
        timestamp: event.args.timestamp.toString()
      }));

      this.cache.set(cacheKey, transactions, this.cache.defaultTTL);
      return transactions;
    } catch (error) {
      console.error('Erreur getCampaignTransactions:', error);
      return [];
    }
  }

  async getUserInvestments(userAddress) {
    const cacheKey = this.cache.generateKey('user_investments', userAddress);
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const campaigns = await this.getAllCampaigns();
      const investments = [];

      for (const campaignAddress of campaigns) {
        const campaign = await this.getContract('Campaign', campaignAddress);
        const balance = await campaign.balanceOf(userAddress);
        
        if (balance.gt(0)) {
          const campaignData = await this.getCampaignData(campaignAddress);
          investments.push({
            ...campaignData,
            userShares: balance.toString()
          });
        }
      }

      this.cache.set(cacheKey, investments, this.cache.defaultTTL);
      return investments;
    } catch (error) {
      console.error('Erreur getUserInvestments:', error);
      return [];
    }
  }

  // === RÉCUPÉRATION IPFS ===
  
  async getCampaignDocuments(campaignAddress) {
    try {
      const divarProxy = await this.getContract('DivarProxy');
      const registry = await divarProxy.getCampaignRegistry(campaignAddress);
      
      console.log('🔍 Registry data:', {
        address: registry.campaignAddress,
        name: registry.name,
        metadata: registry.metadata
      });
      
      if (!registry.metadata || !registry.metadata.startsWith('ipfs://')) {
        console.log('❌ Metadata invalide:', registry.metadata);
        return null;
      }
      
      const ipfsHash = registry.metadata.replace('ipfs://', '');
      
      // 1. Récupérer le JSON principal
      const gateways = [
        `https://${ipfsHash}.ipfs.w3s.link/campaign-data.json`,
        `https://ipfs.io/ipfs/${ipfsHash}/campaign-data.json`,
        `https://gateway.pinata.cloud/ipfs/${ipfsHash}/campaign-data.json`
      ];
      
      let response;
      let lastError;
      
      for (const gateway of gateways) {
        try {
          response = await fetch(gateway);
          if (response.ok) break;
        } catch (error) {
          lastError = error;
          console.warn(`Gateway ${gateway} failed:`, error.message);
        }
      }
      
      if (!response || !response.ok) {
        throw new Error(`Tous les gateways IPFS ont échoué. Dernier erreur: ${lastError?.message}`);
      }
      
      const campaignData = await response.json();
      
      // 2. Si pas de documents dans le JSON, essayer de les détecter automatiquement
      if (!campaignData.documents) {
        console.log('🔍 Pas de documents dans JSON, détection automatique...');
        campaignData.documents = await this.detectIPFSDocuments(ipfsHash);
      }
      
      return campaignData;
    } catch (error) {
      console.error('Erreur récupération documents IPFS:', error);
      return null;
    }
  }
  
  // Nouvelle fonction pour détecter automatiquement les fichiers IPFS
  async detectIPFSDocuments(ipfsHash) {
    try {
      console.log('🔍 Détection automatique des fichiers pour CID:', ipfsHash);
      
      // Patterns de fichiers à détecter
      const documentPatterns = {
        whitepaper: /^whitepaper_(.+)$/,
        pitchDeck: /^pitchDeck_(.+)$/,
        legalDocuments: /^legalDocuments_(.+)$/,
        media: /^media_(.+)$/
      };
      
      const detectedDocuments = {
        whitepaper: [],
        pitchDeck: [],
        legalDocuments: [],
        media: []
      };
      
      // Liste connue des fichiers (depuis ta campagne)
      const knownFiles = [
        'whitepaper_mockup.png',
        'pitchDeck_mockup.png', 
        'legalDocuments_mockup.png',
        'media_mockup.png'
      ];
      
      // Vérifier chaque fichier connu
      for (const fileName of knownFiles) {
        for (const [docType, pattern] of Object.entries(documentPatterns)) {
          const match = fileName.match(pattern);
          if (match) {
            const originalName = match[1];
            const fileExtension = originalName.split('.').pop();
            const fileType = this.getFileType(fileExtension);
            
            // Tester la disponibilité du fichier
            const testUrl = `https://${ipfsHash}.ipfs.w3s.link/${fileName}`;
            try {
              const testResponse = await fetch(testUrl, { method: 'HEAD' });
              if (testResponse.ok) {
                detectedDocuments[docType].push({
                  name: originalName,
                  fileName: fileName,
                  type: fileType,
                  url: testUrl,
                  size: testResponse.headers.get('content-length') || 'Unknown'
                });
                console.log(`✅ Fichier détecté: ${fileName}`);
              }
            } catch (error) {
              console.warn(`❌ Fichier non accessible: ${fileName}`, error.message);
            }
          }
        }
      }
      
      console.log('🎉 Documents détectés:', detectedDocuments);
      return detectedDocuments;
      
    } catch (error) {
      console.error('Erreur détection documents IPFS:', error);
      return {};
    }
  }
  
  // Fonction utilitaire pour déterminer le type de fichier
  getFileType(extension) {
    const types = {
      'pdf': 'application/pdf',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'mp4': 'video/mp4',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    return types[extension.toLowerCase()] || 'application/octet-stream';
  }

  // === UTILITAIRES ===
  
  formatEthValue(value) {
    if (!value) return "0";
    
    try {
      // PROTECTION: Si c'est un array, on ne traite pas
      if (Array.isArray(value)) {
        console.warn('formatEthValue reçoit un array, valeur ignorée:', value);
        return "0";
      }

      let numericValue;
      
      // Si c'est un objet BigNumber avec _hex ou hex
      if (typeof value === 'object' && (value._hex || value.hex)) {
        numericValue = parseInt(value._hex || value.hex, 16);
      } 
      // Si c'est déjà une string hex
      else if (typeof value === 'string' && value.startsWith('0x')) {
        numericValue = parseInt(value, 16);
      }
      // Si c'est un BigNumber objet avec toString()
      else if (typeof value === 'object' && typeof value.toString === 'function') {
        const strValue = value.toString();
        numericValue = parseFloat(strValue);
      }
      // Si c'est un nombre ou string normale
      else {
        numericValue = parseFloat(value.toString());
      }
      
      if (numericValue === 0 || isNaN(numericValue)) return "0";
      
      // Conversion de Wei vers Ether (diviser par 10^18)
      const ethValue = numericValue / Math.pow(10, 18);
      
      // Si la valeur est très petite, utiliser plus de décimales
      if (ethValue < 0.000001) {
        return ethValue.toFixed(9);
      }
      return ethValue.toFixed(6);
    } catch (error) {
      console.error('Erreur formatEthValue:', error, 'value:', value);
      return "0";
    }
  }

  async getEthPrice() {
    const cacheKey = this.cache.generateKey('eth_price', 'current');
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const priceConsumer = await this.getContract('PriceConsumerV3');
      const price = await priceConsumer.getLatestPrice();
      const priceInUsd = (price / 1e8).toFixed(2);
      
      this.cache.set(cacheKey, priceInUsd, this.cache.criticalTTL);
      return priceInUsd;
    } catch (error) {
      console.error('Erreur getEthPrice:', error);
      return "0";
    }
  }

  async getCampaignCreationFee() {
    const cacheKey = this.cache.generateKey('creation_fee', 'current');
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const divarProxy = await this.getContract('DivarProxy');
      const fee = await divarProxy.getCampaignCreationFeeETH();
      const feeFormatted = this.formatEthValue(fee);
      
      this.cache.set(cacheKey, { raw: fee.toString(), formatted: feeFormatted }, this.cache.criticalTTL);
      return { raw: fee.toString(), formatted: feeFormatted };
    } catch (error) {
      console.error('Erreur getCampaignCreationFee:', error);
      return { raw: "0", formatted: "0" };
    }
  }

  // === CRÉATION DE CAMPAGNE ===
  
  async createCampaign(campaignData) {
    try {
      const divarProxy = await this.getContract('DivarProxy', null, true); // needsSigner = true
      
      // Récupération des frais de création
      const fee = await divarProxy.getCampaignCreationFeeETH();
      
      const tx = await divarProxy.createCampaign(
        campaignData.name,
        campaignData.symbol,
        campaignData.targetAmount,
        campaignData.sharePrice,
        campaignData.endTime,
        campaignData.category,
        campaignData.metadata,
        campaignData.royaltyFee,
        campaignData.logo,
        { value: fee }
      );
      
      console.log('✅ Transaction de création envoyée:', tx.hash);
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmée, gas utilisé:', receipt.gasUsed?.toString());
      
      // Extraire l'adresse de la nouvelle campagne depuis les events
      const campaignCreatedEvent = receipt.events?.find(e => e.event === 'CampaignCreated');
      
      if (campaignCreatedEvent) {
        const campaignAddress = campaignCreatedEvent.args?.campaignAddress;
        console.log('✅ Nouvelle campagne créée:', campaignAddress);
        
        // Invalider le cache pour forcer le rechargement
        this.invalidateCache('campaigns');
        
        return {
          success: true,
          campaignAddress,
          txHash: tx.hash,
          receipt
        };
      } else {
        throw new Error('Événement CampaignCreated non trouvé');
      }
      
    } catch (error) {
      console.error('Erreur createCampaign:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  clearCache() {
    this.cache.clear();
  }

  invalidateCache(pattern) {
    this.cache.invalidate(pattern);
  }

  invalidateCampaign(campaignAddress) {
    this.cache.invalidateCampaign(campaignAddress);
  }

  getCacheStats() {
    return this.cache.getCacheStats();
  }

  // === MÉTHODES DE PRÉCHARGEMENT ===

  preloadCampaignOnHover(campaignAddress) {
    this.cache.preloadOnHover(campaignAddress);
  }

  async warmupCache(campaignAddresses) {
    await this.cache.warmupCache(campaignAddresses);
  }
}

// Instance singleton
export const apiManager = new ApiManager();
export default apiManager;