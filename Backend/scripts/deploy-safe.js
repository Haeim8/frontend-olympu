const { ethers, upgrades } = require("hardhat");

async function main() {
    console.log("🚀 DÉPLOIEMENT SYSTÈME LIVAR COMPLET - BASE SEPOLIA");
    console.log("==================================================");
    console.log("📅 Timestamp:", new Date().toLocaleString());
    console.log("🌐 Network:", await ethers.provider.getNetwork());
    
    try {
        const [deployer] = await ethers.getSigners();
        const treasuryAddress = deployer.address;
        
        console.log("\n=== 👥 COMPTES ET BALANCES ===");
        console.log("🔑 Déployeur:", deployer.address);
        console.log("🏦 Treasury:", treasuryAddress);

        const initialBalance = await deployer.getBalance();
        console.log("💰 Balance initiale:", ethers.utils.formatEther(initialBalance), "ETH");
        
        console.log("\n=== 📋 ÉTAPE 1: DÉPLOIEMENT PRICECONSUMERV3 ===");
        console.log("⏳ Préparation du déploiement PriceConsumerV3...");
        
        const PriceConsumerV3 = await ethers.getContractFactory("PriceConsumerV3");
        console.log("📦 Factory PriceConsumerV3 créé");
        console.log("🔧 Bytecode size:", PriceConsumerV3.bytecode.length, "bytes");
        
        console.log("🚀 Lancement du déploiement PriceConsumerV3...");
        const priceConsumer = await PriceConsumerV3.deploy();
        console.log("📤 Transaction PriceConsumerV3 envoyée, hash:", priceConsumer.deployTransaction.hash);
        
        console.log("⏳ Attente de confirmation (2 blocs)...");
        const priceDeployTx = await priceConsumer.deployTransaction.wait(2);
        console.log("✅ PriceConsumerV3 déployé avec succès !");
        console.log("📍 Adresse:", priceConsumer.address);
        console.log("🧾 Hash transaction:", priceDeployTx.transactionHash);
        console.log("⛽ Gas utilisé:", priceDeployTx.gasUsed.toString());
        console.log("🧱 Block:", priceDeployTx.blockNumber);

        // Test PriceConsumerV3
        console.log("🧪 Test PriceConsumerV3...");
        try {
            const testPrice = await priceConsumer.getLatestPrice();
            console.log("📊 Prix ETH/USD:", testPrice.toString());
        } catch (e) {
            console.log("⚠️  Prix ETH/USD non disponible (normal sur testnet)");
        }

        console.log("⏳ Délai sécurisé (5 secondes)...");
        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log("\n=== 📋 ÉTAPE 2: DÉPLOIEMENT DIVARPROXY (UPGRADEABLE) ===");
        console.log("⏳ Préparation du proxy upgradeable...");
        
        const DivarProxy = await ethers.getContractFactory("DivarProxy");
        console.log("📦 Factory DivarProxy créé");
        console.log("🔧 Bytecode size:", DivarProxy.bytecode.length, "bytes");
        
        console.log("🔧 Paramètres d'initialisation:");
        console.log("   Treasury:", treasuryAddress);
        console.log("   CampaignKeeper temporaire:", deployer.address);
        console.log("   PriceConsumer:", priceConsumer.address);
        
        console.log("🚀 Déploiement du proxy upgradeable...");
        const divarProxy = await upgrades.deployProxy(DivarProxy, [
            treasuryAddress,           // _treasury
            deployer.address,          // _campaignKeeper temporaire
            priceConsumer.address      // _priceConsumer
        ], { initializer: 'initialize' });
        
        console.log("⏳ Attente de déploiement proxy...");
        await divarProxy.deployed();
        console.log("✅ DivarProxy déployé avec succès !");
        console.log("📍 Adresse proxy:", divarProxy.address);
        
        // Vérification des paramètres du proxy
        console.log("🔍 Vérification configuration proxy...");
        const treasuryInProxy = await divarProxy.treasury();
        const priceConsumerInProxy = await divarProxy.priceConsumer();
        const keeperInProxy = await divarProxy.campaignKeeper();
        console.log("✅ Treasury configuré:", treasuryInProxy);
        console.log("✅ PriceConsumer configuré:", priceConsumerInProxy);
        console.log("✅ CampaignKeeper temporaire:", keeperInProxy);

        console.log("⏳ Délai sécurisé (10 secondes)...");
        await new Promise(resolve => setTimeout(resolve, 10000));

        console.log("\n=== 📋 ÉTAPE 3: DÉPLOIEMENT CAMPAIGNKEEPER ===");
        console.log("⏳ Préparation CampaignKeeper...");
        console.log("🔗 DivarProxy à utiliser:", divarProxy.address);
        
        const CampaignKeeper = await ethers.getContractFactory("CampaignKeeper");
        console.log("📦 Factory CampaignKeeper créé");
        console.log("🔧 Bytecode size:", CampaignKeeper.bytecode.length, "bytes");
        
        console.log("🚀 Lancement déploiement CampaignKeeper...");
        const campaignKeeper = await CampaignKeeper.deploy(divarProxy.address);
        console.log("📤 Transaction CampaignKeeper envoyée, hash:", campaignKeeper.deployTransaction.hash);
        
        console.log("⏳ Attente de confirmation (2 blocs)...");
        const keeperDeployTx = await campaignKeeper.deployTransaction.wait(2);
        console.log("✅ CampaignKeeper déployé avec succès !");
        console.log("📍 Adresse:", campaignKeeper.address);
        console.log("🧾 Hash transaction:", keeperDeployTx.transactionHash);
        console.log("⛽ Gas utilisé:", keeperDeployTx.gasUsed.toString());
        console.log("🧱 Block:", keeperDeployTx.blockNumber);

        // Vérification CampaignKeeper
        console.log("🔍 Vérification CampaignKeeper...");
        const divarProxyInKeeper = await campaignKeeper.divarProxy();
        const lastCheckTime = await campaignKeeper.lastCheckTime();
        console.log("✅ DivarProxy référencé:", divarProxyInKeeper);
        console.log("✅ LastCheckTime:", lastCheckTime.toString());

        console.log("\n=== 📋 ÉTAPE 4: MISE À JOUR CAMPAIGNKEEPER DANS PROXY ===");
        console.log("🔄 Remplacement du keeper temporaire...");
        console.log("   Ancien keeper:", await divarProxy.campaignKeeper());
        console.log("   Nouveau keeper:", campaignKeeper.address);
        
        console.log("📤 Envoi transaction setCampaignKeeper...");
        const updateKeeperTx = await divarProxy.setCampaignKeeper(campaignKeeper.address);
        console.log("📤 Transaction envoyée, hash:", updateKeeperTx.hash);
        
        console.log("⏳ Attente de confirmation...");
        const keeperUpdateReceipt = await updateKeeperTx.wait();
        console.log("✅ CampaignKeeper mis à jour dans DivarProxy !");
        console.log("🧾 Hash transaction:", keeperUpdateReceipt.transactionHash);
        console.log("⛽ Gas utilisé:", keeperUpdateReceipt.gasUsed.toString());

        // Vérification mise à jour
        const newKeeperInProxy = await divarProxy.campaignKeeper();
        console.log("🔍 Vérification:", newKeeperInProxy === campaignKeeper.address ? "✅ Correct" : "❌ Erreur");

        console.log("\n=== 📋 ÉTAPE 5: CONFIGURATION BYTECODE CAMPAIGN ===");
        console.log("⏳ Préparation du bytecode Campaign...");
        
        const Campaign = await ethers.getContractFactory("Campaign");
        console.log("📦 Factory Campaign créé");
        console.log("🔧 Bytecode Campaign size:", Campaign.bytecode.length, "bytes");
        console.log("📊 Bytecode preview:", Campaign.bytecode.substring(0, 100) + "...");
        
        if (Campaign.bytecode.length === 0) {
            throw new Error("❌ Bytecode Campaign vide !");
        }
        
        console.log("📤 Envoi du bytecode Campaign au proxy...");
        const setBytecodesTx = await divarProxy.setCampaignBytecode(Campaign.bytecode);
        console.log("📤 Transaction setCampaignBytecode envoyée, hash:", setBytecodesTx.hash);
        
        console.log("⏳ Attente de confirmation...");
        const bytecodeReceipt = await setBytecodesTx.wait();
        console.log("✅ Bytecode Campaign configuré dans DivarProxy !");
        console.log("🧾 Hash transaction:", bytecodeReceipt.transactionHash);
        console.log("⛽ Gas utilisé:", bytecodeReceipt.gasUsed.toString());

        console.log("\n=== 📋 ÉTAPE 6: VÉRIFICATIONS FINALES ===");
        console.log("🔍 Vérification de l'état final du système...");
        
        // Test des frais de création
        try {
            const creationFee = await divarProxy.getCampaignCreationFeeETH();
            console.log("💰 Frais de création campagne:", ethers.utils.formatEther(creationFee), "ETH");
        } catch (e) {
            console.log("⚠️  Frais de création non disponibles:", e.message);
        }
        
        // Test liste des campagnes
        const allCampaigns = await divarProxy.getAllCampaigns();
        console.log("📋 Nombre de campagnes existantes:", allCampaigns.length);
        
        // Vérification version
        const version = await divarProxy.getVersion();
        console.log("🏷️  Version DivarProxy:", version);

        // Balance finale
        const finalBalance = await deployer.getBalance();
        const gasSpent = initialBalance.sub(finalBalance);
        console.log("💰 Balance finale:", ethers.utils.formatEther(finalBalance), "ETH");
        console.log("⛽ Total gas dépensé:", ethers.utils.formatEther(gasSpent), "ETH");

        console.log("\n🎉 DÉPLOIEMENT COMPLET RÉUSSI !");
        console.log("===============================");
        console.log("✅ PriceConsumerV3:  ", priceConsumer.address);
        console.log("✅ DivarProxy:       ", divarProxy.address);
        console.log("✅ CampaignKeeper:   ", campaignKeeper.address);
        console.log("");
        console.log("🔗 Configuration:");
        console.log("   Treasury:         ", treasuryAddress);
        console.log("   Bytecode configuré: ✅");
        console.log("   Keeper configuré:   ✅");
        console.log("   Prix feed configuré: ✅");
        console.log("");
        console.log("🚀 Le système Livar est maintenant ENTIÈREMENT opérationnel sur Base Sepolia !");
        console.log("📝 Vous pouvez maintenant créer des campagnes via DivarProxy.createCampaign()");
        
    } catch (error) {
        console.error("\n💥 ERREUR CRITIQUE LORS DU DÉPLOIEMENT !");
        console.error("==========================================");
        console.error("❌ Message:", error.message);
        
        if (error.transaction) {
            console.error("📤 Transaction qui a échoué:");
            console.error("   Hash:", error.transaction.hash);
            console.error("   From:", error.transaction.from);
            console.error("   To:", error.transaction.to);
            console.error("   Value:", ethers.utils.formatEther(error.transaction.value || 0), "ETH");
        }
        
        if (error.receipt) {
            console.error("🧾 Receipt:");
            console.error("   Status:", error.receipt.status);
            console.error("   Gas used:", error.receipt.gasUsed?.toString());
            console.error("   Block:", error.receipt.blockNumber);
        }
        
        console.error("📚 Stack trace:", error.stack);
        process.exit(1);
    }
}

main()
    .then(() => {
        console.log("\n✅ Script terminé avec succès !");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n💥 Erreur fatale:", error);
        process.exit(1);
    });