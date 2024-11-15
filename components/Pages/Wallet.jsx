'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAddress, useBalance, useContract, useContractRead, useContractEvents } from '@thirdweb-dev/react';
import { ethers } from 'ethers';
import CampaignABI from '@/ABI/CampaignABI.json';
import DivarProxyABI from '@/ABI/DivarProxyABI.json';

const INVESTMENT_CONTRACT_ADDRESS = '0x9fc348c0f4f4b1Ad6CaB657a7C519381FC5D3941';

export default function Wallet() {
  const address = useAddress();
  const { contract, isLoading: contractLoading, error: contractError } = useContract(INVESTMENT_CONTRACT_ADDRESS);
  
  // États pour les balances
  const { data: ethBalance, isLoading: ethLoading, error: ethError } = useBalance();
  const { data: wethBalance, isLoading: wethLoading, error: wethError } = useBalance({
    tokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  });
  const { data: usdtBalance, isLoading: usdtLoading, error: usdtError } = useBalance({
    tokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  });

  // Nouveaux états pour les NFTs et les transactions réelles
  const [nftHoldings, setNftHoldings] = useState([]);
  const [walletInfo, setWalletInfo] = useState({
    pnl: '0 USDC',
    investedValue: '0 USDC',
    projectsInvested: 0,
    unlockTime: '',
  });
  const [transactions, setTransactions] = useState([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [transactionError, setTransactionError] = useState(null);

  // Lecture des campagnes
  const { data: campaigns } = useContractRead(
    contract,
    "getAllCampaigns"
  );

  // Fonction pour récupérer les NFTs d'une campagne
  const fetchNFTsForCampaign = async (campaignAddress) => {
    try {
      const campaignContract = await contract.getContract(campaignAddress, CampaignABI);
      const balance = await campaignContract.call("balanceOf", [address]);
      const tokens = [];

      for (let i = 0; i < balance.toNumber(); i++) {
        const tokenId = await campaignContract.call("tokenOfOwnerByIndex", [address, i]);
        const tokenInfo = await campaignContract.call("getNFTInfo", [tokenId]);
        
        const investment = await campaignContract.call("investmentsByAddress", [address, i]);
        tokens.push({
          id: tokenId.toString(),
          round: tokenInfo.round.toString(),
          amount: ethers.utils.formatEther(investment.amount),
          campaign: campaignAddress,
          timestamp: investment.timestamp.toNumber()
        });
      }

      return tokens;
    } catch (error) {
      console.error(`Erreur NFTs:`, error);
      return [];
    }
  };

  // Effet pour les NFTs et le calcul des valeurs
  useEffect(() => {
    async function fetchAllNFTs() {
      if (!campaigns || !address) return;

      try {
        const nftPromises = campaigns.map(fetchNFTsForCampaign);
        const nftResults = await Promise.all(nftPromises);
        const allNFTs = nftResults.flat();

        setNftHoldings(allNFTs);

        // Calcul des valeurs totales
        const totalInvested = allNFTs.reduce((acc, nft) => acc + parseFloat(nft.amount), 0);
        
        setWalletInfo(prev => ({
          ...prev,
          investedValue: `${totalInvested.toFixed(2)} ETH`,
          projectsInvested: new Set(allNFTs.map(nft => nft.campaign)).size
        }));

        // Création des transactions
        const txs = allNFTs.map(nft => ({
          id: nft.id,
          type: 'Achat',
          project: nft.campaign,
          amount: `${nft.amount} ETH`,
          date: new Date(nft.timestamp * 1000).toLocaleDateString()
        }));

        setTransactions(txs);
        setIsLoadingTransactions(false);
      } catch (error) {
        console.error("Erreur lors de la récupération des NFTs:", error);
        setTransactionError("Erreur lors de la récupération des données.");
      }
    }

    fetchAllNFTs();
  }, [campaigns, address]);

  const renderBalance = (balance, loading, error, decimals = 4) => {
    if (loading) return 'Chargement...';
    if (error || !balance) return 'Erreur';
    return parseFloat(balance.displayValue).toFixed(decimals);
  };

  if (contractLoading) {
    return <p>Chargement du contrat...</p>;
  }

  if (contractError) {
    return <p className="text-red-500">Erreur de connexion au contrat: {contractError.message}</p>;
  }

  if (!address) {
    return <p>Veuillez connecter votre portefeuille pour voir votre portefeuille.</p>;
  }

  const renderNFTSection = () => (
    <Card className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-gray-800 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-gray-900 dark:text-gray-100">Vos NFTs</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          {nftHoldings.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">Aucun NFT détenu</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nftHoldings.map((nft) => (
                <div 
                  key={`${nft.campaign}-${nft.id}`}
                  className="p-4 border rounded-lg dark:border-gray-700"
                >
                  <p className="font-medium text-gray-900 dark:text-gray-100">Token #{nft.id}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Round: {nft.round}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Montant: {nft.amount} ETH</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Votre portefeuille</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-gray-800 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">PNL</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{walletInfo.pnl}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-gray-800 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Valeur investie</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{walletInfo.investedValue}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-gray-800 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Projets investis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{walletInfo.projectsInvested}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-gray-800 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Temps avant déblocage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{walletInfo.unlockTime}</p>
          </CardContent>
        </Card>
      </div>

      {/* Token Balances */}
      <Card className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-gray-800 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-900 dark:text-gray-100">Solde des Tokens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 dark:text-gray-300">ETH</span>
            <span className="text-gray-900 dark:text-gray-100">
              {renderBalance(ethBalance, ethLoading, ethError)} ETH
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700 dark:text-gray-300">WETH</span>
            <span className="text-gray-900 dark:text-gray-100">
              {renderBalance(wethBalance, wethLoading, wethError)} WETH
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700 dark:text-gray-300">USDT</span>
            <span className="text-gray-900 dark:text-gray-100">
              {renderBalance(usdtBalance, usdtLoading, usdtError, 2)} USDT
            </span>
          </div>
        </CardContent>
      </Card>

      {/* NFT Section */}
      {renderNFTSection()}

      {/* Transactions Section */}
      <Card className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-gray-800 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-900 dark:text-gray-100">Historique des transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-700 dark:text-gray-300">
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Projet</th>
                  <th className="pb-2">Montant</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingTransactions ? (
                  <tr>
                    <td colSpan="4" className="text-center py-2">Chargement des transactions...</td>
                  </tr>
                ) : transactionError ? (
                  <tr>
                    <td colSpan="4" className="text-center py-2 text-red-500">{transactionError}</td>
                  </tr>
                ) : transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="border-t border-gray-200 dark:border-gray-800">
                      <td className={`py-2 ${tx.type === 'Achat' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {tx.type}
                      </td>
                      <td className="py-2 text-gray-900 dark:text-gray-100">{tx.project}</td>
                      <td className="py-2 text-gray-900 dark:text-gray-100">{tx.amount}</td>
                      <td className="py-2 text-gray-900 dark:text-gray-100">{tx.date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-2">Aucune transaction disponible</td>
                  </tr>
                )}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}