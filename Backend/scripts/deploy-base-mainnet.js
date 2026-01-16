const { ethers, upgrades } = require("hardhat");
const fs = require('fs');
const path = require('path');

// Configuration Base Mainnet
const BASE_MAINNET_CONFIG = {
    chainId: 8453,
    name: "Base Mainnet",
    explorer: "https://basescan.org",
    etherscanAPI: "https://api.basescan.org/api"
};

// Addresses Chainlink sur Base Mainnet
const CHAINLINK_FEEDS = {
    ETH_USD: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70" // ETH/USD feed Base Mainnet
};

async function deployContract(contractName, constructorArgs = [], description = "") {
    console.log(`\n📦 Déploiement ${contractName}...`);
    if (description) console.log(`   ${description}`);

    try {
        const ContractFactory = await ethers.getContractFactory(contractName);

        // Estimation du gas
        const deployTx = ContractFactory.getDeployTransaction(...constructorArgs);
        const gasEstimate = await ethers.provider.estimateGas(deployTx);
        const gasPrice = await ethers.provider.getGasPrice();
        const deploymentCost = gasEstimate.mul(gasPrice);

        console.log(`   ⛽ Gas estimé: ${gasEstimate.toLocaleString()}`);
        console.log(`   💰 Coût estimé: ${ethers.utils.formatEther(deploymentCost)} ETH`);

        // Déploiement
        const contract = await ContractFactory.deploy(...constructorArgs);
        console.log(`   🚀 Transaction: ${contract.deployTransaction.hash}`);

        // Attendre confirmation
        await contract.deployed();
        console.log(`   ✅ ${contractName}: ${contract.address}`);

        // Attendre quelques blocs pour la vérification
        console.log(`   ⏳ Attente de 5 confirmations...`);
        await contract.deployTransaction.wait(5);

        return contract;

    } catch (error) {
        console.log(`   ❌ Erreur déploiement ${contractName}: ${error.message}`);
        throw error;
    }
}

async function deployUpgradeableContract(contractName, initArgs = [], description = "") {
    console.log(`\n📦 Déploiement ${contractName} (Upgradeable)...`);
    if (description) console.log(`   ${description}`);

    try {
        const ContractFactory = await ethers.getContractFactory(contractName);

        console.log(`   🔧 Déploiement proxy upgradeable...`);
        const contract = await upgrades.deployProxy(ContractFactory, initArgs, {
            initializer: 'initialize',
            kind: 'uups',
            timeout: 300000,
            pollingInterval: 5000
        });

        console.log(`   🚀 Transaction: ${contract.deployTransaction.hash}`);
        await contract.deployed();

        console.log(`   ✅ ${contractName} Proxy: ${contract.address}`);

        console.log(`   ⏳ Attente de 5 confirmations...`);
        await contract.deployTransaction.wait(5);

        console.log(`   ⏳ Attente réseau (30s)...`);
        await new Promise(resolve => setTimeout(resolve, 30000));

        try {
            const implementationAddress = await upgrades.erc1967.getImplementationAddress(contract.address);
            console.log(`   🔗 Implementation: ${implementationAddress}`);
        } catch (error) {
            console.log(`   ⚠️ Implementation non détectée immédiatement`);
        }

        return contract;

    } catch (error) {
        console.log(`   ❌ Erreur déploiement ${contractName}: ${error.message}`);
        throw error;
    }
}

async function main() {
    console.log("🚀 DÉPLOIEMENT SYSTÈME LIVAR - BASE MAINNET");
    console.log("=".repeat(60));
    console.log("⚠️  ATTENTION: DÉPLOIEMENT EN PRODUCTION!");
    console.log("=".repeat(60));

    // Vérifications préliminaires
    const network = await ethers.provider.getNetwork();
    console.log(`📡 Réseau: ${network.name} (chainId: ${network.chainId})`);

    if (network.chainId !== BASE_MAINNET_CONFIG.chainId) {
        throw new Error(`❌ Mauvais réseau! Attendu: ${BASE_MAINNET_CONFIG.chainId}, Reçu: ${network.chainId}`);
    }

    const [deployer] = await ethers.getSigners();
    console.log(`👤 Déployeur: ${deployer.address}`);

    const balance = await deployer.getBalance();
    console.log(`💰 Balance: ${ethers.utils.formatEther(balance)} ETH`);

    if (balance.lt(ethers.utils.parseEther("0.005"))) {
        throw new Error("❌ Balance insuffisante! Minimum 0.005 ETH requis pour mainnet Base (L2).");
    }

    // Confirmation manuelle pour mainnet
    console.log("\n⚠️  CONFIRMATION MAINNET");
    console.log("Tu es sur le point de déployer sur BASE MAINNET.");
    console.log("Appuie sur Ctrl+C pour annuler ou attends 10 secondes pour continuer...");
    await new Promise(resolve => setTimeout(resolve, 10000));

    const deploymentAddresses = {};
    const startTime = Date.now();

    try {
        // 1. PriceConsumerV3 avec adresse Chainlink Mainnet
        const priceConsumer = await deployContract(
            "PriceConsumerV3",
            [CHAINLINK_FEEDS.ETH_USD],
            "Oracle Chainlink ETH/USD pour Base Mainnet"
        );
        deploymentAddresses.priceConsumer = priceConsumer.address;

        // 2. NFTRenderer
        const nftRenderer = await deployContract(
            "NFTRenderer",
            [],
            "Générateur de métadonnées NFT dynamiques"
        );
        deploymentAddresses.nftRenderer = nftRenderer.address;

        // 3. DivarProxy (Upgradeable)
        const divarProxy = await deployUpgradeableContract(
            "DivarProxy",
            [
                deployer.address,     // _treasury
                deployer.address,     // _campaignKeeper (temporaire)
                priceConsumer.address, // _priceConsumer
                nftRenderer.address   // _nftRenderer
            ],
            "Contrat principal upgradeable de la plateforme"
        );
        deploymentAddresses.divarProxy = divarProxy.address;

        // 4. CampaignKeeper
        const campaignKeeper = await deployContract(
            "CampaignKeeper",
            [divarProxy.address],
            "Système d'automation Chainlink Keeper"
        );
        deploymentAddresses.campaignKeeper = campaignKeeper.address;

        // 5. RecPromotionManager
        const recPromotionManager = await deployContract(
            "RecPromotionManager",
            [
                divarProxy.address,    // recProxy
                priceConsumer.address, // priceConsumer
                deployer.address       // treasury
            ],
            "Gestionnaire de promotions et boosts"
        );
        deploymentAddresses.recPromotionManager = recPromotionManager.address;

        // Configuration post-déploiement
        console.log("\n🔧 CONFIGURATION POST-DÉPLOIEMENT...");

        // Mettre à jour le CampaignKeeper dans DivarProxy
        console.log("   📝 Configuration DivarProxy...");
        await divarProxy.setCampaignKeeper(campaignKeeper.address);
        console.log(`   ✅ CampaignKeeper configuré: ${campaignKeeper.address}`);

        // Configurer NFTRenderer
        await divarProxy.setNFTRenderer(nftRenderer.address);
        console.log(`   ✅ NFTRenderer configuré: ${nftRenderer.address}`);

        // Générer le bytecode Campaign pour DivarProxy
        console.log("   📝 Configuration bytecode Campaign...");
        const CampaignFactory = await ethers.getContractFactory("Campaign");
        const campaignBytecode = CampaignFactory.bytecode;
        await divarProxy.setCampaignBytecode(campaignBytecode);
        console.log("   ✅ Bytecode Campaign configuré");

        const endTime = Date.now();
        const deploymentTime = (endTime - startTime) / 1000;

        // Résumé final
        console.log("\n" + "=".repeat(60));
        console.log("🎉 DÉPLOIEMENT MAINNET TERMINÉ AVEC SUCCÈS!");
        console.log("=".repeat(60));
        console.log(`⏱️  Temps total: ${deploymentTime.toFixed(1)} secondes`);
        console.log(`🌐 Réseau: ${BASE_MAINNET_CONFIG.name}`);
        console.log(`👤 Déployé par: ${deployer.address}`);

        console.log("\n📋 ADDRESSES DES CONTRATS:");
        Object.entries(deploymentAddresses).forEach(([name, address]) => {
            console.log(`   ${name}: ${address}`);
        });

        console.log("\n🔗 LIENS BASESCAN:");
        Object.entries(deploymentAddresses).forEach(([name, address]) => {
            console.log(`   ${name}: ${BASE_MAINNET_CONFIG.explorer}/address/${address}`);
        });

        // Sauvegarder les addresses
        const deploymentData = {
            network: BASE_MAINNET_CONFIG.name,
            chainId: BASE_MAINNET_CONFIG.chainId,
            deploymentTime: new Date().toISOString(),
            deployer: deployer.address,
            contracts: deploymentAddresses,
            chainlinkFeeds: CHAINLINK_FEEDS,
            explorer: BASE_MAINNET_CONFIG.explorer
        };

        const deploymentsDir = path.join(__dirname, "..", "deployments");
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir);
        }

        const filename = `base-mainnet-${Date.now()}.json`;
        const filepath = path.join(deploymentsDir, filename);
        fs.writeFileSync(filepath, JSON.stringify(deploymentData, null, 2));

        // Sauvegarder aussi dans un fichier latest.json pour référence facile
        const latestPath = path.join(deploymentsDir, "base-mainnet-latest.json");
        fs.writeFileSync(latestPath, JSON.stringify(deploymentData, null, 2));

        console.log(`\n💾 Déploiement sauvegardé: ${filepath}`);

        // Instructions de vérification
        console.log("\n🔍 COMMANDES DE VÉRIFICATION:");
        console.log(`npx hardhat verify ${deploymentAddresses.priceConsumer} "${CHAINLINK_FEEDS.ETH_USD}" --network base`);
        console.log(`npx hardhat verify ${deploymentAddresses.nftRenderer} --network base`);
        console.log(`npx hardhat verify ${deploymentAddresses.campaignKeeper} "${deploymentAddresses.divarProxy}" --network base`);

        console.log("\n🎯 PROCHAINES ÉTAPES:");
        console.log("1. ✅ Vérifier les contrats sur BaseScan");
        console.log("2. 📝 Mettre à jour les adresses dans le frontend");
        console.log("3. 🧪 Tester une campagne de test");
        console.log("4. 🚀 Annoncer le lancement!");

        return deploymentAddresses;

    } catch (error) {
        console.log("\n❌ ERREUR LORS DU DÉPLOIEMENT:");
        console.log(error.message);

        if (deploymentAddresses && Object.keys(deploymentAddresses).length > 0) {
            console.log("\n📋 CONTRATS DÉJÀ DÉPLOYÉS:");
            Object.entries(deploymentAddresses).forEach(([name, address]) => {
                console.log(`   ${name}: ${address}`);
            });
        }

        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("💥 Échec du déploiement:", error);
        process.exit(1);
    });
