const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 === VÉRIFICATION PRÉREQUIS UPGRADE ===");
    console.log("=" .repeat(50));

    // Configuration
    const PROXY_ADDRESS = "0x89Eba0c82c1f16433473A9A06690BfaAC2c7a1b4";
    const NETWORK = process.env.HARDHAT_NETWORK || "sepoliaBase";
    
    console.log(`🌐 Network: ${NETWORK}`);
    console.log(`📍 Proxy: ${PROXY_ADDRESS}`);

    let checks = {
        connection: false,
        balance: false,
        proxy: false,
        owner: false,
        keeper: false,
        compilation: false,
        ready: false
    };

    try {
        // === CHECK 1: CONNECTION RÉSEAU ===
        console.log("\n🔍 CHECK 1: Connection réseau");
        const [deployer] = await ethers.getSigners();
        const network = await ethers.provider.getNetwork();
        
        console.log(`✅ Connecté à: ${network.name} (chainId: ${network.chainId})`);
        console.log(`👤 Adresse déployeur: ${deployer.address}`);
        checks.connection = true;

        // === CHECK 2: SOLDE SUFFISANT ===
        console.log("\n🔍 CHECK 2: Solde déployeur");
        const balance = await ethers.provider.getBalance(deployer.address);
        const balanceETH = parseFloat(ethers.utils.formatEther(balance));
        
        console.log(`💰 Solde: ${balanceETH.toFixed(4)} ETH`);
        
        if (balanceETH > 0.01) {
            console.log("✅ Solde suffisant pour upgrade");
            checks.balance = true;
        } else {
            console.log("❌ Solde insuffisant (besoin ~0.01 ETH)");
        }

        // === CHECK 3: ACCÈS PROXY ===
        console.log("\n🔍 CHECK 3: Accès proxy DivarProxy");
        try {
            const DivarProxy = await ethers.getContractFactory("DivarProxy");
            const proxy = DivarProxy.attach(PROXY_ADDRESS);
            
            const version = await proxy.getVersion();
            const campaigns = await proxy.getAllCampaigns();
            
            console.log(`✅ Proxy accessible - Version: ${version}`);
            console.log(`📊 Campagnes existantes: ${campaigns.length}`);
            checks.proxy = true;
            
        } catch (e) {
            console.log(`❌ Proxy inaccessible: ${e.message.split('\n')[0]}`);
        }

        // === CHECK 4: DROITS OWNER ===
        console.log("\n🔍 CHECK 4: Droits owner sur proxy");
        try {
            const DivarProxy = await ethers.getContractFactory("DivarProxy");
            const proxy = DivarProxy.attach(PROXY_ADDRESS);
            
            const owner = await proxy.owner();
            console.log(`👑 Owner actuel: ${owner}`);
            
            if (owner.toLowerCase() === deployer.address.toLowerCase()) {
                console.log("✅ Tu es owner du proxy");
                checks.owner = true;
            } else {
                console.log("❌ Tu n'es PAS owner du proxy");
                console.log("   Solution: Utilise l'adresse owner ou demande transfert");
            }
            
        } catch (e) {
            console.log(`❌ Impossible vérifier owner: ${e.message.split('\n')[0]}`);
        }

        // === CHECK 5: CAMPAIGN KEEPER ===
        console.log("\n🔍 CHECK 5: CampaignKeeper état");
        try {
            const DivarProxy = await ethers.getContractFactory("DivarProxy");
            const proxy = DivarProxy.attach(PROXY_ADDRESS);
            
            const keeperAddr = await proxy.campaignKeeper();
            console.log(`🤖 CampaignKeeper: ${keeperAddr}`);
            
            // Vérifier si le keeper supporte les nouvelles fonctions
            const CampaignKeeper = await ethers.getContractFactory("CampaignKeeper");
            const keeper = CampaignKeeper.attach(keeperAddr);
            
            try {
                await keeper.getDAOForCampaign(ethers.constants.AddressZero);
                console.log("✅ CampaignKeeper supporte déjà les DAOs");
                checks.keeper = true;
            } catch (e) {
                console.log("⚠️ CampaignKeeper doit être mis à jour");
                console.log("   → Sera déployé automatiquement pendant upgrade");
                checks.keeper = true; // On peut le corriger
            }
            
        } catch (e) {
            console.log(`❌ CampaignKeeper check failed: ${e.message.split('\n')[0]}`);
        }

        // === CHECK 6: COMPILATION ===
        console.log("\n🔍 CHECK 6: Compilation des contrats");
        try {
            const Campaign = await ethers.getContractFactory("Campaign");
            const CampaignDAO = await ethers.getContractFactory("CampaignDAO");
            const LiveSessionManager = await ethers.getContractFactory("LiveSessionManager");
            const CampaignGovernance = await ethers.getContractFactory("CampaignGovernance");
            
            console.log("✅ Campaign compilé");
            console.log("✅ CampaignDAO compilé");
            console.log("✅ LiveSessionManager compilé");
            console.log("✅ CampaignGovernance compilé");
            
            // Vérifier bytecode Campaign
            const bytecode = Campaign.bytecode;
            if (bytecode.length > 1000) {
                console.log(`✅ Campaign bytecode prêt (${bytecode.length} chars)`);
                checks.compilation = true;
            }
            
        } catch (e) {
            console.log(`❌ Compilation failed: ${e.message.split('\n')[0]}`);
            console.log("   Solution: npx hardhat compile");
        }

        // === RÉSUMÉ ===
        console.log("\n" + "=".repeat(50));
        console.log("📊 RÉSUMÉ VÉRIFICATIONS");
        console.log("=".repeat(50));

        const checkItems = [
            { name: "Connection réseau", status: checks.connection },
            { name: "Solde suffisant", status: checks.balance },
            { name: "Accès proxy", status: checks.proxy },
            { name: "Droits owner", status: checks.owner },
            { name: "CampaignKeeper", status: checks.keeper },
            { name: "Compilation", status: checks.compilation }
        ];

        checkItems.forEach(check => {
            const icon = check.status ? "✅" : "❌";
            console.log(`${icon} ${check.name}`);
        });

        const allGood = checkItems.every(check => check.status);
        checks.ready = allGood;

        console.log("\n" + "=".repeat(50));
        if (allGood) {
            console.log("🎉 PRÊT POUR UPGRADE !");
            console.log("Tu peux lancer:");
            console.log("npx hardhat run scripts/upgrade-complete-system.js --network sepoliaBase");
        } else {
            console.log("⚠️ CORRECTIONS NÉCESSAIRES AVANT UPGRADE");
            console.log("Corrige les points ❌ ci-dessus");
        }

        // === PREVIEW UPGRADE ===
        if (allGood) {
            console.log("\n📋 PREVIEW UPGRADE:");
            console.log("1. 🆕 Déployer LiveSessionManager");
            console.log("2. 🔄 Upgrade/vérifier CampaignKeeper");
            console.log("3. ⬆️ Upgrade DivarProxy (si nécessaire)");
            console.log("4. 📦 Mettre à jour Campaign bytecode");
            console.log("5. 🧪 Tests de validation");
            console.log("6. 💾 Sauvegarde addresses");
            
            console.log("\n🆕 NOUVEAUX CONTRATS QUI SERONT DISPONIBLES:");
            console.log("• CampaignDAO - Gestion phases DAO avec live");
            console.log("• CampaignGovernance - Votes NFT communauté");
            console.log("• LiveSessionManager - Sessions live obligatoires");
            
            console.log("\n🔧 FONCTIONNALITÉS QUI SERONT CORRIGÉES:");
            console.log("• Bug critique remboursement après live");
            console.log("• Règles multi-rounds");
            console.log("• Intégration Chainlink pour DAOs");
        }

    } catch (error) {
        console.error("❌ Erreur pendant vérifications:", error.message);
        checks.ready = false;
    }

    process.exit(checks.ready ? 0 : 1);
}

main().catch((error) => {
    console.error("💥 Fatal error:", error);
    process.exit(1);
});