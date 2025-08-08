const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 === VÉRIFICATION STATUS UPGRADE ===");

    const PROXY_ADDRESS = "0x89Eba0c82c1f16433473A9A06690BfaAC2c7a1b4";

    try {
        // Test direct avec l'ABI complet
        const DivarProxy = await ethers.getContractFactory("DivarProxy");
        const proxy = DivarProxy.attach(PROXY_ADDRESS);

        console.log("📋 Test des fonctions disponibles...");

        // Test 1: getAllCampaigns (devrait marcher)
        try {
            const campaigns = await proxy.getAllCampaigns();
            console.log(`✅ getAllCampaigns: ${campaigns.length} campagnes`);
        } catch (e) {
            console.log(`❌ getAllCampaigns: ${e.message}`);
        }

        // Test 2: getCampaignRegistry (la nouvelle fonction)  
        let campaigns;
        try {
            campaigns = await proxy.getAllCampaigns();
        } catch (e) {
            campaigns = [];
        }

        try {
            if (campaigns.length > 0) {
                const testCampaign = campaigns[0];
                const registry = await proxy.getCampaignRegistry(testCampaign);
                console.log(`✅ getCampaignRegistry: fonction existe et marche`);
                console.log(`  Address: ${registry.campaignAddress}`);
                console.log(`  Creator: ${registry.creator}`);
                console.log(`  Name: ${registry.name}`);
            } else {
                // Test avec une adresse fictive pour voir si la fonction existe
                try {
                    await proxy.getCampaignRegistry("0x0000000000000000000000000000000000000001");
                } catch (e) {
                    if (e.message.includes("Function does not exist")) {
                        console.log("❌ getCampaignRegistry: fonction n'existe PAS");
                    } else {
                        console.log("✅ getCampaignRegistry: fonction existe (erreur normale pour adresse fictive)");
                    }
                }
            }
        } catch (e) {
            if (e.message.includes("Function does not exist")) {
                console.log("❌ getCampaignRegistry: fonction n'existe PAS dans le contrat");
            } else {
                console.log(`✅ getCampaignRegistry existe mais erreur: ${e.message}`);
            }
        }

        // Test 3: Vérifier la version du contrat
        try {
            const version = await proxy.getVersion();
            console.log(`📦 Version du contrat: ${version}`);
        } catch (e) {
            console.log(`❌ getVersion: ${e.message}`);
        }

        // Test 4: Essayer avec le mapping public direct
        console.log("\n🔧 Test du mapping public campaignRegistry...");
        try {
            const proxyWithMapping = new ethers.Contract(PROXY_ADDRESS, [
                "function campaignRegistry(address) external view returns (tuple(address,address,uint256,uint256,string,bool,string,string,string,address))"
            ], proxy.provider);

            if (campaigns && campaigns.length > 0) {
                const result = await proxyWithMapping.campaignRegistry(campaigns[0]);
                console.log("✅ mapping campaignRegistry est accessible directement");
            }
        } catch (e) {
            console.log(`❌ mapping campaignRegistry: ${e.message}`);
        }

    } catch (error) {
        console.error("❌ ERREUR GLOBALE:", error.message);
    }

    console.log("\n🎯 CONCLUSION: Vérification terminée");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ ERREUR:", error);
        process.exit(1);
    });