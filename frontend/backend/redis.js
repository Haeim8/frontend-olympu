/**
 * =============================================================================
 * CLIENT REDIS - LIVAR
 * =============================================================================
 *
 * Client Redis pour le cache scalable et economique
 * Compatible avec Upstash (serverless)
 * Fonctionne en mode degrade si Redis n'est pas configure
 * =============================================================================
 */

import { Redis } from '@upstash/redis';

// Configuration Redis
let redis = null;
let redisInitialized = false;
let redisAvailable = false;

/**
 * Initialiser le client Redis (une seule fois)
 */
function initRedis() {
    if (redisInitialized) return redis;
    redisInitialized = true;

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    // Si pas de configuration Upstash, on fonctionne sans cache
    if (!url || !token) {
        if (process.env.NODE_ENV === 'development') {
            console.log('[Redis] Mode sans cache (Upstash non configure)');
        }
        redisAvailable = false;
        return null;
    }

    try {
        redis = new Redis({ url, token });
        redisAvailable = true;
        console.log('[Redis] Client Upstash initialise');
        return redis;
    } catch (error) {
        console.warn('[Redis] Erreur initialisation:', error.message);
        redisAvailable = false;
        return null;
    }
}

// Préfixe des clés
const PREFIX = process.env.REDIS_KEY_PREFIX || 'livar:';

// TTL par défaut (en secondes)
const TTL = {
    default: parseInt(process.env.REDIS_TTL_DEFAULT || '60', 10),
    short: parseInt(process.env.REDIS_TTL_SHORT || '30', 10),
    long: parseInt(process.env.REDIS_TTL_LONG || '300', 10),
    campaigns: parseInt(process.env.REDIS_TTL_CAMPAIGNS || '120', 10),
    transactions: parseInt(process.env.REDIS_TTL_TRANSACTIONS || '60', 10),
    promotions: parseInt(process.env.REDIS_TTL_PROMOTIONS || '30', 10),
};

/**
 * Générer une clé avec préfixe
 */
function key(name) {
    return `${PREFIX}${name}`;
}

// =============================================================================
// OPÉRATIONS DE BASE
// =============================================================================

/**
 * Recuperer une valeur du cache
 */
export async function get(cacheKey) {
    const client = initRedis();
    if (!client) return null;

    try {
        return await client.get(key(cacheKey));
    } catch {
        return null;
    }
}

/**
 * Stocker une valeur dans le cache
 */
export async function set(cacheKey, value, ttlSeconds = TTL.default) {
    const client = initRedis();
    if (!client) return false;

    try {
        await client.set(key(cacheKey), value, { ex: ttlSeconds });
        return true;
    } catch {
        return false;
    }
}

/**
 * Supprimer une valeur du cache
 */
export async function del(cacheKey) {
    const client = initRedis();
    if (!client) return false;

    try {
        await client.del(key(cacheKey));
        return true;
    } catch {
        return false;
    }
}

/**
 * Verifier si une cle existe
 */
export async function exists(cacheKey) {
    const client = initRedis();
    if (!client) return false;

    try {
        const result = await client.exists(key(cacheKey));
        return result === 1;
    } catch {
        return false;
    }
}

// =============================================================================
// FONCTIONS SPÉCIFIQUES CAMPAGNES
// =============================================================================

export const campaignCache = {
    /**
     * Clé pour la liste des campagnes
     */
    listKey: () => 'campaigns:list',

    /**
     * Clé pour une campagne spécifique
     */
    itemKey: (address) => `campaign:${address?.toLowerCase()}`,

    /**
     * Récupérer la liste des campagnes du cache
     */
    async getList() {
        return await get(this.listKey());
    },

    /**
     * Stocker la liste des campagnes
     */
    async setList(campaigns) {
        return await set(this.listKey(), campaigns, TTL.campaigns);
    },

    /**
     * Récupérer une campagne du cache
     */
    async getOne(address) {
        return await get(this.itemKey(address));
    },

    /**
     * Stocker une campagne
     */
    async setOne(address, campaign) {
        return await set(this.itemKey(address), campaign, TTL.campaigns);
    },

    /**
     * Invalider le cache d'une campagne
     */
    async invalidate(address) {
        await del(this.itemKey(address));
        await del(this.listKey());
    },

    /**
     * Invalider tout le cache des campagnes
     */
    async invalidateAll() {
        await del(this.listKey());
    }
};

// =============================================================================
// FONCTIONS SPÉCIFIQUES TRANSACTIONS
// =============================================================================

export const transactionCache = {
    /**
     * Clé pour les transactions d'une campagne
     */
    key: (campaignAddress) => `transactions:${campaignAddress?.toLowerCase()}`,

    /**
     * Récupérer les transactions du cache
     */
    async get(campaignAddress) {
        return await get(this.key(campaignAddress));
    },

    /**
     * Stocker les transactions
     */
    async set(campaignAddress, transactions) {
        return await set(this.key(campaignAddress), transactions, TTL.transactions);
    },

    /**
     * Invalider le cache des transactions
     */
    async invalidate(campaignAddress) {
        await del(this.key(campaignAddress));
    }
};

// =============================================================================
// FONCTIONS SPÉCIFIQUES PROMOTIONS
// =============================================================================

export const promotionCache = {
    /**
     * Clé pour les promotions actives
     */
    key: () => 'promotions:active',

    /**
     * Récupérer les promotions du cache
     */
    async getActive() {
        return await get(this.key());
    },

    /**
     * Stocker les promotions
     */
    async setActive(promotions) {
        return await set(this.key(), promotions, TTL.promotions);
    },

    /**
     * Invalider le cache des promotions
     */
    async invalidate() {
        await del(this.key());
    }
};

// =============================================================================
// EXPORT
// =============================================================================

export default {
    get,
    set,
    del,
    exists,
    campaignCache,
    transactionCache,
    promotionCache,
    TTL,
};
