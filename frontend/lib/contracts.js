// Adresses des contrats déployés sur Base Sepolia
export const CONTRACTS = {
  DIVAR_PROXY: "0x761400A08C2cD05bfEC9064F09724E1AE1CEFDbb",
  PRICE_CONSUMER_V3: "0xA8e71Fb1FfF4cE16C5470F5E830881fAd66b37c8", 
  CAMPAIGN_KEEPER: "0x96Ed55A4Fc91cDeCD5E34B2d2e1dA535860bDcb9",
  
  // Network info
  NETWORK: "base-sepolia",
  CHAIN_ID: 84532,
};

// Fonctions utiles pour récupérer les adresses
export const getContractAddress = (contractName) => {
  return CONTRACTS[contractName];
};

export const getAllContracts = () => {
  return CONTRACTS;
};