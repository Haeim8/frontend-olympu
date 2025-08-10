const { ethers } = require("hardhat");

async function main() {
    console.log("🔬 TEST EXHAUSTIF & DEBUG - ÉCOSYSTÈME LIVAR");
    console.log("=" .repeat(60));
    console.log("📋 AUCUN ARRÊT - ON DOCUMENTE TOUT, MÊME LES ÉCHECS");
    console.log("=" .repeat(60));
    
    let results = {
        deployments: [],
        investments: [],
        refunds: [],
        finalization: [],
        dao: [],
        governance: [],
        bugs: [],
        warnings: []
    };

    try {
        // Récupérer signers
        let [deployer, founder, investor1, investor2, investor3, treasury] = await ethers.getSigners();
        
        console.log("\n👥 PARTICIPANTS:");
        console.log("🏗️ Deployeur:", deployer.address);
        console.log("👑 Founder:", founder.address);
        console.log("💰 Investor1:", investor1.address);
        console.log("💰 Investor2:", investor2.address);
        console.log("💰 Investor3:", investor3.address);
        console.log("🏦 Treasury:", treasury.address);

        // ===== PHASE 1: DÉPLOIEMENTS =====
        console.log("\n" + "=".repeat(50));
        console.log("🏗️ PHASE 1 - DÉPLOIEMENTS");
        console.log("=".repeat(50));

        let campaign, dao, governance, liveManager;

        try {
            const Campaign = await ethers.getContractFactory("Campaign");
            campaign = await Campaign.deploy(
                founder.address,
                "Livar Exhaustive Test",
                "LET",
                ethers.utils.parseEther("20"), // 20 ETH target
                ethers.utils.parseEther("2"),  // 2 ETH par NFT
                Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24h
                treasury.address,
                500,
                treasury.address,
                "ipfs://exhaustive-test",
                deployer.address,
                deployer.address
            );
            await campaign.deployed();
            console.log("✅ Campaign déployé:", campaign.address);
            results.deployments.push({ contract: "Campaign", status: "SUCCESS", address: campaign.address });
        } catch (error) {
            console.log("❌ Campaign FAILED:", error.message.split('\n')[0]);
            results.deployments.push({ contract: "Campaign", status: "FAILED", error: error.message });
        }

        try {
            const LiveSessionManager = await ethers.getContractFactory("LiveSessionManager");
            liveManager = await LiveSessionManager.deploy();
            await liveManager.deployed();
            console.log("✅ LiveSessionManager déployé:", liveManager.address);
            results.deployments.push({ contract: "LiveSessionManager", status: "SUCCESS", address: liveManager.address });
        } catch (error) {
            console.log("❌ LiveSessionManager FAILED:", error.message.split('\n')[0]);
            results.deployments.push({ contract: "LiveSessionManager", status: "FAILED", error: error.message });
        }

        try {
            const CampaignDAO = await ethers.getContractFactory("CampaignDAO");
            dao = await CampaignDAO.deploy(campaign.address, liveManager.address, founder.address);
            await dao.deployed();
            console.log("✅ CampaignDAO déployé:", dao.address);
            results.deployments.push({ contract: "CampaignDAO", status: "SUCCESS", address: dao.address });
        } catch (error) {
            console.log("❌ CampaignDAO FAILED:", error.message.split('\n')[0]);
            results.deployments.push({ contract: "CampaignDAO", status: "FAILED", error: error.message });
        }

        try {
            const CampaignGovernance = await ethers.getContractFactory("CampaignGovernance");
            governance = await CampaignGovernance.deploy(campaign.address, founder.address);
            await governance.deployed();
            console.log("✅ CampaignGovernance déployé:", governance.address);
            results.deployments.push({ contract: "CampaignGovernance", status: "SUCCESS", address: governance.address });
        } catch (error) {
            console.log("❌ CampaignGovernance FAILED:", error.message.split('\n')[0]);
            results.deployments.push({ contract: "CampaignGovernance", status: "FAILED", error: error.message });
        }

        // Connexions
        console.log("\n🔗 CONNEXIONS DES CONTRATS:");
        
        try {
            if (campaign && dao) {
                await campaign.connect(founder).setDAOContract(dao.address);
                console.log("✅ DAO connecté au Campaign");
                results.deployments.push({ contract: "DAO Connection", status: "SUCCESS" });
            }
        } catch (error) {
            console.log("❌ DAO Connection FAILED:", error.message.split('\n')[0]);
            results.deployments.push({ contract: "DAO Connection", status: "FAILED", error: error.message });
        }

        try {
            if (campaign && governance) {
                await campaign.connect(founder).setGovernanceContract(governance.address);
                console.log("✅ Governance connecté au Campaign");
                results.deployments.push({ contract: "Governance Connection", status: "SUCCESS" });
            }
        } catch (error) {
            console.log("❌ Governance Connection FAILED:", error.message.split('\n')[0]);
            results.deployments.push({ contract: "Governance Connection", status: "FAILED", error: error.message });
        }

        // ===== PHASE 2: INVESTISSEMENTS =====
        console.log("\n" + "=".repeat(50));
        console.log("💰 PHASE 2 - INVESTISSEMENTS");
        console.log("=".repeat(50));

        // Investment 1
        try {
            await campaign.connect(investor1).buyShares(3, { value: ethers.utils.parseEther("6") });
            console.log("✅ Investor1: 3 NFTs pour 6 ETH");
            results.investments.push({ investor: "investor1", nfts: 3, amount: "6 ETH", status: "SUCCESS" });
        } catch (error) {
            console.log("❌ Investor1 investment FAILED:", error.message.split('\n')[0]);
            results.investments.push({ investor: "investor1", status: "FAILED", error: error.message });
        }

        // Investment 2
        try {
            await campaign.connect(investor2).buyShares(2, { value: ethers.utils.parseEther("4") });
            console.log("✅ Investor2: 2 NFTs pour 4 ETH");
            results.investments.push({ investor: "investor2", nfts: 2, amount: "4 ETH", status: "SUCCESS" });
        } catch (error) {
            console.log("❌ Investor2 investment FAILED:", error.message.split('\n')[0]);
            results.investments.push({ investor: "investor2", status: "FAILED", error: error.message });
        }

        // Investment 3 - Atteindre l'objectif (17 ETH nets)
        try {
            await campaign.connect(investor3).buyShares(5, { value: ethers.utils.parseEther("10") });
            console.log("✅ Investor3: 5 NFTs pour 10 ETH (pour atteindre objectif)");
            results.investments.push({ investor: "investor3", nfts: 5, amount: "10 ETH", status: "SUCCESS" });
        } catch (error) {
            console.log("❌ Investor3 investment FAILED:", error.message.split('\n')[0]);
            results.investments.push({ investor: "investor3", status: "FAILED", error: error.message });
        }

        // État après investissements
        try {
            const roundInfo = await campaign.getCurrentRound();
            console.log(`📊 État Round 1: ${ethers.utils.formatEther(roundInfo.fundsRaised)} ETH levés, ${roundInfo.sharesSold} NFTs vendus, finalisé: ${roundInfo.isFinalized}`);
            results.investments.push({ 
                type: "ROUND_STATE", 
                fundsRaised: ethers.utils.formatEther(roundInfo.fundsRaised),
                nftsSold: roundInfo.sharesSold.toString(),
                finalized: roundInfo.isFinalized,
                status: "SUCCESS"
            });
        } catch (error) {
            console.log("❌ Round state check FAILED:", error.message.split('\n')[0]);
            results.investments.push({ type: "ROUND_STATE", status: "FAILED", error: error.message });
        }

        // ===== PHASE 3: TESTS REMBOURSEMENT =====
        console.log("\n" + "=".repeat(50));
        console.log("🔄 PHASE 3 - TESTS REMBOURSEMENT");
        console.log("=".repeat(50));

        // Test remboursement Round 1 actif
        console.log("\n🧪 TEST 1: Remboursement Round actuel");
        try {
            const [canRefund1, msg1] = await campaign.canRefundToken(1000001);
            console.log(`NFT #1000001: ${canRefund1 ? '✅' : '❌'} - ${msg1}`);
            results.refunds.push({ 
                test: "Round actuel", 
                tokenId: "1000001", 
                canRefund: canRefund1, 
                message: msg1, 
                status: "SUCCESS" 
            });
        } catch (error) {
            console.log("❌ Refund test 1 FAILED:", error.message.split('\n')[0]);
            results.refunds.push({ test: "Round actuel", status: "FAILED", error: error.message });
        }

        // Finaliser Round 1
        console.log("\n🏁 FINALISATION ROUND 1");
        try {
            await campaign.connect(deployer).finalizeRound();
            console.log("✅ Round 1 finalisé");
            results.finalization.push({ action: "finalize_round", status: "SUCCESS" });
        } catch (error) {
            console.log("❌ Round 1 finalization FAILED:", error.message.split('\n')[0]);
            results.finalization.push({ action: "finalize_round", status: "FAILED", error: error.message });
        }

        // Vérifier phase DAO
        try {
            const daoPhase = await dao.getCurrentPhase();
            console.log(`🏛️ Phase DAO après finalisation: ${daoPhase} (1=WAITING_FOR_LIVE)`);
            results.dao.push({ action: "check_phase_after_finalization", phase: daoPhase.toString(), status: "SUCCESS" });
        } catch (error) {
            console.log("❌ DAO phase check FAILED:", error.message.split('\n')[0]);
            results.dao.push({ action: "check_phase_after_finalization", status: "FAILED", error: error.message });
        }

        // Test remboursement après finalisation
        console.log("\n🧪 TEST 2: Remboursement après finalisation Round 1");
        try {
            const [canRefund2, msg2] = await campaign.canRefundToken(1000001);
            console.log(`NFT #1000001: ${canRefund2 ? '✅' : '❌'} - ${msg2}`);
            results.refunds.push({ 
                test: "Après finalisation", 
                tokenId: "1000001", 
                canRefund: canRefund2, 
                message: msg2, 
                status: "SUCCESS" 
            });
        } catch (error) {
            console.log("❌ Refund test 2 FAILED:", error.message.split('\n')[0]);
            results.refunds.push({ test: "Après finalisation", status: "FAILED", error: error.message });
        }

        // ===== PHASE 4: ROUND 2 =====
        console.log("\n" + "=".repeat(50));
        console.log("🚀 PHASE 4 - ROUND 2");
        console.log("=".repeat(50));

        try {
            await campaign.connect(founder).startNewRound(
                ethers.utils.parseEther("30"),
                ethers.utils.parseEther("5"),
                24 * 60 * 60 // 24h
            );
            console.log("✅ Round 2 démarré (5 ETH/NFT)");
            results.investments.push({ action: "start_round_2", status: "SUCCESS" });
        } catch (error) {
            console.log("❌ Round 2 start FAILED:", error.message.split('\n')[0]);
            results.investments.push({ action: "start_round_2", status: "FAILED", error: error.message });
        }

        // Investissement Round 2 (nouveau investisseur pour éviter confusion)
        try {
            await campaign.connect(investor1).buyShares(2, { value: ethers.utils.parseEther("10") });
            console.log("✅ Investor1: 2 NFTs Round 2 pour 10 ETH");
            results.investments.push({ investor: "investor1", nfts: 2, amount: "10 ETH", round: 2, status: "SUCCESS" });
        } catch (error) {
            console.log("❌ Investor1 Round 2 investment FAILED:", error.message.split('\n')[0]);
            results.investments.push({ investor: "investor1", round: 2, status: "FAILED", error: error.message });
        }

        // 🔥 TEST CRITIQUE: Remboursement Round 1 pendant Round 2
        console.log("\n🧪 TEST 3 (CRITIQUE): Round 1 pendant Round 2 avec DAO active");
        try {
            const [canRefund3, msg3] = await campaign.canRefundToken(1000001);
            console.log(`NFT #1000001: ${canRefund3 ? '✅' : '❌'} - ${msg3}`);
            
            if (canRefund3) {
                results.bugs.push({
                    bug: "NFT Round 1 remboursable pendant Round 2 à cause phase DAO",
                    severity: "CRITICAL",
                    tokenId: "1000001",
                    message: msg3
                });
                console.log("🚨 BUG DÉTECTÉ: NFT Round 1 ne devrait PAS être remboursable pendant Round 2 !");
            } else {
                console.log("✅ Comportement correct: NFT Round 1 bloqué pendant Round 2");
            }
            
            results.refunds.push({ 
                test: "Round 1 pendant Round 2", 
                tokenId: "1000001", 
                canRefund: canRefund3, 
                message: msg3, 
                status: "SUCCESS" 
            });
        } catch (error) {
            console.log("❌ Refund test 3 FAILED:", error.message.split('\n')[0]);
            results.refunds.push({ test: "Round 1 pendant Round 2", status: "FAILED", error: error.message });
        }

        // Test remboursement Round 2
        console.log("\n🧪 TEST 4: Remboursement Round 2 actuel");
        try {
            const [canRefund4, msg4] = await campaign.canRefundToken(2000001);
            console.log(`NFT #2000001: ${canRefund4 ? '✅' : '❌'} - ${msg4}`);
            results.refunds.push({ 
                test: "Round 2 actuel", 
                tokenId: "2000001", 
                canRefund: canRefund4, 
                message: msg4, 
                status: "SUCCESS" 
            });
        } catch (error) {
            console.log("❌ Refund test 4 FAILED:", error.message.split('\n')[0]);
            results.refunds.push({ test: "Round 2 actuel", status: "FAILED", error: error.message });
        }

        // ===== PHASE 5: SESSION LIVE DAO =====
        console.log("\n" + "=".repeat(50));
        console.log("🎥 PHASE 5 - SESSION LIVE DAO");
        console.log("=".repeat(50));

        // Programmer session live
        const futureTime = Math.floor(Date.now() / 1000) + 3600;
        try {
            await dao.connect(founder).scheduleLiveSession(
                futureTime,
                "https://stream.livar.com/test"
            );
            console.log("✅ Session live programmée");
            results.dao.push({ action: "schedule_live", status: "SUCCESS" });
        } catch (error) {
            console.log("❌ Schedule live FAILED:", error.message.split('\n')[0]);
            results.dao.push({ action: "schedule_live", status: "FAILED", error: error.message });
        }

        // Simuler le temps
        console.log("⏰ Simulation: 1h passe...");
        await ethers.provider.send("evm_increaseTime", [3600]);
        await ethers.provider.send("evm_mine");

        // Démarrer live
        try {
            await dao.connect(founder).startLiveSession();
            console.log("✅ Session live démarrée");
            results.dao.push({ action: "start_live", status: "SUCCESS" });
        } catch (error) {
            console.log("❌ Start live FAILED:", error.message.split('\n')[0]);
            results.dao.push({ action: "start_live", status: "FAILED", error: error.message });
        }

        // Simuler durée live
        console.log("⏰ Simulation: Live 20 minutes...");
        await ethers.provider.send("evm_increaseTime", [20 * 60]);
        await ethers.provider.send("evm_mine");

        // Terminer live
        try {
            await dao.connect(founder).endLiveSession(15);
            console.log("✅ Session live terminée (20 min → Valide)");
            results.dao.push({ action: "end_live", duration: "20min", valid: true, status: "SUCCESS" });
        } catch (error) {
            console.log("❌ End live FAILED:", error.message.split('\n')[0]);
            results.dao.push({ action: "end_live", status: "FAILED", error: error.message });
        }

        // Vérifier phase échange
        try {
            const finalPhase = await dao.getCurrentPhase();
            console.log(`🔄 Phase après live: ${finalPhase} (4=EXCHANGE_PERIOD)`);
            results.dao.push({ action: "check_exchange_phase", phase: finalPhase.toString(), status: "SUCCESS" });
        } catch (error) {
            console.log("❌ Exchange phase check FAILED:", error.message.split('\n')[0]);
            results.dao.push({ action: "check_exchange_phase", status: "FAILED", error: error.message });
        }

        // ===== PHASE 6: GOUVERNANCE =====
        console.log("\n" + "=".repeat(50));
        console.log("🗳️ PHASE 6 - GOUVERNANCE");
        console.log("=".repeat(50));

        // Vérifier pouvoirs de vote
        try {
            const power1 = await governance.getVotingPower(investor1.address);
            const power2 = await governance.getVotingPower(investor2.address);
            const power3 = await governance.getVotingPower(investor3.address);
            console.log(`📊 Pouvoirs de vote: Investor1=${power1}, Investor2=${power2}, Investor3=${power3}`);
            results.governance.push({ 
                action: "check_voting_power", 
                investor1: power1.toString(), 
                investor2: power2.toString(),
                investor3: power3.toString(),
                status: "SUCCESS" 
            });
        } catch (error) {
            console.log("❌ Voting power check FAILED:", error.message.split('\n')[0]);
            results.governance.push({ action: "check_voting_power", status: "FAILED", error: error.message });
        }

        // Créer proposition
        try {
            await governance.connect(founder).createProposal(
                0, // PARAMETER_CHANGE
                "Réduire commission 15% → 10%",
                "Test de gouvernance exhaustif",
                ethers.utils.defaultAbiCoder.encode(["uint256"], [10]),
                30, // 30% quorum
                51  // 51% majorité
            );
            console.log("✅ Proposition gouvernance créée");
            results.governance.push({ action: "create_proposal", status: "SUCCESS" });
        } catch (error) {
            console.log("❌ Create proposal FAILED:", error.message.split('\n')[0]);
            results.governance.push({ action: "create_proposal", status: "FAILED", error: error.message });
        }

        // Votes
        try {
            await governance.connect(investor1).castVote(1, 1, "Vote pour");
            console.log("✅ Investor1 vote POUR");
            results.governance.push({ action: "vote_investor1", vote: "FOR", status: "SUCCESS" });
        } catch (error) {
            console.log("❌ Investor1 vote FAILED:", error.message.split('\n')[0]);
            results.governance.push({ action: "vote_investor1", status: "FAILED", error: error.message });
        }

        try {
            await governance.connect(investor2).castVote(1, 0, "Vote contre");
            console.log("✅ Investor2 vote CONTRE");
            results.governance.push({ action: "vote_investor2", vote: "AGAINST", status: "SUCCESS" });
        } catch (error) {
            console.log("❌ Investor2 vote FAILED:", error.message.split('\n')[0]);
            results.governance.push({ action: "vote_investor2", status: "FAILED", error: error.message });
        }

        // Résultats vote
        try {
            const voteResults = await governance.getProposalResults(1);
            console.log(`📊 Résultats: Participation=${voteResults.participationRate}%, Support=${voteResults.supportRate}%`);
            results.governance.push({ 
                action: "vote_results", 
                participation: voteResults.participationRate.toString(),
                support: voteResults.supportRate.toString(),
                status: "SUCCESS" 
            });
        } catch (error) {
            console.log("❌ Vote results FAILED:", error.message.split('\n')[0]);
            results.governance.push({ action: "vote_results", status: "FAILED", error: error.message });
        }

    } catch (globalError) {
        console.log("❌ GLOBAL ERROR:", globalError.message);
        results.bugs.push({ bug: "Global execution error", severity: "CRITICAL", error: globalError.message });
    }

    // ===== RAPPORT FINAL =====
    console.log("\n" + "=".repeat(60));
    console.log("📊 RAPPORT FINAL - ANALYSE EXHAUSTIVE");
    console.log("=".repeat(60));

    console.log("\n🏗️ DÉPLOIEMENTS:", results.deployments.filter(d => d.status === "SUCCESS").length, "succès,", results.deployments.filter(d => d.status === "FAILED").length, "échecs");
    console.log("💰 INVESTISSEMENTS:", results.investments.filter(i => i.status === "SUCCESS").length, "succès,", results.investments.filter(i => i.status === "FAILED").length, "échecs");
    console.log("🔄 REMBOURSEMENTS:", results.refunds.filter(r => r.status === "SUCCESS").length, "succès,", results.refunds.filter(r => r.status === "FAILED").length, "échecs");
    console.log("🗳️ GOUVERNANCE:", results.governance.filter(g => g.status === "SUCCESS").length, "succès,", results.governance.filter(g => g.status === "FAILED").length, "échecs");
    console.log("🏛️ DAO:", results.dao.filter(d => d.status === "SUCCESS").length, "succès,", results.dao.filter(d => d.status === "FAILED").length, "échecs");

    console.log("\n🚨 BUGS DÉTECTÉS:");
    results.bugs.forEach((bug, i) => {
        console.log(`${i+1}. [${bug.severity}] ${bug.bug}`);
        if (bug.error) console.log(`   Erreur: ${bug.error.split('\n')[0]}`);
    });

    if (results.bugs.length === 0) {
        console.log("✅ Aucun bug critique détecté!");
    }

    console.log("\n🎯 PROBLÈMES À CORRIGER:");
    if (results.bugs.some(b => b.bug.includes("Round 1 pendant Round 2"))) {
        console.log("1. 🔴 CRITIQUE: NFT Round 1 remboursable pendant Round 2 (logique phase DAO incorrecte)");
    }
    
    // Compter les échecs
    const totalTests = results.deployments.length + results.investments.length + results.refunds.length + results.governance.length + results.dao.length;
    const totalFailures = 
        results.deployments.filter(d => d.status === "FAILED").length +
        results.investments.filter(i => i.status === "FAILED").length +
        results.refunds.filter(r => r.status === "FAILED").length +
        results.governance.filter(g => g.status === "FAILED").length +
        results.dao.filter(d => d.status === "FAILED").length;

    console.log(`\n📈 TAUX DE RÉUSSITE: ${((totalTests - totalFailures) / totalTests * 100).toFixed(1)}%`);
    
    if (totalFailures === 0 && results.bugs.length === 0) {
        console.log("🎉 SYSTÈME 100% FONCTIONNEL - PRÊT POUR PRODUCTION!");
    } else {
        console.log(`⚠️ ${totalFailures} échecs et ${results.bugs.length} bugs à corriger avant production`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("💥 ERREUR FATALE:", error.message);
        process.exit(1);
    });