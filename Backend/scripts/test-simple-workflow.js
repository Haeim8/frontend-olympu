const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 TEST WORKFLOW SIMPLIFIÉ - ÉCOSYSTÈME LIVAR");
    
    let [deployer, founder, investor1, investor2] = await ethers.getSigners();
    
    console.log("\n👥 PARTICIPANTS:");
    console.log("Deployeur:", deployer.address);
    console.log("Founder:", founder.address);
    console.log("Investor1:", investor1.address);
    console.log("Investor2:", investor2.address);

    // ===== DÉPLOIEMENT =====
    console.log("\n🏗️ DÉPLOIEMENT");

    const Campaign = await ethers.getContractFactory("Campaign");
    const campaign = await Campaign.deploy(
        founder.address,
        "Test Simple",
        "TS",
        ethers.utils.parseEther("10"), // 10 ETH target
        ethers.utils.parseEther("2"),  // 2 ETH par NFT
        Math.floor(Date.now() / 1000) + 3600,
        deployer.address,
        500,
        deployer.address,
        "ipfs://test",
        deployer.address,
        deployer.address
    );
    await campaign.deployed();
    console.log("✅ Campaign:", campaign.address);

    const LiveSessionManager = await ethers.getContractFactory("LiveSessionManager");
    const liveManager = await LiveSessionManager.deploy();
    await liveManager.deployed();
    console.log("✅ LiveSessionManager:", liveManager.address);

    const CampaignDAO = await ethers.getContractFactory("CampaignDAO");
    const dao = await CampaignDAO.deploy(campaign.address, liveManager.address, founder.address);
    await dao.deployed();
    console.log("✅ CampaignDAO:", dao.address);

    const CampaignGovernance = await ethers.getContractFactory("CampaignGovernance");
    const governance = await CampaignGovernance.deploy(campaign.address, founder.address);
    await governance.deployed();
    console.log("✅ CampaignGovernance:", governance.address);

    // Connexions
    await campaign.connect(founder).setDAOContract(dao.address);
    await campaign.connect(founder).setGovernanceContract(governance.address);
    console.log("✅ Contrats connectés");

    // ===== INVESTISSEMENTS =====
    console.log("\n💰 INVESTISSEMENTS");

    await campaign.connect(investor1).buyShares(2, { value: ethers.utils.parseEther("4") });
    console.log("✅ Investor1: 2 NFTs (4 ETH)");

    await campaign.connect(investor2).buyShares(3, { value: ethers.utils.parseEther("6") });
    console.log("✅ Investor2: 3 NFTs (6 ETH)");

    // État campagne
    const roundInfo = await campaign.getCurrentRound();
    console.log(`📊 Fonds levés: ${ethers.utils.formatEther(roundInfo.fundsRaised)} ETH`);
    console.log(`📊 NFTs vendus: ${roundInfo.sharesSold}`);
    console.log(`📊 Round finalisé: ${roundInfo.isFinalized}`);

    // Test remboursement Round 1 actif
    console.log("\n🔄 TEST REMBOURSEMENT ROUND ACTIF");
    const [canRefund, msg] = await campaign.canRefundToken(1000001);
    console.log(`NFT #1000001: ${canRefund ? '✅' : '❌'} - ${msg}`);

    // Finalisation
    console.log("\n🏁 FINALISATION");
    await campaign.connect(deployer).finalizeRound();
    console.log("✅ Round finalisé");

    const daoPhase = await dao.getCurrentPhase();
    console.log(`🏛️ Phase DAO: ${daoPhase}`);

    // Test remboursement après finalisation
    console.log("\n🔄 TEST REMBOURSEMENT APRÈS FINALISATION");
    const [canRefund2, msg2] = await campaign.canRefundToken(1000001);
    console.log(`NFT #1000001: ${canRefund2 ? '✅' : '❌'} - ${msg2}`);

    // Round 2
    console.log("\n🚀 ROUND 2");
    await campaign.connect(founder).startNewRound(
        ethers.utils.parseEther("20"),
        ethers.utils.parseEther("5"),
        3600
    );
    console.log("✅ Round 2 démarré");

    // Test remboursement Round 1 pendant Round 2
    console.log("\n🔒 TEST REMBOURSEMENT ROUND 1 PENDANT ROUND 2");
    const [canRefund3, msg3] = await campaign.canRefundToken(1000001);
    console.log(`NFT #1000001: ${canRefund3 ? '✅' : '❌'} - ${msg3}`);

    // Gouvernance
    console.log("\n🗳️ GOUVERNANCE");
    
    const votePower1 = await governance.getVotingPower(investor1.address);
    const votePower2 = await governance.getVotingPower(investor2.address);
    console.log(`Investor1 pouvoir: ${votePower1} NFTs`);
    console.log(`Investor2 pouvoir: ${votePower2} NFTs`);

    await governance.connect(founder).createProposal(
        0,
        "Test Proposal",
        "Test Description",
        "0x",
        30,
        51
    );
    console.log("✅ Proposition créée");

    if (votePower1 > 0) {
        await governance.connect(investor1).castVote(1, 1, "Support");
        console.log("✅ Investor1 vote");
    }

    console.log("\n🎉 TEST SIMPLIFIÉ TERMINÉ");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Erreur:", error.message);
        process.exit(1);
    });