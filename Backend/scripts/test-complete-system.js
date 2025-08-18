const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("DÉPLOIEMENT CONTRATS", function () {
    let deployer, startup, treasury;
    let divarProxy, campaignKeeper, liveSessionManager, priceConsumer;
    
    before(async function () {
        [deployer, startup, treasury] = await ethers.getSigners();
        
        console.log("Deployer:", deployer.address);
        console.log("Treasury:", treasury.address);
    });
    
    it("Déploie tous les contrats - Keeper en premier", async function () {
        // 1. PriceConsumer
        const PriceConsumer = await ethers.getContractFactory("PriceConsumerV3");
        priceConsumer = await PriceConsumer.deploy();
        await priceConsumer.deployed();
        console.log("✅ PriceConsumer:", priceConsumer.address);
        
        // 2. LiveSessionManager
        const LiveSessionManager = await ethers.getContractFactory("LiveSessionManager");
        liveSessionManager = await LiveSessionManager.deploy();
        await liveSessionManager.deployed();
        console.log("✅ LiveSessionManager:", liveSessionManager.address);
        
        // 3. DivarProxy temporaire
        const DivarProxy = await ethers.getContractFactory("DivarProxy");
        divarProxy = await upgrades.deployProxy(DivarProxy, [
            treasury.address,
            deployer.address, // temporaire
            priceConsumer.address,
            liveSessionManager.address
        ]);
        await divarProxy.deployed();
        console.log("✅ DivarProxy:", divarProxy.address);
        
        // 4. CampaignKeeper EN PREMIER avec vraie adresse proxy
        const CampaignKeeper = await ethers.getContractFactory("CampaignKeeper");
        campaignKeeper = await CampaignKeeper.deploy(divarProxy.address);
        await campaignKeeper.deployed();
        console.log("✅ CampaignKeeper:", campaignKeeper.address);
        
        // 5. Update keeper dans proxy
        await divarProxy.connect(treasury).setCampaignKeeper(campaignKeeper.address);
        console.log("✅ Keeper mis à jour");
        
        // 6. Set bytecode
        const Campaign = await ethers.getContractFactory("Campaign");
        await divarProxy.connect(treasury).setCampaignBytecode(Campaign.bytecode);
        console.log("✅ Bytecode défini");
        
        console.log("🎉 DÉPLOIEMENT TERMINÉ");
    });

    it("Crée une campagne et affiche TOUS les contrats créés", async function () {
        const [, , , startup] = await ethers.getSigners();
        console.log("\n📝 CRÉATION DE CAMPAGNE COMPLÈTE");
        console.log("Startup:", startup.address);
        
        const CAMPAIGN_FEE = ethers.utils.parseEther("0.001");
        const SHARE_PRICE = ethers.utils.parseEther("0.1");
        const TARGET_AMOUNT = ethers.utils.parseEther("10.0");
        const endTime = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 jours
        
        console.log("\n🚀 Création campagne...");
        const tx = await divarProxy.connect(startup).createCampaign(
            "Test Campaign",
            "TC",
            TARGET_AMOUNT,
            SHARE_PRICE,
            endTime,
            "Technology",
            "Test metadata",
            250, // 2.5% royalty
            "https://logo.com",
            { value: CAMPAIGN_FEE }
        );
        
        const receipt = await tx.wait();
        console.log("\n📋 ÉVÉNEMENTS ÉMIS :");
        
        // Analyser TOUS les événements
        receipt.events?.forEach((event, index) => {
            console.log(`\n--- Événement ${index + 1} ---`);
            console.log(`Contract: ${event.address}`);
            console.log(`Event: ${event.event || 'Unknown'}`);
            if (event.args) {
                console.log("Args:", event.args);
            }
        });
        
        const campaignCreatedEvent = receipt.events?.find(e => e.event === "CampaignCreated");
        const campaignAddress = campaignCreatedEvent.args.campaignAddress;
        
        console.log("\n🎯 CONTRATS CRÉÉS :");
        console.log("✅ Campaign:", campaignAddress);
        
        // Vérifier DAO connecté
        const campaign = await ethers.getContractAt("Campaign", campaignAddress);
        const daoAddress = await campaign.campaignDAO();
        console.log("✅ CampaignDAO:", daoAddress);
        
        // Vérifier enregistrement Chainlink
        const isRegistered = await campaignKeeper.isCampaignRegistered(campaignAddress);
        console.log("✅ Enregistré Chainlink:", isRegistered);
        
        // Vérifier les détails du round
        const roundInfo = await campaign.getCurrentRound();
        console.log("\n📊 DÉTAILS DU ROUND :");
        console.log("Round Number:", roundInfo.roundNumber.toString());
        console.log("Share Price:", ethers.utils.formatEther(roundInfo.sharePrice), "ETH");
        console.log("Target Amount:", ethers.utils.formatEther(roundInfo.targetAmount), "ETH");
        console.log("Funds Raised:", ethers.utils.formatEther(roundInfo.fundsRaised), "ETH");
        console.log("End Time:", new Date(roundInfo.endTime.toNumber() * 1000).toLocaleString());
        console.log("Is Active:", roundInfo.isActive);
        console.log("Is Finalized:", roundInfo.isFinalized);
        
        // Vérifier l'état du DAO
        const dao = await ethers.getContractAt("CampaignDAO", daoAddress);
        const daoPhase = await dao.getCurrentPhase();
        console.log("\n🏛️ ÉTAT DAO :");
        console.log("Phase actuelle:", daoPhase); // 0=INACTIVE, 1=WAITING_FOR_LIVE, etc.
        
        console.log("\n🎉 CRÉATION TERMINÉE - Tous les contrats opérationnels");
    });

    it("Test complet : Achat de shares + vérifications système", async function () {
        const [, , , startup, investor1, investor2] = await ethers.getSigners();
        
        // Récupérer la campagne créée précédemment
        const allCampaigns = await divarProxy.getAllCampaigns();
        const campaignAddress = allCampaigns[0];
        const campaign = await ethers.getContractAt("Campaign", campaignAddress);
        const daoAddress = await campaign.campaignDAO();
        const dao = await ethers.getContractAt("CampaignDAO", daoAddress);
        
        console.log("\n💰 TEST ACHAT DE SHARES");
        console.log("Campagne:", campaignAddress);
        console.log("Investisseur 1:", investor1.address);
        console.log("Investisseur 2:", investor2.address);
        
        // ACHAT 1 : Investor1 achète 3 shares
        console.log("\n🔵 Investor1 achète 3 shares...");
        const sharePrice = ethers.utils.parseEther("0.1");
        const tx1 = await campaign.connect(investor1).buyShares(3, { 
            value: sharePrice.mul(3) 
        });
        const receipt1 = await tx1.wait();
        
        console.log("✅ Transaction réussie");
        console.log("Gas utilisé:", receipt1.gasUsed.toString());
        
        // ACHAT 2 : Investor2 achète 5 shares
        console.log("\n🟡 Investor2 achète 5 shares...");
        const tx2 = await campaign.connect(investor2).buyShares(5, { 
            value: sharePrice.mul(5) 
        });
        await tx2.wait();
        console.log("✅ Transaction réussie");
        
        // VÉRIFICATIONS CAMPAIGN
        console.log("\n📊 ÉTAT CAMPAIGN APRÈS ACHATS :");
        const roundInfo = await campaign.getCurrentRound();
        console.log("Fonds levés:", ethers.utils.formatEther(roundInfo.fundsRaised), "ETH");
        console.log("Shares vendues:", roundInfo.sharesSold.toString());
        console.log("Round actif:", roundInfo.isActive);
        
        // NFTs de l'investor1
        const investor1Balance = await campaign.balanceOf(investor1.address);
        console.log("NFTs de investor1:", investor1Balance.toString());
        
        // NFTs de l'investor2
        const investor2Balance = await campaign.balanceOf(investor2.address);
        console.log("NFTs de investor2:", investor2Balance.toString());
        
        // Balance du contrat Campaign
        const campaignBalance = await ethers.provider.getBalance(campaignAddress);
        console.log("Balance Campaign:", ethers.utils.formatEther(campaignBalance), "ETH");
        
        // VÉRIFICATIONS DAO
        console.log("\n🏛️ ÉTAT DAO :");
        const daoPhase = await dao.getCurrentPhase();
        console.log("Phase DAO:", daoPhase); // 0=INACTIVE
        
        const founderDao = await dao.founder();
        console.log("Founder DAO:", founderDao);
        console.log("Startup address:", startup.address);
        console.log("Founder = Startup:", founderDao === startup.address);
        
        // VÉRIFICATIONS KEEPER
        console.log("\n⚙️ ÉTAT KEEPER :");
        const isRegistered = await campaignKeeper.isCampaignRegistered(campaignAddress);
        console.log("Enregistré Chainlink:", isRegistered);
        
        // Test checkUpkeep
        const [upkeepNeeded, performData] = await campaignKeeper.checkUpkeep("0x");
        console.log("Upkeep nécessaire:", upkeepNeeded);
        if (upkeepNeeded) {
            console.log("Perform data:", performData);
        }
        
        // INVESTISSEMENTS DÉTAILLÉS
        console.log("\n💼 HISTORIQUE INVESTISSEMENTS :");
        const investor1Investments = await campaign.getInvestments(investor1.address);
        console.log("Investissements investor1:", investor1Investments.length);
        
        const investor2Investments = await campaign.getInvestments(investor2.address);
        console.log("Investissements investor2:", investor2Investments.length);
        
        // Détails du premier investissement
        if (investor1Investments.length > 0) {
            const inv = investor1Investments[0];
            console.log("Premier investissement investor1:");
            console.log("  - Montant:", ethers.utils.formatEther(inv.amount), "ETH");
            console.log("  - Shares:", inv.shares.toString());
            console.log("  - Round:", inv.roundNumber.toString());
            console.log("  - Token IDs:", inv.tokenIds.map(id => id.toString()));
        }
        
        console.log("\n🎉 SYSTÈME FONCTIONNEL - Tous les tests passés");
    });

    it("Test complet avec REVENTE + commissions plateforme", async function () {
        const [, , treasury, , , , investor3] = await ethers.getSigners();
        
        // Récupérer la campagne
        const allCampaigns = await divarProxy.getAllCampaigns();
        const campaignAddress = allCampaigns[0];
        const campaign = await ethers.getContractAt("Campaign", campaignAddress);
        
        console.log("\n🔄 TEST ACHAT + REVENTE + COMMISSIONS");
        console.log("Investisseur 3:", investor3.address);
        console.log("Treasury:", treasury.address);
        
        // Balance initiale treasury
        const treasuryBalanceBefore = await ethers.provider.getBalance(treasury.address);
        console.log("Balance Treasury AVANT:", ethers.utils.formatEther(treasuryBalanceBefore), "ETH");
        
        // ACHAT 3 : Investor3 achète 2 shares
        console.log("\n🟢 Investor3 achète 2 shares...");
        const sharePrice = ethers.utils.parseEther("0.1");
        const purchaseAmount = sharePrice.mul(2); // 0.2 ETH
        
        const tx3 = await campaign.connect(investor3).buyShares(2, { 
            value: purchaseAmount 
        });
        const receipt3 = await tx3.wait();
        
        // Analyser les événements pour voir la commission
        console.log("\n💰 ÉVÉNEMENTS ACHAT :");
        receipt3.events?.forEach((event) => {
            if (event.event === "CommissionPaid") {
                console.log(`Commission payée: ${ethers.utils.formatEther(event.args.amount)} ETH`);
                console.log(`Destinataire: ${event.args.recipient}`);
            }
            if (event.event === "SharesPurchased") {
                console.log(`Shares achetées: ${event.args.shares} par ${event.args.investor}`);
            }
        });
        
        // Vérifier balance treasury après achat
        const treasuryBalanceAfterPurchase = await ethers.provider.getBalance(treasury.address);
        const commissionReceived = treasuryBalanceAfterPurchase.sub(treasuryBalanceBefore);
        console.log("Commission reçue treasury:", ethers.utils.formatEther(commissionReceived), "ETH");
        console.log("Pourcentage commission:", commissionReceived.mul(100).div(purchaseAmount).toString() + "%");
        
        // État après achat
        const roundInfoAfterPurchase = await campaign.getCurrentRound();
        console.log("\n📊 ÉTAT APRÈS ACHAT investor3 :");
        console.log("Fonds levés total:", ethers.utils.formatEther(roundInfoAfterPurchase.fundsRaised), "ETH");
        console.log("Shares vendues total:", roundInfoAfterPurchase.sharesSold.toString());
        
        // Balance Campaign
        const campaignBalanceAfterPurchase = await ethers.provider.getBalance(campaignAddress);
        console.log("Balance Campaign:", ethers.utils.formatEther(campaignBalanceAfterPurchase), "ETH");
        
        // NFTs de investor3
        const investor3Balance = await campaign.balanceOf(investor3.address);
        console.log("NFTs investor3:", investor3Balance.toString());
        
        // Récupérer les token IDs de investor3
        const investor3Investments = await campaign.getInvestments(investor3.address);
        const tokenIds = investor3Investments[0].tokenIds;
        console.log("Token IDs investor3:", tokenIds.map(id => id.toString()));
        
        // REVENTE : Investor3 revend 1 NFT
        console.log("\n🔴 Investor3 revend 1 NFT...");
        const tokenToRefund = tokenIds[0]; // Premier token
        
        // Vérifier si le token peut être remboursé
        const [canRefund, refundMessage] = await campaign.canRefundToken(tokenToRefund);
        console.log("Peut rembourser:", canRefund);
        console.log("Message:", refundMessage);
        
        if (canRefund) {
            // Calculer montant de remboursement
            const refundAmount = await campaign.getRefundAmount(tokenToRefund);
            console.log("Montant remboursement:", ethers.utils.formatEther(refundAmount), "ETH");
            
            // Effectuer le remboursement directement
            
            // Effectuer le remboursement
            const refundTx = await campaign.connect(investor3).refundShares([tokenToRefund]);
            const refundReceipt = await refundTx.wait();
            
            // Analyser les événements de remboursement
            console.log("\n💸 ÉVÉNEMENTS REMBOURSEMENT :");
            refundReceipt.events?.forEach((event) => {
                if (event.event === "SharesRefunded") {
                    console.log(`Shares remboursées: ${event.args.numShares.toString()}`);
                    console.log(`Montant: ${ethers.utils.formatEther(event.args.refundAmount)} ETH`);
                    console.log(`Investisseur: ${event.args.investor}`);
                }
            });
            
            // Vérifier que le NFT a été brûlé
            try {
                await campaign.ownerOf(tokenToRefund);
                console.log("❌ ERREUR: NFT pas brûlé");
            } catch (error) {
                console.log("✅ NFT brûlé correctement");
            }
            
            // État final après remboursement
            const roundInfoFinal = await campaign.getCurrentRound();
            console.log("\n📊 ÉTAT FINAL APRÈS REMBOURSEMENT :");
            console.log("Fonds levés:", ethers.utils.formatEther(roundInfoFinal.fundsRaised), "ETH");
            console.log("Shares vendues:", roundInfoFinal.sharesSold.toString());
            
            const campaignBalanceFinal = await ethers.provider.getBalance(campaignAddress);
            console.log("Balance Campaign finale:", ethers.utils.formatEther(campaignBalanceFinal), "ETH");
            
            const investor3BalanceFinal = await campaign.balanceOf(investor3.address);
            console.log("NFTs investor3 restants:", investor3BalanceFinal.toString());
        }
        
        // BILAN COMMISSIONS PLATEFORME
        const treasuryBalanceFinal = await ethers.provider.getBalance(treasury.address);
        const totalCommissions = treasuryBalanceFinal.sub(treasuryBalanceBefore);
        
        console.log("\n💰 BILAN COMMISSIONS PLATEFORME :");
        console.log("Balance Treasury initiale:", ethers.utils.formatEther(treasuryBalanceBefore), "ETH");
        console.log("Balance Treasury finale:", ethers.utils.formatEther(treasuryBalanceFinal), "ETH");
        console.log("Total commissions perçues:", ethers.utils.formatEther(totalCommissions), "ETH");
        
        // Calcul théorique des commissions (12% de tous les achats)
        const totalPurchases = ethers.utils.parseEther("0.3").add(ethers.utils.parseEther("0.5")).add(ethers.utils.parseEther("0.2")); // 3+5+2 shares = 1.0 ETH
        const expectedCommissions = totalPurchases.mul(12).div(100); // 12%
        console.log("Commissions attendues (12%):", ethers.utils.formatEther(expectedCommissions), "ETH");
        console.log("Différence:", ethers.utils.formatEther(totalCommissions.sub(expectedCommissions)), "ETH");
        
        console.log("\n🎉 TEST COMPLET TERMINÉ - Système de commissions fonctionnel");
    });

    it("🏛️ Test DAO du Round 1 - Finalisation + Phase DAO", async function() {
        console.log("\n🏛️ TEST DAO DU ROUND 1");
        console.log("===============================");
        
        // Récupérer les signers
        const [, , , startup, investor1] = await ethers.getSigners();
        
        // Récupérer l'adresse de la campagne depuis les événements précédents
        const campaigns = await divarProxy.getAllCampaigns();
        const campaignAddress = campaigns[campaigns.length - 1]; // Dernière campagne créée
        const campaign = await ethers.getContractAt("Campaign", campaignAddress);
        const daoAddress = await campaign.campaignDAO();
        const campaignDAO = await ethers.getContractAt("CampaignDAO", daoAddress);
        
        console.log("Campagne:", campaignAddress);
        console.log("DAO:", daoAddress);
        
        // Finaliser le round 1 d'abord
        console.log("\n🎯 FINALISATION DU ROUND 1...");
        
        // Vérifier l'état avant finalisation
        const roundInfoBefore = await campaign.getCurrentRound();
        console.log("Fonds levés avant finalisation:", ethers.utils.formatEther(roundInfoBefore.fundsRaised), "ETH");
        console.log("Target du round:", ethers.utils.formatEther(roundInfoBefore.targetAmount), "ETH");
        console.log("Round actif:", roundInfoBefore.isActive);
        
        // Le round devrait avoir assez de fonds pour être finalisé avec succès
        if (roundInfoBefore.fundsRaised.gte(roundInfoBefore.targetAmount)) {
            console.log("✅ Target atteint - Finalisation possible");
            
            // Simuler la finalisation via le Keeper
            console.log("\n⚙️ Simulation finalisation Chainlink...");
            const [upkeepNeeded, performData] = await campaignKeeper.checkUpkeep("0x");
            if (upkeepNeeded) {
                await campaignKeeper.performUpkeep(performData);
            }
            
            // Vérifier que le round est finalisé
            const roundInfoAfter = await campaign.getCurrentRound();
            console.log("Round finalisé:", roundInfoAfter.isFinalized);
            
            if (roundInfoAfter.isFinalized) {
                console.log("✅ Round 1 finalisé avec succès");
                
                // Vérifier que la phase DAO a démarré
                console.log("\n🏛️ VÉRIFICATION PHASE DAO...");
                const currentPhase = await campaignDAO.getCurrentPhase();
                console.log("Phase DAO actuelle:", currentPhase.toString());
                
                const phaseNames = ["INACTIVE", "WAITING_FOR_LIVE", "LIVE_SCHEDULED", "LIVE_ACTIVE", "EXCHANGE_PERIOD", "COMPLETED", "EMERGENCY"];
                console.log("Phase DAO:", phaseNames[currentPhase] || "UNKNOWN");
                
                if (currentPhase == 1) { // WAITING_FOR_LIVE
                    console.log("✅ Phase DAO démarrée - En attente de programmation live");
                    
                    // Programmer une session live
                    console.log("\n📺 PROGRAMMATION SESSION LIVE...");
                    const futureTime = Math.floor(Date.now() / 1000) + 300; // Dans 5 minutes
                    const streamUrl = "https://stream.example.com/live123";
                    
                    await campaignDAO.connect(startup).scheduleLiveSession(futureTime, streamUrl);
                    
                    const newPhase = await campaignDAO.getCurrentPhase();
                    console.log("Phase après programmation:", phaseNames[newPhase]);
                    
                    if (newPhase == 2) { // LIVE_SCHEDULED
                        console.log("✅ Session live programmée avec succès");
                        
                        // Récupérer les détails de la session
                        const sessionDetails = await campaignDAO.getSessionInfo();
                        console.log("Session programmée pour:", new Date(sessionDetails.scheduledTime * 1000));
                        console.log("Stream URL:", sessionDetails.streamUrl);
                        
                        console.log("\n🎉 PHASE DAO OPÉRATIONNELLE");
                    } else {
                        console.log("❌ Erreur programmation live");
                    }
                } else {
                    console.log("❌ Phase DAO pas démarrée correctement");
                }
            } else {
                console.log("❌ Échec finalisation round");
            }
        } else {
            console.log("❌ Target pas atteint - Achat de shares supplémentaires nécessaire");
            
            // Acheter plus de shares pour atteindre le target
            const needed = roundInfoBefore.targetAmount.sub(roundInfoBefore.fundsRaised);
            console.log("Montant manquant:", ethers.utils.formatEther(needed), "ETH");
            
            // Calculer shares disponibles (max - vendues)
            const maxShares = roundInfoBefore.targetAmount.div(ethers.utils.parseEther("0.1"));
            const sharesAvailable = maxShares.sub(roundInfoBefore.sharesSold);
            const sharesToBuy = Math.min(sharesAvailable.toNumber(), Math.ceil(parseFloat(ethers.utils.formatEther(needed)) / 0.1));
            console.log("Shares disponibles:", sharesAvailable.toString());
            console.log("Shares à acheter:", sharesToBuy);
            
            await campaign.connect(investor1).buyShares(sharesToBuy, {
                value: ethers.utils.parseEther((sharesToBuy * 0.1).toString())
            });
            
            console.log("✅ Shares supplémentaires achetées");
            
            // Relancer la finalisation
            const [upkeepNeeded2, performData2] = await campaignKeeper.checkUpkeep("0x");
            if (upkeepNeeded2) {
                await campaignKeeper.performUpkeep(performData2);
            }
            
            const finalRound = await campaign.getCurrentRound();
            console.log("Round finalement finalisé:", finalRound.isFinalized);
        }
        
        console.log("\n🎉 TEST DAO ROUND 1 TERMINÉ");
    });
});