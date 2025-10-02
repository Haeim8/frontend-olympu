/**
 * Service pour récupérer et parser les métadonnées IPFS
 * Utilise l'API route /api/ipfs/[hash] côté serveur pour de meilleures performances
 */

// Gateways IPFS optimisés pour Web3.Storage (ordre de priorité basé sur diagnostic)
const IPFS_GATEWAYS = [
  'https://w3s.link/ipfs/',           // Web3.Storage - priorité 1 (détecté par diag)
  'https://dag.w3s.link/ipfs/',       // Web3.Storage DAG - priorité 2 (détecté par diag)
  'https://dweb.link/ipfs/',          // IPFS Foundation
  'https://4everland.io/ipfs/',       // 4everland CDN
  'https://ipfs.io/ipfs/',            // IPFS.io (fallback)
  'https://gateway.pinata.cloud/ipfs/' // Pinata (fallback)
];

// Cache IPFS en mémoire (évite les appels répétés)
const ipfsCache = new Map();
const IPFS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Récupère les données depuis IPFS avec fallback sur plusieurs stratégies
 */
async function fetchFromIPFS(ipfsUri) {
  if (!ipfsUri) {
    throw new Error('IPFS URI is required');
  }

  // Extraire le hash IPFS
  const hash = ipfsUri.replace('ipfs://', '').replace(/^\/+/, '');

  // 1️⃣ CHECK CACHE EN PREMIER
  const cacheKey = `ipfs_${hash}`;
  const cached = ipfsCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < IPFS_CACHE_TTL) {
    console.log(`[IPFS] ✅ Cache hit for ${hash.substring(0, 10)}...`);
    return cached.data;
  }

  // 2️⃣ STRATÉGIE 1: Utiliser l'API route Next.js (meilleure perf sur Vercel)
  try {
    console.log(`[IPFS] 🚀 Trying API route for ${hash.substring(0, 10)}...`);

    const apiResponse = await fetch(`/api/ipfs/${hash}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000), // 15s timeout pour l'API
    });

    if (apiResponse.ok) {
      const data = await apiResponse.json();
      console.log(`[IPFS] ✅ Success via API route`);

      // Mettre en cache
      ipfsCache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } else {
      console.warn(`[IPFS] ⚠️ API route failed with status ${apiResponse.status}`);
    }
  } catch (error) {
    console.warn(`[IPFS] ⚠️ API route failed:`, error.message);
  }

  // 3️⃣ STRATÉGIE 2: Fallback direct aux gateways IPFS
  console.log(`[IPFS] 🔄 Falling back to direct gateways...`);

  for (let i = 0; i < IPFS_GATEWAYS.length; i++) {
    const gateway = IPFS_GATEWAYS[i];
    const metadataUrl = `${gateway}${hash}/campaign-data.json`;
    const directUrl = `${gateway}${hash}`;

    try {
      console.log(`[IPFS] Trying gateway ${i}: ${metadataUrl}`);

      const response = await fetch(metadataUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000), // 8s timeout
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[IPFS] ✅ Success with gateway ${i}`);

        // Mettre en cache
        ipfsCache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      }

      // Fallback: essayer le hash direct
      console.log(`[IPFS] Trying direct URL: ${directUrl}`);
      const directResponse = await fetch(directUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      });

      if (directResponse.ok) {
        const data = await directResponse.json();
        console.log(`[IPFS] ✅ Success with direct URL on gateway ${i}`);

        // Mettre en cache
        ipfsCache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      }

    } catch (error) {
      console.warn(`[IPFS] ⚠️ Gateway ${i} failed:`, error.message);
      // Continue to next gateway
    }
  }

  // Tous les gateways ont échoué
  throw new Error('All IPFS gateways failed');
}

/**
 * Parse et normalise les métadonnées d'une campagne
 */
function parseCampaignMetadata(metadata) {
  if (!metadata) return null;

  return {
    // Informations de base
    name: metadata.name || '',
    description: metadata.description || '',
    shortDescription: metadata.shortDescription || metadata.description?.substring(0, 200) || '',

    // Images
    logo: metadata.logo || metadata.image || '',
    banner: metadata.banner || metadata.coverImage || '',

    // Équipe
    teamMembers: Array.isArray(metadata.teamMembers) ? metadata.teamMembers : [],

    // Réseaux sociaux
    socials: {
      website: metadata.website || metadata.socials?.website || '',
      twitter: metadata.twitter || metadata.socials?.twitter || '',
      github: metadata.github || metadata.socials?.github || '',
      discord: metadata.discord || metadata.socials?.discord || '',
      telegram: metadata.telegram || metadata.socials?.telegram || '',
      medium: metadata.medium || metadata.socials?.medium || '',
      linkedin: metadata.linkedin || metadata.socials?.linkedin || '',
    },

    // Documents
    documents: metadata.documents || {},

    // Roadmap
    roadmap: Array.isArray(metadata.roadmap) ? metadata.roadmap : [],
    milestones: Array.isArray(metadata.milestones) ? metadata.milestones : [],

    // Informations supplémentaires
    category: metadata.category || '',
    sector: metadata.sector || '',
    tags: Array.isArray(metadata.tags) ? metadata.tags : [],

    // NFT
    nft: {
      name: metadata.nftName || metadata.name || '',
      description: metadata.nftDescription || metadata.description || '',
      image: metadata.nftImage || metadata.logo || '',
      backgroundColor: metadata.nftBackgroundColor || '#0f172a',
      textColor: metadata.nftTextColor || '#FFFFFF',
      attributes: Array.isArray(metadata.nftAttributes) ? metadata.nftAttributes : [],
    },

    // Métadonnées brutes pour debug
    raw: metadata
  };
}

/**
 * Récupère les métadonnées complètes d'une campagne (IPFS uniquement)
 * ⚠️ PAS DE SUPABASE - Tout est stocké sur IPFS
 */
export async function getCampaignMetadata(campaign) {
  console.log('[IPFS] 🔍 getCampaignMetadata called for:', campaign.address);

  const result = {
    ipfs: null,
    documents: [],
    error: null
  };

  // Charger les métadonnées IPFS si metadata_uri existe
  const metadataUri = campaign.metadata_uri || campaign.metadataUri;

  const isValidIPFS = metadataUri && (
    metadataUri.startsWith('ipfs://') ||
    metadataUri.startsWith('Qm') ||
    metadataUri.startsWith('bafy')
  );

  if (isValidIPFS) {
    try {
      const ipfsData = await fetchFromIPFS(metadataUri);
      result.ipfs = parseCampaignMetadata(ipfsData);
      console.log('[IPFS] ✅ Metadata loaded successfully');
    } catch (error) {
      console.warn('[IPFS] ⚠️ Failed to load metadata from IPFS:', error.message);
      result.error = error.message;

      // Créer une structure minimale en cas d'erreur
      result.ipfs = createFallbackMetadata(campaign);
    }
  } else {
    // Pas de metadata_uri valide, créer une structure minimale
    console.log('[IPFS] ℹ️ No valid IPFS metadata_uri, using fallback');
    result.ipfs = createFallbackMetadata(campaign);
  }

  return result;
}

/**
 * Crée une structure de métadonnées minimale à partir des données blockchain
 */
function createFallbackMetadata(campaign) {
  return {
    name: campaign.name || '',
    description: campaign.description || 'Description non disponible',
    shortDescription: campaign.description ? campaign.description.substring(0, 200) : '',
    logo: campaign.logo || '',
    banner: '',
    teamMembers: [],
    socials: {},
    documents: {
      whitepaper: [],
      pitchDeck: [],
      legalDocuments: [],
      media: []
    },
    roadmap: [],
    milestones: [],
    category: campaign.category || '',
    sector: campaign.sector || campaign.category || '',
    tags: campaign.category ? [campaign.category] : [],
    nft: {
      name: campaign.name || '',
      description: campaign.description || '',
      image: campaign.nft_logo_url || campaign.logo || '',
      backgroundColor: campaign.nft_background_color || '#0f172a',
      textColor: campaign.nft_text_color || '#FFFFFF',
      attributes: [
        { trait_type: 'Category', value: campaign.category || 'General' },
        { trait_type: 'Status', value: campaign.status || 'unknown' },
        { trait_type: 'Round', value: campaign.current_round || 1 },
      ],
    }
  };
}

/**
 * Génère l'URL d'affichage pour un hash IPFS
 */
export function getIPFSUrl(hash, gatewayIndex = 0) {
  if (!hash) return '';
  const cleanHash = hash.replace('ipfs://', '').replace(/^\/+/, '');
  return `${IPFS_GATEWAYS[gatewayIndex]}${cleanHash}`;
}

/**
 * Vérifie si une URL est une URL IPFS
 */
export function isIPFSUrl(url) {
  if (!url) return false;
  return url.startsWith('ipfs://') || url.includes('/ipfs/');
}

/**
 * Convertit une URL IPFS en URL HTTP
 */
export function ipfsToHttp(url, gatewayIndex = 0) {
  if (!url) return '';
  if (!isIPFSUrl(url)) return url;
  const hash = url.replace('ipfs://', '').replace(/.*\/ipfs\//, '');
  return getIPFSUrl(hash, gatewayIndex);
}
