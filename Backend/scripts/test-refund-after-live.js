const { ethers } = require("hardhat");

async function main() {
    console.log("🎯 TEST SPÉCIFIQUE - REMBOURSEMENT APRÈS LIVE");
    
    let [deployer, founder, investor1, investor2] = await ethers.getSigners();

    // Setup minimal
    const Campaign = await ethers.getContractFactory("Campaign");
    const campaign = await Campaign.deploy(
        founder.address, "Refund Test", "RT",
        ethers.utils.parseEther("8"), ethers.utils.parseEther("2"),
        Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24h dans le futur
        deployer.address, 500, deployer.address, "ipfs://test",
        deployer.address, deployer.address
    );
    await campaign.deployed();

    const LiveSessionManager = await ethers.getContractFactory("LiveSessionManager");
    const liveManager = await LiveSessionManager.deploy();
    await liveManager.deployed();

    const CampaignDAO = await ethers.getContractFactory("CampaignDAO");
    const dao = await CampaignDAO.deploy(campaign.address, liveManager.address, founder.address);
    await dao.deployed();

    await campaign.connect(founder).setDAOContract(dao.address);

    // Investir pour atteindre objectif
    console.log("💰 Investissements...");
    await campaign.connect(investor1).buyShares(2, { value: ethers.utils.parseEther("4") });
    await campaign.connect(investor2).buyShares(2, { value: ethers.utils.parseEther("4") });
    console.log("✅ 4 NFTs achetés pour 8 ETH");

    // Vérifier avant finalisation
    const [canRefund1, msg1] = await campaign.canRefundToken(1000001);
    console.log(`Avant finalisation NFT #1000001: ${canRefund1 ? '✅' : '❌'} - ${msg1}`);

    // Finaliser
    console.log("\n🏁 Finalisation...");
    await campaign.connect(deployer).finalizeRound();
    console.log("✅ Round finalisé");

    // Vérifier après finalisation
    const [canRefund2, msg2] = await campaign.canRefundToken(1000001);
    console.log(`Après finalisation NFT #1000001: ${canRefund2 ? '✅' : '❌'} - ${msg2}`);

    // Live complet
    console.log("\n🎬 Session Live...");
    const futureTime = Math.floor(Date.now() / 1000) + 1800; // 30 min
    await dao.connect(founder).scheduleLiveSession(futureTime, "https://test.com");
    
    await ethers.provider.send("evm_increaseTime", [1800]); // 30 min
    await ethers.provider.send("evm_mine");
    
    await dao.connect(founder).startLiveSession();
    console.log("✅ Live démarré");
    
    await ethers.provider.send("evm_increaseTime", [20 * 60]); // 20 min
    await ethers.provider.send("evm_mine");
    
    await dao.connect(founder).endLiveSession(15);
    console.log("✅ Live terminé (20 min)");

    // Vérifier phase
    const phase = await dao.getCurrentPhase();
    console.log(`📊 Phase DAO: ${phase} (4=EXCHANGE_PERIOD)`);

    // TEST CRITIQUE: Maintenant NFT doit être remboursable
    console.log("\n🔥 TEST CRITIQUE:");
    const [canRefund3, msg3] = await campaign.canRefundToken(1000001);
    console.log(`Pendant EXCHANGE_PERIOD NFT #1000001: ${canRefund3 ? '✅' : '❌'} - ${msg3}`);

    if (canRefund3) {
        console.log("🎉 SUCCÈS: Bug corrigé! NFT remboursable après live");
        
        // Test remboursement réel
        const balanceBefore = await ethers.provider.getBalance(investor1.address);
        await campaign.connect(investor1).refundShares([1000001]);
        const balanceAfter = await ethers.provider.getBalance(investor1.address);
        const gained = balanceAfter.sub(balanceBefore);
        
        console.log(`💰 Remboursement réussi: ${ethers.utils.formatEther(gained)} ETH net reçu`);
        console.log("✅ REMBOURSEMENT APRÈS LIVE FONCTIONNE PARFAITEMENT!");
    } else {
        console.log("❌ ÉCHEC: Bug pas encore corrigé");
        console.log("💡 Raison:", msg3);
    }
    
    console.log("\n📊 RÉSULTAT FINAL:");
    if (canRefund3) {
        console.log("🎉 SYSTÈME VALIDÉ - Remboursements après live OK");
    } else {
        console.log("⚠️ SYSTÈME PAS PRÊT - Bug critique persiste");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Erreur:", error.message.split('\n')[0]);
        process.exit(1);
    });