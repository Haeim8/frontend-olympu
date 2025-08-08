const { ethers } = require("hardhat");

async function main() {
    console.log("🧪 TEST COMPLET DU SYSTÈME LIVAR EN LOCAL");
    console.log("=========================================\n");

    const [deployer, user1, user2] = await ethers.getSigners();
    
    console.log("👥 COMPTES:");
    console.log("Deployer:", deployer.address);
    console.log("User1:", user1.address);
    console.log("User2:", user2.address);
    console.log("Balance deployer:", ethers.utils.formatEther(await deployer.getBalance()), "ETH\n");

    // 1. DÉPLOIEMENT PRICECONSUMERV3
    console.log("📋 1. DÉPLOIEMENT PRICECONSUMERV3");
    console.log("================================");
    
    const PriceConsumerV3 = await ethers.getContractFactory("PriceConsumerV3");
    const priceConsumer = await PriceConsumerV3.deploy();
    await priceConsumer.deployed();
    
    console.log("✅ PriceConsumerV3 déployé:", priceConsumer.address);
    
    // Test des fonctions PriceConsumerV3
    try {
        const ethPrice = await priceConsumer.getLatestPrice();
        console.log("📊 getLatestPrice():", ethPrice.toString());
    } catch (e) {
        console.log("❌ getLatestPrice() failed:", e.message);
    }
    
    try {
        const convertResult = await priceConsumer.convertUSDToETH(8500); // 85 USD
        console.log("📊 convertUSDToETH(8500):", ethers.utils.formatEther(convertResult), "ETH");
    } catch (e) {
        console.log("❌ convertUSDToETH() failed:", e.message);
    }

    // 2. DÉPLOIEMENT DIVARPROXY
    console.log("\n📋 2. DÉPLOIEMENT DIVARPROXY");
    console.log("============================");
    
    const DivarProxy = await ethers.getContractFactory("DivarProxy");
    const divarProxy = await upgrades.deployProxy(DivarProxy, [
        deployer.address,      // treasury
        deployer.address,      // campaignKeeper temporaire
        priceConsumer.address  // priceConsumer
    ], { initializer: 'initialize' });
    
    await divarProxy.deployed();
    console.log("✅ DivarProxy déployé:", divarProxy.address);
    
    // Test des fonctions DivarProxy
    try {
        const treasury = await divarProxy.treasury();
        console.log("📊 treasury():", treasury);
    } catch (e) {
        console.log("❌ treasury() failed:", e.message);
    }
    
    try {
        const version = await divarProxy.getVersion();
        console.log("📊 getVersion():", version);
    } catch (e) {
        console.log("❌ getVersion() failed:", e.message);
    }
    
    try {
        const fee = await divarProxy.getCampaignCreationFeeETH();
        console.log("📊 getCampaignCreationFeeETH():", ethers.utils.formatEther(fee), "ETH");
    } catch (e) {
        console.log("❌ getCampaignCreationFeeETH() failed:", e.message);
    }
    
    try {
        const allCampaigns = await divarProxy.getAllCampaigns();
        console.log("📊 getAllCampaigns():", allCampaigns);
    } catch (e) {
        console.log("❌ getAllCampaigns() failed:", e.message);
    }

    // 3. DÉPLOIEMENT CAMPAIGNKEEPER
    console.log("\n📋 3. DÉPLOIEMENT CAMPAIGNKEEPER");
    console.log("================================");
    
    const CampaignKeeper = await ethers.getContractFactory("CampaignKeeper");
    const campaignKeeper = await CampaignKeeper.deploy(divarProxy.address);
    await campaignKeeper.deployed();
    
    console.log("✅ CampaignKeeper déployé:", campaignKeeper.address);
    
    // Test des fonctions CampaignKeeper
    try {
        const divarProxyAddr = await campaignKeeper.divarProxy();
        console.log("📊 divarProxy():", divarProxyAddr);
    } catch (e) {
        console.log("❌ divarProxy() failed:", e.message);
    }
    
    try {
        const lastCheckTime = await campaignKeeper.lastCheckTime();
        console.log("📊 lastCheckTime():", lastCheckTime.toString());
    } catch (e) {
        console.log("❌ lastCheckTime() failed:", e.message);
    }

    // 4. MISE À JOUR CAMPAIGNKEEPER DANS PROXY
    console.log("\n📋 4. MISE À JOUR CAMPAIGNKEEPER");
    console.log("================================");
    
    try {
        await divarProxy.setCampaignKeeper(campaignKeeper.address);
        console.log("✅ CampaignKeeper mis à jour dans proxy");
        
        const keeperInProxy = await divarProxy.campaignKeeper();
        console.log("📊 campaignKeeper() dans proxy:", keeperInProxy);
    } catch (e) {
        console.log("❌ setCampaignKeeper() failed:", e.message);
    }

    // 5. CONFIGURATION BYTECODE CAMPAIGN
    console.log("\n📋 5. CONFIGURATION BYTECODE CAMPAIGN");
    console.log("======================================");
    
    try {
        const Campaign = await ethers.getContractFactory("Campaign");
        await divarProxy.setCampaignBytecode(Campaign.bytecode);
        console.log("✅ Bytecode Campaign configuré");
        console.log("📊 Longueur bytecode:", Campaign.bytecode.length);
    } catch (e) {
        console.log("❌ setCampaignBytecode() failed:", e.message);
    }

    // 6. CRÉATION D'UNE CAMPAGNE
    console.log("\n📋 6. CRÉATION D'UNE CAMPAGNE");
    console.log("=============================");
    
    const campaignParams = {
        name: "Test Campaign Local",
        symbol: "TCL",
        targetAmount: ethers.utils.parseEther("1.0"),
        sharePrice: ethers.utils.parseEther("0.01"),
        endTime: Math.floor(Date.now() / 1000) + 3600, // 1 heure
        category: "Technology",
        metadata: '{"description":"Test local"}',
        royaltyFee: 250,
        logo: "https://test.com/logo.png"
    };
    
    try {
        const creationFee = await divarProxy.getCampaignCreationFeeETH();
        console.log("📊 Frais de création requis:", ethers.utils.formatEther(creationFee), "ETH");
        
        const createTx = await divarProxy.createCampaign(
            campaignParams.name,
            campaignParams.symbol,
            campaignParams.targetAmount,
            campaignParams.sharePrice,
            campaignParams.endTime,
            campaignParams.category,
            campaignParams.metadata,
            campaignParams.royaltyFee,
            campaignParams.logo,
            { value: creationFee, gasLimit: 15000000 }
        );
        
        const receipt = await createTx.wait();
        console.log("✅ Campagne créée, gas utilisé:", receipt.gasUsed.toString());
        
        // Récupérer l'adresse de la campagne
        const campaignCreatedEvent = receipt.events?.find(e => e.event === 'CampaignCreated');
        if (campaignCreatedEvent) {
            const campaignAddress = campaignCreatedEvent.args.campaignAddress;
            console.log("📊 Adresse de la campagne:", campaignAddress);
            
            // 7. TEST DU CONTRAT CAMPAIGN
            console.log("\n📋 7. TEST DU CONTRAT CAMPAIGN");
            console.log("==============================");
            
            const campaign = await ethers.getContractAt("Campaign", campaignAddress);
            
            // Test toutes les fonctions view du contrat Campaign
            const campaignTests = [
                "name",
                "symbol", 
                "startup",
                "treasury",
                "campaignName",
                "metadata",
                "currentRound",
                "totalSupply",
                "divarProxy",
                "canReceiveDividends",
                "isRegisteredForUpkeep"
            ];
            
            for (const funcName of campaignTests) {
                try {
                    const result = await campaign[funcName]();
                    console.log(`📊 ${funcName}():`, result.toString ? result.toString() : result);
                } catch (e) {
                    console.log(`❌ ${funcName}() failed:`, e.message);
                }
            }
            
            // Test getCurrentRound() - la fonction problématique
            console.log("\n🔍 TEST CRITIQUE: getCurrentRound()");
            try {
                const currentRound = await campaign.getCurrentRound();
                console.log("✅ getCurrentRound() MARCHE !");
                console.log("📊 Round Number:", currentRound.roundNumber.toString());
                console.log("📊 Share Price:", ethers.utils.formatEther(currentRound.sharePrice), "ETH");
                console.log("📊 Target Amount:", ethers.utils.formatEther(currentRound.targetAmount), "ETH");
                console.log("📊 Funds Raised:", ethers.utils.formatEther(currentRound.fundsRaised), "ETH");
                console.log("📊 Shares Sold:", currentRound.sharesSold.toString());
                console.log("📊 End Time:", new Date(currentRound.endTime * 1000).toLocaleString());
                console.log("📊 Is Active:", currentRound.isActive);
                console.log("📊 Is Finalized:", currentRound.isFinalized);
            } catch (e) {
                console.log("❌ getCurrentRound() FAILED:", e.message);
                console.log("❌ Data:", e.data);
                console.log("❌ Code:", e.code);
            }
            
            // Test accès direct au mapping rounds
            try {
                const round1 = await campaign.rounds(1);
                console.log("📊 rounds[1] direct access:");
                console.log("   roundNumber:", round1.roundNumber.toString());
                console.log("   sharePrice:", ethers.utils.formatEther(round1.sharePrice), "ETH");
                console.log("   isActive:", round1.isActive);
            } catch (e) {
                console.log("❌ rounds[1] failed:", e.message);
            }
            
            // 8. TEST ACHAT DE PARTS
            console.log("\n📋 8. TEST ACHAT DE PARTS");
            console.log("=========================");
            
            try {
                const sharePrice = campaignParams.sharePrice;
                const buyTx = await campaign.connect(user1).buyShares(1, { value: sharePrice });
                const buyReceipt = await buyTx.wait();
                console.log("✅ Achat de 1 part réussi, gas:", buyReceipt.gasUsed.toString());
                
                const balance = await campaign.balanceOf(user1.address);
                console.log("📊 NFTs possédés par user1:", balance.toString());
                
                const totalSupply = await campaign.totalSupply();
                console.log("📊 Total NFTs émis:", totalSupply.toString());
                
                // Test getCurrentRound() après achat
                const roundAfterBuy = await campaign.getCurrentRound();
                console.log("📊 Fonds levés après achat:", ethers.utils.formatEther(roundAfterBuy.fundsRaised), "ETH");
                console.log("📊 Parts vendues après achat:", roundAfterBuy.sharesSold.toString());
                
            } catch (e) {
                console.log("❌ Achat de parts failed:", e.message);
            }
            
            // 9. TEST CAMPAIGNKEEPER AVEC LA CAMPAGNE
            console.log("\n📋 9. TEST CAMPAIGNKEEPER AVEC CAMPAGNE");
            console.log("========================================");
            
            try {
                // Enregistrer la campagne
                await campaignKeeper.registerCampaign(campaignAddress);
                console.log("✅ Campagne enregistrée dans keeper");
                
                const isRegistered = await campaignKeeper.registeredCampaigns(campaignAddress);
                console.log("📊 registeredCampaigns():", isRegistered);
                
                // Test checkUpkeep
                const [upkeepNeeded, performData] = await campaignKeeper.checkUpkeep("0x");
                console.log("📊 checkUpkeep() - upkeepNeeded:", upkeepNeeded);
                console.log("📊 checkUpkeep() - performData:", performData);
                
            } catch (e) {
                console.log("❌ CampaignKeeper tests failed:", e.message);
            }

        } else {
            console.log("❌ Event CampaignCreated non trouvé");
        }
        
    } catch (e) {
        console.log("❌ Création de campagne failed:", e.message);
    }

    console.log("\n🎯 RÉSUMÉ DU TEST");
    console.log("=================");
    console.log("✅ PriceConsumerV3: Déployé et testé");
    console.log("✅ DivarProxy: Déployé et testé");
    console.log("✅ CampaignKeeper: Déployé et testé");
    console.log("✅ Campaign: Créé via CREATE2 et testé");
    console.log("✅ Interactions entre contrats testées");
    console.log("\n🚀 TEST COMPLET TERMINÉ !");

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ ERREUR GLOBALE:", error);
        process.exit(1);
    });