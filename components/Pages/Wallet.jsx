'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAddress } from '@thirdweb-dev/react';
import { ethers } from 'ethers';
import CampaignABI from '@/ABI/CampaignABI.json';
import DivarProxyABI from '@/ABI/DivarProxyABI.json';

const INVESTMENT_CONTRACT_ADDRESS = '0x9fc348c0f4f4b1Ad6CaB657a7C519381FC5D3941';
const PROVIDER_URL = `https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;
const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);
const BATCH_SIZE = 30;
const BATCH_DELAY = 450;
const campaignCache = new Map();

export default function Wallet() {
  const address = useAddress();
  const [nftHoldings, setNftHoldings] = useState([]);
  const [walletInfo, setWalletInfo] = useState({
    totalNFTs: 0,
    totalInvested: '0',
    activeProjects: 0,
    totalDividends: '0'
  });
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  
  

  useEffect(() => {
    if (!address) return;
  
    let isMounted = true;
  
    async function fetchData() {
      try {
        if (isMounted) {
          setIsLoading(true);
          setError(null);
          setNftHoldings([]);
          setTransactions([]);
          setWalletInfo({
            totalNFTs: 0,
            totalInvested: '0',
            activeProjects: 0,
            totalDividends: '0'
          });
        }
  
        const proxyContract = new ethers.Contract(INVESTMENT_CONTRACT_ADDRESS, DivarProxyABI, provider);
        const campaigns = await proxyContract.getAllCampaigns();
        
        let totalNFTs = [];
        
        for (let i = 0; i < campaigns.length; i += BATCH_SIZE) {
          if (!isMounted) return;
  
          const batch = campaigns.slice(i, i + BATCH_SIZE);
          
          const batchResults = await Promise.all(
            batch.map(async (campaignAddress) => {
              try {
                // Utiliser le cache correctement
                if (campaignCache.has(campaignAddress)) {
                  const cachedNFTs = campaignCache.get(campaignAddress);
                  totalNFTs.push(...cachedNFTs);
                  return;
                }
  
                const campaignContract = new ethers.Contract(campaignAddress, CampaignABI, provider);
                const balance = await campaignContract.balanceOf(address);
                
                if (balance.toNumber() > 0) {
                  const [investments, campaignInfo] = await Promise.all([
                    campaignContract.getInvestments(address),
                    proxyContract.campaignRegistry(campaignAddress)
                  ]);
                  
                  const nfts = investments.map(inv => ({
                    id: `${campaignAddress}-${inv.tokenIds[0].toString()}`,
                    amount: ethers.utils.formatEther(inv.amount),
                    shares: inv.shares.toString(),
                    campaign: campaignInfo.name || campaignAddress.slice(0, 6),
                    timestamp: inv.timestamp.toNumber(),
                    txHash: campaignAddress
                  }));
  
                  campaignCache.set(campaignAddress, nfts);
                  totalNFTs.push(...nfts);
                }
              } catch (e) {
                console.warn(`Erreur pour la campagne ${campaignAddress}:`, e);
              }
            })
          );
  
          if (isMounted) {
            setNftHoldings([...totalNFTs]);
            updateWalletInfo([...totalNFTs]);
            updateTransactions([...totalNFTs]);
          }
  
          if (i + BATCH_SIZE < campaigns.length) {
            await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
          }
        }
  
      } catch (error) {
        if (isMounted) {
          console.error('Error:', error);
          setError(error.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
  
    fetchData();
  
    return () => {
      isMounted = false;
    };
  }, [address]);
  
  const updateWalletInfo = (nfts) => {
    setWalletInfo({
      totalNFTs: nfts.reduce((acc, nft) => acc + parseInt(nft.shares), 0),
      totalInvested: nfts.reduce((acc, nft) => acc + parseFloat(nft.amount), 0).toFixed(4),
      activeProjects: new Set(nfts.map(nft => nft.campaign)).size,
      totalDividends: "0"
    });
  };
  
  const updateTransactions = (nfts) => {
    setTransactions(nfts.map((nft, index) => ({
      id: `${nft.id}-${index}`,
      type: 'Investment',
      project: nft.campaign,
      amount: `${nft.amount} ETH`,
      date: new Date(nft.timestamp * 1000).toLocaleDateString(),
      txHash: nft.txHash
    })));
  };

  if (!address) {
    return <p>Please connect your wallet</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Votre portefeuille</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-gray-950 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre de NFT</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{walletInfo.totalNFTs}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-gray-950 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Valeur investie</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{walletInfo.totalInvested} ETH</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-gray-950 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Projets soutenus</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{walletInfo.activeProjects}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-gray-950 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Dividendes perçus</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{walletInfo.totalDividends} ETH</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-gray-950 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-900 dark:text-gray-100">Vos NFTs</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            {nftHoldings.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">Aucun NFT détenu</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {nftHoldings.map((nft, index) => (
  <div 
    key={`${nft.id}-${nft.campaign}-${index}`}
    className="p-4 border rounded-lg dark:border-gray-900"
  >
    <p className="font-medium text-gray-900 dark:text-gray-100">Token {nft.id}</p>
    <p className="text-sm text-gray-600 dark:text-gray-400">Montant: {nft.amount} ETH</p>
    <p className="text-sm text-gray-600 dark:text-gray-400">Dividendes: {nft.dividends} ETH</p>
  </div>
))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-gray-950 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-900 dark:text-gray-100">Historique des transactions</CardTitle>
        </CardHeader>
        <CardContent>
         <ScrollArea className="h-[200px]">
  <table className="w-full">
    <thead>
      <tr>
      <th className="pb-2">Type</th>
      <th className="pb-2">Projet</th>
      <th className="pb-2">Montant</th>
      <th className="pb-2">Date</th>
      <th className="pb-2">Transaction</th>
      </tr>
    </thead>
    <tbody>
      {transactions.map((tx, index) => (
        <tr key={`transaction-${tx.txHash}-${index}`} className="border-t border-gray-200 dark:border-gray-950">
          <td className="py-2 text-green-600 dark:text-green-400">{tx.type}</td>
          <td className="py-2 text-gray-900 dark:text-gray-100">{tx.project}</td>
          <td className="py-2 text-gray-900 dark:text-gray-100">{tx.amount}</td>
          <td className="py-2 text-gray-900 dark:text-gray-100">{tx.date}</td>
          <td className="py-2">
            <a 
              href={`https://sepolia.basescan.org/address/${tx.txHash}`}
              target="_blank"
              rel="noopener noreferrer" 
              className="text-lime-500 hover:text-lime-600"
            >Voir</a>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}