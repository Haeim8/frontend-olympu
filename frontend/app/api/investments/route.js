import { NextResponse } from 'next/server';
import { getSupabase } from '@/backend/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Block de démarrage pour Base Mainnet - les transactions avant ce block sont de Sepolia
const MAINNET_START_BLOCK = parseInt(process.env.DIVAR_START_BLOCK || '40000000', 10);

/**
 * GET /api/investments?address=0x...
 * Recupere les investissements d'un utilisateur (ses transactions d'achat)
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const investorAddress = searchParams.get('address');

    if (!investorAddress) {
        return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }

    try {
        const supabase = getSupabase();

        // Récupérer les transactions de l'investisseur - FILTRER par block_number pour exclure Sepolia
        // Les blocks Mainnet Base sont > 40 millions, Sepolia beaucoup moins
        const { data: transactions, error: txError } = await supabase
            .from('campaign_transactions')
            .select('*')
            .eq('investor', investorAddress.toLowerCase())
            .gte('block_number', MAINNET_START_BLOCK) // Filtrer seulement les transactions mainnet
            .order('timestamp', { ascending: false });

        if (txError) {
            console.error('[API Investments] Transactions error:', txError);
            return NextResponse.json({ investments: [], error: txError.message }, { status: 200 });
        }

        if (!transactions || transactions.length === 0) {
            return NextResponse.json({ investments: [] });
        }

        // Grouper par campagne
        const campaignAddresses = [...new Set(transactions.map(t => t.campaign_address))];

        // Récupérer les infos des campagnes
        const { data: campaigns, error: campError } = await supabase
            .from('campaigns')
            .select('address, name, symbol, logo, category')
            .in('address', campaignAddresses);

        if (campError) {
            console.error('[API Investments] Campaigns error:', campError);
        }

        const campaignMap = {};
        (campaigns || []).forEach(c => {
            campaignMap[c.address] = c;
        });

        // Grouper les transactions par campagne
        const investmentsByAddress = {};
        transactions.forEach(tx => {
            const addr = tx.campaign_address;
            if (!investmentsByAddress[addr]) {
                investmentsByAddress[addr] = [];
            }
            investmentsByAddress[addr].push({
                tx_hash: tx.tx_hash,
                amount: tx.amount,
                shares: tx.shares,
                round_number: tx.round_number,
                timestamp: tx.timestamp ? new Date(tx.timestamp).getTime() / 1000 : 0,
                type: tx.type
            });
        });

        // Formatter pour le frontend
        const investments = Object.entries(investmentsByAddress).map(([addr, txs]) => {
            const campaign = campaignMap[addr] || {};
            return {
                campaignAddress: addr,
                campaignName: campaign.name || 'Unknown',
                campaignSymbol: campaign.symbol || '???',
                campaignLogo: campaign.logo || '',
                campaignCategory: campaign.category || 'Other',
                investments: txs
            };
        });

        return NextResponse.json({ investments });
    } catch (error) {
        console.error('[API Investments] Error:', error);
        return NextResponse.json({ investments: [], error: error.message }, { status: 200 });
    }
}
