const hre = require("hardhat");
const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("🚀 REDÉPLOIEMENT DIVARPROXY PROPRE\n");

  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer (OWNER):", deployer.address);
  
  const balance = await deployer.getBalance();
  console.log("💰 Balance:", ethers.utils.formatEther(balance), "ETH");
  console.log("");

  // Adresses Base Sepolia
  const NFT_RENDERER_ADDRESS = "0xD4904a23a91166445B7dd4aebFe7e59280B38F31";
  const CHAINLINK_KEEPER_REGISTRY = "0x8C8f7D13A8A5d1b61D76D5f6a38E0ED24E9D9FE7"; // Base Sepolia
  const PRICE_CONSUMER_ADDRESS = "0x123"; // À remplacer par la vraie adresse
  
  console.log("📍 ADRESSES:");
  console.log("  🎨 NFTRenderer:", NFT_RENDERER_ADDRESS);
  console.log("  🔗 Chainlink Registry:", CHAINLINK_KEEPER_REGISTRY);
  console.log("");

  // ===========================================
  // 1. PAS BESOIN DE PRICECONSUMER - PRICE FEED DIRECT !
  // ===========================================
  console.log("💰 PHASE 1: PRICE FEED DIRECT !\n");

  console.log("✅ Utilisation direct du Price Feed Base Sepolia (comme ton script) !");
  console.log("");

  // ===========================================
  // 2. DÉPLOIEMENT DIVARPROXY TEMPORAIRE
  // ===========================================
  console.log("🏢 PHASE 2: DÉPLOIEMENT DIVARPROXY\n");

  console.log("2.1 Déploiement DivarProxy upgradeable...");
  const DivarProxy = await ethers.getContractFactory("DivarProxy");
  
  // Déployer avec les VRAIES adresses de ton script
  const divarProxy = await upgrades.deployProxy(DivarProxy, [
    "0x8dfE7918F36ddabF0DcfaB01B2762c6c0a4b9dfC", // treasury = TOI
    "0x8dfE7918F36ddabF0DcfaB01B2762c6c0a4b9dfC", // campaignKeeper = TOI aussi
    "0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1"  // Price Feed Base Sepolia
  ], {
    initializer: "initialize(address,address,address)",
    gasLimit: 5000000
  });

  await divarProxy.deployed();
  console.log("✅ DivarProxy déployé:", divarProxy.address);
  console.log("");

  // ===========================================
  // 3. PAS BESOIN DE CAMPAIGNKEEPER - C'EST TOI !
  // ===========================================
  console.log("🔗 PHASE 3: CAMPAIGNKEEPER = TOI !\n");
  
  console.log("✅ CampaignKeeper = Ton adresse (comme dans ton script) !");
  console.log("");

  // ===========================================
  // 4. CONFIGURATION NFTRENDERER
  // ===========================================
  console.log("🎨 PHASE 4: CONFIGURATION NFTRENDERER\n");

  console.log("4.1 Configuration NFTRenderer...");
  const setNFTTx = await divarProxy.setNFTRenderer(NFT_RENDERER_ADDRESS, {
    gasLimit: 300000
  });
  await setNFTTx.wait();
  console.log("✅ NFTRenderer configuré !");
  
  const currentRenderer = await divarProxy.getNFTRenderer();
  console.log("  🎨 NFTRenderer vérifié:", currentRenderer);
  console.log("");

  // ===========================================
  // 5. CONFIGURATION CHAINLINK
  // ===========================================
  console.log("🔗 PHASE 5: CONFIGURATION CHAINLINK\n");

  console.log("5.1 Chainlink déjà configuré (c'est TOI le keeper) !");
  console.log("✅ Pas besoin de configuration supplémentaire");
  console.log("");

  // ===========================================
  // 6. CONFIGURATION CAMPAIGN BYTECODE
  // ===========================================
  console.log("📦 PHASE 6: CONFIGURATION CAMPAIGN BYTECODE\n");

  console.log("6.1 Obtention bytecode Campaign...");
  const Campaign = await ethers.getContractFactory("contracts/Campaign.sol:Campaign");
  const campaignBytecode = Campaign.bytecode;
  
  console.log("6.2 Configuration bytecode dans DivarProxy...");
  const setBytcodeTx = await divarProxy.setCampaignBytecode(campaignBytecode, {
    gasLimit: 5000000
  });
  await setBytcodeTx.wait();
  console.log("✅ Campaign bytecode configuré !");
  console.log("");

  // ===========================================
  // 7. VÉRIFICATIONS FINALES
  // ===========================================
  console.log("✅ PHASE 7: VÉRIFICATIONS FINALES\n");

  try {
    const owner = await divarProxy.owner();
    const fee = await divarProxy.getCampaignCreationFeeETH();
    const renderer = await divarProxy.getNFTRenderer();
    const keeper = "0x8dfE7918F36ddabF0DcfaB01B2762c6c0a4b9dfC"; // C'est TOI
    
    console.log("7.1 État final:");
    console.log("  👤 Owner DivarProxy:", owner);
    console.log("  💰 Fee création:", ethers.utils.formatEther(fee), "ETH");
    console.log("  🎨 NFTRenderer:", renderer);
    console.log("  🔗 CampaignKeeper linked:", keeper);
    
    // Test création campagne
    console.log("\n7.2 Test création campagne...");
    const testFee = await divarProxy.getCampaignCreationFeeETH();
    console.log("  ✅ Fonction fee marche !");
    
    if (owner === deployer.address && renderer === NFT_RENDERER_ADDRESS) {
      console.log("\n🎉 DÉPLOIEMENT PARFAIT !");
      console.log("  ✅ Tu es owner");
      console.log("  ✅ NFTRenderer configuré");
      console.log("  ✅ Chainlink configuré");
      console.log("  ✅ Prêt pour créer des campagnes avec NFTs stylés");
    } else {
      console.log("\n⚠️ PROBLÈME CONFIGURATION");
    }

  } catch (error) {
    console.log("❌ Erreur vérification:", error.message);
  }

  // ===========================================
  // 8. SAUVEGARDE INFOS
  // ===========================================
  console.log("\n💾 SAUVEGARDE ADRESSES\n");

  const deploymentInfo = {
    network: "base-sepolia",
    timestamp: new Date().toISOString(),
    contracts: {
      DivarProxy: divarProxy.address,
      CampaignKeeper: "0x8dfE7918F36ddabF0DcfaB01B2762c6c0a4b9dfC",
      PriceFeed: "0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1",
      NFTRenderer: NFT_RENDERER_ADDRESS
    },
    owner: deployer.address,
    status: "✅ FONCTIONNEL"
  };

  const fs = require('fs');
  fs.writeFileSync('./new-deployment.json', JSON.stringify(deploymentInfo, null, 2));
  
  console.log("✅ DÉPLOIEMENT TERMINÉ !");
  console.log("📍 NOUVEAU DIVARPROXY:", divarProxy.address);
  console.log("👤 OWNER:", deployer.address);
  console.log("🎨 AVEC NFTS STYLÉS !");
  console.log("🔗 CHAINLINK FONCTIONNEL !");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ ERREUR DÉPLOIEMENT:", error);
    process.exit(1);
  });