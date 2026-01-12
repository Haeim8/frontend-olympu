/**
 * =============================================================================
 * CONFIGURATION CENTRALISÉE - LIVAR
 * =============================================================================
 * 
 * Ce fichier est le SEUL point de configuration pour toute l'application.
 * Tout est chargé depuis les variables d'environnement (.env / .env.local)
 * 
 * Plus de Supabase, plus d'IPFS, plus de Web3 storage
 * =============================================================================
 */

// =============================================================================
// CONFIGURATION RÉSEAU BLOCKCHAIN
// =============================================================================

const NETWORKS = {
    baseSepolia: {
        chainId: 84532,
        chainIdHex: '0x14a34',
        name: 'Base Sepolia',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: [
            process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL,
            process.env.NEXT_PUBLIC_CDP_CLIENT_API_KEY
                ? `https://api.developer.coinbase.com/rpc/v1/base-sepolia/${process.env.NEXT_PUBLIC_CDP_CLIENT_API_KEY}`
                : null,
            'https://sepolia.base.org',
        ].filter(Boolean),
        blockExplorerUrls: ['https://sepolia.basescan.org'],
    },
    baseMainnet: {
        chainId: 8453,
        chainIdHex: '0x2105',
        name: 'Base',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: [
            process.env.NEXT_PUBLIC_BASE_RPC_URL,
            'https://mainnet.base.org',
        ].filter(Boolean),
        blockExplorerUrls: ['https://basescan.org'],
    },
};

const ACTIVE_NETWORK = process.env.NEXT_PUBLIC_NETWORK || 'baseSepolia';

// =============================================================================
// ADRESSES DES CONTRATS (depuis .env)
// =============================================================================

const getContractAddresses = () => ({
    DivarProxy: process.env.NEXT_PUBLIC_DIVAR_PROXY_ADDRESS || null,
    CampaignKeeper: process.env.NEXT_PUBLIC_CAMPAIGN_KEEPER_ADDRESS || null,
    PriceConsumerV3: process.env.NEXT_PUBLIC_PRICE_CONSUMER_ADDRESS || null,
    RecPromotionManager: process.env.NEXT_PUBLIC_REC_PROMOTION_MANAGER_ADDRESS || null,
});

// =============================================================================
// CONFIGURATION POSTGRESQL
// =============================================================================

const getPostgresConfig = () => ({
    url: process.env.DATABASE_URL || null,
    isConfigured: Boolean(process.env.DATABASE_URL),
});

// =============================================================================
// CONFIGURATION REDIS
// =============================================================================

const getRedisConfig = () => ({
    url: process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL || null,
    token: process.env.REDIS_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || null,
    isConfigured: Boolean(
        process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL
    ),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'livar:',
    ttl: {
        default: parseInt(process.env.REDIS_TTL_DEFAULT || '60', 10),
        short: parseInt(process.env.REDIS_TTL_SHORT || '30', 10),
        long: parseInt(process.env.REDIS_TTL_LONG || '300', 10),
        campaigns: parseInt(process.env.REDIS_TTL_CAMPAIGNS || '120', 10),
        transactions: parseInt(process.env.REDIS_TTL_TRANSACTIONS || '60', 10),
    },
});

// =============================================================================
// CONSTANTES
// =============================================================================

const APP_CONSTANTS = {
    SUPPORTED_LANGUAGES: ['fr', 'en', 'es', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar'],
    DEFAULT_LANGUAGE: 'fr',
    CAMPAIGN_CATEGORIES: ['Tech', 'Finance', 'DeFi', 'Gaming', 'NFT', 'Blockchain', 'Infrastructure', 'Industry', 'Other'],
    BOOST_TYPES: { FEATURED: 'featured', TRENDING: 'trending', SPOTLIGHT: 'spotlight' },
};

// =============================================================================
// EXPORT
// =============================================================================

const config = {
    activeNetwork: ACTIVE_NETWORK,

    get network() {
        return NETWORKS[ACTIVE_NETWORK] || NETWORKS.baseSepolia;
    },

    networks: NETWORKS,

    get contracts() {
        return getContractAddresses();
    },

    get postgres() {
        return getPostgresConfig();
    },

    get redis() {
        return getRedisConfig();
    },

    constants: APP_CONSTANTS,

    helpers: {
        getPrimaryRPC() {
            const network = NETWORKS[ACTIVE_NETWORK];
            return network?.rpcUrls?.[0] || 'https://sepolia.base.org';
        },

        getAllRPCs() {
            const network = NETWORKS[ACTIVE_NETWORK];
            return network?.rpcUrls || ['https://sepolia.base.org'];
        },

        getExplorerTxUrl(txHash) {
            const network = NETWORKS[ACTIVE_NETWORK];
            const baseUrl = network?.blockExplorerUrls?.[0] || 'https://sepolia.basescan.org';
            return `${baseUrl}/tx/${txHash}`;
        },

        getExplorerAddressUrl(address) {
            const network = NETWORKS[ACTIVE_NETWORK];
            const baseUrl = network?.blockExplorerUrls?.[0] || 'https://sepolia.basescan.org';
            return `${baseUrl}/address/${address}`;
        },
    },
};

export default config;
export { NETWORKS, APP_CONSTANTS, ACTIVE_NETWORK };
export const getContractAddress = (name) => config.contracts[name];
