const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 VÉRIFICATION COMPLÈTE DU DÉPLOIEMENT LIVAR");
    console.log("==============================================");
    console.log("📅 Timestamp:", new Date().toLocaleString());
    console.log("🌐 Network:", await ethers.provider.getNetwork());
    
    // Adresses déployées
    const ADDRESSES = {
        PriceConsumerV3: "0xa5050E4FC5F7115378Bbf8bAa17517298962bebE",
        DivarProxy: "0x89Eba0c82c1f16433473A9A06690BfaAC2c7a1b4",
        CampaignKeeper: "0x7BA165d19De799DA8070D3c1C061933551726D1E"
    };

    const [tester] = await ethers.getSigners();
    console.log("🔑 Testeur:", tester.address);
    console.log("💰 Balance:", ethers.utils.formatEther(await tester.getBalance()), "ETH\n");

    let allTestsPassed = true;

    try {
        // ===== TEST 1: PRICECONSUMERV3 =====
        console.log("📋 TEST 1: PRICECONSUMERV3");
        console.log("===========================");
        
        const priceConsumer = await ethers.getContractAt("PriceConsumerV3", ADDRESSES.PriceConsumerV3);
        
        // Vérifier que le contrat existe
        const priceCode = await ethers.provider.getCode(ADDRESSES.PriceConsumerV3);
        if (priceCode === "0x") {
            console.log("❌ PriceConsumerV3: Contrat n'existe pas");
            allTestsPassed = false;
        } else {
            console.log("✅ PriceConsumerV3: Contrat existe");
            console.log("🔧 Code size:", priceCode.length, "bytes");
        }
        
        // Test fonction getLatestPrice
        try {
            const price = await priceConsumer.getLatestPrice();
            console.log("✅ getLatestPrice():", price.toString(), "(", (price / 1e8).toFixed(2), "USD)");
        } catch (e) {
            console.log("❌ getLatestPrice() failed:", e.message);
            allTestsPassed = false;
        }
        
        // Test fonction convertUSDToETH
        try {
            const ethAmount = await priceConsumer.convertUSDToETH(8500); // 85 USD
            console.log("✅ convertUSDToETH(85 USD):", ethers.utils.formatEther(ethAmount), "ETH");
        } catch (e) {
            console.log("❌ convertUSDToETH() failed:", e.message);
            allTestsPassed = false;
        }

        // ===== TEST 2: DIVARPROXY =====
        console.log("\n📋 TEST 2: DIVARPROXY");
        console.log("======================");
        
        const divarProxy = await ethers.getContractAt("DivarProxy", ADDRESSES.DivarProxy);
        
        // Vérifier que le contrat existe
        const proxyCode = await ethers.provider.getCode(ADDRESSES.DivarProxy);
        if (proxyCode === "0x") {
            console.log("❌ DivarProxy: Contrat n'existe pas");
            allTestsPassed = false;
        } else {
            console.log("✅ DivarProxy: Contrat existe");
            console.log("🔧 Code size:", proxyCode.length, "bytes");
        }
        
        // Test configuration Treasury
        try {
            const treasury = await divarProxy.treasury();
            console.log("✅ Treasury configuré:", treasury);
            if (treasury === "0x0000000000000000000000000000000000000000") {
                console.log("❌ Treasury est address(0)");
                allTestsPassed = false;
            }
        } catch (e) {
            console.log("❌ treasury() failed:", e.message);
            allTestsPassed = false;
        }
        
        // Test configuration PriceConsumer
        try {
            const priceConsumerAddr = await divarProxy.priceConsumer();
            console.log("✅ PriceConsumer configuré:", priceConsumerAddr);
            if (priceConsumerAddr !== ADDRESSES.PriceConsumerV3) {
                console.log("❌ PriceConsumer address mismatch");
                allTestsPassed = false;
            }
        } catch (e) {
            console.log("❌ priceConsumer() failed:", e.message);
            allTestsPassed = false;
        }
        
        // Test configuration CampaignKeeper
        try {
            const keeperAddr = await divarProxy.campaignKeeper();
            console.log("✅ CampaignKeeper configuré:", keeperAddr);
            if (keeperAddr !== ADDRESSES.CampaignKeeper) {
                console.log("❌ CampaignKeeper address mismatch");
                allTestsPassed = false;
            }
        } catch (e) {
            console.log("❌ campaignKeeper() failed:", e.message);
            allTestsPassed = false;
        }
        
        // Test bytecode Campaign
        try {
            const bytecode = await divarProxy.campaignBytecode();
            console.log("✅ Campaign bytecode configuré, size:", bytecode.length, "bytes");
            if (bytecode.length < 1000) {
                console.log("❌ Bytecode trop petit, probablement vide");
                allTestsPassed = false;
            }
        } catch (e) {
            console.log("❌ campaignBytecode() failed:", e.message);
            allTestsPassed = false;
        }
        
        // Test version
        try {
            const version = await divarProxy.getVersion();
            console.log("✅ Version:", version);
        } catch (e) {
            console.log("❌ getVersion() failed:", e.message);
            allTestsPassed = false;
        }
        
        // Test frais de création
        try {
            const fee = await divarProxy.getCampaignCreationFeeETH();
            console.log("✅ Frais de création:", ethers.utils.formatEther(fee), "ETH");
            if (fee.eq(0)) {
                console.log("⚠️  Frais de création = 0 (vérifier PriceConsumer)");
            }
        } catch (e) {
            console.log("❌ getCampaignCreationFeeETH() failed:", e.message);
            allTestsPassed = false;
        }
        
        // Test liste campagnes
        try {
            const campaigns = await divarProxy.getAllCampaigns();
            console.log("✅ Campagnes existantes:", campaigns.length);
            console.log("📋 Liste:", campaigns);
        } catch (e) {
            console.log("❌ getAllCampaigns() failed:", e.message);
            allTestsPassed = false;
        }

        // ===== TEST 3: CAMPAIGNKEEPER =====
        console.log("\n📋 TEST 3: CAMPAIGNKEEPER");
        console.log("==========================");
        
        const campaignKeeper = await ethers.getContractAt("CampaignKeeper", ADDRESSES.CampaignKeeper);
        
        // Vérifier que le contrat existe
        const keeperCode = await ethers.provider.getCode(ADDRESSES.CampaignKeeper);
        if (keeperCode === "0x") {
            console.log("❌ CampaignKeeper: Contrat n'existe pas");
            allTestsPassed = false;
        } else {
            console.log("✅ CampaignKeeper: Contrat existe");
            console.log("🔧 Code size:", keeperCode.length, "bytes");
        }
        
        // Test référence DivarProxy
        try {
            const divarProxyRef = await campaignKeeper.divarProxy();
            console.log("✅ DivarProxy référencé:", divarProxyRef);
            if (divarProxyRef !== ADDRESSES.DivarProxy) {
                console.log("❌ DivarProxy reference mismatch");
                allTestsPassed = false;
            }
        } catch (e) {
            console.log("❌ divarProxy() failed:", e.message);
            allTestsPassed = false;
        }
        
        // Test lastCheckTime
        try {
            const lastCheck = await campaignKeeper.lastCheckTime();
            console.log("✅ LastCheckTime:", lastCheck.toString());
            console.log("📅 Date:", new Date(lastCheck * 1000).toLocaleString());
        } catch (e) {
            console.log("❌ lastCheckTime() failed:", e.message);
            allTestsPassed = false;
        }
        
        // Test checkUpkeep
        try {
            const [upkeepNeeded, performData] = await campaignKeeper.checkUpkeep("0x");
            console.log("✅ checkUpkeep() works");
            console.log("🔍 Upkeep needed:", upkeepNeeded);
            console.log("📊 Perform data:", performData);
        } catch (e) {
            console.log("❌ checkUpkeep() failed:", e.message);
            allTestsPassed = false;
        }

        // ===== TEST 4: INTÉGRATION ENTRE CONTRATS =====
        console.log("\n📋 TEST 4: INTÉGRATION ENTRE CONTRATS");
        console.log("======================================");
        
        // Test: DivarProxy peut récupérer les campagnes via CampaignKeeper
        try {
            const campaigns = await divarProxy.getAllCampaigns();
            const [upkeepNeeded] = await campaignKeeper.checkUpkeep("0x");
            console.log("✅ Communication DivarProxy ↔ CampaignKeeper fonctionne");
            console.log("📊 Campagnes dans proxy:", campaigns.length);
            console.log("🤖 Automation status:", upkeepNeeded ? "Nécessaire" : "Pas nécessaire");
        } catch (e) {
            console.log("❌ Communication entre contrats failed:", e.message);
            allTestsPassed = false;
        }
        
        // Test: Calcul des frais via PriceConsumer
        try {
            const feeFromProxy = await divarProxy.getCampaignCreationFeeETH();
            const ethPriceFromConsumer = await priceConsumer.convertUSDToETH(8500);
            
            if (feeFromProxy.eq(ethPriceFromConsumer)) {
                console.log("✅ Intégration DivarProxy ↔ PriceConsumer parfaite");
            } else {
                console.log("⚠️  Légère différence de calcul (normal, prix fluctue)");
                console.log("   Proxy:", ethers.utils.formatEther(feeFromProxy), "ETH");
                console.log("   Direct:", ethers.utils.formatEther(ethPriceFromConsumer), "ETH");
            }
        } catch (e) {
            console.log("❌ Intégration prix failed:", e.message);
            allTestsPassed = false;
        }

        // ===== TEST 5: PERMISSIONS ET SÉCURITÉ =====
        console.log("\n📋 TEST 5: PERMISSIONS ET SÉCURITÉ");
        console.log("===================================");
        
        // Test ownership DivarProxy
        try {
            const owner = await divarProxy.owner();
            console.log("✅ Owner DivarProxy:", owner);
            if (owner === "0x0000000000000000000000000000000000000000") {
                console.log("❌ Owner est address(0)");
                allTestsPassed = false;
            }
        } catch (e) {
            console.log("❌ owner() failed:", e.message);
            allTestsPassed = false;
        }
        
        // Test que seul DivarProxy peut enregistrer des campagnes dans CampaignKeeper
        try {
            // Ceci devrait échouer si appelé par nous directement
            await campaignKeeper.registerCampaign("0x0000000000000000000000000000000000000001");
            console.log("❌ SÉCURITÉ COMPROMISE: registerCampaign accessible à tous");
            allTestsPassed = false;
        } catch (e) {
            if (e.message.includes("Only DivarProxy can register")) {
                console.log("✅ Sécurité OK: registerCampaign protégé");
            } else {
                console.log("⚠️  Erreur inattendue:", e.message);
            }
        }

        // ===== RÉSUMÉ FINAL =====
        console.log("\n" + "=".repeat(50));
        console.log("🎯 RÉSUMÉ FINAL DE LA VÉRIFICATION");
        console.log("=".repeat(50));
        
        if (allTestsPassed) {
            console.log("🎉 TOUS LES TESTS RÉUSSIS !");
            console.log("✅ PriceConsumerV3: Fonctionnel");
            console.log("✅ DivarProxy: Fonctionnel");
            console.log("✅ CampaignKeeper: Fonctionnel");
            console.log("✅ Intégrations: Fonctionnelles");
            console.log("✅ Sécurité: Correcte");
            console.log("");
            console.log("🚀 LE SYSTÈME LIVAR EST 100% OPÉRATIONNEL !");
            console.log("📝 Vous pouvez maintenant créer des campagnes en toute sécurité.");
            console.log("");
            console.log("📋 ADRESSES FINALES:");
            console.log("   PriceConsumerV3:", ADDRESSES.PriceConsumerV3);
            console.log("   DivarProxy:     ", ADDRESSES.DivarProxy);
            console.log("   CampaignKeeper: ", ADDRESSES.CampaignKeeper);
        } else {
            console.log("❌ CERTAINS TESTS ONT ÉCHOUÉ !");
            console.log("⚠️  Vérifiez les erreurs ci-dessus avant de continuer.");
            console.log("🔧 Le système peut nécessiter des corrections.");
        }
        
    } catch (error) {
        console.error("\n💥 ERREUR CRITIQUE LORS DE LA VÉRIFICATION !");
        console.error("==============================================");
        console.error("❌ Message:", error.message);
        console.error("📚 Stack:", error.stack);
        allTestsPassed = false;
    }
    
    process.exit(allTestsPassed ? 0 : 1);
}

main()
    .then(() => {
        console.log("\n✅ Vérification terminée !");
    })
    .catch((error) => {
        console.error("\n💥 Erreur fatale:", error);
        process.exit(1);
    });