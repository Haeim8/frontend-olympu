/**
 * Script pour réinitialiser sync_state en production
 * Usage: node scripts/reset-sync-state-prod.js
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Bloc de départ pour Base Mainnet (contrat déployé au bloc ~40880000)
const START_BLOCK = 40880000;

async function main() {
    console.log('🔧 Reset sync_state pour Base Mainnet...');
    console.log(`📦 Start block: ${START_BLOCK}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Reset toutes les entrées sync_state
    const entries = ['campaigns', 'transactions', 'promotions'];

    for (const id of entries) {
        const { error } = await supabase
            .from('sync_state')
            .upsert({
                id: id,
                last_block: START_BLOCK,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

        if (error) {
            console.error(`❌ Erreur pour ${id}:`, error.message);
        } else {
            console.log(`✅ ${id} -> bloc ${START_BLOCK}`);
        }
    }

    console.log('✅ sync_state réinitialisé !');
}

main().catch(console.error);
