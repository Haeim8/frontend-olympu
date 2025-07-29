const hre = require("hardhat");

async function main() {
  const [creator, buyer] = await hre.ethers.getSigners();  // On prend 2 comptes différents

  console.log("1. Connexion DivarProxy...");
  const divar = await hre.ethers.getContractAt("DivarProxy", "0x9fc348c0f4f4b1Ad6CaB657a7C519381FC5D3941");
  const fee = await divar.getCampaignCreationFeeETH();
  console.log("Frais création:", hre.ethers.utils.formatEther(fee), "ETH");

  console.log("\n2. Création campagne...");
  const tx = await divar.connect(creator).createCampaign(
    "Test Campaign", 
    "TEST", 
    hre.ethers.utils.parseEther("0.00001"),
    hre.ethers.utils.parseEther("0.000001"),
    Math.floor(Date.now()/1000) + 180,
    "Test",
    "https://i.imgur.com/test.png",
    250, "",
    {value: fee}
  );

  const receipt = await tx.wait();
  const campaignAddr = receipt.events.find(e => e.event === 'CampaignCreated').args.campaignAddress;
  console.log("Campagne déployée:", campaignAddr);

  console.log("\n3. Test achat NFT avec autre compte...");
  const campaign = await hre.ethers.getContractAt("Campaign", campaignAddr);
  await campaign.connect(buyer).buyShares(1, {
    value: hre.ethers.utils.parseEther("0.000001")
  });
  
  console.log("NFT acheté!");
  console.log("Voir NFT:", `https://sepolia.basescan.org/nft/${campaignAddr}/1000001`);
}

main().catch(console.error);