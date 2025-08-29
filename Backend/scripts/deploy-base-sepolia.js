const { ethers, upgrades } = require("hardhat");
const fs = require('fs');
const path = require('path');

// Configuration Base Sepolia
const BASE_SEPOLIA_CONFIG = {
    chainId: 84532,
    name: "Base Sepolia",
    explorer: "https://sepolia-explorer.base.org",
    etherscanAPI: "https://api-sepolia.basescan.org/api"
};

// Addresses Chainlink sur Base Sepolia
const CHAINLINK_FEEDS = {
    ETH_USD: "0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1" // ETH/USD feed Base Sepolia
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
        console.log(`   ⏳ Attente de 3 confirmations...`);
        await contract.deployTransaction.wait(3);
        
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
            timeout: 300000,      // 5 minutes
            pollingInterval: 5000 // Poll toutes les 5 secondes
        });
        
        console.log(`   🚀 Transaction: ${contract.deployTransaction.hash}`);
        await contract.deployed();
        
        console.log(`   ✅ ${contractName} Proxy: ${contract.address}`);
        
        // Attendre confirmations AVANT de récupérer l'implementation
        console.log(`   ⏳ Attente de 5 confirmations...`);
        await contract.deployTransaction.wait(5);
        
        // Attendre 20 secondes supplémentaires pour Base Sepolia
        console.log(`   ⏳ Attente réseau (20s)...`);
        await new Promise(resolve => setTimeout(resolve, 20000));
        
        // Maintenant récupérer l'adresse de l'implémentation
        try {
            const implementationAddress = await upgrades.erc1967.getImplementationAddress(contract.address);
            console.log(`   🔗 Implementation: ${implementationAddress}`);
        } catch (error) {
            console.log(`   ⚠️ Implementation non détectée immédiatement (normal sur testnet)`);
        }
        
        return contract;
        
    } catch (error) {
        console.log(`   ❌ Erreur déploiement ${contractName}: ${error.message}`);
        throw error;
    }
}

async function main() {
    console.log("🚀 DÉPLOIEMENT SYSTÈME LIVAR - BASE SEPOLIA");
    console.log("=" .repeat(60));
    
    // Vérifications préliminaires
    const network = await ethers.provider.getNetwork();
    console.log(`📡 Réseau: ${network.name} (chainId: ${network.chainId})`);
    
    if (network.chainId !== BASE_SEPOLIA_CONFIG.chainId) {
        throw new Error(`❌ Mauvais réseau ! Attendu: ${BASE_SEPOLIA_CONFIG.chainId}, Reçu: ${network.chainId}`);
    }
    
    const [deployer] = await ethers.getSigners();
    console.log(`👤 Déployeur: ${deployer.address}`);
    
    const balance = await deployer.getBalance();
    console.log(`💰 Balance: ${ethers.utils.formatEther(balance)} ETH`);
    
    if (balance.lt(ethers.utils.parseEther("0.01"))) {
        console.log("⚠️ Balance faible ! Assure-toi d'avoir au moins 0.01 ETH");
    }
    
    // Addresses de déploiement
    const deploymentAddresses = {};
    const startTime = Date.now();
    
    try {
        // 1. PriceConsumerV3 (pas d'arguments - adresse hardcodée)
        const priceConsumer = await deployContract(
            "PriceConsumerV3",
            [],
            "Oracle Chainlink ETH/USD pour Base Sepolia"
        );
        deploymentAddresses.priceConsumer = priceConsumer.address;
        
        // 2. DivarProxy (Upgradeable) - utilisation adresse temporaire  
        console.log("   🔧 Déploiement temporaire avec adresse placeholder...");
        
        // ATTENTION: DivarProxy.initialize(treasury, campaignKeeper, priceConsumer)
        const divarProxy = await deployUpgradeableContract(
            "DivarProxy",
            [
                deployer.address,     // _treasury
                deployer.address,     // _campaignKeeper (temporaire - sera mis à jour)
                priceConsumer.address // _priceConsumer
            ],
            "Contrat principal upgradeable de la plateforme"
        );
        deploymentAddresses.divarProxy = divarProxy.address;
        
        // 3. CampaignKeeper
        const campaignKeeper = await deployContract(
            "CampaignKeeper",
            [divarProxy.address],
            "Système d'automation Chainlink Keeper"
        );
        deploymentAddresses.campaignKeeper = campaignKeeper.address;
        
        // 4. NFTRenderer
        const nftRenderer = await deployContract(
            "NFTRenderer",
            [],
            "Générateur de métadonnées NFT dynamiques"
        );
        deploymentAddresses.nftRenderer = nftRenderer.address;
        
        // 5. RecPromotionManager
        const recPromotionManager = await deployContract(
            "RecPromotionManager",
            [
                deployer.address, // treasury
                priceConsumer.address, // price consumer
                divarProxy.address // divar proxy
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
        console.log("🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS!");
        console.log("=".repeat(60));
        console.log(`⏱️  Temps total: ${deploymentTime.toFixed(1)} secondes`);
        console.log(`🌐 Réseau: ${BASE_SEPOLIA_CONFIG.name}`);
        console.log(`👤 Déployé par: ${deployer.address}`);
        
        console.log("\n📋 ADDRESSES DES CONTRATS:");
        Object.entries(deploymentAddresses).forEach(([name, address]) => {
            console.log(`   ${name}: ${address}`);
        });
        
        console.log("\n🔗 LIENS UTILES:");
        Object.entries(deploymentAddresses).forEach(([name, address]) => {
            console.log(`   ${name}: ${BASE_SEPOLIA_CONFIG.explorer}/address/${address}`);
        });
        
        // Sauvegarder les addresses
        const deploymentData = {
            network: BASE_SEPOLIA_CONFIG.name,
            chainId: BASE_SEPOLIA_CONFIG.chainId,
            deploymentTime: new Date().toISOString(),
            deployer: deployer.address,
            contracts: deploymentAddresses,
            explorer: BASE_SEPOLIA_CONFIG.explorer
        };
        
        const deploymentsDir = path.join(__dirname, "..", "deployments");
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir);
        }
        
        const filename = `base-sepolia-${Date.now()}.json`;
        const filepath = path.join(deploymentsDir, filename);
        fs.writeFileSync(filepath, JSON.stringify(deploymentData, null, 2));
        
        console.log(`\n💾 Déploiement sauvegardé: ${filepath}`);
        
        // Instructions suivantes
        console.log("\n🎯 PROCHAINES ÉTAPES:");
        console.log("1. ✅ Vérifier les contrats sur BaseScan");
        console.log("2. 🧪 Tester les fonctionnalités de base");
        console.log("3. 🎨 Créer l'interface frontend");
        console.log("4. 📝 Préparer la documentation");
        console.log("5. 🚀 Candidater aux programmes de financement Base");
        
        console.log("\n💡 COMMANDES UTILES:");
        console.log(`npx hardhat verify ${deploymentAddresses.priceConsumer} --network sepoliaBase`);
        console.log(`npx hardhat verify ${deploymentAddresses.nftRenderer} --network sepoliaBase`);
        
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

// Fonction pour vérifier les contrats après déploiement
async function verifyContracts(addresses) {
    console.log("\n🔍 VÉRIFICATION DES CONTRATS...");
    
    try {
        // PriceConsumer (pas d'arguments de constructeur)
        console.log("   📝 Vérification PriceConsumerV3...");
        await run("verify:verify", {
            address: addresses.priceConsumer,
            constructorArguments: []
        });
        
        // NFTRenderer (pas d'arguments de constructeur)
        console.log("   📝 Vérification NFTRenderer...");
        await run("verify:verify", {
            address: addresses.nftRenderer,
            constructorArguments: []
        });
        
        console.log("✅ Vérifications terminées!");
        
    } catch (error) {
        console.log("⚠️ Erreur lors de la vérification:", error.message);
        console.log("💡 Tu peux vérifier manuellement avec les commandes affichées plus haut");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("💥 Échec du déploiement:", error);
        process.exit(1);
    });