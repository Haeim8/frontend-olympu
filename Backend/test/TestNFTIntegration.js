const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Test NFT Integration Simple", function () {
    let divarProxy, campaign, priceConsumer, campaignKeeper, nftRenderer;
    let owner, startup, investor1;
    
    before(async function () {
        [owner, startup, investor1] = await ethers.getSigners();
        
        console.log("\n=== DEPLOIEMENT LOCAL SIMPLIFIÉ ===");
        
        // Deploy PriceConsumerV3
        const PriceConsumerV3 = await ethers.getContractFactory("PriceConsumerV3");
        priceConsumer = await PriceConsumerV3.deploy();
        await priceConsumer.deployed();
        console.log("✓ PriceConsumerV3:", priceConsumer.address);
        
        // Deploy NFTRenderer
        const NFTRenderer = await ethers.getContractFactory("NFTRenderer");
        nftRenderer = await NFTRenderer.deploy();
        await nftRenderer.deployed();
        console.log("✓ NFTRenderer:", nftRenderer.address);
        
        // Pour éviter la dépendance circulaire, on crée une implementation DivarProxy basique
        const DivarProxy = await ethers.getContractFactory("DivarProxy");
        const implementation = await DivarProxy.deploy();
        await implementation.deployed();
        console.log("✓ DivarProxy Implementation:", implementation.address);
        
        // Deploy un proxy ERC1967 standard
        const ERC1967Proxy = await ethers.getContractFactory("ERC1967Proxy");
        const initData = DivarProxy.interface.encodeFunctionData("initialize", [
            owner.address,
            owner.address, // campaignKeeper temporaire
            priceConsumer.address,
            nftRenderer.address
        ]);
        
        const proxy = await ERC1967Proxy.deploy(implementation.address, initData);
        await proxy.deployed();
        
        divarProxy = DivarProxy.attach(proxy.address);
        console.log("✓ DivarProxy Proxy:", divarProxy.address);
        
        // Deploy CampaignKeeper avec la bonne adresse
        const CampaignKeeper = await ethers.getContractFactory("CampaignKeeper");
        campaignKeeper = await CampaignKeeper.deploy(divarProxy.address);
        await campaignKeeper.deployed();
        console.log("✓ CampaignKeeper:", campaignKeeper.address);
        
        // Configurer le vrai campaignKeeper
        await divarProxy.setCampaignKeeper(campaignKeeper.address);
        
        // Configurer le bytecode Campaign
        const Campaign = await ethers.getContractFactory("Campaign");
        await divarProxy.setCampaignBytecode(Campaign.bytecode);
        console.log("✓ Configuration terminée");
    });
    
    it("Devrait créer une campagne avec NFT personnalisé", async function () {
        console.log("\n=== TEST CREATION CAMPAGNE NFT ===");
        
        const targetAmount = ethers.utils.parseEther("1.0");
        const sharePrice = ethers.utils.parseEther("0.1");
        const endTime = Math.floor(Date.now() / 1000) + 3600;
        
        // Paramètres NFT personnalisés
        const nftBackgroundColor = "#1E40AF";
        const nftTextColor = "#FFFFFF";
        const nftLogoUrl = "https://test-logo.svg";
        const nftSector = "DeFi";
        
        console.log("Configuration NFT:");
        console.log(`   Background: ${nftBackgroundColor}`);
        console.log(`   Text: ${nftTextColor}`);
        console.log(`   Logo: ${nftLogoUrl}`);
        console.log(`   Sector: ${nftSector}`);
        
        // Créer la campagne
        const tx = await divarProxy.connect(startup).createCampaign(
            "Test NFT Campaign",
            "TNC",
            targetAmount,
            sharePrice,
            endTime,
            "DeFi",
            "Test metadata",
            500, // 5% royalty
            "https://campaign-logo.png",
            nftBackgroundColor,
            nftTextColor,
            nftLogoUrl,
            nftSector,
            { value: ethers.utils.parseEther("0.001") } // Prix test local
        );
        
        const receipt = await tx.wait();
        console.log("✓ Campagne créée, gas:", receipt.gasUsed.toString());
        
        // Récupérer l'adresse de la campagne
        const campaignCreatedEvent = receipt.events.find(e => e.event === 'CampaignCreated');
        expect(campaignCreatedEvent).to.not.be.undefined;
        
        const campaignAddress = campaignCreatedEvent.args.campaignAddress;
        console.log("✓ Adresse campagne:", campaignAddress);
        
        // Vérifier que c'est bien déployé
        campaign = await ethers.getContractAt("Campaign", campaignAddress);
        expect(await campaign.campaignName()).to.equal("Test NFT Campaign");
        
        // VERIFICATION INTEGRATION NFT
        expect(await campaign.nftRenderer()).to.equal(nftRenderer.address);
        expect(await campaign.nftBackgroundColor()).to.equal(nftBackgroundColor);
        expect(await campaign.nftTextColor()).to.equal(nftTextColor);
        expect(await campaign.nftLogoUrl()).to.equal(nftLogoUrl);
        expect(await campaign.nftSector()).to.equal(nftSector);
        
        console.log("✅ INTEGRATION NFT REUSSIE !");
    });
    
    it("Devrait générer un NFT avec le design personnalisé", async function () {
        console.log("\n=== TEST GENERATION NFT ===");
        
        // Investir pour créer un NFT
        console.log("Investissement de 0.1 ETH...");
        const investTx = await campaign.connect(investor1).buyShares(1, {
            value: ethers.utils.parseEther("0.1")
        });
        
        const investReceipt = await investTx.wait();
        console.log("✓ Investissement effectué, gas:", investReceipt.gasUsed.toString());
        
        // Vérifier le NFT
        const balance = await campaign.balanceOf(investor1.address);
        expect(balance).to.equal(1);
        
        const tokenId = await campaign.tokenOfOwnerByIndex(investor1.address, 0);
        console.log("✓ Token ID:", tokenId.toString());
        
        // Tester la génération d'URI personnalisé
        const tokenURI = await campaign.tokenURI(tokenId);
        console.log("Token URI généré:", tokenURI.substring(0, 100) + "...");
        
        expect(tokenURI).to.include("data:application/json;base64");
        
        // Décoder et vérifier
        const base64Data = tokenURI.split(',')[1];
        const jsonData = JSON.parse(Buffer.from(base64Data, 'base64').toString());
        
        console.log("Métadonnées NFT:");
        console.log("   Nom:", jsonData.name);
        console.log("   Description:", jsonData.description);
        console.log("   Attributs:", jsonData.attributes.length);
        
        expect(jsonData.name).to.include("Test NFT Campaign");
        expect(jsonData.attributes).to.have.lengthOf(5); // Company, Sector, Round, Number, Contract
        
        console.log("✅ NFT PERSONNALISE GENERE AVEC SUCCES !");
    });
});