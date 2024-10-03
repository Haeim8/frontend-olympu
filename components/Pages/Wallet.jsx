import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAccount, useBalance } from 'wagmi';
import { formatUnits } from 'ethers/lib/utils';

export default function Wallet() {
  const { address } = useAccount();

  // Hooks pour les balances
  const ethBalance = useBalance({
    address: address,
    watch: true,
  });

  const wethBalance = useBalance({
    address: address,
    token: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // Adresse WETH Mainnet
    watch: true,
  });

  const usdtBalance = useBalance({
    address: address,
    token: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // Adresse USDT Mainnet
    watch: true,
  });

  const walletInfo = {
    pnl: "+500 USDC",
    investedValue: "2000 USDC",
    projectsInvested: 5,
    unlockTime: "30 jours"
  };

  const transactions = [
    { id: 1, type: 'Achat', project: 'Projet A', amount: '100 USDC', date: '2023-09-01' },
    { id: 2, type: 'Vente', project: 'Projet B', amount: '50 USDC', date: '2023-09-15' },
    { id: 3, type: 'Achat', project: 'Projet C', amount: '200 USDC', date: '2023-09-30' },
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Votre portefeuille</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">PNL</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{walletInfo.pnl}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Valeur investie</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{walletInfo.investedValue}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Projets investis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{walletInfo.projectsInvested}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Temps avant déblocage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{walletInfo.unlockTime}</p>
          </CardContent>
        </Card>
      </div>
      <Card className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-900 dark:text-gray-100">Solde des Tokens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 dark:text-gray-300">ETH</span>
            <span className="text-gray-900 dark:text-gray-100">
              {ethBalance.isLoading ? '...' : ethBalance.data ? parseFloat(formatUnits(ethBalance.data.value, ethBalance.data.decimals)).toFixed(4) : '0.0000'} ETH
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700 dark:text-gray-300">WETH</span>
            <span className="text-gray-900 dark:text-gray-100">
              {wethBalance.isLoading ? '...' : wethBalance.data ? parseFloat(formatUnits(wethBalance.data.value, wethBalance.data.decimals)).toFixed(4) : '0.0000'} WETH
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700 dark:text-gray-300">USDT</span>
            <span className="text-gray-900 dark:text-gray-100">
              {usdtBalance.isLoading ? '...' : usdtBalance.data ? parseFloat(formatUnits(usdtBalance.data.value, usdtBalance.data.decimals)).toFixed(2) : '0.00'} USDT
            </span>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-md">
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
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-t border-gray-200 dark:border-gray-800">
                    <td className={`py-2 ${tx.type === 'Achat' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{tx.type}</td>
                    <td className="py-2 text-gray-900 dark:text-gray-100">{tx.project}</td>
                    <td className="py-2 text-gray-900 dark:text-gray-100">{tx.amount}</td>
                    <td className="py-2 text-gray-900 dark:text-gray-100">{tx.date}</td>
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