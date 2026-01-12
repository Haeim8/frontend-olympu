/**
 * SCRIPT D'INTROSPECTION PAR BALAYAGE - LIVAR
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function scanDeep() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const potentialTables = [
        'campaigns', 'campaign_transactions', 'campaign_promotions',
        'campaign_documents', 'campaign_investors', 'campaign_rounds',
        'campaign_finance', 'sync_state', 'investors', 'transactions',
        'documents', 'rounds', 'finance', 'projects', 'users', 'profiles'
    ];

    console.log('--- SCAN PROFOND DE LA BASE ---');

    for (const table of potentialTables) {
        process.stdout.write(`Vérification de ${table}... `);
        const { data, error } = await supabase.from(table).select('*').limit(1);

        if (error) {
            console.log(`[ABSENT/ERREUR] ${error.message}`);
        } else {
            console.log(`[PRÉSENT]`);
            if (data.length > 0) {
                console.log(`  Structure détectée: ${Object.keys(data[0]).join(', ')}`);
                // Dump des types (approximatif via typeof)
                Object.entries(data[0]).forEach(([col, val]) => {
                    console.log(`    - ${col}: ${typeof val} (${val})`);
                });
            } else {
                console.log('  Table vide.');
            }
        }
    }
}

scanDeep();
