/**
 * =============================================================================
 * CLIENT POSTGRESQL - LIVAR
 * =============================================================================
 * 
 * Client PostgreSQL pour remplacer Supabase
 * Utilise pg (node-postgres) pour la connexion
 * =============================================================================
 */

import { Pool } from 'pg';

// Configuration depuis les variables d'environnement avec fallback local
const dbConfig = {
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/livar',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
};

const pool = new Pool(dbConfig);

// Vérification de la connexion au démarrage
pool.on('connect', () => {
    console.log('[PostgreSQL] ✅ Connexion établie');
});

pool.on('error', (err) => {
    console.error('[PostgreSQL] ❌ Erreur de connexion:', err.message);
});

/**
 * Exécuter une requête SQL
 */
export async function query(text, params) {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log(`[PostgreSQL] Requête exécutée en ${duration}ms`);
        return result;
    } catch (error) {
        console.error('[PostgreSQL] Erreur requête:', error.message);
        throw error;
    }
}

/**
 * Obtenir un client pour les transactions
 */
export async function getClient() {
    const client = await pool.connect();
    return client;
}

/**
 * Fermer le pool de connexions
 */
export async function closePool() {
    await pool.end();
}

// =============================================================================
// FONCTIONS CRUD POUR LES CAMPAGNES
// =============================================================================

export const campaigns = {
    /**
     * Récupérer toutes les campagnes
     */
    async getAll(options = {}) {
        const { limit = 50, offset = 0, status, category } = options;

        let sql = 'SELECT * FROM campaigns WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (status) {
            sql += ` AND status = $${paramIndex++}`;
            params.push(status);
        }

        if (category) {
            sql += ` AND category = $${paramIndex++}`;
            params.push(category);
        }

        sql += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, offset);

        const result = await query(sql, params);
        return result.rows;
    },

    /**
     * Récupérer une campagne par adresse
     */
    async getByAddress(address) {
        const result = await query(
            'SELECT * FROM campaigns WHERE address = $1',
            [address.toLowerCase()]
        );
        return result.rows[0] || null;
    },

    /**
     * Créer ou mettre à jour une campagne
     */
    async upsert(campaignData) {
        const {
            address,
            creator,
            name,
            symbol,
            goal,
            raised,
            share_price,
            shares_sold,
            total_shares,
            status,
            is_active,
            is_finalized,
            end_date,
            metadata_uri,
            category,
            logo,
            current_round,
            nft_background_color,
            nft_text_color,
            nft_logo_url,
            nft_sector,
        } = campaignData;

        const sql = `
      INSERT INTO campaigns (
        address, creator, name, symbol, goal, raised, share_price,
        shares_sold, total_shares, status, is_active, is_finalized,
        end_date, metadata_uri, category, logo, current_round,
        nft_background_color, nft_text_color, nft_logo_url, nft_sector,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21, NOW()
      )
      ON CONFLICT (address) DO UPDATE SET
        creator = EXCLUDED.creator,
        name = EXCLUDED.name,
        symbol = EXCLUDED.symbol,
        goal = EXCLUDED.goal,
        raised = EXCLUDED.raised,
        share_price = EXCLUDED.share_price,
        shares_sold = EXCLUDED.shares_sold,
        total_shares = EXCLUDED.total_shares,
        status = EXCLUDED.status,
        is_active = EXCLUDED.is_active,
        is_finalized = EXCLUDED.is_finalized,
        end_date = EXCLUDED.end_date,
        metadata_uri = EXCLUDED.metadata_uri,
        category = EXCLUDED.category,
        logo = EXCLUDED.logo,
        current_round = EXCLUDED.current_round,
        nft_background_color = EXCLUDED.nft_background_color,
        nft_text_color = EXCLUDED.nft_text_color,
        nft_logo_url = EXCLUDED.nft_logo_url,
        nft_sector = EXCLUDED.nft_sector,
        updated_at = NOW()
      RETURNING *
    `;

        const result = await query(sql, [
            address.toLowerCase(), creator?.toLowerCase(), name, symbol, goal, raised,
            share_price, shares_sold, total_shares, status, is_active, is_finalized,
            end_date, metadata_uri, category, logo, current_round,
            nft_background_color, nft_text_color, nft_logo_url, nft_sector
        ]);

        return result.rows[0];
    },

    /**
     * Supprimer une campagne
     */
    async delete(address) {
        await query('DELETE FROM campaigns WHERE address = $1', [address.toLowerCase()]);
    }
};

// =============================================================================
// FONCTIONS CRUD POUR LES TRANSACTIONS
// =============================================================================

export const transactions = {
    /**
     * Récupérer les transactions d'une campagne
     */
    async getByCampaign(campaignAddress, options = {}) {
        const { limit = 100, offset = 0 } = options;

        const result = await query(
            `SELECT * FROM campaign_transactions 
       WHERE campaign_address = $1 
       ORDER BY timestamp DESC 
       LIMIT $2 OFFSET $3`,
            [campaignAddress.toLowerCase(), limit, offset]
        );
        return result.rows;
    },

    /**
     * Ajouter une transaction
     */
    async insert(txData) {
        const {
            tx_hash,
            campaign_address,
            investor,
            amount,
            shares,
            round_number,
            type,
            block_number,
            timestamp,
            commission,
            net_amount,
        } = txData;

        const sql = `
      INSERT INTO campaign_transactions (
        tx_hash, campaign_address, investor, amount, shares,
        round_number, type, block_number, timestamp, commission, net_amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (tx_hash) DO NOTHING
      RETURNING *
    `;

        const result = await query(sql, [
            tx_hash, campaign_address.toLowerCase(), investor?.toLowerCase(),
            amount, shares, round_number, type, block_number, timestamp,
            commission, net_amount
        ]);

        return result.rows[0];
    }
};

// =============================================================================
// FONCTIONS CRUD POUR LES PROMOTIONS
// =============================================================================

export const promotions = {
    /**
     * Récupérer les promotions actives
     */
    async getActivePromotions(includeExpired = false) {
        let sql = 'SELECT * FROM campaign_promotions WHERE 1=1';
        if (!includeExpired) {
            sql += ' AND is_active = true AND end_timestamp > NOW()';
        }
        sql += ' ORDER BY boost_type, created_at DESC';

        const result = await query(sql);
        return result.rows;
    },

    /**
     * Vérifier si une campagne est promue
     */
    async isCampaignBoosted(campaignAddress) {
        const result = await query(
            `SELECT * FROM campaign_promotions 
       WHERE campaign_address = $1 
       AND is_active = true 
       AND end_timestamp > NOW()`,
            [campaignAddress.toLowerCase()]
        );
        return result.rows.length > 0;
    },

    /**
     * Ajouter une promotion
     */
    async insert(promoData) {
        const {
            campaign_address,
            creator,
            boost_type,
            round_number,
            eth_amount,
            start_timestamp,
            end_timestamp,
            tx_hash,
            block_number,
        } = promoData;

        const sql = `
      INSERT INTO campaign_promotions (
        campaign_address, creator, boost_type, round_number, eth_amount,
        start_timestamp, end_timestamp, is_active, tx_hash, block_number
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $9)
      RETURNING *
    `;

        const result = await query(sql, [
            campaign_address.toLowerCase(), creator?.toLowerCase(), boost_type,
            round_number, eth_amount, start_timestamp, end_timestamp,
            tx_hash, block_number
        ]);

        return result.rows[0];
    },

    /**
     * Expirer une promotion
     */
    async expire(campaignAddress, roundNumber, boostType) {
        await query(
            `UPDATE campaign_promotions
       SET is_active = false
       WHERE campaign_address = $1
       AND round_number = $2
       AND boost_type = $3`,
            [campaignAddress.toLowerCase(), roundNumber, boostType]
        );
    }
};

// =============================================================================
// FONCTIONS CRUD POUR LES DOCUMENTS
// =============================================================================

export const documents = {
    /**
     * Récupérer les documents d'une campagne
     */
    async getByCampaign(campaignAddress) {
        const result = await query(
            `SELECT * FROM campaign_documents 
       WHERE campaign_address = $1 
       ORDER BY created_at DESC`,
            [campaignAddress.toLowerCase()]
        );
        return result.rows;
    },

    /**
     * Ajouter un document
     */
    async insert(docData) {
        const { campaign_address, ipfs_hash, name, category, is_public } = docData;

        const sql = `
      INSERT INTO campaign_documents (
        campaign_address, ipfs_hash, name, category, is_public, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;

        const result = await query(sql, [
            campaign_address.toLowerCase(), ipfs_hash, name, category || 'other', is_public ?? true
        ]);

        return result.rows[0];
    }
};

// =============================================================================
// ÉTAT DE SYNCHRONISATION
// =============================================================================

export const syncState = {
    async get(id) {
        const result = await query(
            'SELECT * FROM sync_state WHERE id = $1',
            [id]
        );
        return result.rows[0];
    },

    async upsert(id, lastBlock) {
        await query(
            `INSERT INTO sync_state (id, last_block, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (id) DO UPDATE SET
         last_block = EXCLUDED.last_block,
         updated_at = NOW()`,
            [id, lastBlock]
        );
    }
};

export default {
    query,
    getClient,
    closePool,
    campaigns,
    transactions,
    promotions,
    documents,
    syncState,
};
