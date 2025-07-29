// scripts/verify-campaign.js
const hre = require("hardhat");

async function main() {
  // Adresse de la dernière campagne déployée
  const campaignAddr = "0xff18a173EacCE0d1763a5f7f4e8F02ebea71569A"; 
  const divarProxy = "0x9fc348c0f4f4b1Ad6CaB657a7C519381FC5D3941";
  
  // Les mêmes paramètres exacts que dans createCampaign
  const args = [
    "0x8dfE7918F36ddabF0DcfaB01B2762c6c0a4b9dfC", // creator/startup
    "Test Campaign",  // name
    "TEST",          // symbol
    hre.ethers.utils.parseEther("0.00001"), // targetAmount
    hre.ethers.utils.parseEther("0.000001"), // sharePrice
    Math.floor(Date.now()/1000) + 180,  // endTime
    "0x8dfE7918F36ddabF0DcfaB01B2762c6c0a4b9dfC", // treasury
    250,              // royaltyFee
    "0x8dfE7918F36ddabF0DcfaB01B2762c6c0a4b9dfC", // royaltyReceiver 
    "https://i.imgur.com/test.png", // metadata
    divarProxy,       // divarProxy
    "0x8dfE7918F36ddabF0DcfaB01B2762c6c0a4b9dfC"  // campaignKeeper
  ];

  console.log("Vérification de la campagne...");
  await hre.run("verify:verify", {
    address: campaignAddr,
    contract: "contracts/Campaign.sol:Campaign",
    constructorArguments: args
  });
}

main().catch(console.error);