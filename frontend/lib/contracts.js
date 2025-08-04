// Adresses des contrats déployés sur Base Sepolia
export const CONTRACTS = {
  DIVAR_PROXY: "0xEF19D1E5510321a5Fbf7F0F701F8162345c40B90",
  PRICE_CONSUMER_V3: "0x8ff2c0B7029614306F9a59CdEfe333f2912D4822", 
  CAMPAIGN_KEEPER: "0xD36a940840208820E3Eb30d1443d7762491a4C9D",
  
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