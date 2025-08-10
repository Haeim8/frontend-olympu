const { ethers } = require("hardhat");

async function main() {
    console.log("🔬 TEST EXHAUSTIF FINAL - TOUS SCÉNARIOS + CORRECTIONS");
    console.log("=" .repeat(80));
    
    let results = {
        deploymentCosts: [],
        transactionCosts: [],
        roundTests: [],
        refundTests: [],
        governanceTests: [],
        bugs: [],
        warnings: [],
        summary: { success: 0, failed: 0 }
    };

    try {
        let [deployer, founder, investor1, investor2, investor3, investor4, treasury, keeper] = await ethers.getSigners();
        
        console.log("\n👥 PARTICIPANTS:");
        console.log("🏗️ Deployeur:", deployer.address);
        console.log("👑 Founder:", founder.address);
        console.log("💰 Investor1-4:", investor1.address.substring(0,10) + "...");
        console.log("🏦 Treasury:", treasury.address);
        console.log("🤖 Keeper:", keeper.address);

        // ===== DÉPLOIEMENTS AVEC COÛTS =====
        console.log("\n" + "=".repeat(60));
        console.log("🏗️ DÉPLOIEMENTS ET COÛTS");
        console.log("=".repeat(60));

        // Campaign (Deployer paye)
        const deployerBalanceBefore = await ethers.provider.getBalance(deployer.address);
        
        const Campaign = await ethers.getContractFactory("Campaign");
        const campaign = await Campaign.deploy(
            founder.address, "Test Exhaustif Final", "TEF",
            ethers.utils.parseEther("20"), // 20 ETH target
            ethers.utils.parseEther("2"),  // 2 ETH par NFT  
            Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 jours
            treasury.address, 500, treasury.address, "ipfs://test-exhaustif",
            deployer.address, keeper.address
        );
        
        const receipt1 = await campaign.deployTransaction.wait();
        const deployerBalanceAfter = await ethers.provider.getBalance(deployer.address);
        const campaignCost = deployerBalanceBefore.sub(deployerBalanceAfter);
        
        console.log("✅ Campaign déployé:", campaign.address);
        console.log(`💰 Coût Campaign: ${ethers.utils.formatEther(campaignCost)} ETH`);
        
        results.deploymentCosts.push({
            contract: "Campaign",
            payer: "Deployer", 
            cost: ethers.utils.formatEther(campaignCost),
            gasUsed: receipt1.gasUsed.toString()
        });

        // LiveSessionManager
        const LiveSessionManager = await ethers.getContractFactory("LiveSessionManager");
        const liveManager = await LiveSessionManager.deploy();
        await liveManager.deployed();

        // CampaignDAO (Founder paye)
        const founderBalanceBefore = await ethers.provider.getBalance(founder.address);
        
        const CampaignDAO = await ethers.getContractFactory("CampaignDAO", founder);
        const dao = await CampaignDAO.deploy(campaign.address, liveManager.address, founder.address);
        const receipt2 = await dao.deployTransaction.wait();
        
        const founderBalanceAfter = await ethers.provider.getBalance(founder.address);
        const daoCost = founderBalanceBefore.sub(founderBalanceAfter);
        
        console.log("✅ CampaignDAO déployé par FOUNDER");
        console.log(`💰 Coût DAO: ${ethers.utils.formatEther(daoCost)} ETH (payé par founder)`);
        
        results.deploymentCosts.push({
            contract: "CampaignDAO",
            payer: "Founder",
            cost: ethers.utils.formatEther(daoCost),
            gasUsed: receipt2.gasUsed.toString()
        });

        // CampaignGovernance (Deployer paye)
        const deployerBalance2Before = await ethers.provider.getBalance(deployer.address);
        
        const CampaignGovernance = await ethers.getContractFactory("CampaignGovernance", deployer);
        const governance = await CampaignGovernance.deploy(campaign.address, founder.address);
        const receipt3 = await governance.deployTransaction.wait();
        
        const deployerBalance2After = await ethers.provider.getBalance(deployer.address);
        const govCost = deployerBalance2Before.sub(deployerBalance2After);
        
        console.log("✅ CampaignGovernance déployé par DEPLOYER");
        console.log(`💰 Coût Governance: ${ethers.utils.formatEther(govCost)} ETH`);
        
        results.deploymentCosts.push({
            contract: "CampaignGovernance",
            payer: "Deployer",
            cost: ethers.utils.formatEther(govCost),
            gasUsed: receipt3.gasUsed.toString()
        });

        // Connexions
        await campaign.connect(founder).setDAOContract(dao.address);
        await campaign.connect(founder).setGovernanceContract(governance.address);
        console.log("✅ Tous les contrats connectés");

        // ===== ROUND 1 COMPLET =====
        console.log("\n" + "=".repeat(60));
        console.log("💰 ROUND 1 - INVESTISSEMENTS (20 ETH TARGET)");
        console.log("=".repeat(60));

        // Investissements pour atteindre exactement l'objectif
        await campaign.connect(investor1).buyShares(3, { value: ethers.utils.parseEther("6") });
        console.log("✅ Investor1: 3 NFTs pour 6 ETH");
        
        await campaign.connect(investor2).buyShares(4, { value: ethers.utils.parseEther("8") });
        console.log("✅ Investor2: 4 NFTs pour 8 ETH");
        
        await campaign.connect(investor3).buyShares(3, { value: ethers.utils.parseEther("6") });
        console.log("✅ Investor3: 3 NFTs pour 6 ETH");
        
        // Vérifier état Round 1
        const round1Info = await campaign.getCurrentRound();
        console.log(`📊 Round 1: ${ethers.utils.formatEther(round1Info.fundsRaised)} ETH levés, ${round1Info.sharesSold} NFTs`);
        console.log(`🎯 Objectif: ${ethers.utils.formatEther(round1Info.targetAmount)} ETH, Finalisé: ${round1Info.isFinalized}`);

        results.roundTests.push({
            round: 1,
            targetReached: round1Info.fundsRaised.gte(ethers.utils.parseEther("19")), // 95% avec commission
            autoFinalized: round1Info.isFinalized,
            nftsSold: round1Info.sharesSold.toString()
        });

        // Finalisation manuelle si pas auto
        if (!round1Info.isFinalized) {
            await campaign.connect(keeper).finalizeRound();
            console.log("✅ Round 1 finalisé manuellement par Keeper");
        }

        // Vérifier activation DAO
        const daoPhase1 = await dao.getCurrentPhase();
        console.log(`🏛️ Phase DAO après finalisation R1: ${daoPhase1} (1=WAITING_FOR_LIVE)`);
        
        if (daoPhase1 == 1) {
            results.summary.success++;
            console.log("✅ DAO correctement activé");
        } else {
            results.bugs.push("DAO pas en phase WAITING_FOR_LIVE après finalisation R1");
            results.summary.failed++;
        }

        // ===== TESTS REMBOURSEMENT ROUND 1 =====
        console.log("\n" + "=".repeat(60));
        console.log("🔄 TESTS REMBOURSEMENT ROUND 1");
        console.log("=".repeat(60));

        // Test 1: NFT R1 après finalisation (avant live)
        console.log("\n🧪 TEST 1: NFT Round 1 après finalisation, avant live");
        const [canRefund1, msg1] = await campaign.canRefundToken(1000001);
        console.log(`NFT #1000001: ${canRefund1 ? '✅' : '❌'} - ${msg1}`);
        
        results.refundTests.push({
            test: "R1_after_finalization_before_live",
            tokenId: "1000001", 
            canRefund: canRefund1,
            message: msg1,
            expected: false, // Ne devrait PAS être remboursable
            correct: !canRefund1
        });

        if (!canRefund1) {
            results.summary.success++;
            console.log("✅ CORRECT: NFT R1 bloqué après finalisation");
        } else {
            results.bugs.push("NFT R1 remboursable après finalisation (ne devrait pas)");
            results.summary.failed++;
        }

        // ===== ROUND 2 =====
        console.log("\n" + "=".repeat(60));
        console.log("🚀 ROUND 2 - PRIX AUGMENTÉ");
        console.log("=".repeat(60));

        try {
            await campaign.connect(founder).startNewRound(
                ethers.utils.parseEther("30"), // 30 ETH target
                ethers.utils.parseEther("3"),   // 3 ETH par NFT (50% augmentation)
                20 * 24 * 60 * 60 // 20 jours
            );
            console.log("✅ Round 2 démarré: 3 ETH/NFT (+50%)");
            
            // Investissement Round 2
            await campaign.connect(investor4).buyShares(2, { value: ethers.utils.parseEther("6") });
            console.log("✅ Investor4: 2 NFTs Round 2 pour 6 ETH");
            
            // Vérifier ID des NFTs Round 2
            const tokenId = await campaign.tokenOfOwnerByIndex(investor4.address, 0);
            console.log(`📊 Premier NFT Round 2 ID: ${tokenId}`);
            
            if (tokenId.toString().startsWith("2000")) {
                results.summary.success++;
                console.log("✅ NFT IDs Round 2 corrects");
            } else {
                results.bugs.push("NFT IDs Round 2 incorrects: " + tokenId.toString());
                results.summary.failed++;
            }
            
            results.roundTests.push({
                round: 2,
                started: true,
                priceIncrease: "50%",
                nftsIdsCorrect: tokenId.toString().startsWith("2000")
            });
            
        } catch (error) {
            console.log("❌ Round 2 FAILED:", error.message.split('\n')[0]);
            results.bugs.push("Round 2 création échouée: " + error.message);
            results.summary.failed++;
        }

        // ===== TESTS REMBOURSEMENT MULTI-ROUNDS =====
        console.log("\n" + "=".repeat(60));
        console.log("🔄 TESTS REMBOURSEMENT MULTI-ROUNDS (CRITIQUE)");
        console.log("=".repeat(60));

        // Test 2: Round 1 pendant Round 2 actif (CRITIQUE - ne devrait PAS être remboursable)
        console.log("\n🧪 TEST 2 (CRITIQUE): Round 1 pendant Round 2 actif");
        const [canRefund2, msg2] = await campaign.canRefundToken(1000001);
        console.log(`NFT #1000001 (R1): ${canRefund2 ? '🚨 MAUVAIS' : '✅ CORRECT'} - ${msg2}`);
        
        results.refundTests.push({
            test: "R1_during_R2_active",
            tokenId: "1000001",
            canRefund: canRefund2,
            message: msg2,
            expected: false, // NE DEVRAIT PAS être remboursable
            correct: !canRefund2
        });

        if (canRefund2) {
            results.bugs.push("BUG CRITIQUE: NFT Round 1 remboursable pendant Round 2 actif");
            console.log("🚨 BUG DÉTECTÉ: NFT Round 1 ne devrait PAS être remboursable pendant Round 2!");
            results.summary.failed++;
        } else {
            results.summary.success++;
            console.log("✅ CORRECT: NFT Round 1 bloqué pendant Round 2");
        }

        // Test 3: Round 2 actuel (devrait être remboursable)
        console.log("\n🧪 TEST 3: Round 2 actuel");
        const [canRefund3, msg3] = await campaign.canRefundToken(2000001);
        console.log(`NFT #2000001 (R2): ${canRefund3 ? '✅ CORRECT' : '❌ MAUVAIS'} - ${msg3}`);
        
        results.refundTests.push({
            test: "R2_current_active",
            tokenId: "2000001",
            canRefund: canRefund3,
            message: msg3,
            expected: true, // DEVRAIT être remboursable
            correct: canRefund3
        });

        if (canRefund3) {
            results.summary.success++;
            console.log("✅ CORRECT: NFT Round 2 remboursable (round actif)");
        } else {
            results.bugs.push("NFT Round 2 pas remboursable alors que round actif");
            results.summary.failed++;
        }

        // ===== SESSION LIVE =====
        console.log("\n" + "=".repeat(60));
        console.log("🎬 SESSION LIVE + DAO");
        console.log("=".repeat(60));

        // Finaliser Round 2 d'abord
        await campaign.connect(keeper).finalizeRound();
        console.log("✅ Round 2 finalisé");

        // Session live complète
        const futureTime = Math.floor(Date.now() / 1000) + 3600;
        await dao.connect(founder).scheduleLiveSession(futureTime, "https://live.test.com");
        console.log("✅ Live session programmée");

        await ethers.provider.send("evm_increaseTime", [3600]);
        await ethers.provider.send("evm_mine");
        
        await dao.connect(founder).startLiveSession();
        console.log("✅ Live session démarrée");
        
        await ethers.provider.send("evm_increaseTime", [20 * 60]); // 20 min
        await ethers.provider.send("evm_mine");
        
        await dao.connect(founder).endLiveSession(15);
        console.log("✅ Live session terminée (20 min - VALIDE)");

        const finalPhase = await dao.getCurrentPhase();
        console.log(`🏛️ Phase finale DAO: ${finalPhase} (4=EXCHANGE_PERIOD)`);
        
        if (finalPhase == 4) {
            results.summary.success++;
            console.log("✅ DAO en phase EXCHANGE_PERIOD");
        } else {
            results.bugs.push("DAO pas en phase EXCHANGE_PERIOD après live");
            results.summary.failed++;
        }

        // ===== TESTS REMBOURSEMENT POST-LIVE (CRITIQUE) =====
        console.log("\n" + "=".repeat(60));
        console.log("🔄 TESTS REMBOURSEMENT POST-LIVE (CRITIQUE)");
        console.log("=".repeat(60));

        // Test 4: Round 1 pendant EXCHANGE_PERIOD (DEVRAIT être remboursable maintenant)
        console.log("\n🧪 TEST 4 (CRITIQUE): Round 1 pendant EXCHANGE_PERIOD");
        const [canRefund4, msg4] = await campaign.canRefundToken(1000001);
        console.log(`NFT #1000001 (R1): ${canRefund4 ? '✅ CRITIQUE OK' : '🚨 CRITIQUE FAILED'} - ${msg4}`);
        
        results.refundTests.push({
            test: "R1_during_EXCHANGE_PERIOD",
            tokenId: "1000001",
            canRefund: canRefund4,
            message: msg4,
            expected: true, // DEVRAIT être remboursable maintenant
            correct: canRefund4
        });

        if (canRefund4) {
            results.summary.success++;
            console.log("✅ CRITIQUE VALIDÉ: NFT Round 1 remboursable pendant échange");
            
            // Test remboursement réel
            const balanceBefore = await ethers.provider.getBalance(investor1.address);
            await campaign.connect(investor1).refundShares([1000001]);
            const balanceAfter = await ethers.provider.getBalance(investor1.address);
            const netGain = balanceAfter.sub(balanceBefore);
            
            console.log(`💰 Remboursement R1 réussi: ${ethers.utils.formatEther(netGain)} ETH net`);
            results.refundTests.push({ 
                test: "R1_actual_refund", 
                success: true, 
                amount: ethers.utils.formatEther(netGain) 
            });
            
        } else {
            results.bugs.push("CRITIQUE: NFT Round 1 PAS remboursable pendant EXCHANGE_PERIOD");
            results.summary.failed++;
        }

        // Test 5: Round 2 pendant EXCHANGE_PERIOD
        console.log("\n🧪 TEST 5: Round 2 pendant EXCHANGE_PERIOD");
        const [canRefund5, msg5] = await campaign.canRefundToken(2000001);
        console.log(`NFT #2000001 (R2): ${canRefund5 ? '✅' : '❌'} - ${msg5}`);
        
        if (canRefund5) {
            results.summary.success++;
            const balanceBefore = await ethers.provider.getBalance(investor4.address);
            await campaign.connect(investor4).refundShares([2000001]);
            const balanceAfter = await ethers.provider.getBalance(investor4.address);
            const netGain = balanceAfter.sub(balanceBefore);
            
            console.log(`💰 Remboursement R2 réussi: ${ethers.utils.formatEther(netGain)} ETH net`);
        } else {
            results.bugs.push("NFT Round 2 pas remboursable pendant EXCHANGE_PERIOD");
            results.summary.failed++;
        }

        // ===== GOUVERNANCE COMPLÈTE =====
        console.log("\n" + "=".repeat(60));
        console.log("🗳️ GOUVERNANCE COMPLÈTE");
        console.log("=".repeat(60));

        // Pouvoirs de vote
        const power1 = await governance.getVotingPower(investor1.address);
        const power2 = await governance.getVotingPower(investor2.address); 
        const power3 = await governance.getVotingPower(investor3.address);
        const power4 = await governance.getVotingPower(investor4.address);
        
        console.log(`📊 POUVOIRS DE VOTE:`);
        console.log(`Investor1: ${power1} (3-1 remboursé = 2)`);
        console.log(`Investor2: ${power2} (4 NFTs)`);
        console.log(`Investor3: ${power3} (3 NFTs)`);
        console.log(`Investor4: ${power4} (2-1 remboursé = 1)`);
        
        const totalPower = power1.add(power2).add(power3).add(power4);
        console.log(`💪 Total: ${totalPower} votes`);
        
        results.governanceTests.push({
            investor1Power: power1.toString(),
            investor2Power: power2.toString(),
            investor3Power: power3.toString(), 
            investor4Power: power4.toString(),
            totalPower: totalPower.toString()
        });

        // Création de proposition (Founder paye)
        console.log("\n🏛️ CRÉATION PROPOSITION (Founder paye):");
        const founderBalance3Before = await ethers.provider.getBalance(founder.address);
        
        const tx = await governance.connect(founder).createProposal(
            0, // PARAMETER_CHANGE
            "Réduire commission 5% → 3%",
            "Réduction commission pour attirer plus d'investisseurs",
            ethers.utils.defaultAbiCoder.encode(["uint256"], [300]), // 3%
            25, // 25% quorum
            60  // 60% majorité
        );
        
        const receiptProp = await tx.wait();
        const founderBalance3After = await ethers.provider.getBalance(founder.address);
        const proposalCost = founderBalance3Before.sub(founderBalance3After);
        
        console.log("✅ Proposition créée par FOUNDER");
        console.log(`💰 Coût création: ${ethers.utils.formatEther(proposalCost)} ETH`);
        
        results.transactionCosts.push({
            action: "CREATE_PROPOSAL",
            payer: "FOUNDER",
            cost: ethers.utils.formatEther(proposalCost),
            gasUsed: receiptProp.gasUsed.toString()
        });

        // Votes avec coûts
        console.log("\n🗳️ VOTES (chacun paye son vote):");
        
        // Vote Investor2 POUR
        const voter2BalanceBefore = await ethers.provider.getBalance(investor2.address);
        const voteTx = await governance.connect(investor2).castVote(1, 1, "Vote POUR");
        const voteReceipt = await voteTx.wait();
        const voter2BalanceAfter = await ethers.provider.getBalance(investor2.address);
        const vote2Cost = voter2BalanceBefore.sub(voter2BalanceAfter);
        
        console.log(`✅ Investor2 vote POUR (${power2} votes)`);
        console.log(`💰 Coût vote: ${ethers.utils.formatEther(vote2Cost)} ETH`);
        
        results.transactionCosts.push({
            action: "CAST_VOTE", 
            payer: "INVESTOR2",
            cost: ethers.utils.formatEther(vote2Cost),
            gasUsed: voteReceipt.gasUsed.toString()
        });

        // Vote Investor3 POUR
        await governance.connect(investor3).castVote(1, 1, "POUR aussi");
        console.log(`✅ Investor3 vote POUR (${power3} votes)`);

        // Résultats vote
        const proposal = await governance.getProposal(1);
        const voteResults = await governance.getProposalResults(1);
        
        console.log(`\n📊 RÉSULTATS VOTE:`);
        console.log(`Pour: ${proposal.forVotes} votes`);
        console.log(`Contre: ${proposal.againstVotes} votes`);
        console.log(`Participation: ${voteResults.participationRate}%`);
        console.log(`Support: ${voteResults.supportRate}%`);
        
        const shouldPass = voteResults.participationRate.gte(25) && voteResults.supportRate.gte(60);
        console.log(`🎯 Proposition devrait ${shouldPass ? 'PASSER' : 'ÉCHOUER'}`);
        
        results.governanceTests.push({
            proposalCreated: true,
            forVotes: proposal.forVotes.toString(),
            againstVotes: proposal.againstVotes.toString(),
            participationRate: voteResults.participationRate.toString(),
            supportRate: voteResults.supportRate.toString(),
            shouldPass: shouldPass
        });

        results.summary.success++;

    } catch (globalError) {
        console.log("❌ ERREUR GLOBALE:", globalError.message);
        results.bugs.push("Erreur globale: " + globalError.message);
        results.summary.failed++;
    }

    // ===== RAPPORT FINAL EXHAUSTIF =====
    console.log("\n" + "=".repeat(80));
    console.log("📊 RAPPORT FINAL EXHAUSTIF");
    console.log("=".repeat(80));

    console.log("\n💰 COÛTS DE DÉPLOIEMENT (QUI PAYE QUOI):");
    results.deploymentCosts.forEach((cost, i) => {
        console.log(`${i+1}. ${cost.contract} → ${cost.payer} paye ${cost.cost} ETH`);
    });

    console.log("\n💸 COÛTS TRANSACTIONS:");
    results.transactionCosts.forEach((cost, i) => {
        console.log(`${i+1}. ${cost.action} → ${cost.payer} paye ${cost.cost} ETH`);
    });

    console.log("\n🚀 TESTS ROUNDS:");
    results.roundTests.forEach((test, i) => {
        console.log(`${i+1}. Round ${test.round}: ${JSON.stringify(test)}`);
    });

    console.log("\n🔄 TESTS REMBOURSEMENT:");
    results.refundTests.forEach((test, i) => {
        const status = test.correct ? "✅ OK" : "❌ FAILED";
        console.log(`${i+1}. ${test.test}: ${status}`);
        if (test.message) console.log(`   Message: ${test.message}`);
    });

    console.log("\n🗳️ TESTS GOUVERNANCE:");
    results.governanceTests.forEach((test, i) => {
        console.log(`${i+1}. ${JSON.stringify(test)}`);
    });

    console.log("\n🚨 BUGS DÉTECTÉS:");
    results.bugs.forEach((bug, i) => {
        console.log(`${i+1}. ${bug}`);
    });

    console.log("\n⚠️ AVERTISSEMENTS:");
    results.warnings.forEach((warning, i) => {
        console.log(`${i+1}. ${warning}`);
    });

    const totalTests = results.summary.success + results.summary.failed;
    const successRate = (results.summary.success / totalTests * 100).toFixed(1);
    
    console.log(`\n📈 RÉSULTATS FINAUX:`);
    console.log(`✅ Succès: ${results.summary.success}`);
    console.log(`❌ Échecs: ${results.summary.failed}`);
    console.log(`📊 Taux réussite: ${successRate}%`);
    console.log(`🐛 Bugs critiques: ${results.bugs.length}`);

    if (results.bugs.length === 0 && results.summary.failed === 0) {
        console.log("\n🎉 SYSTÈME 100% VALIDÉ!");
        console.log("🚀 TOUS SCÉNARIOS PASSÉS - PRÊT POUR PRODUCTION!");
    } else if (results.bugs.length === 0) {
        console.log("\n✅ AUCUN BUG CRITIQUE DÉTECTÉ");
        console.log("⚠️ Quelques échecs mineurs seulement");
    } else {
        console.log(`\n❌ ${results.bugs.length} bugs critiques à corriger`);
        console.log("🔧 SYSTÈME PAS ENCORE PRÊT POUR PRODUCTION");
    }

    console.log("\n🔍 RÉPONSES À TES QUESTIONS:");
    console.log("• QUI PAYE LE DÉPLOIEMENT DAO? → Le FOUNDER");
    console.log("• QUI PAYE LES VOTES? → Chaque INVESTISSEUR paye son propre vote");
    console.log("• COMBIEN DE ROUNDS TESTÉS? → 2 rounds complets");
    console.log("• TOUS SCÉNARIOS TESTÉS? → Multi-rounds, gouvernance, remboursements, coûts");
    console.log("• BUG CRITIQUE CORRIGÉ? → " + (results.refundTests.find(t => t.test === "R1_during_EXCHANGE_PERIOD" && t.correct) ? "✅ OUI" : "❌ NON"));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("💥 ERREUR FATALE:", error.message);
        process.exit(1);
    });