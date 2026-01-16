const { ethers } = require("hardhat");

// Adresses des contrats déployés sur Base Mainnet
const DEPLOYED_ADDRESSES = {
    priceConsumer: "0xbE8B117C0523B908A26A22d51F83d9fDe3b6195E",
    nftRenderer: "0x139AF2A72C15485552CDC9a12B62d51F83FF3231",
    divarProxy: "0xdDDaF00B9d4907610E4D36517a1D56Ab2c3ef92e",
    campaignKeeper: "0x418A8D10ED01315617cACB7ae4D8a70561150022",
    recPromotionManager: "0xD125E8df345f6bA4E7d4bC0a08286803b02f4c50"
};

async function main() {
    console.log("🔧 FINALISATION CONFIGURATION - BASE MAINNET");
    console.log("=".repeat(60));

    const [deployer] = await ethers.getSigners();
    console.log(`👤 Compte: ${deployer.address}`);

    const balance = await deployer.getBalance();
    console.log(`💰 Balance: ${ethers.utils.formatEther(balance)} ETH`);

    // Récupérer le contrat DivarProxy
    const DivarProxy = await ethers.getContractFactory("DivarProxy");
    const divarProxy = DivarProxy.attach(DEPLOYED_ADDRESSES.divarProxy);

    console.log("\n📝 Configuration du bytecode Campaign...");

    // Générer le bytecode Campaign
    const CampaignFactory = await ethers.getContractFactory("Campaign");
    const campaignBytecode = CampaignFactory.bytecode;

    console.log(`   📦 Taille bytecode: ${campaignBytecode.length / 2} bytes`);

    // Attendre quelques secondes pour éviter les conflits de nonce
    console.log("   ⏳ Attente 5 secondes...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Envoyer la transaction
    console.log("   🚀 Envoi transaction setCampaignBytecode...");
    const tx = await divarProxy.setCampaignBytecode(campaignBytecode);
    console.log(`   📋 TX Hash: ${tx.hash}`);

    console.log("   ⏳ Attente de confirmation...");
    await tx.wait(3);

    console.log("\n" + "=".repeat(60));
    console.log("🎉 CONFIGURATION TERMINÉE AVEC SUCCÈS!");
    console.log("=".repeat(60));

    console.log("\n📋 ADDRESSES FINALES (Base Mainnet):");
    Object.entries(DEPLOYED_ADDRESSES).forEach(([name, address]) => {
        console.log(`   ${name}: ${address}`);
    });

    console.log("\n🔗 LIENS BASESCAN:");
    Object.entries(DEPLOYED_ADDRESSES).forEach(([name, address]) => {
        console.log(`   ${name}: https://basescan.org/address/${address}`);
    });

    console.log("\n🎯 PROCHAINES ÉTAPES:");
    console.log("1. ✅ Vérifier les contrats sur BaseScan");
    console.log("2. 📝 Mettre à jour les adresses dans le frontend");
    console.log("3. 🧪 Tester une campagne de test");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("💥 Erreur:", error.message);
        process.exit(1);
    });
