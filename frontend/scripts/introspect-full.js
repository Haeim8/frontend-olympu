/**
 * SCRIPT D'INTROSPECTION TOTALE - LIVAR
 * 
 * Ce script utilise la fonction RPC execute_sql pour extraire le schéma complet.
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function introspectFull() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Erreur: Variables Supabase manquantes.');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('--- INTROSPECTION TOTALE DE LA BASE ---');

    const query = `
        SELECT 
            table_name, 
            column_name, 
            data_type, 
            is_nullable,
            column_default
        FROM 
            information_schema.columns 
        WHERE 
            table_schema = 'public'
        ORDER BY 
            table_name, ordinal_position;
    `;

    const { data: rows, error } = await supabase.rpc('execute_sql', {
        query_text: query,
        query_params: []
    });

    if (error) {
        console.error('Erreur RPC Introspection:', error.message);
        return;
    }

    let currentTable = '';
    rows.forEach(row => {
        if (row.table_name !== currentTable) {
            currentTable = row.table_name;
            console.log(`\n[TABLE] ${currentTable}`);
        }
        console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})${row.column_default ? ' DEFAULT ' + row.column_default : ''}`);
    });
}

introspectFull();
