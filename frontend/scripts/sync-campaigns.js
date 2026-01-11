/**
 * Script de synchronisation Blockchain → Supabase
 * Ajoute les campagnes on-chain manquantes dans Supabase
 */

import { ethers } from 'ethers';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const RPC_URL = 'https://sepolia.base.org';
const DIVAR_PROXY_ADDRESS = '0xaB0999Eae920849a41A55eA080d0a4a210156817';

// ABI minimal pour lire les campagnes
const DIVAR_PROXY_ABI = [
    'function getAllCampaigns() view returns (address[])',
    'function getCampaignInfo(address) view returns (tuple(string name, string symbol, address creator, string category, string metadata, uint256 royaltyFee, bool isActive, bool isFinalized))'
];

const CAMPAIGN_ABI = [
    'function getCurrentRound() view returns (tuple(uint256 roundNumber, uint256 targetAmount, uint256 sharePrice, uint256 sharesSold, uint256 fundsRaised, uint256 endTimestamp, bool isActive, bool isFinalized))',
    'function totalShares() view returns (uint256)',
    'function getLogoUrl() view returns (string)'
];

async function syncCampaigns() {
    // Vérifier les variables d'environnement
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Variables Supabase manquantes !');
        console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
        console.log('SUPABASE_ANON_KEY:', supabaseKey ? '✓' : '✗');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const divarContract = new ethers.Contract(DIVAR_PROXY_ADDRESS, DIVAR_PROXY_ABI, provider);

    console.log('🔄 Récupération des campagnes on-chain...');
    const onChainAddresses = await divarContract.getAllCampaigns();
    console.log(`📊 ${onChainAddresses.length} campagnes on-chain`);

    // Récupérer les campagnes déjà dans Supabase
    const { data: existingCampaigns, error: fetchError } = await supabase
        .from('campaigns')
        .select('address');

    if (fetchError) {
        console.error('❌ Erreur Supabase:', fetchError);
        process.exit(1);
    }

    const existingAddresses = new Set((existingCampaigns || []).map(c => c.address?.toLowerCase()));
    console.log(`📦 ${existingAddresses.size} campagnes dans Supabase`);

    // Trouver les manquantes
    const missingAddresses = onChainAddresses.filter(
        addr => !existingAddresses.has(addr.toLowerCase())
    );

    console.log(`⚠️  ${missingAddresses.length} campagnes à synchroniser`);

    if (missingAddresses.length === 0) {
        console.log('✅ Tout est synchronisé !');
        return;
    }

    // Synchroniser chaque campagne manquante
    for (const address of missingAddresses) {
        try {
            console.log(`\n📝 Sync ${address}...`);

            // Lire les infos depuis DivarProxy
            const info = await divarContract.getCampaignInfo(address);

            // Lire les données du round depuis le contrat Campaign
            const campaignContract = new ethers.Contract(address, CAMPAIGN_ABI, provider);
            const roundData = await campaignContract.getCurrentRound();
            const totalShares = await campaignContract.totalShares();

            let logo = '';
            try {
                logo = await campaignContract.getLogoUrl();
            } catch (e) { }

            // Préparer les données
            const campaignData = {
                address: address.toLowerCase(),
                name: info.name,
                symbol: info.symbol,
                creator: info.creator.toLowerCase(),
                category: info.category || 'Other',
                description: '',
                logo: logo,
                share_price: ethers.utils.formatEther(roundData.sharePrice),
                total_shares: totalShares.toString(),
                goal: ethers.utils.formatEther(roundData.targetAmount),
                raised: ethers.utils.formatEther(roundData.fundsRaised),
                shares_sold: roundData.sharesSold.toString(),
                end_date: new Date(roundData.endTimestamp.toNumber() * 1000).toISOString(),
                is_active: roundData.isActive,
                is_finalized: roundData.isFinalized,
                current_round: roundData.roundNumber.toNumber(),
                status: roundData.isFinalized ? 'finalized' : (roundData.isActive ? 'active' : 'pending'),
                metadata_uri: info.metadata || ''
            };

            // Insérer dans Supabase
            const { error: insertError } = await supabase
                .from('campaigns')
                .upsert(campaignData, { onConflict: 'address' });

            if (insertError) {
                console.error(`  ❌ Erreur insertion:`, insertError.message);
            } else {
                console.log(`  ✅ ${info.name} synchronisée`);
            }

        } catch (err) {
            console.error(`  ❌ Erreur pour ${address}:`, err.message);
        }
    }

    console.log('\n🎉 Synchronisation terminée !');
}

syncCampaigns().catch(console.error);
