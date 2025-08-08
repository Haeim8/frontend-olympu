const { ethers } = require("hardhat");

async function main() {
  try {
    const [tester] = await ethers.getSigners();
    console.log("\n=== Configuration initiale ===");
    console.log("Compte testeur:", tester.address);
    
    const balance = await tester.getBalance();
    console.log("Balance:", ethers.utils.formatEther(balance), "ETH");

    // Nouvelle adresse du proxy déployé
    const DIVAR_PROXY = "0x8cBeAa8C67d082c01f864460352FA1b4F9bf7bCC";
    console.log("Adresse DivarProxy:", DIVAR_PROXY);

    console.log("\n=== Connexion aux contrats ===");
    const DivarProxy = await ethers.getContractFactory("DivarProxy");
    const divarProxy = await DivarProxy.attach(DIVAR_PROXY);
    console.log("✅ Connecté au DivarProxy");

    console.log("\n=== Vérification Bytecode ===");
    const bytecode = await divarProxy.campaignBytecode();
    console.log("Taille bytecode actuel:", bytecode.length);
    if(bytecode.length > 0) {
        console.log("✅ Bytecode déjà configuré");
    }

    console.log("\n=== Vérification Inscription ===");
    const isRegistered = await divarProxy.isUserRegistered(tester.address);
    console.log("Est inscrit ?", isRegistered);

    if(!isRegistered) {
        console.log("Inscription en cours...");
        const tx = await divarProxy.registerUser({
            value: ethers.utils.parseEther("0.05"),
            gasLimit: 500000
        });
        await tx.wait();
        console.log("✅ Inscription réussie");
    } else {
        console.log("✅ Déjà inscrit");
    }

    console.log("\n=== Création Campagne ===");
    // Durée de la campagne : 1 heure
    const endTime = Math.floor(Date.now()/1000) + 3600;
    console.log("Temps fin:", new Date(endTime * 1000).toLocaleString());

    const targetAmount = "100000000000000"; // 0.0001 ETH
    const sharePrice = "10000000000000";    // 0.00001 ETH

    console.log("Paramètres:");
    console.log("- Target:", ethers.utils.formatEther(targetAmount), "ETH");
    console.log("- Prix/share:", ethers.utils.formatEther(sharePrice), "ETH");
    console.log("- Frais:", ethers.utils.formatEther("50000000000000000"), "ETH");

    console.log("\nEnvoi transaction...");
    const createTx = await divarProxy.createCampaign(
        "Test Campaign",
        "TEST",
        targetAmount,
        sharePrice,
        endTime,
        "Test",
        "Test metadata",
        100,
        "test_logo.png",
        {
            value: ethers.utils.parseEther("0.05"),
            gasLimit: 10000000  // Augmenté à 10M
        }
    );

    console.log("Transaction envoyée:", createTx.hash);
    console.log("Attente confirmation...");

    const receipt = await createTx.wait();
    console.log("Transaction confirmée!");
    
    // Recherche de l'événement
    const campaignCreatedEvent = receipt.events.find(e => e.event === "CampaignCreated");
    
    if (campaignCreatedEvent) {
        const campaignAddress = campaignCreatedEvent.args.campaignAddress;
        console.log("\n✅ Campagne créée avec succès!");
        console.log("Adresse de la campagne:", campaignAddress);
        
        // Afficher les détails de la campagne
        const Campaign = await ethers.getContractFactory("Campaign");
        const campaign = Campaign.attach(campaignAddress);
        
        const currentRound = await campaign.getCurrentRound();
        console.log("\nDétails du round actuel:");
        console.log("- Round number:", currentRound.roundNumber.toString());
        console.log("- Target amount:", ethers.utils.formatEther(currentRound.targetAmount), "ETH");
        console.log("- Share price:", ethers.utils.formatEther(currentRound.sharePrice), "ETH");
        console.log("- End time:", new Date(currentRound.endTime.toNumber() * 1000).toLocaleString());
    }

  } catch (error) {
    console.log("\n❌ ERREUR DÉTAILLÉE:");
    console.log("Message:", error.message);
    
    if(error.transaction) {
        console.log("\nTransaction:");
        console.log("- From:", error.transaction.from);
        console.log("- To:", error.transaction.to);
        console.log("- Value:", ethers.utils.formatEther(error.transaction.value), "ETH");
        console.log("- Gas limit:", error.transaction.gasLimit?.toString());
    }
  }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });