import { NextResponse } from 'next/server';
import { query } from '@/backend/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
        // Recuperer toutes les transactions de cet investisseur groupees par campagne
        const sql = `
            SELECT
                ct.campaign_address,
                c.name as campaign_name,
                c.symbol as campaign_symbol,
                c.logo as campaign_logo,
                c.category as campaign_category,
                json_agg(
                    json_build_object(
                        'tx_hash', ct.tx_hash,
                        'amount', ct.amount,
                        'shares', ct.shares,
                        'round_number', ct.round_number,
                        'timestamp', extract(epoch from ct.timestamp)::bigint,
                        'type', ct.type
                    ) ORDER BY ct.timestamp DESC
                ) as investments
            FROM campaign_transactions ct
            JOIN campaigns c ON c.address = ct.campaign_address
            WHERE ct.investor = $1
            GROUP BY ct.campaign_address, c.name, c.symbol, c.logo, c.category
            ORDER BY MAX(ct.timestamp) DESC
        `;

        const result = await query(sql, [investorAddress.toLowerCase()]);

        // Transformer pour le format attendu par le frontend
        const investments = result.rows.map(row => ({
            campaignAddress: row.campaign_address,
            campaignName: row.campaign_name,
            campaignSymbol: row.campaign_symbol,
            campaignLogo: row.campaign_logo,
            campaignCategory: row.campaign_category,
            investments: row.investments || []
        }));

        return NextResponse.json({ investments });
    } catch (error) {
        console.error('[API Investments] Error:', error);
        return NextResponse.json({ investments: [], error: error.message }, { status: 200 });
    }
}
