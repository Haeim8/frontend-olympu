/**
 * Service pour récupérer et parser les métadonnées IPFS
 */

const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/'
];

// Cache IPFS en mémoire (évite les appels répétés)
const ipfsCache = new Map();
const IPFS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Récupère les données depuis IPFS avec fallback sur plusieurs gateways
 */
async function fetchFromIPFS(ipfsUri, gatewayIndex = 0) {
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

  if (gatewayIndex >= IPFS_GATEWAYS.length) {
    throw new Error('All IPFS gateways failed');
  }

  // Essayer d'abord campaign-data.json (cas répertoire)
  const metadataUrl = `${IPFS_GATEWAYS[gatewayIndex]}${hash}/campaign-data.json`;
  const directUrl = `${IPFS_GATEWAYS[gatewayIndex]}${hash}`;

  try {
    console.log(`[IPFS] Trying metadata file: ${metadataUrl}`);

    const response = await fetch(metadataUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 🔥 5s timeout (au lieu de 10s)
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`[IPFS] ✅ Fetched campaign-data.json from gateway ${gatewayIndex}`);

      // 2️⃣ METTRE EN CACHE
      ipfsCache.set(cacheKey, { data, timestamp: Date.now() });

      return data;
    }

    // Si campaign-data.json n'existe pas, essayer le hash direct (fallback)
    console.log(`[IPFS] campaign-data.json not found, trying direct: ${directUrl}`);
    const directResponse = await fetch(directUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 🔥 5s timeout
    });

    if (!directResponse.ok) {
      throw new Error(`HTTP ${directResponse.status}`);
    }

    const data = await directResponse.json();
    console.log(`[IPFS] ✅ Fetched successfully from gateway ${gatewayIndex}`);

    // 2️⃣ METTRE EN CACHE
    ipfsCache.set(cacheKey, { data, timestamp: Date.now() });

    return data;

  } catch (error) {
    console.warn(`[IPFS] ⚠️ Gateway ${gatewayIndex} failed:`, error.message);

    // Essayer le gateway suivant
    return fetchFromIPFS(ipfsUri, gatewayIndex + 1);
  }
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
 * Récupère les métadonnées complètes d'une campagne (IPFS + Supabase)
 */
export async function getCampaignMetadata(campaign) {
  console.log('[IPFS] 🔍 getCampaignMetadata called with campaign:', {
    address: campaign.address,
    name: campaign.name,
    metadata_uri: campaign.metadata_uri,
    metadataUri: campaign.metadataUri,
    nft_logo_url: campaign.nft_logo_url,
    nft_background_color: campaign.nft_background_color,
    allKeys: Object.keys(campaign)
  });

  const result = {
    ipfs: null,
    documents: [],
    error: null
  };

  // 1. Charger les métadonnées IPFS si metadata_uri existe ET est un hash IPFS valide
  const metadataUri = campaign.metadata_uri || campaign.metadataUri;
  console.log('[IPFS] 🔍 Extracted metadataUri:', metadataUri);

  const isValidIPFS = metadataUri && (
    metadataUri.startsWith('ipfs://') ||
    metadataUri.startsWith('Qm') ||
    metadataUri.startsWith('bafy')
  );
  console.log('[IPFS] 🔍 Is valid IPFS URI?', isValidIPFS);

  if (isValidIPFS) {
    try {
      const ipfsData = await fetchFromIPFS(metadataUri);
      result.ipfs = parseCampaignMetadata(ipfsData);

      console.log('[IPFS] ✅ Metadata parsed:', result.ipfs);
    } catch (error) {
      console.warn('[IPFS] ⚠️ Failed to load metadata from IPFS:', error.message);
      result.error = error.message;

      // Créer une structure minimale même en cas d'erreur
      result.ipfs = {
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
          image: (campaign.nft_logo_url && campaign.nft_logo_url !== '') ? campaign.nft_logo_url : campaign.logo || '',
          backgroundColor: (campaign.nft_background_color && campaign.nft_background_color !== '') ? campaign.nft_background_color : '#0f172a',
          textColor: (campaign.nft_text_color && campaign.nft_text_color !== '') ? campaign.nft_text_color : '#FFFFFF',
          attributes: [
            { trait_type: 'Category', value: campaign.category || 'General' },
            { trait_type: 'Status', value: campaign.status || 'unknown' },
            { trait_type: 'Round', value: campaign.current_round || 1 },
          ],
        }
      };
    }
  } else {
    // Pas de metadata_uri valide, créer une structure minimale à partir des données DB
    console.log('[IPFS] ℹ️ No valid IPFS metadata_uri, using database values');
    console.log('[IPFS] 🔍 Database fallback - campaign data:', {
      name: campaign.name,
      description: campaign.description,
      logo: campaign.logo,
      category: campaign.category,
      nft_logo_url: campaign.nft_logo_url,
      nft_background_color: campaign.nft_background_color,
      nft_text_color: campaign.nft_text_color
    });

    result.ipfs = {
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
        image: (campaign.nft_logo_url && campaign.nft_logo_url !== '') ? campaign.nft_logo_url : campaign.logo || '',
        backgroundColor: (campaign.nft_background_color && campaign.nft_background_color !== '') ? campaign.nft_background_color : '#0f172a',
        textColor: (campaign.nft_text_color && campaign.nft_text_color !== '') ? campaign.nft_text_color : '#FFFFFF',
        attributes: [
          { trait_type: 'Category', value: campaign.category || 'General' },
          { trait_type: 'Status', value: campaign.status || 'unknown' },
          { trait_type: 'Round', value: campaign.current_round || 1 },
        ],
      }
    };
    console.log('[IPFS] 🔍 Created fallback structure:', result.ipfs);
  }

  // 2. Charger les documents depuis Supabase (ajoutés via le frontend)
  try {
    // ❌ DÉSACTIVÉ - API /api/campaigns/documents n'existe pas
    console.log('[IPFS] ⚠️ Supabase documents disabled (API route missing)');
    const supabaseDocs = []; // Vide pour éviter l'erreur 404

    console.log('[IPFS] 📄 Supabase documents loaded:', supabaseDocs);

    if (Array.isArray(supabaseDocs) && supabaseDocs.length > 0) {
      result.documents = supabaseDocs;

      // Structurer les documents par type pour l'affichage
      if (result.ipfs) {
        // Initialiser la structure de documents
        if (!result.ipfs.documents || Array.isArray(result.ipfs.documents)) {
          result.ipfs.documents = {
            whitepaper: [],
            pitchDeck: [],
            legalDocuments: [],
            media: []
          };
        }

        // Organiser les documents par catégorie
        supabaseDocs.forEach(doc => {
          // Déterminer le type de fichier
          const fileName = doc.name || doc.document_name || '';
          const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
          const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExt);
          const isVideo = ['mp4', 'webm', 'mov', 'avi'].includes(fileExt);

          const docData = {
            name: doc.name || doc.document_name || 'Document',
            url: doc.url || `https://ipfs.io/ipfs/${doc.hash}`,
            ipfsHash: doc.hash,
            type: isImage ? `image/${fileExt}` : isVideo ? `video/${fileExt}` : 'application/pdf',
            fileName: fileName,
            size: doc.size,
            category: doc.category,
            isVerified: doc.isVerified,
            uploadedAt: doc.timestamp,
          };

          console.log('[IPFS] 📝 Processing document:', {
            name: docData.name,
            category: doc.category,
            url: docData.url
          });

          // Mapper la catégorie au bon type de document
          const category = (doc.category || '').toLowerCase();

          if (category === 'whitepaper' || category === 'legal') {
            result.ipfs.documents.whitepaper.push(docData);
            console.log('[IPFS] ✅ Added to whitepaper');
          } else if (category === 'financial' || category === 'pitch' || category === 'pitchdeck') {
            result.ipfs.documents.pitchDeck.push(docData);
            console.log('[IPFS] ✅ Added to pitchDeck');
          } else if (category === 'technical' || category === 'marketing') {
            result.ipfs.documents.legalDocuments.push(docData);
            console.log('[IPFS] ✅ Added to legalDocuments');
          } else if (isImage || isVideo || category === 'media') {
            result.ipfs.documents.media.push(docData);
            console.log('[IPFS] ✅ Added to media');
          } else {
            // Par défaut, mettre dans legal documents
            result.ipfs.documents.legalDocuments.push(docData);
            console.log('[IPFS] ✅ Added to legalDocuments (default)');
          }
        });

        console.log('[IPFS] 📊 Documents organized:', {
          whitepaper: result.ipfs.documents.whitepaper.length,
          pitchDeck: result.ipfs.documents.pitchDeck.length,
          legalDocuments: result.ipfs.documents.legalDocuments.length,
          media: result.ipfs.documents.media.length
        });
      }
    } else {
      console.log('[IPFS] ℹ️ No documents found in Supabase for campaign:', campaign.address);
    }
  } catch (error) {
    console.error('[IPFS] ❌ Failed to load Supabase documents:', error);
  }

  console.log('[IPFS] 🔍 Final result to return:', {
    hasIpfs: !!result.ipfs,
    documentsCount: result.documents.length,
    error: result.error,
    ipfsStructure: result.ipfs ? {
      hasName: !!result.ipfs.name,
      hasDescription: !!result.ipfs.description,
      hasNft: !!result.ipfs.nft,
      documentsCount: result.ipfs.documents?.length || 0
    } : null
  });

  return result;
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
