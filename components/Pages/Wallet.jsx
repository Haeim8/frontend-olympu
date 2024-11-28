'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAddress, useBalance, useContract, useContractRead, useContractEvents } from '@thirdweb-dev/react';
import { ethers } from 'ethers';
import CampaignABI from '@/ABI/CampaignABI.json';
import DivarProxyABI from '@/ABI/DivarProxyABI.json';


const INVESTMENT_CONTRACT_ADDRESS = '0x9fc348c0f4f4b1Ad6CaB657a7C519381FC5D3941';

export default function Wallet({ address }) {
  const [nftHoldings, setNftHoldings] = useState([]);
  const [walletInfo, setWalletInfo] = useState({
    pnl: '0',
    investedValue: '0 ETH',
    projectsInvested: 0,
    unlockTime: '0 ETH',
  });
  const [transactions, setTransactions] = useState([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [transactionError, setTransactionError] = useState(null);

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const contract = new ethers.Contract(INVESTMENT_CONTRACT_ADDRESS, DivarProxyABI, provider);

  const fetchNFTsForCampaign = async (campaignAddress) => {
    try {
      const campaignContract = new ethers.Contract(campaignAddress, CampaignABI, provider);
      const balance = await campaignContract.balanceOf(address);
      
      if (balance.toNumber() === 0) return [];

      const tokens = [];
      for (let i = 0; i < balance.toNumber(); i++) {
        const tokenId = await campaignContract.tokenOfOwnerByIndex(address, i);
        const investment = await campaignContract.investmentsByAddress(address, tokenId);
        const dividends = await campaignContract.getDividends(tokenId);
        
        tokens.push({
          id: tokenId.toString(),
          amount: ethers.utils.formatEther(investment.amount),
          dividends: ethers.utils.formatEther(dividends),
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

  useEffect(() => {
    if (!address) return;

    let mounted = true;

    async function fetchAllNFTs() {
      try {
        const campaigns = await contract.getAllCampaigns();
        
        if (!mounted) return;

        const allNFTs = [];
        for (const campaign of campaigns) {
          const tokens = await fetchNFTsForCampaign(campaign);
          allNFTs.push(...tokens);
        }

        if (!mounted) return;

        const totalInvested = allNFTs.reduce((sum, nft) => sum + Number(nft.amount), 0);
        const totalDividends = allNFTs.reduce((sum, nft) => sum + Number(nft.dividends), 0);
        
        setNftHoldings(allNFTs);
        setWalletInfo({
          pnl: String(allNFTs.length),
          investedValue: `${totalInvested.toFixed(4)} ETH`,
          projectsInvested: new Set(allNFTs.map(nft => nft.campaign)).size,
          unlockTime: `${totalDividends.toFixed(4)} ETH`
        });

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
        console.error("Erreur:", error);
        if (mounted) {
          setTransactionError(error.message);
          setIsLoadingTransactions(false);
        }
      }
    }

    fetchAllNFTs();
    return () => mounted = false;
  }, [address]);

  const renderNFTSection = () => (
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
              {nftHoldings.map((nft) => (
                <div 
                  key={`${nft.campaign}-${nft.id}`}
                  className="p-1 border rounded-lg dark:border-gray-900"
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
    <div className="space-y-4">
      <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Votre portefeuille</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-gray-950 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre de nft </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{walletInfo.pnl}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-gray-950 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Valeur investie</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{walletInfo.investedValue}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-gray-950 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Projets soutenue </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{walletInfo.projectsInvested}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-gray-950 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">dividende percus</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{walletInfo.unlockTime}</p>
          </CardContent>
        </Card>
      </div>

      {/* NFT Section */}
      {renderNFTSection()}

      {/* Transactions Section */}
      <Card className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-gray-950 shadow-md">
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
                    <td colSpan="4" className="text-center py-4">Chargement des transactions...</td>
                  </tr>
                ) : transactionError ? (
                  <tr>
                    <td colSpan="4" className="text-center py-2 text-red-500">{transactionError}</td>
                  </tr>
                ) : transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="border-t border-gray-200 dark:border-gray-950">
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
                    <td colSpan="6" className="text-center py-4">Aucune transaction disponible</td>
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