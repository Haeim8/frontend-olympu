const { ethers, upgrades } = require("hardhat");

async function main() {
    console.log("🚀 === UPGRADE DIVAR PROXY ===");

    // Adresse du proxy existant
    const PROXY_ADDRESS = "0x89Eba0c82c1f16433473A9A06690BfaAC2c7a1b4";

    console.log("📦 Récupération de la nouvelle implémentation...");
    const DivarProxyV2 = await ethers.getContractFactory("DivarProxy");

    console.log("⏳ Upgrade du proxy en cours...");
    const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, DivarProxyV2);

    console.log("✅ Upgrade terminé !");
    console.log("📍 Proxy address (inchangée):", upgraded.address);
    
    // Test de la nouvelle fonction
    console.log("\n🧪 Test de la nouvelle fonction getCampaignRegistry...");
    try {
        // Récupérer une campagne pour tester
        const campaigns = await upgraded.getAllCampaigns();
        console.log(`📊 ${campaigns.length} campagnes trouvées`);
        
        if (campaigns.length > 0) {
            const testCampaign = campaigns[0];
            console.log(`🎯 Test avec campagne: ${testCampaign}`);
            
            try {
                const registry = await upgraded.getCampaignRegistry(testCampaign);
                console.log("✅ getCampaignRegistry fonctionne !");
                console.log("📋 Registry data:", {
                    campaignAddress: registry.campaignAddress,
                    creator: registry.creator,
                    category: registry.category,
                    name: registry.name
                });
            } catch (e) {
                console.log("❌ getCampaignRegistry error:", e.message);
            }
        }
    } catch (e) {
        console.log("❌ Test error:", e.message);
    }

    console.log("\n🎉 UPGRADE TERMINÉ AVEC SUCCÈS !");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ ERREUR:", error);
        process.exit(1);
    });