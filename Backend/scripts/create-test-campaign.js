const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 CRÉATION D'UNE CAMPAGNE DE TEST");
    console.log("=================================");
    console.log("📅 Timestamp:", new Date().toLocaleString());
    console.log("🌐 Network:", await ethers.provider.getNetwork());
    
    // Adresses des contrats déployés
    const DIVAR_PROXY_ADDRESS = "0x89Eba0c82c1f16433473A9A06690BfaAC2c7a1b4";
    
    try {
        const [creator] = await ethers.getSigners();
        console.log("\n=== 👥 INFORMATIONS CRÉATEUR ===");
        console.log("🔑 Créateur:", creator.address);
        const balance = await creator.getBalance();
        console.log("💰 Balance:", ethers.utils.formatEther(balance), "ETH");
        
        // Connexion au contrat DivarProxy
        console.log("\n=== 📋 CONNEXION AU PROXY ===");
        const divarProxy = await ethers.getContractAt("DivarProxy", DIVAR_PROXY_ADDRESS);
        console.log("✅ DivarProxy connecté à:", divarProxy.address);
        
        // Vérification des frais
        console.log("\n=== 💰 VÉRIFICATION DES FRAIS ===");
        const creationFee = await divarProxy.getCampaignCreationFeeETH();
        console.log("💳 Frais de création:", ethers.utils.formatEther(creationFee), "ETH");
        
        // Paramètres de la campagne
        console.log("\n=== 📊 PARAMÈTRES DE LA CAMPAGNE ===");
        
        const campaignParams = {
            name: "TestCampaign Livar Alpha",
            symbol: "TCLA",
            targetAmount: ethers.utils.parseEther("0.0003"), // 0.0003 ETH
            sharePrice: ethers.utils.parseEther("0.00000001"), // 0.00000001 ETH par share
            endTime: Math.floor(Date.now() / 1000) + (5 * 60), // +5 minutes
            category: "Technology",
            metadata: JSON.stringify({
                description: "Campagne de test pour le système Livar Alpha",
                website: "https://livar.com",
                social: {
                    twitter: "@LivarProject",
                    discord: "discord.gg/livar"
                },
                roadmap: [
                    "Phase 1: Test du système de financement",
                    "Phase 2: Validation des investissements",
                    "Phase 3: Distribution des bénéfices"
                ],
                risks: "Ceci est une campagne de test à des fins de développement",
                team: [
                    {
                        name: "Claude AI",
                        role: "Smart Contract Developer",
                        experience: "Expert en développement blockchain"
                    }
                ]
            }),
            royaltyFee: 250, // 2.5%
            logo: "https://via.placeholder.com/150x150/4F46E5/ffffff?text=TCLA"
        };
        
        console.log("📛 Nom:", campaignParams.name);
        console.log("🎯 Symbole:", campaignParams.symbol);
        console.log("💰 Objectif:", ethers.utils.formatEther(campaignParams.targetAmount), "ETH");
        console.log("💎 Prix par share:", ethers.utils.formatEther(campaignParams.sharePrice), "ETH");
        console.log("📅 Fin:", new Date(campaignParams.endTime * 1000).toLocaleString());
        console.log("🏷️  Catégorie:", campaignParams.category);
        console.log("👑 Royalty:", campaignParams.royaltyFee / 100, "%");
        
        // Calcul des shares totales
        const totalShares = campaignParams.targetAmount.div(campaignParams.sharePrice);
        console.log("📈 Shares totales:", totalShares.toString());
        
        // Vérification du budget
        if (balance.lt(creationFee.add(ethers.utils.parseEther("0.01")))) {
            throw new Error(`❌ Balance insuffisante. Requis: ${ethers.utils.formatEther(creationFee.add(ethers.utils.parseEther("0.01")))} ETH`);
        }
        
        console.log("\n=== 🚀 CRÉATION DE LA CAMPAGNE ===");
        console.log("⏳ Envoi de la transaction...");
        
        // Création de la campagne
        const tx = await divarProxy.createCampaign(
            campaignParams.name,
            campaignParams.symbol,
            campaignParams.targetAmount,
            campaignParams.sharePrice,
            campaignParams.endTime,
            campaignParams.category,
            campaignParams.metadata,
            campaignParams.royaltyFee,
            campaignParams.logo,
            {
                value: creationFee,
                gasLimit: 8000000 // 8M gas limit pour être sûr
            }
        );
        
        console.log("📤 Transaction envoyée, hash:", tx.hash);
        console.log("⏳ Attente de confirmation (2 blocs)...");
        
        const receipt = await tx.wait(2);
        console.log("✅ Transaction confirmée !");
        console.log("🧾 Hash:", receipt.transactionHash);
        console.log("⛽ Gas utilisé:", receipt.gasUsed.toString());
        console.log("🧱 Block:", receipt.blockNumber);
        
        // Recherche de l'événement CampaignCreated
        console.log("\n=== 🔍 RECHERCHE DE LA CAMPAGNE CRÉÉE ===");
        const campaignCreatedEvent = receipt.events?.find(
            event => event.event === "CampaignCreated"
        );
        
        if (campaignCreatedEvent) {
            const campaignAddress = campaignCreatedEvent.args.campaignAddress;
            console.log("✅ Campagne créée avec succès !");
            console.log("📍 Adresse de la campagne:", campaignAddress);
            console.log("👤 Créateur:", campaignCreatedEvent.args.creator);
            console.log("📛 Nom:", campaignCreatedEvent.args.name);
            console.log("⏰ Timestamp:", new Date(campaignCreatedEvent.args.timestamp * 1000).toLocaleString());
            
            // Vérification de la campagne
            console.log("\n=== ✅ VÉRIFICATION DE LA CAMPAGNE ===");
            const campaign = await ethers.getContractAt("Campaign", campaignAddress);
            
            const [
                name,
                symbol,
                currentRoundNum,
                totalSupply
            ] = await Promise.all([
                campaign.name(),
                campaign.symbol(),
                campaign.getCurrentRound(),
                campaign.totalSupply()
            ]);

            // Récupérer les données du round actuel
            const roundData = await campaign.rounds(currentRoundNum);
            
            console.log("📊 Vérifications:");
            console.log("  Nom:", name);
            console.log("  Symbole:", symbol);
            console.log("  Round actuel:", currentRoundNum.toString());
            console.log("  Objectif:", ethers.utils.formatEther(roundData.targetAmount), "ETH");
            console.log("  Prix/Share:", ethers.utils.formatEther(roundData.sharePrice), "ETH");
            console.log("  Fonds levés:", ethers.utils.formatEther(roundData.fundsRaised), "ETH");
            console.log("  Shares vendues:", roundData.sharesSold.toString());
            console.log("  Fin:", new Date(roundData.endTime * 1000).toLocaleString());
            console.log("  Round actif:", roundData.isActive);
            console.log("  Shares émises:", totalSupply.toString());
            
            // Vérification dans le registry
            const registry = await divarProxy.campaignRegistry(campaignAddress);
            console.log("📋 Registry:");
            console.log("  Créateur:", registry.creator);
            console.log("  Catégorie:", registry.category);
            console.log("  Active:", registry.isActive);
            
        } else {
            console.log("❌ Événement CampaignCreated non trouvé dans les logs");
        }
        
        // Vérification de la liste globale
        console.log("\n=== 📋 VÉRIFICATION LISTE GLOBALE ===");
        const allCampaigns = await divarProxy.getAllCampaigns();
        console.log("📈 Total campagnes:", allCampaigns.length);
        console.log("📋 Dernière campagne:", allCampaigns[allCampaigns.length - 1]);
        
        console.log("\n🎉 CAMPAGNE DE TEST CRÉÉE AVEC SUCCÈS !");
        console.log("=======================================");
        console.log("✅ Tout fonctionne parfaitement !");
        console.log("🎯 Vous pouvez maintenant tester les investissements");
        console.log("⏰ La campagne se termine dans 5 minutes");
        
    } catch (error) {
        console.error("\n💥 ERREUR LORS DE LA CRÉATION !");
        console.error("==============================");
        console.error("❌ Message:", error.message);
        
        if (error.transaction) {
            console.error("📤 Transaction:");
            console.error("   Hash:", error.transaction.hash);
            console.error("   From:", error.transaction.from);
            console.error("   To:", error.transaction.to);
            console.error("   Value:", ethers.utils.formatEther(error.transaction.value || 0), "ETH");
        }
        
        if (error.receipt) {
            console.error("🧾 Receipt:");
            console.error("   Status:", error.receipt.status);
            console.error("   Gas used:", error.receipt.gasUsed?.toString());
        }
        
        console.error("📚 Stack:", error.stack);
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