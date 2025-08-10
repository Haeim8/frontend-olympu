const { ethers } = require("hardhat");

async function main() {
    console.log("🔬 TEST SUPER EXHAUSTIF - TOUS LES SCÉNARIOS POSSIBLES");
    console.log("=" .repeat(80));
    console.log("📋 ON TESTE VRAIMENT TOUT - MULTI-ROUNDS, GOUVERNANCE, FRAIS, ERREURS");
    console.log("=" .repeat(80));
    
    let results = {
        deployments: { success: 0, failed: 0, details: [] },
        rounds: { success: 0, failed: 0, details: [] },
        refunds: { success: 0, failed: 0, details: [] },
        governance: { success: 0, failed: 0, details: [] },
        dao: { success: 0, failed: 0, details: [] },
        costs: { deploymentCosts: [], transactionCosts: [] },
        bugs: [],
        warnings: []
    };

    try {
        // Récupérer plus de signers pour tests avancés
        let [deployer, founder, investor1, investor2, investor3, investor4, treasury, keeper] = await ethers.getSigners();
        
        console.log("\n👥 PARTICIPANTS (8 ADDRESSES):");
        console.log("🏗️ Deployeur:", deployer.address);
        console.log("👑 Founder:", founder.address);
        console.log("💰 Investor1:", investor1.address);
        console.log("💰 Investor2:", investor2.address);
        console.log("💰 Investor3:", investor3.address);
        console.log("💰 Investor4:", investor4.address);
        console.log("🏦 Treasury:", treasury.address);
        console.log("🤖 Keeper:", keeper.address);

        // ===== PHASE 1: DÉPLOIEMENTS AVEC COÛTS =====
        console.log("\n" + "=".repeat(60));
        console.log("🏗️ PHASE 1 - DÉPLOIEMENTS ET COÛTS");
        console.log("=".repeat(60));

        let campaign, dao, governance, liveManager;
        
        // Déploiement Campaign avec coûts
        try {
            const deployerBalanceBefore = await ethers.provider.getBalance(deployer.address);
            
            const Campaign = await ethers.getContractFactory("Campaign");
            const deployTx = await Campaign.getDeployTransaction(
                founder.address,
                "Test Super Exhaustif",
                "TSE",
                ethers.utils.parseEther("50"), // 50 ETH target (gros projet)
                ethers.utils.parseEther("2.5"), // 2.5 ETH par NFT
                Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 jours
                treasury.address,
                750, // 7.5% commission
                treasury.address,
                "ipfs://super-exhaustif-test",
                deployer.address,
                keeper.address
            );
            
            const gasEstimate = await ethers.provider.estimateGas(deployTx);
            campaign = await Campaign.deploy(
                founder.address, "Test Super Exhaustif", "TSE",
                ethers.utils.parseEther("50"), ethers.utils.parseEther("2.5"),
                Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
                treasury.address, 750, treasury.address, "ipfs://super-exhaustif-test",
                deployer.address, keeper.address
            );
            
            const receipt = await campaign.deployTransaction.wait();
            const deployerBalanceAfter = await ethers.provider.getBalance(deployer.address);
            const deploymentCost = deployerBalanceBefore.sub(deployerBalanceAfter);
            
            console.log("✅ Campaign déployé:", campaign.address);
            console.log(`💰 Coût déploiement: ${ethers.utils.formatEther(deploymentCost)} ETH`);
            console.log(`⛽ Gas utilisé: ${receipt.gasUsed.toString()}`);
            
            results.deployments.success++;
            results.costs.deploymentCosts.push({
                contract: "Campaign",
                cost: ethers.utils.formatEther(deploymentCost),
                gasUsed: receipt.gasUsed.toString()
            });
            
        } catch (error) {
            console.log("❌ Campaign déploiement FAILED:", error.message.split('\n')[0]);
            results.deployments.failed++;
            results.deployments.details.push({ contract: "Campaign", status: "FAILED", error: error.message });
        }

        // Déploiement LiveSessionManager
        try {
            const LiveSessionManager = await ethers.getContractFactory("LiveSessionManager");
            liveManager = await LiveSessionManager.deploy();
            const receipt = await liveManager.deployTransaction.wait();
            
            console.log("✅ LiveSessionManager déployé:", liveManager.address);
            console.log(`⛽ Gas utilisé: ${receipt.gasUsed.toString()}`);
            results.deployments.success++;
            
        } catch (error) {
            console.log("❌ LiveSessionManager FAILED:", error.message.split('\n')[0]);
            results.deployments.failed++;
        }

        // Déploiement CampaignDAO (qui paye ?)
        try {
            const founderBalanceBefore = await ethers.provider.getBalance(founder.address);
            
            const CampaignDAO = await ethers.getContractFactory("CampaignDAO", founder); // Founder déploie
            dao = await CampaignDAO.deploy(campaign.address, liveManager.address, founder.address);
            const receipt = await dao.deployTransaction.wait();
            
            const founderBalanceAfter = await ethers.provider.getBalance(founder.address);
            const daoCost = founderBalanceBefore.sub(founderBalanceAfter);
            
            console.log("✅ CampaignDAO déployé par FOUNDER:", dao.address);
            console.log(`💰 Coût DAO pour founder: ${ethers.utils.formatEther(daoCost)} ETH`);
            console.log(`⛽ Gas utilisé: ${receipt.gasUsed.toString()}`);
            
            results.deployments.success++;
            results.costs.deploymentCosts.push({
                contract: "CampaignDAO",
                payer: "FOUNDER",
                cost: ethers.utils.formatEther(daoCost),
                gasUsed: receipt.gasUsed.toString()
            });
            
        } catch (error) {
            console.log("❌ CampaignDAO FAILED:", error.message.split('\n')[0]);
            results.deployments.failed++;
        }

        // Déploiement CampaignGovernance (qui paye ?)
        try {
            const deployerBalanceBefore = await ethers.provider.getBalance(deployer.address);
            
            const CampaignGovernance = await ethers.getContractFactory("CampaignGovernance", deployer); // Deployer paye
            governance = await CampaignGovernance.deploy(campaign.address, founder.address);
            const receipt = await governance.deployTransaction.wait();
            
            const deployerBalanceAfter = await ethers.provider.getBalance(deployer.address);
            const govCost = deployerBalanceBefore.sub(deployerBalanceAfter);
            
            console.log("✅ CampaignGovernance déployé par DEPLOYER:", governance.address);
            console.log(`💰 Coût Governance pour deployer: ${ethers.utils.formatEther(govCost)} ETH`);
            console.log(`⛽ Gas utilisé: ${receipt.gasUsed.toString()}`);
            
            results.deployments.success++;
            results.costs.deploymentCosts.push({
                contract: "CampaignGovernance", 
                payer: "DEPLOYER",
                cost: ethers.utils.formatEther(govCost),
                gasUsed: receipt.gasUsed.toString()
            });
            
        } catch (error) {
            console.log("❌ CampaignGovernance FAILED:", error.message.split('\n')[0]);
            results.deployments.failed++;
        }

        // Connexions
        await campaign.connect(founder).setDAOContract(dao.address);
        await campaign.connect(founder).setGovernanceContract(governance.address);
        console.log("✅ Tous les contrats connectés");

        // ===== PHASE 2: ROUND 1 EXHAUSTIF =====
        console.log("\n" + "=".repeat(60));
        console.log("💰 PHASE 2 - ROUND 1 EXHAUSTIF (50 ETH TARGET)");
        console.log("=".repeat(60));

        // Investissement 1: Petit investisseur
        try {
            const tx = await campaign.connect(investor1).buyShares(2, { value: ethers.utils.parseEther("5") });
            const receipt = await tx.wait();
            console.log(`✅ Investor1: 2 NFTs pour 5 ETH (gas: ${receipt.gasUsed})`);
            results.rounds.success++;
            
            const balance1 = await campaign.balanceOf(investor1.address);
            console.log(`📊 Balance Investor1: ${balance1} NFTs`);
            
        } catch (error) {
            console.log("❌ Investor1 Round1 FAILED:", error.message.split('\n')[0]);
            results.rounds.failed++;
        }

        // Investissement 2: Gros investisseur
        try {
            await campaign.connect(investor2).buyShares(8, { value: ethers.utils.parseEther("20") });
            console.log("✅ Investor2: 8 NFTs pour 20 ETH (gros investisseur)");
            results.rounds.success++;
            
        } catch (error) {
            console.log("❌ Investor2 Round1 FAILED:", error.message.split('\n')[0]);
            results.rounds.failed++;
        }

        // Investissement 3: Compléter pour atteindre objectif
        try {
            await campaign.connect(investor3).buyShares(10, { value: ethers.utils.parseEther("25") });
            console.log("✅ Investor3: 10 NFTs pour 25 ETH (atteint objectif)");
            results.rounds.success++;
            
            // Vérifier auto-finalisation
            const roundInfo = await campaign.getCurrentRound();
            console.log(`📊 Round 1: ${ethers.utils.formatEther(roundInfo.fundsRaised)} ETH, finalisé: ${roundInfo.isFinalized}`);
            
            if (roundInfo.isFinalized) {
                console.log("✅ AUTO-FINALISATION Round 1 OK");
                results.rounds.success++;
            } else {
                console.log("⚠️ Round 1 pas auto-finalisé");
                results.warnings.push("Round 1 devrait être auto-finalisé");
            }
            
        } catch (error) {
            console.log("❌ Investor3 Round1 FAILED:", error.message.split('\n')[0]);
            results.rounds.failed++;
        }

        // ===== PHASE 3: TESTS REMBOURSEMENT ROUND 1 =====
        console.log("\n" + "=".repeat(60));
        console.log("🔄 PHASE 3 - TESTS REMBOURSEMENT ROUND 1");
        console.log("=".repeat(60));

        // Test 1: Remboursement après finalisation (avant live)
        console.log("\n🧪 TEST 1: Remboursement Round 1 après finalisation (avant live)");
        try {
            const [canRefund1, msg1] = await campaign.canRefundToken(1000001);
            console.log(`NFT #1000001: ${canRefund1 ? '✅' : '❌'} - ${msg1}`);
            
            if (!canRefund1 && msg1.includes("not active")) {
                results.refunds.success++;
                console.log("✅ CORRECT: NFT bloqué après finalisation");
            } else {
                results.bugs.push("NFT Round 1 remboursable après finalisation (avant live)");
                results.refunds.failed++;
            }
            
        } catch (error) {
            console.log("❌ Test remboursement 1 FAILED:", error.message.split('\n')[0]);
            results.refunds.failed++;
        }

        // ===== PHASE 4: ROUND 2 =====
        console.log("\n" + "=".repeat(60));
        console.log("🚀 PHASE 4 - ROUND 2 (PRIX AUGMENTÉ)");
        console.log("=".repeat(60));

        try {
            await campaign.connect(founder).startNewRound(
                ethers.utils.parseEther("80"), // 80 ETH target
                ethers.utils.parseEther("4"),   // 4 ETH par NFT (+60%)
                30 * 24 * 60 * 60 // 30 jours
            );
            console.log("✅ Round 2 démarré: 4 ETH/NFT (60% augmentation)");
            results.rounds.success++;
            
            // Investissement Round 2
            await campaign.connect(investor4).buyShares(3, { value: ethers.utils.parseEther("12") });
            console.log("✅ Investor4: 3 NFTs Round 2 pour 12 ETH");
            results.rounds.success++;
            
            // Vérifier IDs des NFTs Round 2
            const balance4 = await campaign.balanceOf(investor4.address);
            const tokenId = await campaign.tokenOfOwnerByIndex(investor4.address, 0);
            console.log(`📊 Investor4 balance: ${balance4}, premier NFT ID: ${tokenId}`);
            
            if (tokenId.toString().startsWith("2000")) {
                console.log("✅ NFT IDs Round 2 corrects (2000xxx)");
                results.rounds.success++;
            } else {
                results.bugs.push("NFT IDs Round 2 incorrects");
                results.rounds.failed++;
            }
            
        } catch (error) {
            console.log("❌ Round 2 FAILED:", error.message.split('\n')[0]);
            results.rounds.failed++;
        }

        // ===== PHASE 5: TESTS REMBOURSEMENT MULTI-ROUNDS =====
        console.log("\n" + "=".repeat(60));
        console.log("🔄 PHASE 5 - REMBOURSEMENTS MULTI-ROUNDS");
        console.log("=".repeat(60));

        // Test 2: Round 1 pendant Round 2 actif (CRITIQUE)
        console.log("\n🧪 TEST 2 (CRITIQUE): Round 1 pendant Round 2 actif");
        try {
            const [canRefund2, msg2] = await campaign.canRefundToken(1000001);
            console.log(`NFT #1000001 (R1): ${canRefund2 ? '🚨' : '✅'} - ${msg2}`);
            
            if (canRefund2) {
                results.bugs.push("BUG CRITIQUE: NFT Round 1 remboursable pendant Round 2");
                console.log("🚨 BUG DÉTECTÉ: NFT Round 1 ne devrait PAS être remboursable pendant Round 2!");
            } else {
                results.refunds.success++;
                console.log("✅ CORRECT: NFT Round 1 bloqué pendant Round 2");
            }
            
        } catch (error) {
            console.log("❌ Test remboursement 2 FAILED:", error.message.split('\n')[0]);
            results.refunds.failed++;
        }

        // Test 3: Round 2 actuel
        console.log("\n🧪 TEST 3: Round 2 actuel remboursable");
        try {
            const [canRefund3, msg3] = await campaign.canRefundToken(2000001);
            console.log(`NFT #2000001 (R2): ${canRefund3 ? '✅' : '❌'} - ${msg3}`);
            
            if (canRefund3) {
                results.refunds.success++;
                console.log("✅ CORRECT: NFT Round 2 remboursable (round actif)");
            } else {
                results.bugs.push("NFT Round 2 pas remboursable alors que round actif");
                results.refunds.failed++;
            }
            
        } catch (error) {
            console.log("❌ Test remboursement 3 FAILED:", error.message.split('\n')[0]);
            results.refunds.failed++;
        }

        // ===== PHASE 6: SESSION LIVE AVEC ROUND 2 =====
        console.log("\n" + "=".repeat(60));
        console.log("🎬 PHASE 6 - SESSION LIVE (ROUND 2 ACTIF)");
        console.log("=".repeat(60));

        // Finaliser Round 2 d'abord
        try {
            await campaign.connect(keeper).finalizeRound();
            console.log("✅ Round 2 finalisé par Keeper");
            results.dao.success++;
        } catch (error) {
            console.log("❌ Finalisation Round 2 FAILED:", error.message.split('\n')[0]);
            results.dao.failed++;
        }

        // Vérifier phase DAO
        try {
            const daoPhase = await dao.getCurrentPhase();
            console.log(`🏛️ Phase DAO: ${daoPhase} (1=WAITING_FOR_LIVE)`);
            
            if (daoPhase == 1) {
                results.dao.success++;
                console.log("✅ DAO en attente de programmation live");
            } else {
                results.bugs.push("DAO pas en phase WAITING_FOR_LIVE après finalisation");
                results.dao.failed++;
            }
        } catch (error) {
            console.log("❌ Phase DAO check FAILED:", error.message.split('\n')[0]);
        }

        // Programmer et faire session live complète
        const futureTime = Math.floor(Date.now() / 1000) + 3600;
        await dao.connect(founder).scheduleLiveSession(futureTime, "https://live.test.com");
        
        await ethers.provider.send("evm_increaseTime", [3600]);
        await ethers.provider.send("evm_mine");
        
        await dao.connect(founder).startLiveSession();
        console.log("✅ Live session démarrée");
        
        await ethers.provider.send("evm_increaseTime", [25 * 60]); // 25 min
        await ethers.provider.send("evm_mine");
        
        await dao.connect(founder).endLiveSession(20);
        console.log("✅ Live session terminée (25 min - VALIDE)");
        
        const finalPhase = await dao.getCurrentPhase();
        if (finalPhase == 4) { // EXCHANGE_PERIOD
            console.log("✅ DAO en phase EXCHANGE_PERIOD");
            results.dao.success++;
        } else {
            console.log("❌ DAO pas en phase EXCHANGE_PERIOD:", finalPhase);
            results.dao.failed++;
        }

        // ===== PHASE 7: REMBOURSEMENTS POST-LIVE =====
        console.log("\n" + "=".repeat(60));
        console.log("🔄 PHASE 7 - REMBOURSEMENTS POST-LIVE (TOUS ROUNDS)");
        console.log("=".repeat(60));

        // Test 4: Round 1 pendant EXCHANGE_PERIOD
        console.log("\n🧪 TEST 4 (CRITIQUE): Round 1 pendant EXCHANGE_PERIOD");
        try {
            const [canRefund4, msg4] = await campaign.canRefundToken(1000001);
            console.log(`NFT #1000001 (R1): ${canRefund4 ? '✅' : '❌'} - ${msg4}`);
            
            if (canRefund4) {
                results.refunds.success++;
                console.log("✅ CRITIQUE VALIDÉ: NFT Round 1 remboursable pendant échange");
                
                // Test remboursement réel Round 1
                const balanceBefore = await ethers.provider.getBalance(investor1.address);
                const refundAmount = await campaign.getRefundAmount(1000001);
                console.log(`💰 Montant remboursement prévu: ${ethers.utils.formatEther(refundAmount)} ETH`);
                
                await campaign.connect(investor1).refundShares([1000001]);
                
                const balanceAfter = await ethers.provider.getBalance(investor1.address);
                const netGain = balanceAfter.sub(balanceBefore);
                console.log(`✅ Remboursement Round 1 réussi: ${ethers.utils.formatEther(netGain)} ETH net`);
                
            } else {
                results.bugs.push("CRITIQUE: NFT Round 1 pas remboursable pendant EXCHANGE_PERIOD");
                console.log("🚨 BUG CRITIQUE: NFT Round 1 devrait être remboursable!");
            }
            
        } catch (error) {
            console.log("❌ Test remboursement 4 FAILED:", error.message.split('\n')[0]);
            results.refunds.failed++;
        }

        // Test 5: Round 2 pendant EXCHANGE_PERIOD  
        console.log("\n🧪 TEST 5: Round 2 pendant EXCHANGE_PERIOD");
        try {
            const [canRefund5, msg5] = await campaign.canRefundToken(2000001);
            console.log(`NFT #2000001 (R2): ${canRefund5 ? '✅' : '❌'} - ${msg5}`);
            
            if (canRefund5) {
                results.refunds.success++;
                console.log("✅ NFT Round 2 aussi remboursable pendant échange");
                
                // Test remboursement réel Round 2  
                const balanceBefore = await ethers.provider.getBalance(investor4.address);
                const refundAmount = await campaign.getRefundAmount(2000001);
                console.log(`💰 Montant remboursement Round 2 prévu: ${ethers.utils.formatEther(refundAmount)} ETH`);
                
                await campaign.connect(investor4).refundShares([2000001]);
                
                const balanceAfter = await ethers.provider.getBalance(investor4.address);
                const netGain = balanceAfter.sub(balanceBefore);
                console.log(`✅ Remboursement Round 2 réussi: ${ethers.utils.formatEther(netGain)} ETH net`);
                
            } else {
                results.bugs.push("NFT Round 2 pas remboursable pendant EXCHANGE_PERIOD");
                results.refunds.failed++;
            }
            
        } catch (error) {
            console.log("❌ Test remboursement 5 FAILED:", error.message.split('\n')[0]);
            results.refunds.failed++;
        }

        // ===== PHASE 8: GOUVERNANCE EXHAUSTIVE =====
        console.log("\n" + "=".repeat(60));
        console.log("🗳️ PHASE 8 - GOUVERNANCE EXHAUSTIVE");
        console.log("=".repeat(60));

        // Vérifier pouvoirs de vote détaillés
        console.log("\n📊 POUVOIRS DE VOTE PAR INVESTISSEUR:");
        const power1 = await governance.getVotingPower(investor1.address);
        const power2 = await governance.getVotingPower(investor2.address); 
        const power3 = await governance.getVotingPower(investor3.address);
        const power4 = await governance.getVotingPower(investor4.address);
        
        console.log(`Investor1: ${power1} votes (2 NFTs R1 - 1 remboursé = 1)`);
        console.log(`Investor2: ${power2} votes (8 NFTs R1)`);
        console.log(`Investor3: ${power3} votes (10 NFTs R1)`);
        console.log(`Investor4: ${power4} votes (3 NFTs R2 - 1 remboursé = 2)`);
        
        const totalVotingPower = power1.add(power2).add(power3).add(power4);
        console.log(`💪 Total pouvoir de vote: ${totalVotingPower}`);

        if (power1.gt(0) && power2.gt(0) && power3.gt(0) && power4.gt(0)) {
            results.governance.success++;
            console.log("✅ Tous les investisseurs ont du pouvoir de vote");
        } else {
            results.bugs.push("Certains investisseurs n'ont pas de pouvoir de vote");
            results.governance.failed++;
        }

        // Création de proposition par founder
        console.log("\n🏛️ CRÉATION DE PROPOSITION GOUVERNANCE:");
        try {
            const founderBalanceBefore = await ethers.provider.getBalance(founder.address);
            
            const tx = await governance.connect(founder).createProposal(
                0, // PARAMETER_CHANGE
                "Réduire commission de 7.5% à 5%",
                "Réduction commission pour encourager plus d'investissements dans les rounds futurs. Cela bénéficiera à tous les holders NFT.",
                ethers.utils.defaultAbiCoder.encode(["uint256"], [500]), // 5%
                20, // 20% quorum
                60  // 60% majorité requise
            );
            
            const receipt = await tx.wait();
            const founderBalanceAfter = await ethers.provider.getBalance(founder.address);
            const proposalCost = founderBalanceBefore.sub(founderBalanceAfter);
            
            console.log("✅ Proposition créée par FOUNDER");
            console.log(`💰 Coût création proposition: ${ethers.utils.formatEther(proposalCost)} ETH`);
            console.log(`⛽ Gas utilisé: ${receipt.gasUsed}`);
            
            results.governance.success++;
            results.costs.transactionCosts.push({
                action: "CREATE_PROPOSAL",
                payer: "FOUNDER",
                cost: ethers.utils.formatEther(proposalCost),
                gasUsed: receipt.gasUsed.toString()
            });
            
        } catch (error) {
            console.log("❌ Création proposition FAILED:", error.message.split('\n')[0]);
            results.governance.failed++;
        }

        // Votes détaillés avec coûts
        console.log("\n🗳️ VOTES AVEC COÛTS:");
        
        // Vote Investor2 (POUR)
        try {
            const voterBalanceBefore = await ethers.provider.getBalance(investor2.address);
            const tx = await governance.connect(investor2).castVote(1, 1, "Je vote POUR car réduire commission augmente valeur NFTs");
            const receipt = await tx.wait();
            const voterBalanceAfter = await ethers.provider.getBalance(investor2.address);
            const voteCost = voterBalanceBefore.sub(voterBalanceAfter);
            
            console.log("✅ Investor2 vote POUR (8 votes)");
            console.log(`💰 Coût vote: ${ethers.utils.formatEther(voteCost)} ETH`);
            results.governance.success++;
            
        } catch (error) {
            console.log("❌ Vote Investor2 FAILED:", error.message.split('\n')[0]);
            results.governance.failed++;
        }

        // Vote Investor3 (CONTRE)
        try {
            await governance.connect(investor3).castVote(1, 0, "Je vote CONTRE car commission actuelle finance bien le développement");
            console.log("✅ Investor3 vote CONTRE (10 votes)");
            results.governance.success++;
            
        } catch (error) {
            console.log("❌ Vote Investor3 FAILED:", error.message.split('\n')[0]);
            results.governance.failed++;
        }

        // Vote Investor4 (POUR)
        try {
            await governance.connect(investor4).castVote(1, 1, "POUR - commission plus basse = plus attractif");
            console.log("✅ Investor4 vote POUR (2 votes)");
            results.governance.success++;
            
        } catch (error) {
            console.log("❌ Vote Investor4 FAILED:", error.message.split('\n')[0]);
            results.governance.failed++;
        }

        // Résultats détaillés du vote
        console.log("\n📊 RÉSULTATS VOTE DÉTAILLÉS:");
        try {
            const proposal = await governance.getProposal(1);
            const results_vote = await governance.getProposalResults(1);
            
            console.log(`Votes POUR: ${proposal.forVotes} (Investor2: 8 + Investor4: 2 = 10)`);
            console.log(`Votes CONTRE: ${proposal.againstVotes} (Investor3: 10)`);
            console.log(`Abstentions: ${proposal.abstainVotes}`);
            console.log(`Participation: ${results_vote.participationRate}% (besoin 20%)`);
            console.log(`Support: ${results_vote.supportRate}% (besoin 60%)`);
            
            if (results_vote.participationRate.gte(20) && results_vote.supportRate.gte(60)) {
                console.log("✅ Proposition devrait PASSER (quorum + majorité atteints)");
            } else {
                console.log("❌ Proposition devrait ÉCHOUER (critères non atteints)");
            }
            
            results.governance.success++;
            
        } catch (error) {
            console.log("❌ Résultats vote FAILED:", error.message.split('\n')[0]);
            results.governance.failed++;
        }

        // ===== PHASE 9: ROUND 3 (OPTIONNEL) =====
        console.log("\n" + "=".repeat(60));
        console.log("🚀 PHASE 9 - ROUND 3 (PRIX ÉLEVÉ)");
        console.log("=".repeat(60));

        try {
            await campaign.connect(founder).startNewRound(
                ethers.utils.parseEther("100"), // 100 ETH target
                ethers.utils.parseEther("10"),  // 10 ETH par NFT (prix très élevé)
                15 * 24 * 60 * 60 // 15 jours
            );
            console.log("✅ Round 3 démarré: 10 ETH/NFT (prix premium)");
            
            // Petit investissement Round 3
            await campaign.connect(investor1).buyShares(1, { value: ethers.utils.parseEther("10") });
            console.log("✅ Investor1: 1 NFT Round 3 pour 10 ETH");
            
            results.rounds.success += 2;
            
        } catch (error) {
            console.log("❌ Round 3 FAILED:", error.message.split('\n')[0]);
            results.rounds.failed++;
        }

    } catch (globalError) {
        console.log("❌ ERREUR GLOBALE:", globalError.message);
        results.bugs.push({ severity: "CRITICAL", error: "Erreur globale: " + globalError.message });
    }

    // ===== RAPPORT FINAL EXHAUSTIF =====
    console.log("\n" + "=".repeat(80));
    console.log("📊 RAPPORT FINAL EXHAUSTIF - ANALYSE COMPLÈTE");
    console.log("=".repeat(80));

    console.log(`\n🏗️ DÉPLOIEMENTS: ${results.deployments.success} succès, ${results.deployments.failed} échecs`);
    console.log(`🚀 ROUNDS: ${results.rounds.success} succès, ${results.rounds.failed} échecs`);
    console.log(`🔄 REMBOURSEMENTS: ${results.refunds.success} succès, ${results.refunds.failed} échecs`);
    console.log(`🗳️ GOUVERNANCE: ${results.governance.success} succès, ${results.governance.failed} échecs`);
    console.log(`🏛️ DAO: ${results.dao.success} succès, ${results.dao.failed} échecs`);

    console.log("\n💰 COÛTS DE DÉPLOIEMENT:");
    results.costs.deploymentCosts.forEach((cost, i) => {
        console.log(`${i+1}. ${cost.contract} (${cost.payer || 'Unknown'}): ${cost.cost} ETH (${cost.gasUsed} gas)`);
    });

    console.log("\n💸 COÛTS TRANSACTIONS:");
    results.costs.transactionCosts.forEach((cost, i) => {
        console.log(`${i+1}. ${cost.action} (${cost.payer}): ${cost.cost} ETH (${cost.gasUsed} gas)`);
    });

    console.log("\n🚨 BUGS DÉTECTÉS:");
    results.bugs.forEach((bug, i) => {
        if (typeof bug === 'string') {
            console.log(`${i+1}. ${bug}`);
        } else {
            console.log(`${i+1}. [${bug.severity}] ${bug.error}`);
        }
    });

    console.log("\n⚠️ AVERTISSEMENTS:");
    results.warnings.forEach((warning, i) => {
        console.log(`${i+1}. ${warning}`);
    });

    const totalOperations = results.deployments.success + results.rounds.success + results.refunds.success + results.governance.success + results.dao.success;
    const totalFailures = results.deployments.failed + results.rounds.failed + results.refunds.failed + results.governance.failed + results.dao.failed;
    
    console.log(`\n📈 TAUX DE RÉUSSITE GLOBAL: ${((totalOperations / (totalOperations + totalFailures)) * 100).toFixed(1)}%`);
    console.log(`📊 ${totalOperations} opérations réussies, ${totalFailures} échecs`);

    if (results.bugs.length === 0 && totalFailures === 0) {
        console.log("\n🎉 SYSTÈME 100% VALIDÉ - TOUS SCÉNARIOS PASSÉS!");
        console.log("🚀 PRÊT POUR PRODUCTION AVEC CONFIANCE TOTALE!");
    } else if (results.bugs.length === 0) {
        console.log("\n✅ AUCUN BUG CRITIQUE DÉTECTÉ");
        console.log("⚠️ Quelques échecs mineurs à investiguer");
    } else {
        console.log(`\n❌ ${results.bugs.length} bugs à corriger avant production`);
        console.log("🔧 SYSTÈME PAS ENCORE PRÊT");
    }

    console.log("\n🔍 QUI PAYE QUOI:");
    console.log("• Campaign → Deployer paye");
    console.log("• CampaignDAO → Founder paye");
    console.log("• CampaignGovernance → Deployer paye");
    console.log("• Créer proposition → Founder paye");
    console.log("• Voter → Chaque investisseur paye son vote");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("💥 ERREUR FATALE:", error.message);
        process.exit(1);
    });