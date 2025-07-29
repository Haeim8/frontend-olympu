// scripts/deploy-mainnet-test.js
const hre = require("hardhat");

async function main() {
 console.log("1. Connexion DivarProxy mainnet...");
 // ATTENTION: On doit d'abord déployer DivarProxy sur mainnet
 const DivarProxy = await hre.ethers.getContractFactory("DivarProxy");
 console.log("Déploiement DivarProxy...");
 const divar = await hre.upgrades.deployProxy(DivarProxy, [
   "0x8dfE7918F36ddabF0DcfaB01B2762c6c0a4b9dfC", // treasury - ton adresse
   "0x8dfE7918F36ddabF0DcfaB01B2762c6c0a4b9dfC", // keeper - ton adresse 
   "0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1"  // Price Feed Base mainnet
 ]);
 await divar.deployed();
 console.log("DivarProxy déployé:", divar.address);

 // Déployer Campaign
 const Campaign = await hre.ethers.getContractFactory("Campaign");
 console.log("\n2. Update bytecode...");
 await divar.setCampaignBytecode(Campaign.bytecode);

 // Créer campagne test
 console.log("\n3. Création campagne test...");
 const tx = await divar.createCampaign(
   "Test Base", 
   "TBASE",
   hre.ethers.utils.parseEther("0.0001"),  // target mini
   hre.ethers.utils.parseEther("0.0001"),  // prix mini
   Math.floor(Date.now()/1000) + 900,     // 15min
   "Test",
   "https://i.imgur.com/test.png",        // image test basique
   250, "",
   {value: hre.ethers.utils.parseEther("0.01")} // estimation frais
 );

 const receipt = await tx.wait();
 const campaignAddr = receipt.events.find(e => e.event === 'CampaignCreated').args.campaignAddress;
 console.log("Campaign test déployée:", campaignAddr);
 console.log("Voir NFT sur OpenSea:", `https://opensea.io/assets/base/${campaignAddr}/1000001`);
}

main().catch(console.error);