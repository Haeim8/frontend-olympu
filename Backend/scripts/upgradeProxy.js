const hre = require("hardhat");
const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("Déploiement de la mise à jour DivarProxy...");

  // Adresse du proxy existant
  const proxyAddress = "0x9fc348c0f4f4b1Ad6CaB657a7C519381FC5D3941";  

  // Obtenir le contrat factory
  const DivarProxy = await ethers.getContractFactory("DivarProxy");

  // Faire l'upgrade
  await upgrades.upgradeProxy(proxyAddress, DivarProxy);

  console.log("DivarProxy mis à jour avec succès à l'adresse:", proxyAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });