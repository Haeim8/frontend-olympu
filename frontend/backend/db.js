/**
 * =============================================================================
 * CLIENT SUPABASE - LIVAR
 * =============================================================================
 *
 * Client Supabase utilisant l'API REST (IPv4 compatible)
 * Remplace la connexion PostgreSQL directe pour Vercel
 * =============================================================================
 */

import { createClient } from '@supabase/supabase-js';

// Client Supabase (lazy initialization)
let supabase = null;

export function getSupabase() {
    if (supabase) return supabase;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // Use SERVICE_KEY for server-side to bypass RLS
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_KEY;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('[Supabase] Variables manquantes: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_KEY');
    }

    supabase = createClient(supabaseUrl, supabaseKey);
    console.log(`[Supabase] Client initialisé (mode: ${hasServiceKey ? 'SERVICE_KEY' : 'ANON_KEY'})`);
    return supabase;
}

/**
 * Exécuter une requête SQL brute via RPC (pour compatibilité)
 */
export async function query(text, params = []) {
    const start = Date.now();
    try {
        // Pour les requêtes SELECT simples, on parse et utilise l'API Supabase
        // Pour les requêtes complexes, on utilise la fonction RPC
        const { data, error } = await getSupabase().rpc('execute_sql', {
            query_text: text,
            query_params: params
        });

        if (error) {
            // Fallback: essayer d'interpréter la requête
            console.error('[Supabase] Erreur RPC:', error.message);
            throw error;
        }

        const duration = Date.now() - start;
        console.log(`[Supabase] Requête exécutée en ${duration}ms`);
        return { rows: data || [] };
    } catch (error) {
        console.error('[Supabase] Erreur requête:', error.message);
        throw error;
    }
}

/**
 * Obtenir un client (pour compatibilité)
 */
export async function getClient() {
    return getSupabase();
}

/**
 * Fermer le client (no-op pour Supabase)
 */
export async function closePool() {
    // Pas nécessaire pour Supabase REST API
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

        let query = getSupabase()
            .from('campaigns')
            .select('*')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) {
            query = query.eq('status', status);
        }

        if (category) {
            query = query.eq('category', category);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[Supabase] campaigns.getAll error:', error.message);
            throw error;
        }

        return data || [];
    },

    /**
     * Récupérer une campagne par adresse
     */
    async getByAddress(address) {
        const { data, error } = await getSupabase()
            .from('campaigns')
            .select('*')
            .eq('address', address.toLowerCase())
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('[Supabase] campaigns.getByAddress error:', error.message);
            throw error;
        }

        return data || null;
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
            description,
            goal,
            raised,
            share_price,
            shares_sold,
            total_shares,
            status,
            is_active,
            is_finalized,
            end_date,
            category,
            logo,
            current_round,
            nft_background_color,
            nft_text_color,
            nft_logo_url,
            nft_sector,
            // Social networks
            twitter,
            discord,
            website,
            github,
            telegram,
            farcaster,
            medium,
            base,
        } = campaignData;

        const { data, error } = await getSupabase()
            .from('campaigns')
            .upsert({
                address: address.toLowerCase(),
                creator: creator?.toLowerCase(),
                name,
                symbol,
                description,
                goal,
                raised,
                share_price,
                shares_sold,
                total_shares,
                status,
                is_active,
                is_finalized,
                end_date,
                category,
                logo,
                current_round,
                nft_background_color,
                nft_text_color,
                nft_logo_url,
                nft_sector,
                // Social networks
                twitter,
                discord,
                website,
                github,
                telegram,
                farcaster,
                medium,
                base,
                updated_at: new Date().toISOString()
            }, { onConflict: 'address' })
            .select()
            .single();

        if (error) {
            console.error('[Supabase] campaigns.upsert error:', error.message);
            throw error;
        }

        return data;
    },


    /**
     * Supprimer une campagne
     */
    async delete(address) {
        const { error } = await getSupabase()
            .from('campaigns')
            .delete()
            .eq('address', address.toLowerCase());

        if (error) {
            console.error('[Supabase] campaigns.delete error:', error.message);
            throw error;
        }
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

        const { data, error } = await getSupabase()
            .from('campaign_transactions')
            .select('*')
            .eq('campaign_address', campaignAddress.toLowerCase())
            .order('timestamp', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('[Supabase] transactions.getByCampaign error:', error.message);
            throw error;
        }

        return data || [];
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

        const { data, error } = await getSupabase()
            .from('campaign_transactions')
            .upsert({
                tx_hash,
                campaign_address: campaign_address.toLowerCase(),
                investor: investor?.toLowerCase(),
                amount,
                shares,
                round_number,
                type,
                block_number,
                timestamp,
                commission,
                net_amount
            }, { onConflict: 'tx_hash', ignoreDuplicates: true })
            .select()
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('[Supabase] transactions.insert error:', error.message);
            throw error;
        }

        return data;
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
        let query = getSupabase()
            .from('campaign_promotions')
            .select('*')
            .order('boost_type')
            .order('created_at', { ascending: false });

        if (!includeExpired) {
            query = query
                .eq('is_active', true)
                .gt('end_timestamp', new Date().toISOString());
        }

        const { data, error } = await query;

        if (error) {
            console.error('[Supabase] promotions.getActivePromotions error:', error.message);
            throw error;
        }

        return data || [];
    },

    /**
     * Vérifier si une campagne est promue
     */
    async isCampaignBoosted(campaignAddress) {
        const { data, error } = await getSupabase()
            .from('campaign_promotions')
            .select('*')
            .eq('campaign_address', campaignAddress.toLowerCase())
            .eq('is_active', true)
            .gt('end_timestamp', new Date().toISOString());

        if (error) {
            console.error('[Supabase] promotions.isCampaignBoosted error:', error.message);
            throw error;
        }

        return (data || []).length > 0;
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

        const { data, error } = await getSupabase()
            .from('campaign_promotions')
            .insert({
                campaign_address: campaign_address.toLowerCase(),
                creator: creator?.toLowerCase(),
                boost_type,
                round_number,
                eth_amount,
                start_timestamp,
                end_timestamp,
                is_active: true,
                tx_hash,
                block_number
            })
            .select()
            .single();

        if (error) {
            console.error('[Supabase] promotions.insert error:', error.message);
            throw error;
        }

        return data;
    },

    /**
     * Expirer une promotion
     */
    async expire(campaignAddress, roundNumber, boostType) {
        const { error } = await getSupabase()
            .from('campaign_promotions')
            .update({ is_active: false })
            .eq('campaign_address', campaignAddress.toLowerCase())
            .eq('round_number', roundNumber)
            .eq('boost_type', boostType);

        if (error) {
            console.error('[Supabase] promotions.expire error:', error.message);
            throw error;
        }
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
        const { data, error } = await getSupabase()
            .from('campaign_documents')
            .select('*')
            .eq('campaign_address', campaignAddress.toLowerCase())
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Supabase] documents.getByCampaign error:', error.message);
            throw error;
        }

        return data || [];
    },

    /**
     * Ajouter un document
     */
    async insert(docData) {
        const { campaign_address, url, name, category, is_public } = docData;

        const { data, error } = await getSupabase()
            .from('campaign_documents')
            .insert({
                campaign_address: campaign_address.toLowerCase(),
                url,
                name,
                category: category || 'other',
                is_public: is_public ?? true,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('[Supabase] documents.insert error:', error.message);
            throw error;
        }

        return data;
    }
};

// =============================================================================
// TEAM MEMBERS
// =============================================================================

export const teamMembers = {
    /**
     * Get team members for a campaign
     */
    async getByCampaign(campaignAddress) {
        const { data, error } = await getSupabase()
            .from('campaign_team_members')
            .select('*')
            .eq('campaign_address', campaignAddress.toLowerCase())
            .order('created_at', { ascending: true });

        if (error) {
            console.error('[Supabase] teamMembers.getByCampaign error:', error.message);
            return [];
        }

        return data || [];
    },

    /**
     * Save team members for a campaign (replaces all existing)
     */
    async saveByCampaign(campaignAddress, members) {
        const address = campaignAddress.toLowerCase();

        // Delete existing members
        await getSupabase()
            .from('campaign_team_members')
            .delete()
            .eq('campaign_address', address);

        // Insert new members
        if (!members || members.length === 0) return [];

        const rows = members.map(m => ({
            campaign_address: address,
            name: m.name || '',
            role: m.role || '',
            twitter: m.socials?.twitter || m.twitter || null,
            linkedin: m.socials?.linkedin || m.linkedin || null,
            github: m.socials?.github || m.github || null
        })).filter(m => m.name); // Only insert if name exists

        if (rows.length === 0) return [];

        const { data, error } = await getSupabase()
            .from('campaign_team_members')
            .insert(rows)
            .select();

        if (error) {
            console.error('[Supabase] teamMembers.saveByCampaign error:', error.message);
            throw error;
        }

        return data || [];
    }
};

// =============================================================================
// ÉTAT DE SYNCHRONISATION
// =============================================================================

export const syncState = {
    async get(id) {
        const { data, error } = await getSupabase()
            .from('sync_state')
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('[Supabase] syncState.get error:', error.message);
            throw error;
        }

        return data || null;
    },

    async upsert(id, lastBlock) {
        const { error } = await getSupabase()
            .from('sync_state')
            .upsert({
                id,
                last_block: lastBlock,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

        if (error) {
            console.error('[Supabase] syncState.upsert error:', error.message);
            throw error;
        }
    }
};

// =============================================================================
// FONCTIONS CRUD POUR LES ROUNDS
// =============================================================================

export const rounds = {
    async getByCampaign(campaignAddress) {
        const { data, error } = await getSupabase()
            .from('campaign_rounds')
            .select('*')
            .eq('campaign_address', campaignAddress.toLowerCase())
            .order('round_number', { ascending: true });

        if (error) {
            console.error('[Supabase] rounds.getByCampaign error:', error.message);
            throw error;
        }
        return data || [];
    },

    async upsert(roundData) {
        const {
            campaign_address,
            round_number,
            share_price,
            target_amount,
            funds_raised,
            shares_sold,
            end_time,
            is_active,
            is_finalized
        } = roundData;

        const { data, error } = await getSupabase()
            .from('campaign_rounds')
            .upsert({
                campaign_address: campaign_address.toLowerCase(),
                round_number,
                share_price,
                target_amount,
                funds_raised,
                shares_sold,
                end_time: end_time ? (isNaN(end_time) ? Math.floor(new Date(end_time).getTime() / 1000) : end_time) : 0,
                is_active,
                is_finalized,
                updated_at: new Date().toISOString()
            }, { onConflict: 'campaign_address,round_number' })
            .select()
            .single();

        if (error) {
            console.error('[Supabase] rounds.upsert error:', error.message);
            throw error;
        }
        return data;
    }
};

// =============================================================================
// FONCTIONS CRUD POUR LA FINANCE
// =============================================================================

export const finance = {
    async getByCampaign(campaignAddress) {
        const { data, error } = await getSupabase()
            .from('campaign_finance')
            .select('*')
            .eq('campaign_address', campaignAddress.toLowerCase())
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('[Supabase] finance.getByCampaign error:', error.message);
            throw error;
        }
        return data || null;
    },

    async upsert(financeData) {
        const {
            campaign_address,
            escrow_amount,
            escrow_release_time,
            is_escrow_released,
            total_dividends_deposited,
            dividends_per_share
        } = financeData;

        const { data, error } = await getSupabase()
            .from('campaign_finance')
            .upsert({
                campaign_address: campaign_address.toLowerCase(),
                escrow_amount,
                escrow_release_time,
                is_escrow_released,
                total_dividends_deposited,
                dividends_per_share,
                updated_at: new Date().toISOString()
            }, { onConflict: 'campaign_address' })
            .select()
            .single();

        if (error) {
            console.error('[Supabase] finance.upsert error:', error.message);
            throw error;
        }
        return data;
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
    rounds,
    finance
};
