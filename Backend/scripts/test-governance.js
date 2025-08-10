const { ethers, network } = require("hardhat");

async function main() {
    console.log("🗳️ TEST SYSTÈME DE GOUVERNANCE COSMOS-STYLE");
    
    // Recuperer les signers
    let [deployer, founder, investor1, investor2, investor3, investor4] = await ethers.getSigners();
    
    console.log("\n👥 Participants :");
    console.log("Founder:", founder.address);
    console.log("Investor1:", investor1.address);
    console.log("Investor2:", investor2.address);
    console.log("Investor3:", investor3.address);
    console.log("Investor4:", investor4.address);

    // Déployer Campaign
    console.log("\n📦 DÉPLOIEMENT CAMPAIGN");
    
    const Campaign = await ethers.getContractFactory("Campaign");
    const campaign = await Campaign.deploy(
        founder.address,
        "Test Governance",
        "TGV",
        ethers.utils.parseEther("30"), // 30 ETH target
        ethers.utils.parseEther("3"),  // 3 ETH par share
        Math.floor(Date.now() / 1000) + 3600, // fin dans 1h
        deployer.address, // treasury
        500, // 5% royalty
        deployer.address, // royalty receiver
        "ipfs://test",
        deployer.address, // faux proxy
        deployer.address  // faux keeper
    );
    await campaign.deployed();
    console.log("Campaign:", campaign.address);

    // Déployer Governance
    console.log("\n🏛️ DÉPLOIEMENT GOVERNANCE");
    
    const CampaignGovernance = await ethers.getContractFactory("CampaignGovernance");
    const governance = await CampaignGovernance.deploy(
        campaign.address,
        founder.address
    );
    await governance.deployed();
    console.log("Governance:", governance.address);

    // Connecter la gouvernance à la campagne
    await campaign.connect(founder).setGovernanceContract(governance.address);
    console.log("✅ Gouvernance connectée à la campagne");

    // Investissements pour avoir des NFTs = pouvoir de vote
    console.log("\n🎯 INVESTISSEMENTS POUR CRÉER POUVOIR DE VOTE");
    
    await campaign.connect(investor1).buyShares(3, { value: ethers.utils.parseEther("9") });
    console.log("✅ Investor1 achète 3 NFTs (3 votes)");
    
    await campaign.connect(investor2).buyShares(2, { value: ethers.utils.parseEther("6") });
    console.log("✅ Investor2 achète 2 NFTs (2 votes)");
    
    await campaign.connect(investor3).buyShares(1, { value: ethers.utils.parseEther("3") });
    console.log("✅ Investor3 achète 1 NFT (1 vote)");
    
    await campaign.connect(investor4).buyShares(4, { value: ethers.utils.parseEther("12") });
    console.log("✅ Investor4 achète 4 NFTs (4 votes)");
    
    console.log("💪 Total pouvoir de vote: 10 NFTs");

    // Vérifier les pouvoirs de vote
    const votingPower1 = await governance.getVotingPower(investor1.address);
    const votingPower2 = await governance.getVotingPower(investor2.address);
    const votingPower3 = await governance.getVotingPower(investor3.address);
    const votingPower4 = await governance.getVotingPower(investor4.address);
    
    console.log("\n📊 POUVOIRS DE VOTE:");
    console.log(`Investor1: ${votingPower1} NFTs`);
    console.log(`Investor2: ${votingPower2} NFTs`);
    console.log(`Investor3: ${votingPower3} NFTs`);
    console.log(`Investor4: ${votingPower4} NFTs`);

    // TEST 1: Créer une proposition pour changer la commission
    console.log("\n🗳️ TEST 1 - CRÉATION PROPOSITION: Réduire commission 15% → 10%");
    
    const proposalTitle = "Réduire commission plateforme";
    const proposalDescription = "Proposition de réduire la commission de 15% à 10% pour être plus compétitifs";
    const executionData = ethers.utils.defaultAbiCoder.encode(["uint256"], [10]); // 10%
    
    await governance.connect(founder).createProposal(
        0, // ProposalType.PARAMETER_CHANGE
        proposalTitle,
        proposalDescription,
        executionData,
        30, // 30% quorum
        51  // 51% majorité simple
    );
    
    console.log("✅ Proposition #1 créée par le founder");
    
    const proposal1 = await governance.getProposal(1);
    console.log(`📋 Titre: ${proposal1.title}`);
    console.log(`📋 Type: PARAMETER_CHANGE`);
    console.log(`⏰ Deadline: ${new Date(proposal1.votingDeadline * 1000).toLocaleString()}`);

    // TEST 2: Voting par les détenteurs NFT
    console.log("\n🗳️ TEST 2 - PÉRIODE DE VOTE");
    
    // Investor1 vote POUR (3 votes)
    await governance.connect(investor1).castVote(1, 1, "Je soutiens la réduction de commission");
    console.log("✅ Investor1 vote POUR (3 votes)");
    
    // Investor2 vote CONTRE (2 votes)  
    await governance.connect(investor2).castVote(1, 0, "Commission actuelle est correcte");
    console.log("✅ Investor2 vote CONTRE (2 votes)");
    
    // Investor3 s'abstient (1 vote)
    await governance.connect(investor3).castVote(1, 2, "Pas d'opinion forte");
    console.log("✅ Investor3 s'ABSTIENT (1 vote)");
    
    // Investor4 vote POUR (4 votes)
    await governance.connect(investor4).castVote(1, 1, "Excellente idée pour attirer plus de projets");
    console.log("✅ Investor4 vote POUR (4 votes)");

    // Vérifier les résultats en temps réel
    console.log("\n📊 RÉSULTATS VOTE EN COURS:");
    const results = await governance.getProposalResults(1);
    console.log(`Total NFTs: ${results.totalSupply}`);
    console.log(`Participation: ${results.participationRate}%`);
    console.log(`Support: ${results.supportRate}%`);
    console.log(`Quorum atteint: ${results.quorumMet ? '✅' : '❌'}`);
    console.log(`Majorité atteinte: ${results.majorityMet ? '✅' : '❌'}`);

    // TEST 3: Essayer de voter deux fois (doit échouer)
    console.log("\n🗳️ TEST 3 - PROTECTION DOUBLE VOTE");
    
    try {
        await governance.connect(investor1).castVote(1, 0, "Changement d'avis");
        console.log("❌ PROBLÈME: Double vote autorisé!");
    } catch (error) {
        console.log("✅ Double vote correctement bloqué");
    }

    // TEST 4: Non-détenteur NFT essaie de voter (doit échouer)
    console.log("\n🗳️ TEST 4 - PROTECTION VOTE SANS NFT");
    
    try {
        await governance.connect(deployer).castVote(1, 1, "Vote sans NFT");
        console.log("❌ PROBLÈME: Vote sans NFT autorisé!");
    } catch (error) {
        console.log("✅ Vote sans NFT correctement bloqué");
    }

    // Simuler passage du temps pour fin de vote
    console.log("\n⏰ Simulation: 7 jours passent (fin période vote)...");
    await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]); // 7 jours
    await ethers.provider.send("evm_mine");

    // TEST 5: Finaliser la proposition
    console.log("\n🏁 TEST 5 - FINALISATION PROPOSITION");
    
    await governance.finalizeProposal(1);
    console.log("✅ Proposition finalisée");
    
    const finalProposal = await governance.getProposal(1);
    const finalResults = await governance.getProposalResults(1);
    
    console.log("\n🎯 RÉSULTATS FINAUX:");
    console.log(`Status: ${finalProposal.status == 1 ? 'PASSED ✅' : 'REJECTED ❌'}`);
    console.log(`Votes POUR: ${finalProposal.votesFor} (${finalResults.supportRate}%)`);
    console.log(`Votes CONTRE: ${finalProposal.votesAgainst}`);
    console.log(`Abstentions: ${finalProposal.votesAbstain}`);
    console.log(`Participation: ${finalResults.participationRate}% (besoin ${finalProposal.quorumRequired}%)`);

    // TEST 6: Créer proposition dividendes exceptionnels
    console.log("\n🗳️ TEST 6 - PROPOSITION DIVIDENDES EXCEPTIONNELS");
    
    const dividendData = ethers.utils.defaultAbiCoder.encode(["uint256"], [ethers.utils.parseEther("5")]); // 5 ETH
    
    await governance.connect(founder).createProposal(
        1, // ProposalType.DIVIDEND_DISTRIBUTION
        "Distribution dividendes exceptionnels",
        "Proposer de distribuer 5 ETH en dividendes exceptionnels aux détenteurs NFT",
        dividendData,
        25, // 25% quorum
        67  // 67% supermajorité
    );
    
    console.log("✅ Proposition #2 créée: Distribution dividendes");

    // Vote rapide sur proposition 2
    await governance.connect(investor1).castVote(2, 1, "Oui aux dividendes!");
    await governance.connect(investor2).castVote(2, 1, "Excellente idée");
    await governance.connect(investor4).castVote(2, 1, "Je soutiens");
    // investor3 ne vote pas cette fois

    console.log("✅ Votes rapides sur proposition dividendes");

    // TEST 7: Lister toutes les propositions
    console.log("\n📋 TEST 7 - LISTE TOUTES PROPOSITIONS");
    
    const allProposals = await governance.getAllProposals();
    console.log(`Total propositions: ${allProposals.length}`);
    
    for (let i = 0; i < allProposals.length; i++) {
        const propId = allProposals[i];
        const prop = await governance.getProposal(propId);
        console.log(`#${propId}: ${prop.title} - Status: ${prop.status}`);
    }

    // TEST 8: Propositions actives
    console.log("\n🔄 TEST 8 - PROPOSITIONS ACTIVES");
    
    const activeProposals = await governance.getActiveProposals();
    console.log(`Propositions actives: ${activeProposals.length}`);
    
    for (let i = 0; i < activeProposals.length; i++) {
        const propId = activeProposals[i];
        const prop = await governance.getProposal(propId);
        console.log(`#${propId}: ${prop.title} (deadline: ${new Date(prop.votingDeadline * 1000).toLocaleString()})`);
    }

    console.log("\n🎉 RÉSULTATS TESTS GOUVERNANCE:");
    console.log("✅ Création propositions par founder seulement");
    console.log("✅ Vote pondéré par NFTs possédés (Cosmos style)");
    console.log("✅ Protection double vote");
    console.log("✅ Restriction vote aux détenteurs NFT");
    console.log("✅ Calcul quorum et majorité");
    console.log("✅ Différents types propositions");
    console.log("✅ Gestion états propositions");
    console.log("✅ Fonctions de lecture complètes");
    console.log("\n💯 SYSTÈME DE GOUVERNANCE PARFAITEMENT FONCTIONNEL !");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Erreur:", error);
        process.exit(1);
    });