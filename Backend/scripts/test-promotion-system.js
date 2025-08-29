const { ethers } = require("hardhat");

async function main() {
    console.log("🔄 TEST SYSTÈME PROMOTION + SIMULATION SUPABASE");
    console.log("================================================");
    
    // Adresses déployées sur Base Sepolia
    const DIVAR_PROXY_ADDRESS = "0xaB0999Eae920849a41A55eA080d0a4a210156817";
    const REC_PROMOTION_MANAGER_ADDRESS = "0x85cD8153659d61866F1e6CFdb9896f6195a707d2";
    
    try {
        const [deployer, user1] = await ethers.getSigners();
        console.log("Deployer:", deployer.address);
        console.log("User1 (Campaign Creator):", user1.address);
        console.log("Balance Deployer:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");
        console.log("Balance User1:", ethers.utils.formatEther(await user1.getBalance()), "ETH");
        
        // Transférer ETH à user1 si nécessaire
        const user1Balance = await user1.getBalance();
        const minRequired = ethers.utils.parseEther("0.05"); // 0.05 ETH minimum
        
        if (user1Balance.lt(minRequired)) {
            console.log("\n💰 Transfer ETH à user1...");
            const transferAmount = ethers.utils.parseEther("0.05");
            const transferTx = await deployer.sendTransaction({
                to: user1.address,
                value: transferAmount
            });
            await transferTx.wait();
            console.log("✅ Transféré", ethers.utils.formatEther(transferAmount), "ETH à user1");
            console.log("Nouveau balance user1:", ethers.utils.formatEther(await user1.getBalance()), "ETH");
        }
        
        // ========== 1. CRÉER UNE CAMPAGNE TEST ==========
        console.log("\n🏗️ CRÉATION CAMPAGNE TEST...");
        
        const divarProxy = await ethers.getContractAt("DivarProxy", DIVAR_PROXY_ADDRESS);
        
        // Configuration campagne avec micro-valeurs
        const campaignName = "TestPromo Campaign";
        const campaignSymbol = "TPC";
        const targetAmount = ethers.utils.parseEther("0.00001"); // 0.00001 ETH
        const sharePrice = ethers.utils.parseEther("0.000001"); // 0.000001 ETH
        const endTime = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 jours
        const category = "Tech";
        const metadata = "Test promotion campaign";
        const royaltyFee = 500; // 5%
        const logo = "https://example.com/logo.png";
        
        // Configuration NFT
        const nftBackgroundColor = "#FF6B35";
        const nftTextColor = "#FFFFFF";
        const nftLogoUrl = "https://example.com/nft-logo.svg";
        const nftSector = "Promotion";
        
        const deploymentFee = await divarProxy.getCampaignCreationFeeETH();
        console.log("Frais de déploiement:", ethers.utils.formatEther(deploymentFee), "ETH");
        
        const createTx = await divarProxy.connect(user1).createCampaign(
            campaignName, campaignSymbol, targetAmount, sharePrice, endTime,
            category, metadata, royaltyFee, logo,
            nftBackgroundColor, nftTextColor, nftLogoUrl, nftSector,
            { value: deploymentFee }
        );
        
        const receipt = await createTx.wait();
        const campaignAddress = receipt.events.find(e => e.event === "CampaignCreated").args.campaignAddress;
        
        console.log("✅ Campagne créée:", campaignAddress);
        
        // ========== 2. VÉRIFIER RECPROMOTIONMANAGER ==========
        console.log("\n🔍 VÉRIFICATION RECPROMOTIONMANAGER...");
        
        const promotionManager = await ethers.getContractAt("RecPromotionManager", REC_PROMOTION_MANAGER_ADDRESS);
        console.log("RecPromotionManager Address:", REC_PROMOTION_MANAGER_ADDRESS);
        
        // Vérifier la configuration
        const recProxy = await promotionManager.recProxy();
        const treasury = await promotionManager.treasury();
        const priceConsumer = await promotionManager.priceConsumer();
        
        console.log("Configuration RecPromotionManager:");
        console.log("- RecProxy:", recProxy);
        console.log("- Treasury:", treasury);
        console.log("- PriceConsumer:", priceConsumer);
        
        // ========== 3. OBTENIR LES PRIX DES BOOSTS ==========
        console.log("\n💰 PRIX DES BOOSTS...");
        
        const [featuredETH, trendingETH, spotlightETH] = await promotionManager.getAllBoostPrices();
        
        console.log("Prix des boosts:");
        console.log("- FEATURED (24h):", ethers.utils.formatEther(featuredETH), "ETH");
        console.log("- TRENDING (7j):", ethers.utils.formatEther(trendingETH), "ETH");
        console.log("- SPOTLIGHT (30j):", ethers.utils.formatEther(spotlightETH), "ETH");
        
        // ========== 4. PROMOUVOIR LA CAMPAGNE ==========
        console.log("\n🚀 PROMOTION CAMPAGNE...");
        
        // Test avec FEATURED (boost type 0) - moins cher
        const boostType = 0; // FEATURED
        const boostPrice = featuredETH;
        
        console.log(`Promotion ${campaignAddress} avec boost FEATURED (${ethers.utils.formatEther(boostPrice)} ETH)`);
        
        const promoteTx = await promotionManager.connect(user1).promoteCampaign(
            campaignAddress,
            boostType,
            { value: boostPrice }
        );
        
        const promoteReceipt = await promoteTx.wait();
        console.log("✅ Promotion effectuée !");
        console.log("Transaction:", promoteTx.hash);
        console.log("Gas utilisé:", promoteReceipt.gasUsed.toString());
        
        // ========== 5. EXTRAIRE L'ÉVÉNEMENT CAMPAIGNPROMOTED ==========
        console.log("\n📊 EXTRACTION ÉVÉNEMENT...");
        
        const promotedEvent = promoteReceipt.events.find(e => e.event === "CampaignPromoted");
        if (promotedEvent) {
            const eventData = {
                campaignAddress: promotedEvent.args.campaignAddress,
                creator: promotedEvent.args.creator,
                boostType: promotedEvent.args.boostType.toString(),
                roundNumber: promotedEvent.args.roundNumber.toString(),
                ethAmount: ethers.utils.formatEther(promotedEvent.args.ethAmount),
                startTime: new Date(promotedEvent.args.startTime * 1000).toISOString(),
                endTime: new Date(promotedEvent.args.endTime * 1000).toISOString(),
                timestamp: new Date(promotedEvent.args.timestamp * 1000).toISOString()
            };
            
            console.log("Données événement CampaignPromoted:");
            console.log(JSON.stringify(eventData, null, 2));
            
            // ========== 6. SIMULATION SUPABASE ==========
            console.log("\n🗄️ SIMULATION INSERTION SUPABASE...");
            
            // Mapping BoostType enum → string pour Supabase
            const boostTypeMapping = {
                "0": "featured",
                "1": "trending", 
                "2": "spotlight"
            };
            
            const supabaseData = {
                campaign_address: eventData.campaignAddress.toLowerCase(),
                creator: eventData.creator.toLowerCase(),
                boost_type: boostTypeMapping[eventData.boostType],
                round_number: parseInt(eventData.roundNumber),
                eth_amount: eventData.ethAmount,
                start_timestamp: eventData.startTime,
                end_timestamp: eventData.endTime,
                created_at: eventData.timestamp,
                is_active: true,
                expired_at: null,
                tx_hash: promoteTx.hash
            };
            
            console.log("Données pour table 'campaign_promotions':");
            console.log(JSON.stringify(supabaseData, null, 2));
            
            // Données pour vue 'active_promotions'
            const activePromotionData = {
                campaign_address: supabaseData.campaign_address,
                round_number: supabaseData.round_number,
                boost_type: supabaseData.boost_type,
                end_timestamp: supabaseData.end_timestamp
            };
            
            console.log("\nDonnées pour vue 'active_promotions':");
            console.log(JSON.stringify(activePromotionData, null, 2));
            
        } else {
            console.log("❌ Événement CampaignPromoted non trouvé");
        }
        
        // ========== 7. VÉRIFIER LA PROMOTION ACTIVE ==========
        console.log("\n✅ VÉRIFICATION PROMOTION ACTIVE...");
        
        const campaign = await ethers.getContractAt("Campaign", campaignAddress);
        const currentRound = await campaign.currentRound();
        
        const isActive = await promotionManager.isPromotionActive(campaignAddress, currentRound);
        console.log("Promotion active:", isActive);
        
        const activePromotion = await promotionManager.getActivePromotion(campaignAddress, currentRound);
        console.log("Détails promotion active:");
        console.log("- Campagne:", activePromotion.campaignAddress);
        console.log("- Type boost:", activePromotion.boostType.toString());
        console.log("- Round:", activePromotion.roundNumber.toString());
        console.log("- Montant ETH:", ethers.utils.formatEther(activePromotion.ethAmount));
        console.log("- Début:", new Date(activePromotion.startTime * 1000).toLocaleString());
        console.log("- Fin:", new Date(activePromotion.endTime * 1000).toLocaleString());
        console.log("- Active:", activePromotion.isActive);
        
        // ========== 8. TEST GETACTIVEPROMOTIONS ==========
        console.log("\n📋 TEST GETACTIVEPROMOTIONS...");
        
        const allActivePromotions = await promotionManager.getActivePromotions();
        console.log(`Nombre de promotions actives: ${allActivePromotions.length}`);
        
        allActivePromotions.forEach((promo, index) => {
            console.log(`\nPromotion ${index + 1}:`);
            console.log("- Campagne:", promo.campaignAddress);
            console.log("- Type:", promo.boostType.toString());
            console.log("- Round:", promo.roundNumber.toString());
            console.log("- Fin:", new Date(promo.endTime * 1000).toLocaleString());
        });
        
        // ========== 9. SIMULATION RÉPONSE FRONTEND ==========
        console.log("\n🖥️ SIMULATION RÉPONSE FRONTEND...");
        
        // Mapping BoostType enum → string pour frontend
        const boostTypeMapping = {
            "0": "featured",
            "1": "trending", 
            "2": "spotlight"
        };
        
        // Simuler PromotionService.getActivePromotions()
        const frontendActivePromotions = allActivePromotions.map(promo => ({
            campaign_address: promo.campaignAddress.toLowerCase(),
            round_number: promo.roundNumber.toString(),
            boost_type: boostTypeMapping[promo.boostType.toString()],
            end_timestamp: new Date(promo.endTime * 1000).toISOString()
        }));
        
        console.log("Réponse simulée PromotionService.getActivePromotions():");
        console.log(JSON.stringify(frontendActivePromotions, null, 2));
        
        // Simuler PromotionService.isCampaignBoosted()
        const campaignBoosted = {
            isBoosted: true,
            boostType: boostTypeMapping[activePromotion.boostType.toString()],
            endTime: new Date(activePromotion.endTime * 1000)
        };
        
        console.log("\nRéponse simulée PromotionService.isCampaignBoosted():");
        console.log(JSON.stringify(campaignBoosted, null, 2));
        
        console.log("\n🎉 TEST PROMOTION SYSTÈME TERMINÉ AVEC SUCCÈS !");
        
    } catch (error) {
        console.error("❌ Erreur:", error.message);
        if (error.reason) console.error("Raison:", error.reason);
    }
}

main().catch(console.error);