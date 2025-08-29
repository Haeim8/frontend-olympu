/**
 * Gestionnaire centralisé des appels API - Firebase + Blockchain
 */

import blockchainCache from './cache-manager.js';

// Supabase pour les promotions
let supabase;
const initSupabase = async () => {
  if (!supabase) {
    const { supabase: sb } = await import('../supabase/client.js');
    supabase = sb;
  }
  return supabase;
};

class ApiManager {
  constructor() {
    this.cache = blockchainCache;
    
    // Adresses des contrats déployés sur Base Sepolia - MISE À JOUR 28/08/2025
    this.contractAddresses = {
      PriceConsumerV3: "0x0888C31a910c44a5291F9E4f6Eb440Df74f581Db",
      DivarProxy: "0xaB0999Eae920849a41A55eA080d0a4a210156817",
      CampaignKeeper: "0xcCD7381A3bD40F992DADc82FAaC7491d738E6b4F"
    };

    // Cache des ABIs
    this.abis = {};
    this.contracts = {};
    this.provider = null;

    // Circuit breaker pour éviter les appels répétés qui échouent
    this.circuitBreaker = {
      failures: new Map(),
      isOpen: (key) => {
        const failures = this.circuitBreaker.failures.get(key);
        if (!failures) return false;
        return failures.count >= 5 && (Date.now() - failures.lastAttempt) < 60000; // 1 minute
      },
      recordFailure: (key) => {
        const current = this.circuitBreaker.failures.get(key) || { count: 0, lastAttempt: 0 };
        this.circuitBreaker.failures.set(key, {
          count: current.count + 1,
          lastAttempt: Date.now()
        });
      },
      recordSuccess: (key) => {
        this.circuitBreaker.failures.delete(key);
      }
    };
  }

  async initializeWeb3() {
    const { ethers } = await import('ethers');
    
    // Liste de fallback RPC avec retry
    const rpcUrls = [
      "https://sepolia.base.org",
      "https://base-sepolia.blockpi.network/v1/rpc/public",
      "https://base-sepolia.g.alchemy.com/v2/demo",
      process.env.NEXT_PUBLIC_QUICKNODE_HTTP_URL
    ].filter(Boolean);

    for (const url of rpcUrls) {
      try {
        const provider = new ethers.providers.JsonRpcProvider(url);
        
        // Test de connexion avec timeout
        await Promise.race([
          provider.getNetwork(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
        ]);
        
        this.provider = provider;
        return true;
      } catch (error) {
        console.warn(`❌ RPC ${url} échoué:`, error.message);
      }
    }
    
    throw new Error('Aucun RPC disponible');
  }

  async loadABIs() {
    if (Object.keys(this.abis).length > 0) return;

    try {
      // Import dynamique des ABIs
      const divarAbi = await import('../../ABI/DivarProxyABI.json');
      const campaignAbi = await import('../../ABI/CampaignABI.json');
      const keeperAbi = await import('../../ABI/CampaignKeeperABI.json');
      const priceAbi = await import('../../ABI/PriceConsumerV3ABI.json');
   

      // Fonction utilitaire pour extraire l'ABI selon le format
      const extractABI = (importedAbi) => {
        const abi = importedAbi.default || importedAbi;
        // Si c'est un objet Hardhat avec propriété .abi
        if (abi && typeof abi === 'object' && abi.abi) {
          return abi.abi;
        }
        // Sinon c'est déjà un tableau ABI
        return abi;
      };

      this.abis = {
        DivarProxy: extractABI(divarAbi),
        Campaign: extractABI(campaignAbi),
        CampaignKeeper: extractABI(keeperAbi),
        PriceConsumerV3: extractABI(priceAbi),
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
    const circuitKey = `rpc_campaign_${campaignAddress}`;
    
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    // Circuit breaker check
    if (this.circuitBreaker.isOpen(circuitKey)) {
      return null;
    }

    try {
      // Rate limiting - attendre entre chaque campagne pour éviter 429
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const campaign = await this.getContract('Campaign', campaignAddress);
      const divarProxy = await this.getContract('DivarProxy');
      
      // Réduire la charge en chargeant séquentiellement au lieu de Promise.all
      const name = await campaign.name();
      await new Promise(resolve => setTimeout(resolve, 50));
      const symbol = await campaign.symbol();
      await new Promise(resolve => setTimeout(resolve, 50));
      const currentRound = await campaign.getCurrentRound();
      await new Promise(resolve => setTimeout(resolve, 50));
      const totalShares = await campaign.totalSupply();

      // Récupération du registry avec la VRAIE fonction getCampaignRegistry
      await new Promise(resolve => setTimeout(resolve, 50));
      const registry = await divarProxy.getCampaignRegistry(campaignAddress);

      // Récupérer les données du round actuel avec gestion d'erreur  
      const currentRoundNumber = typeof currentRound === 'object' && currentRound.toNumber ? currentRound.toNumber() : parseInt(currentRound.toString());
      await new Promise(resolve => setTimeout(resolve, 50));
      const roundData = await campaign.rounds(currentRoundNumber);

      // Validation que roundData est un array avec les bonnes propriétés
      if (!Array.isArray(roundData) || roundData.length < 8) {
        throw new Error(`Invalid roundData structure: ${JSON.stringify(roundData)}`);
      }

      // Le struct Round retourne un array : [roundNumber, sharePrice, targetAmount, fundsRaised, sharesSold, endTime, isActive, isFinalized] - 8 valeurs
      
      const campaignData = {
        // Propriétés principales
        address: campaignAddress,
        id: campaignAddress, // Pour la compatibilité avec CampaignCard
        name,
        symbol,
        currentRound: currentRound.toString(),
        totalShares: totalShares.toString(),
        
        // Données du round (en utilisant les index corrects - 8 valeurs selon ABI)
        roundNumber: roundData[0].toString(),
        sharePrice: this.formatEthValue(roundData[1]),
        targetAmount: this.formatEthValue(roundData[2]),
        fundsRaised: this.formatEthValue(roundData[3]),
        sharesSold: roundData[4].toString(),
        startTime: "0", // Plus de startTime dans la nouvelle structure
        endTime: roundData[5].toString(), // endTime est à la position 5
        isActive: roundData[6],
        isFinalized: roundData[7],
        
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
        endDate: new Date(parseInt(roundData[5]) * 1000).toISOString(), // endTime converti en date
        
        // Propriétés calculées
        progressPercentage: roundData[2].toString() !== '0' ? 
          (parseFloat(this.formatEthValue(roundData[3])) / parseFloat(this.formatEthValue(roundData[2]))) * 100 : 0,
        investors: parseInt(roundData[4]) || 0, // Nombre de shares vendues = nombre d'investisseurs approximatif
        isCertified: false // À implémenter plus tard
      };

      this.circuitBreaker.recordSuccess(circuitKey);
      this.cache.set(cacheKey, campaignData, this.cache.defaultTTL);
      return campaignData;
    } catch (error) {
      this.circuitBreaker.recordFailure(circuitKey);
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
      
      // Tentative avec timeout et fallback
      let events;
      try {
        events = await Promise.race([
          campaign.queryFilter(filter),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout RPC')), 5000))
        ]);
      } catch (rpcError) {
        console.warn('RPC principal échoué, tentative fallback:', rpcError.message);
        
        // Fallback : retourner un tableau vide en cache temporaire pour éviter les requêtes répétées
        const emptyResult = [];
        this.cache.set(cacheKey, emptyResult, 30000); // Cache court de 30s
        return emptyResult;
      }
      
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
      console.warn('Erreur getCampaignTransactions:', error.message);
      
      // Retourner un tableau vide et le cacher temporairement pour éviter les requêtes répétées
      const emptyResult = [];
      this.cache.set(cacheKey, emptyResult, 30000); // Cache court de 30s
      return emptyResult;
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
      
      if (!registry.metadata || !registry.metadata.startsWith('ipfs://')) {
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
              }
            } catch (error) {
              // Fichier non accessible, continuer silencieusement
            }
          }
        }
      }
      
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
      
      const receipt = await tx.wait();
      
      // Extraire l'adresse de la nouvelle campagne depuis les events
      const campaignCreatedEvent = receipt.events?.find(e => e.event === 'CampaignCreated');
      
      if (campaignCreatedEvent) {
        const campaignAddress = campaignCreatedEvent.args?.campaignAddress;
        
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

  // === NOUVELLES MÉTHODES REMBOURSEMENT ===

  async canRefundToken(campaignAddress, tokenId) {
    try {
      const campaign = await this.getContract('Campaign', campaignAddress);
      const result = await campaign.canRefundToken(tokenId);
      return {
        canRefund: result[0],
        message: result[1]
      };
    } catch (error) {
      console.error('Erreur canRefundToken:', error);
      return { canRefund: false, message: 'Erreur lors de la vérification' };
    }
  }

  async getRefundAmount(campaignAddress, tokenId) {
    try {
      const campaign = await this.getContract('Campaign', campaignAddress);
      const refundAmount = await campaign.getRefundAmount(tokenId);
      return this.formatEthValue(refundAmount);
    } catch (error) {
      console.error('Erreur getRefundAmount:', error);
      return '0';
    }
  }

  async getNFTRound(campaignAddress, tokenId) {
    try {
      const campaign = await this.getContract('Campaign', campaignAddress);
      const round = await campaign.getNFTRound(tokenId);
      return round.toString();
    } catch (error) {
      console.error('Erreur getNFTRound:', error);
      return '0';
    }
  }

  async refundShares(campaignAddress, tokenIds) {
    try {
      const campaign = await this.getContract('Campaign', campaignAddress, true);
      const tx = await campaign.refundShares(tokenIds);
      await tx.wait();
      
      this.invalidateCampaign(campaignAddress);
      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error('Erreur refundShares:', error);
      return { success: false, error: error.message };
    }
  }

  // === MÉTHODES DE PRÉCHARGEMENT ===

  preloadCampaignOnHover(campaignAddress) {
    this.cache.preloadOnHover(campaignAddress);
  }

  async warmupCache(campaignAddresses) {
    await this.cache.warmupCache(campaignAddresses);
  }

  // === MÉTHODES UTILITAIRES V2 ===

  async getCampaignVersion(campaignAddress) {
    try {
      const campaign = await this.getContract('Campaign', campaignAddress);
      // Test si nouvelles fonctions disponibles
      await campaign.canRefundToken(1000001);
      return 'v2'; // Nouvelles fonctionnalités
    } catch {
      return 'v1'; // Version classique
    }
  }


  async getUserNFTs(campaignAddress, userAddress) {
    try {
      const campaign = await this.getContract('Campaign', campaignAddress);
      const balance = await campaign.balanceOf(userAddress);
      const nfts = [];
      
      for (let i = 0; i < balance.toNumber(); i++) {
        const tokenId = await campaign.tokenOfOwnerByIndex(userAddress, i);
        const round = await this.getNFTRound(campaignAddress, tokenId.toString());
        const refundData = await this.canRefundToken(campaignAddress, tokenId.toString());
        
        nfts.push({
          tokenId: tokenId.toString(),
          round: round,
          canRefund: refundData.canRefund,
          refundMessage: refundData.message
        });
      }
      
      return nfts;
    } catch (error) {
      console.error('Erreur getUserNFTs:', error);
      return [];
    }
  }

  // === MÉTHODES DE PROMOTION AVEC CACHE ===

  async isCampaignBoosted(campaignAddress, roundNumber, useCache = true) {
    const cacheKey = this.cache.generateKey('promotion_boost', `${campaignAddress}_${roundNumber}`);
    const circuitKey = `supabase_promotion_${campaignAddress}`;
    
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    // Circuit breaker check
    if (this.circuitBreaker.isOpen(circuitKey)) {
      const result = { isBoosted: false };
      this.cache.set(cacheKey, result, this.cache.criticalTTL);
      return result;
    }

    try {
      const supabaseClient = await initSupabase();
      
      // Validation du roundNumber
      const validRoundNumber = parseInt(roundNumber) || 1;
      
      const currentTime = new Date().toISOString();
      const { data, error } = await supabaseClient
        .from('campaign_promotions')
        .select('boost_type, end_timestamp')
        .eq('campaign_address', campaignAddress)
        .eq('round_number', validRoundNumber)
        .eq('is_active', true)
        .gte('end_timestamp', currentTime)
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        this.circuitBreaker.recordFailure(circuitKey);
        const result = { isBoosted: false };
        this.cache.set(cacheKey, result, this.cache.criticalTTL);
        return result;
      }
      
      this.circuitBreaker.recordSuccess(circuitKey);
      const result = data ? {
        isBoosted: true,
        boostType: data.boost_type,
        endTime: new Date(data.end_timestamp)
      } : { isBoosted: false };

      this.cache.set(cacheKey, result, this.cache.criticalTTL);
      return result;
    } catch (error) {
      this.circuitBreaker.recordFailure(circuitKey);
      const result = { isBoosted: false };
      this.cache.set(cacheKey, result, this.cache.criticalTTL);
      return result;
    }
  }

  async getActivePromotions(useCache = true) {
    const cacheKey = this.cache.generateKey('active_promotions', 'all');
    
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const supabaseClient = await initSupabase();
      const { data, error } = await supabaseClient
        .from('active_promotions')
        .select('*')
        .order('boost_type', { ascending: false });

      if (error) {
        console.warn('Supabase active promotions error:', error);
        return [];
      }
      
      this.cache.set(cacheKey, data || [], this.cache.defaultTTL);
      return data || [];
    } catch (error) {
      console.warn('Error fetching active promotions:', error);
      return [];
    }
  }
}

// Instance singleton
export const apiManager = new ApiManager();
export default apiManager;