// Test RÉEL avec api-manager du frontend
import('./lib/services/api-manager.js').then(async ({ apiManager }) => {

async function testRealApiManager() {
    console.log('🎯 === TEST RÉEL AVEC API-MANAGER DU FRONTEND ===');
    
    try {
        console.log('⚡ Initialisation api-manager...');
        await apiManager.initializeWeb3();
        await apiManager.loadABIs();
        
        console.log('\n📋 Test getAllCampaigns avec api-manager...');
        const campaigns = await apiManager.getAllCampaigns(false); // pas de cache
        console.log(`✅ ${campaigns.length} campagnes trouvées:`, campaigns);
        
        if (campaigns.length === 0) {
            console.log('❌ Aucune campagne trouvée');
            return;
        }
        
        console.log('\n🔍 Test getCampaignData avec api-manager RÉEL...');
        const testCampaign = campaigns[0];
        console.log(`🎯 Test avec campagne: ${testCampaign}`);
        
        const campaignData = await apiManager.getCampaignData(testCampaign, false); // pas de cache
        
        if (campaignData) {
            console.log('✅ API-MANAGER DU FRONTEND FONCTIONNE !');
            console.log('📊 Données récupérées par api-manager:');
            console.log(`  Name: ${campaignData.name}`);
            console.log(`  Creator: ${campaignData.creator}`);
            console.log(`  Category: ${campaignData.category}`);
            console.log(`  Goal: ${campaignData.goal} ETH`);
            console.log(`  Raised: ${campaignData.raised} ETH`);
            console.log(`  Progress: ${campaignData.progressPercentage}%`);
            console.log(`  Active: ${campaignData.isActive}`);
            console.log(`  End Date: ${campaignData.endDate}`);
            
            console.log('\n🎨 Propriétés pour CampaignCard:');
            console.log(`  id: ${campaignData.id}`);
            console.log(`  sector: ${campaignData.sector}`);
            console.log(`  investors: ${campaignData.investors}`);
            console.log(`  isCertified: ${campaignData.isCertified}`);
            
            console.log('\n🎉 PARFAIT: LES CAMPAGNES PEUVENT S\'AFFICHER SUR LE FRONTEND !');
            
        } else {
            console.log('❌ API-MANAGER a retourné null - échec');
        }
        
        // Test toutes les campagnes avec api-manager
        console.log('\n🔄 Test toutes les campagnes avec api-manager...');
        let successCount = 0;
        for (let i = 0; i < campaigns.length; i++) {
            const campaignAddr = campaigns[i];
            console.log(`\n--- Test campagne ${i + 1}/${campaigns.length}: ${campaignAddr} ---`);
            
            const data = await apiManager.getCampaignData(campaignAddr, false);
            if (data) {
                console.log(`✅ ${data.name} - Goal: ${data.goal} ETH - Raised: ${data.raised} ETH`);
                successCount++;
            } else {
                console.log(`❌ Échec pour ${campaignAddr}`);
            }
        }
        
        console.log(`\n🎯 RÉSULTAT FINAL AVEC API-MANAGER: ${successCount}/${campaigns.length} campagnes récupérées`);
        
        if (successCount === campaigns.length) {
            console.log('🎉 VICTOIRE: API-MANAGER FONCTIONNE PARFAITEMENT !');
            console.log('🎉 TOUTES LES CAMPAGNES PEUVENT ÊTRE AFFICHÉES SUR LE FRONTEND !');
        } else {
            console.log('⚠️ Quelques campagnes ont des problèmes avec api-manager');
        }
        
    } catch (error) {
        console.error('❌ ERREUR AVEC API-MANAGER:', error);
        console.error('Stack:', error.stack);
    }
}

await testRealApiManager();
}).catch(console.error);