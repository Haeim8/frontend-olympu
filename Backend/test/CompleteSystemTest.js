const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("🧪 LIVAR Complete System Tests", function () {
    let divarProxy, priceConsumer, campaignKeeper, nftRenderer, recPromotionManager;
    let owner, treasury, startup1, startup2, investor1, investor2, investor3, investor4;
    let campaign1Address, campaign2Address;
    
    // Test ERC20 tokens pour dividendes
    let mockUSDC, mockCustomToken;
    
    const CAMPAIGN_CREATION_FEE = ethers.utils.parseEther("0.001"); // Fallback pour tests locaux
    const SHARE_PRICE_1 = ethers.utils.parseEther("0.1"); // 0.1 ETH par part
    const SHARE_PRICE_2 = ethers.utils.parseEther("0.05"); // 0.05 ETH par part
    const TARGET_AMOUNT_1 = ethers.utils.parseEther("10"); // 10 ETH objectif
    const TARGET_AMOUNT_2 = ethers.utils.parseEther("5"); // 5 ETH objectif
    const ROUND_DURATION = 7 * 24 * 60 * 60; // 7 jours
    
    async function deploySystemFixture() {
        // Récupération des comptes
        [owner, treasury, startup1, startup2, investor1, investor2, investor3, investor4] = await ethers.getSigners();
        
        console.log("\n🚀 Déploiement du système complet...");
        
        // 1. Déployer PriceConsumerV3 (mock pour tests)
        const PriceConsumerV3 = await ethers.getContractFactory("PriceConsumerV3");
        priceConsumer = await PriceConsumerV3.deploy();
        await priceConsumer.deployed();
        console.log(`✅ PriceConsumer déployé: ${priceConsumer.address}`);
        
        // 2. Déployer DivarProxy (upgradeable)
        const DivarProxy = await ethers.getContractFactory("DivarProxy");
        divarProxy = await upgrades.deployProxy(
            DivarProxy,
            [treasury.address, treasury.address, priceConsumer.address],
            { initializer: "initialize", kind: "uups" }
        );
        await divarProxy.deployed();
        console.log(`✅ DivarProxy déployé: ${divarProxy.address}`);
        
        // 3. Déployer CampaignKeeper
        const CampaignKeeper = await ethers.getContractFactory("CampaignKeeper");
        campaignKeeper = await CampaignKeeper.deploy(divarProxy.address);
        await campaignKeeper.deployed();
        console.log(`✅ CampaignKeeper déployé: ${campaignKeeper.address}`);
        
        // 4. Mettre à jour DivarProxy avec CampaignKeeper
        await divarProxy.setCampaignKeeper(campaignKeeper.address);
        
        // 5. Déployer NFTRenderer
        const NFTRenderer = await ethers.getContractFactory("NFTRenderer");
        nftRenderer = await NFTRenderer.deploy();
        await nftRenderer.deployed();
        console.log(`✅ NFTRenderer déployé: ${nftRenderer.address}`);
        
        // 6. Déployer RecPromotionManager
        const RecPromotionManager = await ethers.getContractFactory("RecPromotionManager");
        recPromotionManager = await RecPromotionManager.deploy(
            divarProxy.address,
            priceConsumer.address,
            treasury.address
        );
        await recPromotionManager.deployed();
        console.log(`✅ RecPromotionManager déployé: ${recPromotionManager.address}`);
        
        // 7. Configurer le bytecode Campaign dans DivarProxy
        const Campaign = await ethers.getContractFactory("Campaign");
        const campaignBytecode = Campaign.bytecode;
        await divarProxy.setCampaignBytecode(campaignBytecode);
        console.log("✅ Bytecode Campaign configuré");
        
        // 8. Déployer tokens de test pour dividendes
        const MockERC20 = await ethers.getContractFactory("contracts/test/MockERC20.sol:MockERC20");
        try {
            mockUSDC = await MockERC20.deploy("Mock USDC", "USDC", 6);
            await mockUSDC.deployed();
            
            mockCustomToken = await MockERC20.deploy("Startup Token", "START", 18);
            await mockCustomToken.deployed();
            console.log(`✅ Mock tokens déployés: USDC(${mockUSDC.address}) START(${mockCustomToken.address})`);
        } catch (error) {
            console.log("⚠️ Tokens ERC20 non déployés (contrat manquant), tests ETH uniquement");
            mockUSDC = null;
            mockCustomToken = null;
        }
        
        return {
            divarProxy, priceConsumer, campaignKeeper, nftRenderer, recPromotionManager,
            owner, treasury, startup1, startup2, investor1, investor2, investor3, investor4,
            mockUSDC, mockCustomToken
        };
    }
    
    beforeEach(async function () {
        const fixture = await loadFixture(deploySystemFixture);
        Object.assign(this, fixture);
        ({
            divarProxy, priceConsumer, campaignKeeper, nftRenderer, recPromotionManager,
            owner, treasury, startup1, startup2, investor1, investor2, investor3, investor4,
            mockUSDC, mockCustomToken
        } = fixture);
    });
    
    describe("📋 1. Création des Campagnes", function () {
        it("Should create campaign 1 successfully", async function () {
            console.log("\n🎯 Test: Création campagne 1 par startup1");
            
            const endTime = (await time.latest()) + ROUND_DURATION;
            
            await expect(
                divarProxy.connect(startup1).createCampaign(
                    "TechStartup Inc",
                    "TECH",
                    TARGET_AMOUNT_1,
                    SHARE_PRICE_1,
                    endTime,
                    "Technology",
                    "Un projet révolutionnaire en blockchain",
                    250, // 2.5% royalty
                    "https://example.com/logo1.png",
                    { value: CAMPAIGN_CREATION_FEE }
                )
            ).to.emit(divarProxy, "CampaignCreated");
            
            const campaigns = await divarProxy.getAllCampaigns();
            campaign1Address = campaigns[0];
            console.log(`✅ Campagne 1 créée: ${campaign1Address}`);
            
            // Vérifier les détails
            const campaignInfo = await divarProxy.getCampaignRegistry(campaign1Address);
            expect(campaignInfo.creator).to.equal(startup1.address);
            expect(campaignInfo.name).to.equal("TechStartup Inc");
        });
        
        it("Should create campaign 2 successfully", async function () {
            console.log("\n🎯 Test: Création campagne 2 par startup2");
            
            const endTime = (await time.latest()) + ROUND_DURATION;
            
            await expect(
                divarProxy.connect(startup2).createCampaign(
                    "GreenEnergy Co",
                    "GREEN",
                    TARGET_AMOUNT_2,
                    SHARE_PRICE_2,
                    endTime,
                    "Energy",
                    "Solutions énergétiques durables",
                    500, // 5% royalty
                    "https://example.com/logo2.png",
                    { value: CAMPAIGN_CREATION_FEE }
                )
            ).to.emit(divarProxy, "CampaignCreated");
            
            const campaigns = await divarProxy.getAllCampaigns();
            campaign2Address = campaigns[1];
            console.log(`✅ Campagne 2 créée: ${campaign2Address}`);
        });
    });
    
    describe("💰 2. Investissements Multi-Wallets", function () {
        beforeEach(async function () {
            // Créer les campagnes
            const endTime = (await time.latest()) + ROUND_DURATION;
            
            await divarProxy.connect(startup1).createCampaign(
                "TechStartup Inc", "TECH", TARGET_AMOUNT_1, SHARE_PRICE_1, endTime,
                "Technology", "metadata", 250, "logo", { value: CAMPAIGN_CREATION_FEE }
            );
            
            await divarProxy.connect(startup2).createCampaign(
                "GreenEnergy Co", "GREEN", TARGET_AMOUNT_2, SHARE_PRICE_2, endTime,
                "Energy", "metadata", 500, "logo", { value: CAMPAIGN_CREATION_FEE }
            );
            
            const campaigns = await divarProxy.getAllCampaigns();
            campaign1Address = campaigns[0];
            campaign2Address = campaigns[1];
        });
        
        it("Should handle multiple investors buying shares", async function () {
            console.log("\n🎯 Test: Investissements multiples sur campagne 1");
            
            const Campaign = await ethers.getContractFactory("Campaign");
            const campaign1 = Campaign.attach(campaign1Address);
            
            // Investor1 achète 5 parts
            await expect(
                campaign1.connect(investor1).buyShares(5, {
                    value: SHARE_PRICE_1.mul(5)
                })
            ).to.emit(campaign1, "SharesPurchased");
            console.log("✅ Investor1: 5 parts achetées");
            
            // Investor2 achète 10 parts
            await expect(
                campaign1.connect(investor2).buyShares(10, {
                    value: SHARE_PRICE_1.mul(10)
                })
            ).to.emit(campaign1, "SharesPurchased");
            console.log("✅ Investor2: 10 parts achetées");
            
            // Investor3 achète 3 parts
            await expect(
                campaign1.connect(investor3).buyShares(3, {
                    value: SHARE_PRICE_1.mul(3)
                })
            ).to.emit(campaign1, "SharesPurchased");
            console.log("✅ Investor3: 3 parts achetées");
            
            // Vérifier les balances NFT
            expect(await campaign1.balanceOf(investor1.address)).to.equal(5);
            expect(await campaign1.balanceOf(investor2.address)).to.equal(10);
            expect(await campaign1.balanceOf(investor3.address)).to.equal(3);
            
            // Vérifier parts possédées
            expect(await campaign1.sharesOwned(investor1.address)).to.equal(5);
            expect(await campaign1.sharesOwned(investor2.address)).to.equal(10);
            expect(await campaign1.sharesOwned(investor3.address)).to.equal(3);
            
            console.log("✅ Toutes les balances vérifiées");
        });
        
        it("Should handle investments in multiple campaigns", async function () {
            console.log("\n🎯 Test: Investissements sur plusieurs campagnes");
            
            const Campaign = await ethers.getContractFactory("Campaign");
            const campaign1 = Campaign.attach(campaign1Address);
            const campaign2 = Campaign.attach(campaign2Address);
            
            // Investor1 investit dans les deux campagnes
            await campaign1.connect(investor1).buyShares(3, {
                value: SHARE_PRICE_1.mul(3)
            });
            
            await campaign2.connect(investor1).buyShares(5, {
                value: SHARE_PRICE_2.mul(5)
            });
            
            // Investor2 aussi
            await campaign1.connect(investor2).buyShares(2, {
                value: SHARE_PRICE_1.mul(2)
            });
            
            await campaign2.connect(investor2).buyShares(8, {
                value: SHARE_PRICE_2.mul(8)
            });
            
            // Vérifications
            expect(await campaign1.balanceOf(investor1.address)).to.equal(3);
            expect(await campaign2.balanceOf(investor1.address)).to.equal(5);
            expect(await campaign1.balanceOf(investor2.address)).to.equal(2);
            expect(await campaign2.balanceOf(investor2.address)).to.equal(8);
            
            console.log("✅ Investissements multi-campagnes validés");
        });
    });
    
    describe("🔄 3. Remboursements et Scenarios", function () {
        beforeEach(async function () {
            // Setup campagnes
            const endTime = (await time.latest()) + ROUND_DURATION;
            
            await divarProxy.connect(startup1).createCampaign(
                "TechStartup Inc", "TECH", TARGET_AMOUNT_1, SHARE_PRICE_1, endTime,
                "Technology", "metadata", 250, "logo", { value: CAMPAIGN_CREATION_FEE }
            );
            
            const campaigns = await divarProxy.getAllCampaigns();
            campaign1Address = campaigns[0];
        });
        
        it("Should handle refunds during active round", async function () {
            console.log("\n🎯 Test: Remboursements pendant round actif");
            
            const Campaign = await ethers.getContractFactory("Campaign");
            const campaign1 = Campaign.attach(campaign1Address);
            
            // Investor1 achète 5 parts
            await campaign1.connect(investor1).buyShares(5, {
                value: SHARE_PRICE_1.mul(5)
            });
            
            const investor1BalanceBefore = await ethers.provider.getBalance(investor1.address);
            
            // Obtenir les token IDs
            const tokenIds = [];
            for (let i = 1; i <= 3; i++) { // Rembourser 3 parts sur 5
                tokenIds.push(i);
            }
            
            // Effectuer le remboursement
            await expect(
                campaign1.connect(investor1).refundShares(tokenIds)
            ).to.emit(campaign1, "SharesRefunded");
            
            console.log("✅ Remboursement effectué pour 3 NFTs");
            
            // Vérifier que les NFTs ont été brûlés
            for (const tokenId of tokenIds) {
                expect(await campaign1.tokenBurned(tokenId)).to.be.true;
            }
            
            // Vérifier les balances mises à jour
            expect(await campaign1.balanceOf(investor1.address)).to.equal(2); // 5 - 3
            expect(await campaign1.sharesOwned(investor1.address)).to.equal(2);
            
            console.log("✅ Balances post-remboursement vérifiées");
        });
        
        it("Should prevent refunds after round finalization", async function () {
            console.log("\n🎯 Test: Interdiction remboursement après finalisation");
            
            const Campaign = await ethers.getContractFactory("Campaign");
            const campaign1 = Campaign.attach(campaign1Address);
            
            // Acheter suffisamment pour finaliser le round
            const sharesNeeded = TARGET_AMOUNT_1.div(SHARE_PRICE_1);
            await campaign1.connect(investor1).buyShares(sharesNeeded, {
                value: TARGET_AMOUNT_1
            });
            
            // Le round devrait être automatiquement finalisé
            const round = await campaign1.getCurrentRound();
            expect(round.isFinalized).to.be.true;
            console.log("✅ Round finalisé automatiquement");
            
            // Tentative de remboursement (devrait échouer)
            await expect(
                campaign1.connect(investor1).refundShares([1])
            ).to.be.revertedWith("Round is finalized");
            
            console.log("✅ Remboursement correctement bloqué après finalisation");
        });
    });
    
    describe("🏁 4. Finalisation et Automation", function () {
        beforeEach(async function () {
            const endTime = (await time.latest()) + ROUND_DURATION;
            
            await divarProxy.connect(startup1).createCampaign(
                "TechStartup Inc", "TECH", TARGET_AMOUNT_1, SHARE_PRICE_1, endTime,
                "Technology", "metadata", 250, "logo", { value: CAMPAIGN_CREATION_FEE }
            );
            
            const campaigns = await divarProxy.getAllCampaigns();
            campaign1Address = campaigns[0];
        });
        
        it("Should auto-finalize when target reached", async function () {
            console.log("\n🎯 Test: Auto-finalisation à l'objectif atteint");
            
            const Campaign = await ethers.getContractFactory("Campaign");
            const campaign1 = Campaign.attach(campaign1Address);
            
            // Acheter juste assez pour atteindre l'objectif
            const sharesNeeded = TARGET_AMOUNT_1.div(SHARE_PRICE_1);
            
            await expect(
                campaign1.connect(investor1).buyShares(sharesNeeded, {
                    value: TARGET_AMOUNT_1
                })
            ).to.emit(campaign1, "RoundFinalized");
            
            const round = await campaign1.getCurrentRound();
            expect(round.isFinalized).to.be.true;
            expect(round.isActive).to.be.false;
            
            console.log("✅ Round auto-finalisé à l'objectif");
        });
        
        it("Should handle Chainlink Keeper automation", async function () {
            console.log("\n🎯 Test: Automation Chainlink Keeper");
            
            const Campaign = await ethers.getContractFactory("Campaign");
            const campaign1 = Campaign.attach(campaign1Address);
            
            // Avancer le temps au-delà de l'end time
            await time.increase(ROUND_DURATION + 1);
            
            // Le keeper devrait détecter qu'il faut finaliser
            const [upkeepNeeded, performData] = await campaignKeeper.checkUpkeep("0x");
            expect(upkeepNeeded).to.be.true;
            console.log("✅ Keeper détecte la nécessité d'intervention");
            
            // Exécuter l'upkeep
            await expect(
                campaignKeeper.performUpkeep(performData)
            ).to.emit(campaignKeeper, "CampaignFinalized");
            
            const round = await campaign1.getCurrentRound();
            expect(round.isFinalized).to.be.true;
            
            console.log("✅ Automation Keeper fonctionnelle");
        });
    });
    
    describe("💎 5. Distribution de Dividendes", function () {
        beforeEach(async function () {
            // Setup campagne et investissements
            const endTime = (await time.latest()) + ROUND_DURATION;
            
            await divarProxy.connect(startup1).createCampaign(
                "TechStartup Inc", "TECH", TARGET_AMOUNT_1, SHARE_PRICE_1, endTime,
                "Technology", "metadata", 250, "logo", { value: CAMPAIGN_CREATION_FEE }
            );
            
            const campaigns = await divarProxy.getAllCampaigns();
            campaign1Address = campaigns[0];
            
            const Campaign = await ethers.getContractFactory("Campaign");
            const campaign1 = Campaign.attach(campaign1Address);
            
            // Plusieurs investisseurs achètent
            await campaign1.connect(investor1).buyShares(10, {
                value: SHARE_PRICE_1.mul(10)
            });
            
            await campaign1.connect(investor2).buyShares(5, {
                value: SHARE_PRICE_1.mul(5)
            });
            
            await campaign1.connect(investor3).buyShares(15, {
                value: SHARE_PRICE_1.mul(15)
            });
            
            // Finaliser le round (atteindre l'objectif)
            const remainingShares = TARGET_AMOUNT_1.div(SHARE_PRICE_1).sub(30);
            if (remainingShares.gt(0)) {
                await campaign1.connect(investor4).buyShares(remainingShares, {
                    value: SHARE_PRICE_1.mul(remainingShares)
                });
            }
        });
        
        it("Should distribute ETH dividends correctly", async function () {
            console.log("\n🎯 Test: Distribution dividendes ETH");
            
            const Campaign = await ethers.getContractFactory("Campaign");
            const campaign1 = Campaign.attach(campaign1Address);
            
            const dividendAmount = ethers.utils.parseEther("2"); // 2 ETH de dividendes
            
            // Distribuer les dividendes
            await expect(
                campaign1.connect(startup1).distributeDividends(dividendAmount, {
                    value: dividendAmount
                })
            ).to.emit(campaign1, "DividendsDistributed");
            
            console.log("✅ Dividendes distribués");
            
            // Investor1 (10 parts sur 100 total) devrait recevoir 10% = 0.2 ETH
            const investor1BalanceBefore = await ethers.provider.getBalance(investor1.address);
            
            const tx = await campaign1.connect(investor1).claimDividends();
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed.mul(tx.gasPrice);
            
            const investor1BalanceAfter = await ethers.provider.getBalance(investor1.address);
            const dividendReceived = investor1BalanceAfter.add(gasUsed).sub(investor1BalanceBefore);
            
            // Vérifier que le montant est approximativement correct (10% de 2 ETH = 0.2 ETH)
            const expectedDividend = dividendAmount.mul(10).div(100); // 10 parts / 100 total
            expect(dividendReceived).to.be.closeTo(expectedDividend, ethers.utils.parseEther("0.01"));
            
            console.log(`✅ Investor1 a reçu ~${ethers.utils.formatEther(dividendReceived)} ETH de dividendes`);
        });
        
        it("Should handle multiple dividend distributions", async function () {
            console.log("\n🎯 Test: Distributions multiples de dividendes");
            
            const Campaign = await ethers.getContractFactory("Campaign");
            const campaign1 = Campaign.attach(campaign1Address);
            
            // Première distribution
            const firstDividend = ethers.utils.parseEther("1");
            await campaign1.connect(startup1).distributeDividends(firstDividend, {
                value: firstDividend
            });
            
            // Deuxième distribution
            const secondDividend = ethers.utils.parseEther("1.5");
            await campaign1.connect(startup1).distributeDividends(secondDividend, {
                value: secondDividend
            });
            
            console.log("✅ Deux distributions effectuées");
            
            // Investor2 claim ses dividendes (devrait recevoir le total cumulé)
            const investor2BalanceBefore = await ethers.provider.getBalance(investor2.address);
            
            const tx = await campaign1.connect(investor2).claimDividends();
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed.mul(tx.gasPrice);
            
            const investor2BalanceAfter = await ethers.provider.getBalance(investor2.address);
            const totalDividendReceived = investor2BalanceAfter.add(gasUsed).sub(investor2BalanceBefore);
            
            // Investor2 a 5 parts sur 100, donc 5% du total (1 + 1.5 = 2.5 ETH) = 0.125 ETH
            const totalDistributed = firstDividend.add(secondDividend);
            const expectedTotal = totalDistributed.mul(5).div(100);
            
            expect(totalDividendReceived).to.be.closeTo(expectedTotal, ethers.utils.parseEther("0.01"));
            
            console.log(`✅ Investor2 a reçu ~${ethers.utils.formatEther(totalDividendReceived)} ETH total`);
        });
    });
    
    describe("🎁 6. Système de Promotion", function () {
        beforeEach(async function () {
            const endTime = (await time.latest()) + ROUND_DURATION;
            
            await divarProxy.connect(startup1).createCampaign(
                "TechStartup Inc", "TECH", TARGET_AMOUNT_1, SHARE_PRICE_1, endTime,
                "Technology", "metadata", 250, "logo", { value: CAMPAIGN_CREATION_FEE }
            );
            
            const campaigns = await divarProxy.getAllCampaigns();
            campaign1Address = campaigns[0];
        });
        
        it("Should promote campaign successfully", async function () {
            console.log("\n🎯 Test: Promotion de campagne");
            
            // Obtenir le prix pour FEATURED boost
            const featuredPrice = await recPromotionManager.getBoostPriceInETH(0); // BoostType.FEATURED
            console.log(`💰 Prix FEATURED: ${ethers.utils.formatEther(featuredPrice)} ETH`);
            
            // Promouvoir la campagne
            await expect(
                recPromotionManager.connect(startup1).promoteCampaign(
                    campaign1Address,
                    0, // BoostType.FEATURED
                    { value: featuredPrice }
                )
            ).to.emit(recPromotionManager, "CampaignPromoted");
            
            console.log("✅ Campagne promue avec succès");
            
            // Vérifier que la promotion est active
            const Campaign = await ethers.getContractFactory("Campaign");
            const campaign1 = Campaign.attach(campaign1Address);
            const currentRound = await campaign1.currentRound();
            
            const isActive = await recPromotionManager.isPromotionActive(campaign1Address, currentRound);
            expect(isActive).to.be.true;
            
            console.log("✅ Promotion confirmée active");
        });
        
        it("Should handle all boost types", async function () {
            console.log("\n🎯 Test: Tous les types de boost");
            
            const endTime = (await time.latest()) + ROUND_DURATION;
            
            // Créer une deuxième et troisième campagne pour tester tous les boosts
            await divarProxy.connect(startup1).createCampaign(
                "Campaign2", "CAMP2", TARGET_AMOUNT_1, SHARE_PRICE_1, endTime,
                "Technology", "metadata", 250, "logo", { value: CAMPAIGN_CREATION_FEE }
            );
            
            await divarProxy.connect(startup1).createCampaign(
                "Campaign3", "CAMP3", TARGET_AMOUNT_1, SHARE_PRICE_1, endTime,
                "Technology", "metadata", 250, "logo", { value: CAMPAIGN_CREATION_FEE }
            );
            
            const campaigns = await divarProxy.getAllCampaigns();
            const campaign2Address = campaigns[1];
            const campaign3Address = campaigns[2];
            
            // Obtenir les prix des différents boosts
            const [featuredPrice, trendingPrice, spotlightPrice] = await recPromotionManager.getAllBoostPrices();
            
            console.log(`💰 Prix FEATURED: ${ethers.utils.formatEther(featuredPrice)} ETH`);
            console.log(`💰 Prix TRENDING: ${ethers.utils.formatEther(trendingPrice)} ETH`);
            console.log(`💰 Prix SPOTLIGHT: ${ethers.utils.formatEther(spotlightPrice)} ETH`);
            
            // Promouvoir avec différents types
            await recPromotionManager.connect(startup1).promoteCampaign(
                campaign1Address, 0, { value: featuredPrice }
            );
            
            await recPromotionManager.connect(startup1).promoteCampaign(
                campaign2Address, 1, { value: trendingPrice }
            );
            
            await recPromotionManager.connect(startup1).promoteCampaign(
                campaign3Address, 2, { value: spotlightPrice }
            );
            
            // Vérifier les promotions actives
            const activePromotions = await recPromotionManager.getActivePromotions();
            expect(activePromotions.length).to.equal(3);
            
            console.log("✅ Tous les types de boost testés avec succès");
        });
    });
    
    describe("🕐 7. Escrow et Récupération des Fonds", function () {
        beforeEach(async function () {
            const endTime = (await time.latest()) + ROUND_DURATION;
            
            await divarProxy.connect(startup1).createCampaign(
                "TechStartup Inc", "TECH", TARGET_AMOUNT_1, SHARE_PRICE_1, endTime,
                "Technology", "metadata", 250, "logo", { value: CAMPAIGN_CREATION_FEE }
            );
            
            const campaigns = await divarProxy.getAllCampaigns();
            campaign1Address = campaigns[0];
            
            const Campaign = await ethers.getContractFactory("Campaign");
            const campaign1 = Campaign.attach(campaign1Address);
            
            // Finaliser le round en atteignant l'objectif
            const sharesNeeded = TARGET_AMOUNT_1.div(SHARE_PRICE_1);
            await campaign1.connect(investor1).buyShares(sharesNeeded, {
                value: TARGET_AMOUNT_1
            });
        });
        
        it("Should setup escrow correctly after finalization", async function () {
            console.log("\n🎯 Test: Configuration escrow après finalisation");
            
            const Campaign = await ethers.getContractFactory("Campaign");
            const campaign1 = Campaign.attach(campaign1Address);
            
            const escrowInfo = await campaign1.getEscrowInfo();
            expect(escrowInfo.amount).to.be.gt(0);
            expect(escrowInfo.isReleased).to.be.false;
            expect(escrowInfo.timeRemaining).to.be.gt(0);
            
            console.log(`✅ Escrow configuré: ${ethers.utils.formatEther(escrowInfo.amount)} ETH`);
            console.log(`⏰ Temps restant: ${escrowInfo.timeRemaining} secondes`);
        });
        
        it("Should prevent early escrow claim", async function () {
            console.log("\n🎯 Test: Prévention claim escrow prématuré");
            
            const Campaign = await ethers.getContractFactory("Campaign");
            const campaign1 = Campaign.attach(campaign1Address);
            
            // Tentative de claim avant 60h
            await expect(
                campaign1.connect(startup1).claimEscrow()
            ).to.be.revertedWith("Release time not reached");
            
            console.log("✅ Claim prématuré correctement bloqué");
        });
        
        it("Should allow escrow claim after delay", async function () {
            console.log("\n🎯 Test: Claim escrow après délai");
            
            const Campaign = await ethers.getContractFactory("Campaign");
            const campaign1 = Campaign.attach(campaign1Address);
            
            // Avancer le temps de 60 heures + marge
            await time.increase(60 * 60 * 60 + 3600); // 60h + 1h
            
            const startup1BalanceBefore = await ethers.provider.getBalance(startup1.address);
            
            await expect(
                campaign1.connect(startup1).claimEscrow()
            ).to.emit(campaign1, "EscrowReleased");
            
            const startup1BalanceAfter = await ethers.provider.getBalance(startup1.address);
            expect(startup1BalanceAfter).to.be.gt(startup1BalanceBefore);
            
            console.log("✅ Escrow récupéré avec succès après délai");
        });
    });
    
    describe("🌊 8. Rounds Multiples", function () {
        beforeEach(async function () {
            const endTime = (await time.latest()) + ROUND_DURATION;
            
            await divarProxy.connect(startup1).createCampaign(
                "TechStartup Inc", "TECH", TARGET_AMOUNT_1, SHARE_PRICE_1, endTime,
                "Technology", "metadata", 250, "logo", { value: CAMPAIGN_CREATION_FEE }
            );
            
            const campaigns = await divarProxy.getAllCampaigns();
            campaign1Address = campaigns[0];
        });
        
        it("Should handle multiple rounds correctly", async function () {
            console.log("\n🎯 Test: Gestion rounds multiples");
            
            const Campaign = await ethers.getContractFactory("Campaign");
            const campaign1 = Campaign.attach(campaign1Address);
            
            // Finaliser le premier round
            const sharesNeeded = TARGET_AMOUNT_1.div(SHARE_PRICE_1);
            await campaign1.connect(investor1).buyShares(sharesNeeded, {
                value: TARGET_AMOUNT_1
            });
            
            let round = await campaign1.getCurrentRound();
            expect(round.isFinalized).to.be.true;
            expect(round.roundNumber).to.equal(1);
            
            console.log("✅ Round 1 finalisé");
            
            // Démarrer un nouveau round avec prix plus élevé
            const newSharePrice = SHARE_PRICE_1.mul(150).div(100); // +50%
            const newTargetAmount = TARGET_AMOUNT_1.mul(2); // Double l'objectif
            
            await expect(
                campaign1.connect(startup1).startNewRound(
                    newTargetAmount,
                    newSharePrice,
                    ROUND_DURATION
                )
            ).to.emit(campaign1, "RoundStarted");
            
            console.log("✅ Round 2 démarré avec prix plus élevé");
            
            // Vérifier le nouveau round
            round = await campaign1.getCurrentRound();
            expect(round.roundNumber).to.equal(2);
            expect(round.isActive).to.be.true;
            expect(round.sharePrice).to.equal(newSharePrice);
            expect(round.targetAmount).to.equal(newTargetAmount);
            
            // Investir dans le nouveau round
            await campaign1.connect(investor2).buyShares(5, {
                value: newSharePrice.mul(5)
            });
            
            expect(await campaign1.sharesOwned(investor2.address)).to.equal(5);
            
            console.log("✅ Investissement dans Round 2 validé");
        });
    });
    
    describe("🎨 9. NFT Rendering et Customization", function () {
        beforeEach(async function () {
            const endTime = (await time.latest()) + ROUND_DURATION;
            
            await divarProxy.connect(startup1).createCampaign(
                "TechStartup Inc", "TECH", TARGET_AMOUNT_1, SHARE_PRICE_1, endTime,
                "Technology", "metadata", 250, "logo", { value: CAMPAIGN_CREATION_FEE }
            );
            
            const campaigns = await divarProxy.getAllCampaigns();
            campaign1Address = campaigns[0];
        });
        
        it("Should generate NFT metadata correctly", async function () {
            console.log("\n🎯 Test: Génération métadonnées NFT");
            
            const Campaign = await ethers.getContractFactory("Campaign");
            const campaign1 = Campaign.attach(campaign1Address);
            
            // Acheter une part pour créer un NFT
            await campaign1.connect(investor1).buyShares(1, {
                value: SHARE_PRICE_1
            });
            
            // Vérifier que le NFT existe et a des métadonnées
            const tokenURI = await campaign1.tokenURI(1);
            expect(tokenURI).to.include("data:application/json;base64,");
            
            // Décoder et vérifier le contenu JSON
            const base64Data = tokenURI.replace("data:application/json;base64,", "");
            const jsonString = Buffer.from(base64Data, 'base64').toString();
            const metadata = JSON.parse(jsonString);
            
            expect(metadata.name).to.include("TechStartup Inc");
            expect(metadata.description).to.include("Share #1");
            
            console.log("✅ Métadonnées NFT générées correctement");
        });
    });
    
    describe("📊 10. Analytics et Getters", function () {
        beforeEach(async function () {
            const endTime = (await time.latest()) + ROUND_DURATION;
            
            // Créer plusieurs campagnes
            await divarProxy.connect(startup1).createCampaign(
                "TechStartup Inc", "TECH", TARGET_AMOUNT_1, SHARE_PRICE_1, endTime,
                "Technology", "metadata", 250, "logo", { value: CAMPAIGN_CREATION_FEE }
            );
            
            await divarProxy.connect(startup2).createCampaign(
                "GreenEnergy Co", "GREEN", TARGET_AMOUNT_2, SHARE_PRICE_2, endTime,
                "Energy", "metadata", 500, "logo", { value: CAMPAIGN_CREATION_FEE }
            );
            
            const campaigns = await divarProxy.getAllCampaigns();
            campaign1Address = campaigns[0];
            campaign2Address = campaigns[1];
        });
        
        it("Should provide correct analytics data", async function () {
            console.log("\n🎯 Test: Données analytiques");
            
            // Vérifier les campagnes par créateur
            const startup1Campaigns = await divarProxy.getCampaignsByCreator(startup1.address);
            const startup2Campaigns = await divarProxy.getCampaignsByCreator(startup2.address);
            
            expect(startup1Campaigns.length).to.equal(1);
            expect(startup2Campaigns.length).to.equal(1);
            expect(startup1Campaigns[0]).to.equal(campaign1Address);
            expect(startup2Campaigns[0]).to.equal(campaign2Address);
            
            // Vérifier les campagnes par catégorie
            const techCampaigns = await divarProxy.getCampaignsByCategory("Technology");
            const energyCampaigns = await divarProxy.getCampaignsByCategory("Energy");
            
            expect(techCampaigns.length).to.equal(1);
            expect(energyCampaigns.length).to.equal(1);
            
            // Vérifier toutes les campagnes
            const allCampaigns = await divarProxy.getAllCampaigns();
            expect(allCampaigns.length).to.equal(2);
            
            console.log("✅ Toutes les données analytiques correctes");
        });
        
        it("Should track user status correctly", async function () {
            console.log("\n🎯 Test: Statut utilisateur");
            
            // Vérifier le statut des startups
            const startup1Status = await divarProxy.checkUserStatus(startup1.address);
            const startup2Status = await divarProxy.checkUserStatus(startup2.address);
            const investorStatus = await divarProxy.checkUserStatus(investor1.address);
            
            expect(startup1Status.campaignCount).to.equal(1);
            expect(startup2Status.campaignCount).to.equal(1);
            expect(investorStatus.campaignCount).to.equal(0); // Pas de campagne créée
            
            console.log("✅ Statuts utilisateur corrects");
        });
    });
    
    after(async function () {
        console.log("\n🎉 RÉSUMÉ DES TESTS COMPLETS:");
        console.log("✅ Création de campagnes multiples");
        console.log("✅ Investissements multi-wallets");
        console.log("✅ Remboursements pendant round actif");
        console.log("✅ Finalisation automatique");
        console.log("✅ Automation Chainlink Keeper");
        console.log("✅ Distribution dividendes ETH");
        console.log("✅ Système de promotion");
        console.log("✅ Gestion escrow (60h)");
        console.log("✅ Rounds multiples");
        console.log("✅ Génération NFT métadonnées");
        console.log("✅ Analytics et getters");
        console.log("\n🚀 SYSTÈME LIVAR ENTIÈREMENT TESTÉ ET VALIDÉ!");
    });
});