// scripts/upgradeDivar.js
const { ethers, upgrades } = require("hardhat");

async function main() {
  const PROXY_ADDRESS = "0x9fc348c0f4f4b1Ad6CaB657a7C519381FC5D3941";

  console.log("1. Déploiement du nouveau PriceConsumerV3...");
  const PriceConsumer = await ethers.getContractFactory("PriceConsumerV3");
  const priceConsumer = await PriceConsumer.deploy();
  await priceConsumer.deployed();
  console.log("PriceConsumerV3 déployé à:", priceConsumer.address);

  console.log("\n2. Préparation de l'upgrade du DivarProxy...");
  const DivarProxy = await ethers.getContractFactory("DivarProxy");
  
  console.log("3. Exécution de l'upgrade...");
  const divarProxy = await upgrades.upgradeProxy(PROXY_ADDRESS, DivarProxy);
  await divarProxy.deployed();
  console.log("DivarProxy upgradé");

  console.log("\n4. Mise à jour du PriceConsumer...");
  const tx = await divarProxy.updatePriceConsumer(priceConsumer.address);
  await tx.wait();
  console.log("PriceConsumer mis à jour");

  // Test immédiat des conversions
  console.log("\n5. Test des conversions...");
  const testConsumer = await ethers.getContractAt("PriceConsumerV3", priceConsumer.address);
  
  try {
    const usdAmount = ethers.utils.parseUnits("2000", 0); // $2000
    const ethAmount = await testConsumer.convertUSDToETH(usdAmount);
    console.log("Test de conversion $2000 USD = ", ethers.utils.formatEther(ethAmount), "ETH");

    const oneEth = ethers.utils.parseEther("1.0"); // 1 ETH
    const usdValue = await testConsumer.convertETHToUSD(oneEth);
    console.log("Test de conversion 1 ETH = $", usdValue.toString());
  } catch (error) {
    console.error("Erreur lors des tests:", error);
  }

  console.log("\nUpgrade terminé avec succès !");
  console.log("DivarProxy:", PROXY_ADDRESS);
  console.log("Nouveau PriceConsumer:", priceConsumer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });