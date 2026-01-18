"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from '@/hooks/useLanguage';
import {
  History,
  Search,
  Filter,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  TrendingUp,
  Download,
  Eye
} from 'lucide-react';
import config from '@/lib/config';

const TransactionRow = ({ transaction, index }) => {
  const { t } = useTranslation();
  
  const getTransactionIcon = (type) => {
    switch (type) {
      case t('wallet.transaction.investment'):
        return <ArrowUpRight className="h-4 w-4 text-lime-600" />;
      case t('wallet.transaction.dividend'):
        return <TrendingUp className="h-4 w-4 text-lime-600" />;
      case t('wallet.transaction.withdrawal'):
        return <ArrowDownRight className="h-4 w-4 text-orange-600" />;
      default:
        return <History className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case t('wallet.transaction.investment'):
        return 'text-lime-600 bg-lime-50 dark:bg-lime-900/20';
      case t('wallet.transaction.dividend'):
        return 'text-lime-600 bg-lime-50 dark:bg-lime-900/20';
      case t('wallet.transaction.withdrawal'):
        return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  return (
    <tr 
      className="border-t border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors group"
      style={{
        animationDelay: `${index * 50}ms`,
        animationDuration: '300ms',
        animationFillMode: 'both'
      }}
    >
      <td className="py-4 pl-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${getTransactionColor(transaction.type)}`}>
            {getTransactionIcon(transaction.type)}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {transaction.type}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ID: {transaction.id.slice(0, 8)}...
            </p>
          </div>
        </div>
      </td>
      
      <td className="py-4">
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {transaction.project}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('wallet.transaction.campaign')}
          </p>
        </div>
      </td>
      
      <td className="py-4">
        <div className="text-right">
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {transaction.amount}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {transaction.type === t('wallet.investment') ? t('wallet.transaction.invested') : t('wallet.transaction.received')}
          </p>
        </div>
      </td>
      
      <td className="py-4">
        <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="h-3 w-3" />
          <span>{transaction.date}</span>
        </div>
      </td>
      
      <td className="py-4 pr-4">
        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => window.open(config.helpers.getExplorerAddressUrl(transaction.txHash), '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            {t('wallet.transaction.view')}
          </Button>
        </div>
      </td>
    </tr>
  );
};

export default function TransactionHistory({ transactions, isLoading }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  // Get unique transaction types
  const transactionTypes = [...new Set(transactions.map(tx => tx.type))];

  // Filter and sort transactions
  const filteredAndSortedTransactions = React.useMemo(() => {
    let filtered = transactions.filter(tx => {
      const matchesSearch = tx.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tx.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || tx.type === filterType;
      return matchesSearch && matchesFilter;
    });

    switch (sortBy) {
      case 'amount':
        filtered.sort((a, b) => {
          const amountA = parseFloat(a.amount.replace(/[^\d.-]/g, ''));
          const amountB = parseFloat(b.amount.replace(/[^\d.-]/g, ''));
          return amountB - amountA;
        });
        break;
      case 'project':
        filtered.sort((a, b) => a.project.localeCompare(b.project));
        break;
      case 'type':
        filtered.sort((a, b) => a.type.localeCompare(b.type));
        break;
      case 'date':
      default:
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    return filtered;
  }, [transactions, searchTerm, filterType, sortBy]);

  const totalInvested = transactions
    .filter(tx => tx.type === t('wallet.transaction.investment'))
    .reduce((sum, tx) => sum + parseFloat(tx.amount.replace(/[^\d.-]/g, '')), 0);

  const totalDividends = transactions
    .filter(tx => tx.type === t('wallet.transaction.dividend'))
    .reduce((sum, tx) => sum + parseFloat(tx.amount.replace(/[^\d.-]/g, '')), 0);

  const exportToCSV = () => {
    const headers = [t('wallet.transaction.typeHeader'), t('wallet.transaction.projectHeader'), t('wallet.transaction.amountHeader'), t('wallet.transaction.dateHeader'), 'Hash'];
    const csvContent = [
      headers.join(','),
      ...filteredAndSortedTransactions.map(tx => [
        tx.type,
        tx.project,
        tx.amount,
        tx.date,
        tx.txHash
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
  };

  return (
    <Card className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <History className="h-5 w-5 text-lime-600" />
              {t('wallet.transaction.title')}
              <Badge className="bg-lime-100 dark:bg-lime-900/20 text-lime-700 dark:text-lime-300">
                {transactions.length}
              </Badge>
            </CardTitle>
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {t('wallet.transaction.totalInvested')}: <span className="font-semibold text-lime-600">{totalInvested.toFixed(4)} ETH</span>
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {t('wallet.transaction.dividends')}: <span className="font-semibold text-lime-600">{totalDividends.toFixed(4)} ETH</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('wallet.transaction.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-colors w-48"
              />
            </div>

            {/* Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-lime-500 focus:border-transparent"
            >
              <option value="all">{t('wallet.transaction.allTypes')}</option>
              {transactionTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-lime-500 focus:border-transparent"
            >
              <option value="date">{t('wallet.transaction.sortDate')}</option>
              <option value="amount">{t('wallet.transaction.sortAmount')}</option>
              <option value="project">{t('wallet.transaction.sortProject')}</option>
              <option value="type">{t('wallet.transaction.sortType')}</option>
            </select>

            {/* Export */}
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="border-gray-300 dark:border-neutral-700"
            >
              <Download className="h-4 w-4 mr-2" />
              {t('wallet.transaction.export')}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
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
        ) : filteredAndSortedTransactions.length === 0 ? (
          <div className="text-center py-12">
            <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {searchTerm || filterType !== 'all' ? t('wallet.transaction.noTransactionsFound') : t('wallet.transaction.noTransactions')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || filterType !== 'all'
                ? t('wallet.transaction.tryModifyFilters')
                : t('wallet.transaction.transactionsWillAppear')
              }
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-neutral-900">
                <tr>
                  <th className="text-left py-3 pl-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t('wallet.transaction.typeHeader')}
                  </th>
                  <th className="text-left py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t('wallet.transaction.projectHeader')}
                  </th>
                  <th className="text-right py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t('wallet.transaction.amountHeader')}
                  </th>
                  <th className="text-left py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t('wallet.transaction.dateHeader')}
                  </th>
                  <th className="text-center py-3 pr-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t('wallet.transaction.actionHeader')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedTransactions.map((transaction, index) => (
                  <TransactionRow
                    key={`${transaction.id}-${index}`}
                    transaction={transaction}
                    index={index}
                  />
                ))}
              </tbody>
            </table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}