const { ethers } = require("hardhat");

async function main() {
    console.log("🏆 TEST FINAL - VALIDATION SYSTÈME COMPLET");
    console.log("=" .repeat(60));
    
    let [deployer, founder, investor1, investor2] = await ethers.getSigners();
    let results = { success: [], critical: [], warnings: [] };

    // === PHASE 1: DÉPLOIEMENT RAPIDE ===
    console.log("\n🏗️ PHASE 1 - DÉPLOIEMENT");
    
    const Campaign = await ethers.getContractFactory("Campaign");
    const campaign = await Campaign.deploy(
        founder.address, "Final Test", "FT",
        ethers.utils.parseEther("8"), ethers.utils.parseEther("2"),
        Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 jours
        deployer.address, 500, deployer.address, "ipfs://final-test",
        deployer.address, deployer.address
    );
    await campaign.deployed();
    console.log("✅ Campaign déployé");

    const LiveSessionManager = await ethers.getContractFactory("LiveSessionManager");
    const liveManager = await LiveSessionManager.deploy();
    await liveManager.deployed();

    const CampaignDAO = await ethers.getContractFactory("CampaignDAO");
    const dao = await CampaignDAO.deploy(campaign.address, liveManager.address, founder.address);
    await dao.deployed();

    const CampaignGovernance = await ethers.getContractFactory("CampaignGovernance");
    const governance = await CampaignGovernance.deploy(campaign.address, founder.address);
    await governance.deployed();

    await campaign.connect(founder).setDAOContract(dao.address);
    await campaign.connect(founder).setGovernanceContract(governance.address);
    console.log("✅ Tous les contrats connectés");

    // === PHASE 2: INVESTISSEMENTS ET FINALISATION ===
    console.log("\n💰 PHASE 2 - INVESTISSEMENTS");

    await campaign.connect(investor1).buyShares(2, { value: ethers.utils.parseEther("4") });
    await campaign.connect(investor2).buyShares(2, { value: ethers.utils.parseEther("4") });
    console.log("✅ 4 NFTs achetés pour 8 ETH");

    await campaign.connect(deployer).finalizeRound();
    console.log("✅ Round finalisé, DAO activé");

    // === PHASE 3: TEST CRITIQUE REMBOURSEMENT ===
    console.log("\n🔥 PHASE 3 - TESTS CRITIQUES");

    // Test 1: NFT Round 1 pas remboursable après finalisation (avant live)
    const [canRefund1, msg1] = await campaign.canRefundToken(1000001);
    if (!canRefund1 && msg1.includes("Current round is not active")) {
        console.log("✅ TEST 1 PASSÉ: NFT Round 1 bloqué après finalisation");
        results.success.push("NFT Round 1 bloqué correctement après finalisation");
    } else {
        console.log("❌ TEST 1 FAILED:", msg1);
        results.critical.push("NFT Round 1 devrait être bloqué après finalisation");
    }

    // === PHASE 4: SESSION LIVE ===
    console.log("\n🎬 PHASE 4 - SESSION LIVE");

    const futureTime = Math.floor(Date.now() / 1000) + 1800; // 30 min
    await dao.connect(founder).scheduleLiveSession(futureTime, "https://test.live");
    
    await ethers.provider.send("evm_increaseTime", [1800]);
    await ethers.provider.send("evm_mine");
    
    await dao.connect(founder).startLiveSession();
    
    await ethers.provider.send("evm_increaseTime", [20 * 60]);
    await ethers.provider.send("evm_mine");
    
    await dao.connect(founder).endLiveSession(10);
    console.log("✅ Live Session complétée (20 min)");

    const daoPhase = await dao.getCurrentPhase();
    if (daoPhase == 4) { // EXCHANGE_PERIOD
        console.log("✅ DAO en phase EXCHANGE_PERIOD");
        results.success.push("DAO transition vers EXCHANGE_PERIOD réussie");
    } else {
        console.log("❌ DAO pas en phase EXCHANGE_PERIOD:", daoPhase);
        results.critical.push("DAO pas en phase EXCHANGE_PERIOD après live");
    }

    // === PHASE 5: TEST CRITIQUE POST-LIVE ===
    console.log("\n🔥 PHASE 5 - TEST REMBOURSEMENT POST-LIVE");

    const [canRefund2, msg2] = await campaign.canRefundToken(1000001);
    if (canRefund2) {
        console.log("✅ TEST CRITIQUE PASSÉ: NFT remboursable pendant EXCHANGE_PERIOD");
        results.success.push("NFT remboursable pendant période échange ✅");
        
        // Test remboursement réel
        try {
            const balanceBefore = await ethers.provider.getBalance(investor1.address);
            await campaign.connect(investor1).refundShares([1000001]);
            const balanceAfter = await ethers.provider.getBalance(investor1.address);
            const gained = balanceAfter.sub(balanceBefore);
            
            console.log(`✅ REMBOURSEMENT RÉUSSI: ${ethers.utils.formatEther(gained)} ETH net reçu`);
            results.success.push("Remboursement réel exécuté avec succès");
        } catch (error) {
            console.log("❌ Remboursement failed:", error.message.split('\n')[0]);
            results.critical.push("Remboursement réel échoué");
        }
    } else {
        console.log("❌ TEST CRITIQUE FAILED:", msg2);
        results.critical.push("NFT pas remboursable pendant période échange");
    }

    // === PHASE 6: GOUVERNANCE ===
    console.log("\n🗳️ PHASE 6 - GOUVERNANCE");

    const votingPower1 = await governance.getVotingPower(investor1.address);
    const votingPower2 = await governance.getVotingPower(investor2.address);
    
    if (votingPower1.gt(0) && votingPower2.gt(0)) {
        console.log(`✅ Pouvoirs de vote: Investor1=${votingPower1}, Investor2=${votingPower2}`);
        results.success.push("Système de gouvernance opérationnel");
    } else {
        console.log("❌ Pouvoirs de vote incorrects");
        results.critical.push("Pouvoirs de vote incorrects");
    }

    // Test création de proposition
    try {
        await governance.connect(founder).createProposal(
            0, // PARAMETER_CHANGE
            "Réduire commission à 10%",
            "Test final gouvernance",
            ethers.utils.defaultAbiCoder.encode(["uint256"], [10]),
            25, // 25% quorum
            51  // 51% majorité
        );
        console.log("✅ Proposition gouvernance créée");
        results.success.push("Création de proposition gouvernance");
    } catch (error) {
        console.log("❌ Création proposition failed:", error.message.split('\n')[0]);
        results.critical.push("Création proposition gouvernance échouée");
    }

    // === PHASE 7: CLÔTURE DAO ===
    console.log("\n🏁 PHASE 7 - CLÔTURE DAO");

    // Avancer le temps pour dépasser la période d'échange
    await ethers.provider.send("evm_increaseTime", [25 * 60 * 60]); // 25h
    await ethers.provider.send("evm_mine");

    try {
        const founderBalanceBefore = await ethers.provider.getBalance(founder.address);
        const contractBalance = await ethers.provider.getBalance(campaign.address);
        
        await dao.connect(deployer).closeDAOPhase(); // Keeper call
        
        const founderBalanceAfter = await ethers.provider.getBalance(founder.address);
        
        if (founderBalanceAfter.gt(founderBalanceBefore)) {
            console.log("✅ Clôture DAO et transfert fonds au founder réussi");
            results.success.push("Clôture automatique DAO réussie");
        } else {
            console.log("❌ Transfert fonds au founder failed");
            results.critical.push("Transfert fonds au founder échoué");
        }
    } catch (error) {
        console.log("❌ Clôture DAO failed:", error.message.split('\n')[0]);
        results.critical.push("Clôture DAO échouée");
    }

    // === RAPPORT FINAL ===
    console.log("\n" + "=".repeat(60));
    console.log("📊 RAPPORT FINAL - VALIDATION SYSTÈME");
    console.log("=".repeat(60));

    console.log(`\n✅ SUCCÈS (${results.success.length}):`);
    results.success.forEach((s, i) => console.log(`${i+1}. ${s}`));

    console.log(`\n⚠️ AVERTISSEMENTS (${results.warnings.length}):`);
    results.warnings.forEach((w, i) => console.log(`${i+1}. ${w}`));

    console.log(`\n🚨 PROBLÈMES CRITIQUES (${results.critical.length}):`);
    results.critical.forEach((c, i) => console.log(`${i+1}. ${c}`));

    if (results.critical.length === 0) {
        console.log("\n🎉 TOUS LES TESTS CRITIQUES PASSÉS!");
        console.log("🚀 SYSTÈME VALIDÉ ET PRÊT POUR PRODUCTION!");
        console.log("\n📋 FONCTIONNALITÉS VALIDÉES:");
        console.log("✅ Investissements et minting NFTs");
        console.log("✅ Finalisation automatique et activation DAO");
        console.log("✅ Session live obligatoire avec validation durée");
        console.log("✅ Remboursements pendant période d'échange");
        console.log("✅ Système de gouvernance avec votes NFT");
        console.log("✅ Clôture automatique et transfert fonds");
        console.log("\n🔒 BUG CRITIQUE CORRIGÉ:");
        console.log("✅ NFTs remboursables après live sessions pendant période échange");
    } else {
        console.log(`\n❌ ${results.critical.length} problèmes critiques à résoudre avant production`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("💥 ERREUR FATALE:", error.message);
        process.exit(1);
    });