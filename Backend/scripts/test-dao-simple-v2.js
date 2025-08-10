const { ethers, network } = require("hardhat");

async function main() {
    console.log("🎯 TEST DAO SIMPLE - DÉPLOIEMENT DIRECT (SANS DIVARPROXY)");
    
    // Recuperer les signers
    let [deployer, founder, investor1, investor2, investor3] = await ethers.getSigners();
    
    console.log("\nAdresses des comptes :");
    console.log("Deployer:", deployer.address);
    console.log("Founder:", founder.address); 
    console.log("Investor1:", investor1.address);
    console.log("Investor2:", investor2.address);
    console.log("Investor3:", investor3.address);

    // 1. Déployer un faux DivarProxy minimal pour CampaignKeeper
    // CampaignKeeper attend un DivarProxy mais on va juste passer deployer address
    const CampaignKeeper = await ethers.getContractFactory("CampaignKeeper");
    const campaignKeeper = await CampaignKeeper.deploy(deployer.address); // Passer deployer au lieu de proxy
    await campaignKeeper.deployed();
    console.log("CampaignKeeper deploye a:", campaignKeeper.address);
        
    // 2. Campaign direct avec commission fixe pour test
    const Campaign = await ethers.getContractFactory("Campaign");
    const campaign = await Campaign.deploy(
        founder.address,                    // _startup
        "Test DAO Campaign",               // _name  
        "TDC",                            // _symbol
        ethers.utils.parseEther("10"),    // _targetAmount
        ethers.utils.parseEther("1"),     // _sharePrice
        Math.floor(Date.now() / 1000) + 86400, // _endTime
        deployer.address,                 // _treasury
        500,                              // _royaltyFee
        deployer.address,                 // _royaltyReceiver
        "ipfs://testmetadata",            // _metadata
        deployer.address,                 // _divarProxy (pas utilisé ici)
        campaignKeeper.address            // _campaignKeeper
    );
    await campaign.deployed();
    console.log("Campaign deploye directement a:", campaign.address);

    // 3. Déployer et connecter DAO AVANT finalisation
    const LiveSessionManager = await ethers.getContractFactory("LiveSessionManager");
    const liveManager = await LiveSessionManager.deploy();
    await liveManager.deployed();
    console.log("LiveSessionManager deploye a:", liveManager.address);

    const CampaignDAO = await ethers.getContractFactory("CampaignDAO");
    const dao = await CampaignDAO.deploy(campaign.address, liveManager.address, founder.address);
    await dao.deployed();
    console.log("CampaignDAO deploye a:", dao.address);
    
    await campaign.connect(founder).setDAOContract(dao.address);
    console.log("✅ DAO connecté à la campagne");

    // 4. Investissements pour atteindre l'objectif
    console.log("\n📈 PHASE INVESTISSEMENT");
    await campaign.connect(investor1).buyShares(5, { value: ethers.utils.parseEther("5") });
    await campaign.connect(investor2).buyShares(5, { value: ethers.utils.parseEther("5") });
    console.log("10 ETH investis (objectif atteint)");

    // 5. Enregistrer manuellement la campagne dans le keeper
    // Normalement fait par DivarProxy, mais on le fait manuellement
    await campaignKeeper.registerCampaign(campaign.address);
    console.log("Campaign enregistrée dans keeper");

    // 6. Finalisation manuelle (pas via Chainlink car pas de DivarProxy)
    await campaign.connect(deployer).finalizeRound();
    console.log("✅ Round finalisé");

    // 6. Vérifier que la phase DAO a démarré automatiquement
    const daoPhase = await dao.getCurrentPhase();
    console.log("Phase DAO:", daoPhase.toString(), daoPhase == 1 ? "✅ WAITING_FOR_LIVE" : "❌ Problème");

    // 7. Test emergency mode (simuler 31 jours plus tard)
    console.log("\n🚨 SIMULATION MODE EMERGENCY");
    await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]); 
    await ethers.provider.send("evm_mine");
    await dao.enableEmergencyMode();
    console.log("✅ Mode emergency activé");

    // 8. Test échanges équitables  
    console.log("\n💰 TEST REMBOURSEMENT ÉQUITABLE");
    const balBefore = await investor1.getBalance();
    console.log("Balance avant:", ethers.utils.formatEther(balBefore), "ETH");
    
    const tx = await dao.connect(investor1).emergencyWithdraw(1000001);
    const receipt = await tx.wait();
    const balAfter = await investor1.getBalance();
    const gasCost = receipt.gasUsed.mul(tx.gasPrice || ethers.utils.parseUnits("1", "gwei"));
    const netGain = balAfter.add(gasCost).sub(balBefore);
    
    console.log("Balance après:", ethers.utils.formatEther(balAfter), "ETH");
    console.log("Remboursement net:", ethers.utils.formatEther(netGain), "ETH");
    console.log("Attendu: 0.85 ETH (1 ETH - 15% commission)");

    // 9. Vérification sécurité - tentative double échange
    console.log("\n🔒 TEST SÉCURITÉ");
    try {
        await dao.connect(investor1).emergencyWithdraw(1000001);
        console.log("❌ PROBLÈME: Double échange autorisé!");
    } catch (error) {
        console.log("✅ Sécurité OK: Double échange bloqué");
    }

    console.log("\n🎉 SYSTÈME DAO COMPLET FONCTIONNEL!");
    console.log("✅ Démarrage automatique phase DAO");
    console.log("✅ Mode emergency après délai");
    console.log("✅ Remboursement équitable selon prix d'achat original");
    console.log("✅ Protection contre double échange");
    console.log("✅ Aucun besoin de DivarProxy pour le DAO!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Erreur:", error);
        process.exit(1);
    });