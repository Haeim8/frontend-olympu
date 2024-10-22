//frontend/components/pages/wallet.jsx
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAddress, useBalance, useContract, useContractRead, useContractEvents } from '@thirdweb-dev/react'; // Importation des hooks Thirdweb
import { ethers } from 'ethers'; // Utilisation de ethers pour formater les unités

const INVESTMENT_CONTRACT_ADDRESS = '0xF334d4CEcB73bc95e032949b9437A1eE6D4C6019'; // Remplacez par l'adresse réelle de votre contrat

export default function Wallet() {
  const address = useAddress(); // Récupérer l'adresse du portefeuille de l'utilisateur
  const { contract, isLoading: contractLoading, error: contractError } = useContract(INVESTMENT_CONTRACT_ADDRESS);
  
  // État pour les balances
  const { data: ethBalance, isLoading: ethLoading, error: ethError } = useBalance();
  const { data: wethBalance, isLoading: wethLoading, error: wethError } = useBalance({
    tokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // Adresse WETH Mainnet (vérifiez pour Sepolia)
  });
  const { data: usdtBalance, isLoading: usdtLoading, error: usdtError } = useBalance({
    tokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // Adresse USDT Mainnet (vérifiez pour Sepolia)
  });

  // État pour les informations de portefeuille
  const [walletInfo, setWalletInfo] = useState({
    pnl: '0 USDC',
    investedValue: '0 USDC',
    projectsInvested: 0,
    unlockTime: '',
  });

  // État pour les transactions
  const [transactions, setTransactions] = useState([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [transactionError, setTransactionError] = useState(null);

  // Utiliser useContractRead pour lire les investissements de l'utilisateur
  const { data: userInvestments, isLoading: investmentsLoading, error: investmentsError, refetch: refetchInvestments } = useContractRead(
    contract,
    "getUserInvestments",
    [address]
  );

  // Écouter les événements de transactions pour rafraîchir les données en temps réel
  useContractEvents(contract, "InvestmentMade", {
    filters: { user: address },
    listener: (event) => {
      console.log("Nouvelle transaction détectée:", event);
      refetchInvestments();
    }
  });

  // Mettre à jour les informations du portefeuille lorsque les investissements sont chargés
  useEffect(() => {
    if (userInvestments) {
      try {
        const totalInvested = userInvestments.reduce((acc, project) => acc + parseFloat(ethers.utils.formatEther(project.amountInvested)), 0);
        const pnl = userInvestments.reduce((acc, project) => acc + parseFloat(ethers.utils.formatEther(project.profitOrLoss)), 0);
        const unlockTime = Math.max(...userInvestments.map(project => project.unlockTime.toNumber()), 0);
        
        setWalletInfo({
          pnl: `${pnl.toFixed(2)} USDC`,
          investedValue: `${totalInvested.toFixed(2)} USDC`,
          projectsInvested: userInvestments.length,
          unlockTime: unlockTime > 0 ? `${Math.ceil((unlockTime - Math.floor(Date.now() / 1000)) / 86400)} jours` : 'N/A',
        });

        // Formater les transactions
        const formattedTransactions = userInvestments.flatMap(project => project.transactions.map(tx => ({
          id: tx.id,
          type: tx.type,
          project: project.name,
          amount: `${ethers.utils.formatEther(tx.amount)} USDC`,
          date: new Date(tx.timestamp.toNumber() * 1000).toLocaleDateString(),
        })));

        setTransactions(formattedTransactions);
        setIsLoadingTransactions(false);
      } catch (error) {
        console.error("Erreur lors du traitement des investissements:", error);
        setTransactionError("Erreur lors de la récupération des transactions.");
        setIsLoadingTransactions(false);
      }
    }
  }, [userInvestments]);

  const renderBalance = (balance, loading, error, decimals = 4) => {
    if (loading) return 'Chargement...';
    if (error || !balance) return 'Erreur';
    return parseFloat(ethers.utils.formatUnits(balance.value, balance.decimals)).toFixed(decimals);
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

  return (
    <div className="space-y-8">
      <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Votre portefeuille</h2>
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
