/**
 * SCRIPT D'INTROSPECTION DE LA BASE - LIVAR
 * 
 * Ce script interroge la structure réelle de la base de données.
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function introspect() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Erreur: Variables Supabase manquantes.');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('--- INTROSPECTION DES TABLES ---');

    // On utilise rpc 'query' ou on essaie de lister via information_schema si possible
    // Note: Supabase JS ne permet pas de requêter information_schema directement via .from()
    // sauf si autorisé. On va essayer de lister les colonnes des tables connues.

    const tables = [
        'campaigns',
        'campaign_transactions',
        'campaign_rounds',
        'campaign_finance',
        'campaign_documents',
        'sync_state'
    ];

    for (const table of tables) {
        console.log(`\n> Table: ${table}`);
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);

        if (error) {
            console.log(`  [Erreur] ${error.message}`);
        } else if (data && data.length > 0) {
            console.log(`  Colonnes détectées: ${Object.keys(data[0]).join(', ')}`);
        } else {
            console.log('  Table vide, impossible de déduire les colonnes via select.');
        }
    }
}

introspect();
