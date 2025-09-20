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

const toStringSafe = (value, fallback = '0') => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint') return value.toString();
  if (typeof value === 'object' && typeof value.toString === 'function') {
    try {
      return value.toString();
    } catch (error) {
      return fallback;
    }
  }
  return fallback;
};

const parseBool = (value, fallback) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'bigint') return value !== 0n;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n', 'off', ''].includes(normalized)) return false;
  }
  return fallback !== undefined ? fallback : Boolean(value);
};

const normalizeCampaignSummary = (summary) => {
  if (!summary) return null;

  const sharePrice = toStringSafe(summary.sharePrice ?? summary.share_price ?? '0');
  const goal = toStringSafe(summary.goal ?? '0');
  const raised = toStringSafe(summary.raised ?? '0');
  const sharesSold = toStringSafe(summary.sharesSold ?? summary.shares_sold ?? '0');
  const totalShares = toStringSafe(summary.totalShares ?? summary.total_shares ?? '0');
  const status = summary.status ?? null;
  const isActive = parseBool(summary.isActive, status ? status === 'active' : undefined);
  const isFinalized = parseBool(summary.isFinalized, status ? status === 'finalized' : undefined);
  const endDate = summary.endDate ?? summary.end_date ?? null;
  const endTimestamp = endDate ? new Date(endDate).getTime() : null;
  const goalNumber = parseFloat(goal) || 0;
  const raisedNumber = parseFloat(raised) || 0;
  const sharePriceNumber = parseFloat(sharePrice) || 0;
  const investors = Number.parseInt(sharesSold, 10);
  const progress = goalNumber > 0 ? (raisedNumber / goalNumber) * 100 : 0;

  return {
    ...summary,
    address: summary.address,
    id: summary.address,
    name: summary.name,
    symbol: summary.symbol,
    goal,
    raised,
    sharePrice,
    share_price: sharePrice,
    sharesSold,
    totalShares,
    targetAmount: goal,
    fundsRaised: raised,
    status,
    isActive: isActive ?? false,
    isFinalized: isFinalized ?? false,
    endDate,
    metadataUri: summary.metadataUri ?? summary.metadata_uri ?? null,
    category: summary.category,
    sector: summary.sector ?? summary.category ?? 'General',
    logo: summary.logo,
    currentRound: summary.currentRound ?? summary.roundNumber ?? 0,
    roundNumber: summary.roundNumber ?? summary.currentRound ?? 0,
    nftPrice: sharePrice,
    nftTotal: sharePriceNumber > 0 ? Math.floor(goalNumber / sharePriceNumber) : 0,
    timeRemaining: endTimestamp ? Math.max(0, endTimestamp - Date.now()) : 0,
    investors: Number.isFinite(investors) ? investors : 0,
    progressPercentage: progress,
    isPromoted: summary.isPromoted ?? false,
    promotionType: summary.promotionType ?? null,
  };
};

const toUnixSeconds = (value) => {
  if (!value) {
    return Math.floor(Date.now() / 1000);
  }

  if (typeof value === 'number') {
    return value > 1e12 ? Math.floor(value / 1000) : Math.floor(value);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return Math.floor(Date.now() / 1000);
  }

  return Math.floor(date.getTime() / 1000);
};

const ensureNumber = (value, fallback = 0) => {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const asString = value.toString?.() ?? '';
  const parsed = Number.parseInt(asString, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBigIntSafe = (value) => {
  if (value === null || value === undefined) return 0n;
  if (typeof value === 'bigint') return value;

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return 0n;
    return BigInt(Math.trunc(value));
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return 0n;
    try {
      if (trimmed.startsWith('0x') || trimmed.startsWith('-0x')) {
        return BigInt(trimmed);
      }
      return BigInt(trimmed);
    } catch (error) {
      return 0n;
    }
  }

  if (typeof value === 'object' && value !== null) {
    if (typeof value.toString === 'function') {
      return toBigIntSafe(value.toString());
    }
    if (value._isBigNumber && typeof value.toHexString === 'function') {
      return toBigIntSafe(value.toHexString());
    }
  }

  return 0n;
};

const normalizeInvestmentStruct = (raw) => {
  if (!raw) return null;

  try {
    const shares = toBigIntSafe(raw.shares).toString();
    const amount = toBigIntSafe(raw.amount).toString();
    const timestampValue = raw.timestamp?.toString?.() ?? raw.timestamp;
    const timestamp = ensureNumber(timestampValue, Math.floor(Date.now() / 1000));
    const roundNumber = raw.roundNumber?.toString?.() ?? raw.roundNumber ?? '0';
    const tokenIds = Array.isArray(raw.tokenIds)
      ? raw.tokenIds.map((tokenId) => tokenId?.toString?.() ?? `${tokenId}`)
      : [];

    return {
      shares,
      amount,
      timestamp,
      roundNumber,
      tokenIds,
    };
  } catch (error) {
    console.warn('Failed to normalize investment struct:', error);
    return null;
  }
};

const normalizeDocumentRow = (row = {}) => {
  if (!row) return null;

  const hash = row.ipfs_hash || row.hash || row.cid || null;
  const name = row.name || row.document_name || row.title || 'Document';
  const category = row.category || row.type || 'other';
  const description = row.description || row.details || '';
  const url = row.url || row.download_url || (hash ? `https://ipfs.io/ipfs/${hash}` : null);
  const isVerified = Boolean(row.is_verified ?? row.verified ?? false);
  const isPublic = Boolean(row.is_public ?? row.public ?? true);
  const uploadedBy = row.uploaded_by || row.owner || row.creator || null;
  const size = row.size ?? row.file_size ?? row.size_bytes ?? row.bytes ?? null;
  const rawTimestamp = row.timestamp || row.created_at || row.createdAt || row.updated_at || row.updatedAt;
  const timestamp = toUnixSeconds(rawTimestamp);

  const identifier = row.id
    || row.document_id
    || row.uuid
    || (row.campaign_address && hash ? `${row.campaign_address}_${hash}` : null)
    || (hash ? `doc_${hash}` : `doc_${Date.now()}`);

  return {
    id: identifier,
    campaignAddress: row.campaign_address || row.address || null,
    name,
    description,
    category,
    hash,
    url,
    isVerified,
    isPublic,
    uploadedBy,
    size,
    timestamp,
    metadata: row.metadata || row.extra || null,
  };
};

const getDocumentStorageKey = (address) => `livar_campaign_documents_${address}`;

const readLocalDocuments = (address) => {
  if (typeof window === 'undefined' || !address) {
    return [];
  }

  try {
    const stored = window.localStorage?.getItem(getDocumentStorageKey(address));
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeDocumentRow)
      .filter(Boolean);
  } catch (error) {
    console.warn('Error reading cached documents from localStorage:', error);
    return [];
  }
};

const writeLocalDocuments = (address, documents) => {
  if (typeof window === 'undefined' || !address) {
    return;
  }

  try {
    window.localStorage?.setItem(
      getDocumentStorageKey(address),
      JSON.stringify(documents ?? [])
    );
  } catch (error) {
    console.warn('Error writing cached documents to localStorage:', error);
  }
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
    this.documentStore = new Map();
    this.investmentStore = new Map();

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


  async fetchJsonFromApi(path, options = {}) {
    const { method = 'GET', headers, ...rest } = options;
    const init = {
      method,
      ...rest,
    };

    if (headers) {
      init.headers = headers;
    }

    const response = await fetch(path, init);
    if (!response.ok) {
      const message = await response.text().catch(() => response.statusText);
      throw new Error(`[API] ${path} failed (${response.status}): ${message}`);
    }

    return response.json();
  }

  formatEthValue(value, precision = 4, decimals = 18) {
    const bigValue = toBigIntSafe(value);
    const divisor = 10n ** BigInt(decimals);
    const isNegative = bigValue < 0n;
    const absValue = isNegative ? -bigValue : bigValue;

    if (precision < 0) {
      precision = 0;
    }

    const integerPart = absValue / divisor;
    const remainder = absValue % divisor;

    if (precision === 0 || remainder === 0n) {
      const intStr = integerPart.toString();
      return isNegative ? `-${intStr}` : intStr;
    }

    const scaledRemainder = (remainder * (10n ** BigInt(precision))) / divisor;
    let fraction = scaledRemainder.toString().padStart(precision, '0');
    fraction = fraction.replace(/0+$/, '');

    const result = fraction.length > 0
      ? `${integerPart.toString()}.${fraction}`
      : integerPart.toString();

    return isNegative ? `-${result}` : result;
  }

  parseEthValue(value, decimals = 18) {
    if (value === null || value === undefined) {
      return '0';
    }

    if (typeof value === 'bigint') {
      return value.toString();
    }

    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        return '0';
      }
      value = value.toString();
    }

    if (typeof value !== 'string') {
      value = value.toString?.() ?? '';
    }

    const trimmed = value.trim();
    if (trimmed === '') {
      return '0';
    }

    if (trimmed.startsWith('0x') || trimmed.startsWith('-0x')) {
      try {
        return BigInt(trimmed).toString();
      } catch (error) {
        return '0';
      }
    }

    const negative = trimmed.startsWith('-');
    const unsigned = negative ? trimmed.slice(1) : trimmed;
    const [integerPartRaw, fractionRaw = ''] = unsigned.split('.');

    const safeInteger = integerPartRaw.replace(/[^0-9]/g, '') || '0';
    const safeFraction = fractionRaw.replace(/[^0-9]/g, '');

    if (safeFraction.length === 0) {
      const normalized = safeInteger.replace(/^0+/, '') || '0';
      return negative ? `-${normalized}` : normalized;
    }

    const paddedFraction = (safeFraction + '0'.repeat(decimals)).slice(0, decimals);
    const combined = (safeInteger + paddedFraction).replace(/^0+/, '') || '0';
    return negative ? `-${combined}` : combined;
  }

  async initializeWeb3() {
    const { ethers } = await import('ethers');

    const coinbaseRpcFromApiKey = process.env.NEXT_PUBLIC_CDP_CLIENT_API_KEY
      ? `https://api.developer.coinbase.com/rpc/v1/base-sepolia/${process.env.NEXT_PUBLIC_CDP_CLIENT_API_KEY}`
      : null;
    const coinbaseRpcFromProject = process.env.NEXT_PUBLIC_CDP_PROJECT_ID
      ? `https://api.developer.coinbase.com/rpc/v1/base-sepolia/${process.env.NEXT_PUBLIC_CDP_PROJECT_ID}`
      : null;

    // Liste de fallback RPC orientée Coinbase
    const rpcUrls = [
      coinbaseRpcFromApiKey,
      coinbaseRpcFromProject,
      'https://sepolia.base.org'
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

    throw new Error('Aucun RPC Coinbase disponible');
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

  async listCampaigns(params = {}, { useCache = true } = {}) {
    const searchParams = new URLSearchParams();

    if (params.creator) {
      searchParams.set('creator', params.creator.toLowerCase());
    }

    if (params.status) {
      searchParams.set('status', params.status);
    }

    const query = searchParams.toString();
    const cacheKey = this.cache.generateKey('api_campaign_list', query || 'all');

    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const url = query ? `/api/campaigns?${query}` : '/api/campaigns';
      const payload = await this.fetchJsonFromApi(url);
      const campaigns = Array.isArray(payload?.campaigns) ? payload.campaigns : [];

      if (useCache) {
        this.cache.set(cacheKey, campaigns, this.cache.defaultTTL);
      }

      return campaigns;
    } catch (error) {
      console.warn('Erreur listCampaigns:', error);
      return [];
    }
  }

  async getCampaignSummary(address, { useCache = true } = {}) {
    if (!address) return null;
    const lower = address.toLowerCase();
    const cacheKey = this.cache.generateKey('api_campaign_summary', lower);

    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const payload = await this.fetchJsonFromApi(`/api/campaigns/${lower}`);
      const campaign = payload?.campaign || null;

      if (campaign && useCache) {
        this.cache.set(cacheKey, campaign, this.cache.defaultTTL);
      }

      return campaign;
    } catch (error) {
      console.warn('Erreur getCampaignSummary:', error);
      return null;
    }
  }

  async getAllCampaigns(useCache = true) {
    const cacheKey = this.cache.generateKey('all_campaigns', 'main');

    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    const apiCampaigns = await this.listCampaigns({}, { useCache: false });
    if (apiCampaigns.length > 0) {
      const addresses = apiCampaigns
        .map((campaign) => campaign.address?.toLowerCase?.() || campaign.address)
        .filter(Boolean);
      if (addresses.length > 0) {
        this.cache.set(cacheKey, addresses, this.cache.defaultTTL);
        return addresses;
      }
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

    const summary = await this.getCampaignSummary(campaignAddress, { useCache });
    if (summary) {
      const normalized = normalizeCampaignSummary(summary);
      if (normalized) {
        this.cache.set(cacheKey, normalized, this.cache.defaultTTL);
        return normalized;
      }
    }

    // Circuit breaker check pour les appels on-chain
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

  async getUserInvestments(userAddress, { useCache = true } = {}) {
    if (!userAddress) {
      return [];
    }

    const lower = userAddress.toLowerCase();
    const cacheKey = this.cache.generateKey('user_investments', lower);

    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    let campaignAddresses = [];
    try {
      campaignAddresses = await this.getAllCampaigns();
    } catch (error) {
      console.warn('Error fetching campaigns for user investments:', error?.message || error);
    }

    if (!Array.isArray(campaignAddresses) || campaignAddresses.length === 0) {
      const fallback = this.investmentStore.get(lower) || [];
      return fallback;
    }

    const investmentsByCampaign = [];

    for (const campaignAddress of campaignAddresses) {
      if (!campaignAddress) continue;

      try {
        const campaign = await this.getContract('Campaign', campaignAddress);
        if (!campaign || typeof campaign.getInvestments !== 'function') {
          continue;
        }

        let investmentsRaw;
        try {
          investmentsRaw = await Promise.race([
            campaign.getInvestments(lower),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout getInvestments')), 6000)),
          ]);
        } catch (error) {
          console.warn(`Error calling getInvestments for ${campaignAddress}:`, error?.message || error);
          continue;
        }

        const normalizedInvestments = (investmentsRaw || [])
          .map(normalizeInvestmentStruct)
          .filter(Boolean);

        if (normalizedInvestments.length === 0) {
          continue;
        }

        const campaignData = await this.getCampaignData(campaignAddress);

        const totalShares = normalizedInvestments.reduce(
          (acc, investment) => acc + toBigIntSafe(investment.shares),
          0n,
        );
        const totalInvested = normalizedInvestments.reduce(
          (acc, investment) => acc + toBigIntSafe(investment.amount),
          0n,
        );

        investmentsByCampaign.push({
          campaignAddress,
          campaignName: campaignData?.name || campaignData?.symbol || campaignAddress,
          campaignSymbol: campaignData?.symbol || null,
          totalShares: totalShares.toString(),
          totalInvested: totalInvested.toString(),
          investments: normalizedInvestments,
          updatedAt: Math.floor(Date.now() / 1000),
        });
      } catch (error) {
        console.warn(`Error processing user investments for ${campaignAddress}:`, error?.message || error);
      }
    }

    if (investmentsByCampaign.length === 0) {
      const fallback = this.investmentStore.get(lower) || [];
      return fallback;
    }

    this.cache.set(cacheKey, investmentsByCampaign, this.cache.defaultTTL);
    this.investmentStore.set(lower, investmentsByCampaign);

    return investmentsByCampaign;
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

  async getCampaignTransactions(campaignAddress, options = {}) {
    if (!campaignAddress) return [];

    if (typeof options === 'boolean') {
      options = { useCache: options };
    }

    const { useCache = true, limit } = options || {};
    const lower = campaignAddress.toLowerCase();
    const cacheKey = this.cache.generateKey(
      'campaign_transactions',
      limit ? `${lower}_limit_${limit}` : lower,
    );

    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    const searchParams = new URLSearchParams();
    if (limit) {
      const parsed = Number.parseInt(limit, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        searchParams.set('limit', String(parsed));
      }
    }

    try {
      const url = searchParams.size > 0
        ? `/api/campaigns/${lower}/transactions?${searchParams.toString()}`
        : `/api/campaigns/${lower}/transactions`;

      const payload = await this.fetchJsonFromApi(url);
      const transactions = Array.isArray(payload?.transactions) ? payload.transactions : [];

      if (useCache) {
        this.cache.set(cacheKey, transactions, this.cache.defaultTTL);
      }
      return transactions;
    } catch (apiError) {
      console.warn('Erreur API getCampaignTransactions:', apiError.message || apiError);
    }

    try {
      const campaign = await this.getContract('Campaign', campaignAddress);
      const filter = campaign.filters.SharesPurchased();

      let events;
      try {
        events = await Promise.race([
          campaign.queryFilter(filter),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout RPC')), 5000))
        ]);
      } catch (rpcError) {
        console.warn('RPC principal échoué, tentative fallback:', rpcError.message);
        const emptyResult = [];
        this.cache.set(cacheKey, emptyResult, 30000);
        return emptyResult;
      }

      const transactions = events.map(event => ({
        hash: event.transactionHash,
        blockNumber: event.blockNumber,
        investor: event.args.investor,
        amount: event.args.amount.toString(),
        shares: event.args.shares.toString(),
        timestamp: event.args.timestamp.toString(),
      }));

      if (useCache) {
        this.cache.set(cacheKey, transactions, this.cache.defaultTTL);
      }
      return transactions;
    } catch (error) {
      console.warn('Erreur fallback getCampaignTransactions:', error.message || error);
      const emptyResult = [];
      this.cache.set(cacheKey, emptyResult, 30000);
      return emptyResult;
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
    if (!campaignAddress) return;
    const lower = campaignAddress.toLowerCase();
    this.cache.invalidate(`api_campaign_summary_${lower}`);
    this.cache.invalidate(`campaign_transactions_${lower}`);
  }

  preloadCampaignDetails(campaignAddress) {
    if (!campaignAddress) return;
    this.cache.preloadOnHover(campaignAddress);
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

  async getCampaignDocuments(campaignAddress, { useCache = true } = {}) {
    if (!campaignAddress) {
      return [];
    }

    const lower = campaignAddress.toLowerCase();
    const cacheKey = this.cache.generateKey('campaign_documents', lower);

    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const supabaseClient = await initSupabase();
      const { data, error } = await supabaseClient
        .from('campaign_documents')
        .select('*')
        .eq('campaign_address', lower)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const documents = (data || [])
        .map(normalizeDocumentRow)
        .filter(Boolean);

      this.cache.set(cacheKey, documents, this.cache.defaultTTL);
      this.documentStore.set(lower, documents);
      writeLocalDocuments(lower, documents);

      return documents;
    } catch (error) {
      console.warn('Error fetching campaign documents:', error);

      const fallbackDocs = this.documentStore.get(lower)
        || readLocalDocuments(lower);

      if (fallbackDocs && fallbackDocs.length > 0) {
        this.cache.set(cacheKey, fallbackDocs, this.cache.defaultTTL);
        this.documentStore.set(lower, fallbackDocs);
        return fallbackDocs;
      }

      return [];
    }
  }

  async addDocument(campaignAddress, ipfsHash, name, options = {}) {
    if (!campaignAddress) {
      throw new Error('campaignAddress is required');
    }

    if (!ipfsHash) {
      throw new Error('ipfsHash is required');
    }

    if (!name) {
      throw new Error('name is required');
    }

    const lower = campaignAddress.toLowerCase();
    const nowSeconds = Math.floor(Date.now() / 1000);

    const baseDocument = normalizeDocumentRow({
      id: options.id,
      campaign_address: lower,
      name,
      document_name: options.documentName,
      description: options.description,
      category: options.category || options.type,
      ipfs_hash: ipfsHash,
      hash: ipfsHash,
      url: options.url,
      download_url: options.downloadUrl,
      is_verified: options.isVerified,
      is_public: options.isPublic,
      uploaded_by: options.uploadedBy,
      file_size: options.size ?? options.fileSize,
      timestamp: nowSeconds,
      metadata: options.metadata,
    });

    let savedDocument = baseDocument;

    try {
      const supabaseClient = await initSupabase();

      const insertPayload = {
        campaign_address: lower,
        name: baseDocument.name,
        description: baseDocument.description,
        category: baseDocument.category,
        ipfs_hash: baseDocument.hash,
        is_public: baseDocument.isPublic,
        is_verified: baseDocument.isVerified,
        file_size: baseDocument.size,
        url: baseDocument.url,
        uploaded_by: baseDocument.uploadedBy,
        metadata: baseDocument.metadata,
      };

      Object.keys(insertPayload).forEach((key) => {
        if (insertPayload[key] === undefined) {
          delete insertPayload[key];
        }
      });

      const { data, error } = await supabaseClient
        .from('campaign_documents')
        .insert([insertPayload])
        .select()
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        const normalized = normalizeDocumentRow(data);
        if (normalized) {
          savedDocument = normalized;
        }
      }
    } catch (error) {
      console.warn('Error adding campaign document:', error);
    }

    const cacheKey = this.cache.generateKey('campaign_documents', lower);
    const existing = this.cache.get(cacheKey)
      || this.documentStore.get(lower)
      || readLocalDocuments(lower)
      || [];

    const updatedDocuments = [
      savedDocument,
      ...existing.filter((doc) => doc && doc.id !== savedDocument.id && doc.hash !== savedDocument.hash),
    ];

    this.cache.set(cacheKey, updatedDocuments, this.cache.defaultTTL);
    this.documentStore.set(lower, updatedDocuments);
    writeLocalDocuments(lower, updatedDocuments);

    return savedDocument;
  }

  getCacheStats() {
    if (!this.cache || typeof this.cache.getCacheStats !== 'function') {
      return {
        totalEntries: 0,
        totalHits: 0,
        typeStats: {},
        isPreloading: false,
        queueSize: 0
      };
    }

    return this.cache.getCacheStats();
  }
}

// Instance singleton
export const apiManager = new ApiManager();
export default apiManager;
