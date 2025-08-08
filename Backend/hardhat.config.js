require("@nomiclabs/hardhat-ethers"); // Ethers v5 compatible
require("@nomiclabs/hardhat-etherscan"); // Pour la vérification Etherscan
require("@openzeppelin/hardhat-upgrades");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("@typechain/hardhat");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0000000000000000000000000000000000000000000000000000000000000000";
const PRIVATE_KEY_2 = process.env.PRIVATE_KEY_2 || "0000000000000000000000000000000000000000000000000000000000000000";
const PRIVATE_KEY_3 = process.env.PRIVATE_KEY_3 || "0000000000000000000000000000000000000000000000000000000000000000";
const PRIVATE_KEY_4 = process.env.PRIVATE_KEY_4 || "0000000000000000000000000000000000000000000000000000000000000000";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true,
      evmVersion: "paris"
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
      gas: "auto",
      gasPrice: "auto",
      blockGasLimit: 100000000,
      allowUnlimitedContractSize: true,
      accounts: {
        accountsBalance: "10000000000000000000000" // 10000 ETH
      },
      mining: {
        auto: true,
        interval: 0
      }
    },
    sepoliaBase: {
      url: process.env.SEPOLIA_BASE_URL || "https://sepolia.base.org",
      chainId: 84532,
      gasPrice: 35000000000, // 35 gwei - fix pour REPLACEMENT_UNDERPRICED
      accounts: [
        PRIVATE_KEY,
        PRIVATE_KEY_2,
        PRIVATE_KEY_3,
        PRIVATE_KEY_4
      ].filter(key => key !== "0000000000000000000000000000000000000000000000000000000000000000")
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY
  },
  etherscan: {
    apiKey: process.env.SEPOLIA_BASE_ETHERSCAN_API_KEY,
    customChains: [
      {
        network: "sepoliaBase",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia-explorer.base.org"
        }
      }
    ]
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5"
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  }
};