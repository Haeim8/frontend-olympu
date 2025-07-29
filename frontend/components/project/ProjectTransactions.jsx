"use client";

import React, { useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  History,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Calendar,
  Filter,
  Search,
  Download,
  TrendingUp,
  Users,
  Eye,
  Clock
} from 'lucide-react';

const TransactionRow = ({ transaction, index }) => {
  const getTransactionIcon = (type) => {
    switch (type) {
      case 'Achat':
        return <ArrowUpRight className="h-4 w-4 text-green-600" />;
      case 'Remboursement':
        return <ArrowDownRight className="h-4 w-4 text-orange-600" />;
      default:
        return <History className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'Achat':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'Remboursement':
        return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <tr 
      className="border-t border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-900 transition-all duration-200 group"
      style={{
        animationDelay: `${index * 100}ms`,
        animationDuration: '400ms',
        animationFillMode: 'both'
      }}
    >
      <td className="py-4 pl-6">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg border ${getTransactionColor(transaction.type)}`}>
            {getTransactionIcon(transaction.type)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {transaction.type}
              </p>
              <Badge 
                variant="outline" 
                className={`text-xs ${getTransactionColor(transaction.type)}`}
              >
                #{transaction.id}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Block {transaction.id}
            </p>
          </div>
        </div>
      </td>
      
      <td className="py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="h-3 w-3 text-gray-400" />
            <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
              {formatAddress(transaction.investor)}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => navigator.clipboard.writeText(transaction.investor)}
          >
            Copier adresse
          </Button>
        </div>
      </td>
      
      <td className="py-4 text-center">
        <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full">
          <TrendingUp className="h-3 w-3 text-blue-600" />
          <span className="font-semibold text-blue-700 dark:text-blue-300">
            {transaction.nftCount}
          </span>
        </div>
      </td>
      
      <td className="py-4 text-right">
        <div className="space-y-1">
          <p className="font-bold text-lg text-gray-900 dark:text-gray-100">
            {transaction.value} ETH
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            ≈ ${(parseFloat(transaction.value) * 2000).toFixed(2)} USD
          </p>
        </div>
      </td>
      
      <td className="py-4 pr-6">
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-lime-50 dark:hover:bg-lime-900/20"
            onClick={() => window.open(`https://sepolia.basescan.org/tx/${transaction.id}`, '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Basescan
          </Button>
        </div>
      </td>
    </tr>
  );
};

export default function ProjectTransactions({ transactions = [], isLoading }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('block');

  // Filtrage et tri des transactions
  const filteredAndSortedTransactions = React.useMemo(() => {
    let filtered = transactions.filter(tx => {
      const matchesSearch = 
        tx.investor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.id.toString().includes(searchTerm);
      const matchesFilter = filterType === 'all' || tx.type === filterType;
      return matchesSearch && matchesFilter;
    });

    switch (sortBy) {
      case 'value':
        filtered.sort((a, b) => parseFloat(b.value) - parseFloat(a.value));
        break;
      case 'shares':
        filtered.sort((a, b) => parseInt(b.nftCount) - parseInt(a.nftCount));
        break;
      case 'type':
        filtered.sort((a, b) => a.type.localeCompare(b.type));
        break;
      case 'block':
      default:
        filtered.sort((a, b) => b.id - a.id);
    }

    return filtered;
  }, [transactions, searchTerm, filterType, sortBy]);

  // Statistiques
  const stats = React.useMemo(() => {
    const purchases = transactions.filter(tx => tx.type === 'Achat');
    const refunds = transactions.filter(tx => tx.type === 'Remboursement');
    
    return {
      totalTransactions: transactions.length,
      totalPurchases: purchases.length,
      totalRefunds: refunds.length,
      totalVolume: transactions.reduce((sum, tx) => sum + parseFloat(tx.value), 0),
      totalShares: transactions.reduce((sum, tx) => sum + parseInt(tx.nftCount), 0)
    };
  }, [transactions]);

  const exportToCSV = () => {
    const headers = ['Type', 'Investisseur', 'Shares', 'Valeur (ETH)', 'Block'];
    const csvContent = [
      headers.join(','),
      ...filteredAndSortedTransactions.map(tx => [
        tx.type,
        tx.investor,
        tx.nftCount,
        tx.value,
        tx.id
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project_transactions_${Date.now()}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 dark:bg-neutral-800 rounded w-48 animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-neutral-800 rounded w-32 animate-pulse" />
          </div>
          <div className="flex space-x-2">
            <div className="h-10 bg-gray-200 dark:bg-neutral-800 rounded w-32 animate-pulse" />
            <div className="h-10 bg-gray-200 dark:bg-neutral-800 rounded w-24 animate-pulse" />
          </div>
        </div>

        {/* Table skeleton */}
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-neutral-800 rounded-lg">
              <div className="w-10 h-10 bg-gray-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-neutral-800 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 dark:bg-neutral-800 rounded w-2/3 animate-pulse" />
              </div>
              <div className="w-20 h-4 bg-gray-200 dark:bg-neutral-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <History className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Historique des transactions
              </h3>
              <Badge className="bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300">
                {stats.totalTransactions}
              </Badge>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Toutes les transactions blockchain pour ce projet
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors w-48"
              />
            </div>

            {/* Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">Tous types</option>
              <option value="Achat">Achats</option>
              <option value="Remboursement">Remboursements</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="block">Block</option>
              <option value="value">Valeur</option>
              <option value="shares">Shares</option>
              <option value="type">Type</option>
            </select>

            {/* Export */}
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="border-gray-300 dark:border-neutral-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-600 font-medium">Achats</span>
            </div>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {stats.totalPurchases}
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownRight className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-orange-600 font-medium">Remboursements</span>
            </div>
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {stats.totalRefunds}
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600 font-medium">Volume total</span>
            </div>
            <p className="text-xl font-bold text-green-700 dark:text-green-300">
              {stats.totalVolume.toFixed(4)} ETH
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-purple-600 font-medium">Shares total</span>
            </div>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {stats.totalShares}
            </p>
          </div>
        </div>
      </div>

      {/* Transactions table */}
      <div className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl shadow-lg overflow-hidden">
        {filteredAndSortedTransactions.length === 0 ? (
          <div className="text-center py-12">
            <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {searchTerm || filterType !== 'all' ? 'Aucune transaction trouvée' : 'Aucune transaction'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || filterType !== 'all'
                ? 'Essayez de modifier vos filtres de recherche'
                : 'Les transactions d\'investissement apparaîtront ici'
              }
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800">
                <tr>
                  <th className="text-left py-4 pl-6 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Type & Block
                  </th>
                  <th className="text-left py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Investisseur
                  </th>
                  <th className="text-center py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Shares
                  </th>
                  <th className="text-right py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Valeur
                  </th>
                  <th className="text-center py-4 pr-6 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedTransactions.map((transaction, index) => (
                  <TransactionRow
                    key={`${transaction.id}-${transaction.investor}-${index}`}
                    transaction={transaction}
                    index={index}
                  />
                ))}
              </tbody>
            </table>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}