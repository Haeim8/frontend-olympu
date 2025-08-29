"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Search, Filter, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import { apiManager } from '@/lib/services/api-manager';

export default function TransactionHistory({ campaignAddress, onPreloadHover }) {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    loadTransactions();
  }, [campaignAddress]);

  const loadTransactions = async () => {
    if (!campaignAddress) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const transactionData = await apiManager.getCampaignTransactions(campaignAddress);
      setTransactions(transactionData || []);
      
    } catch (err) {
      console.error('Erreur chargement transactions:', err);
      setError('Impossible de charger l\'historique des transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedTransactions = () => {
    // Vérifier que transactions est bien un array
    let filtered = Array.isArray(transactions) ? transactions : [];

    if (filter !== 'all') {
      filtered = filtered.filter(tx => 
        filter === 'buy' ? tx.type === 'Achat' : tx.type === 'Remboursement'
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(tx => 
        tx.investor.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return b.id - a.id;
        case 'oldest':
          return a.id - b.id;
        case 'amount_high':
          return parseFloat(b.value) - parseFloat(a.value);
        case 'amount_low':
          return parseFloat(a.value) - parseFloat(b.value);
        default:
          return b.id - a.id;
      }
    });
  };

  const getTransactionIcon = (type) => {
    return type === 'Achat' ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getTransactionBadge = (type) => {
    return type === 'Achat' ? 
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        Achat
      </Badge> : 
      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
        Remboursement
      </Badge>;
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getTransactionStats = () => {
    // Vérifier que transactions est bien un array
    const txArray = Array.isArray(transactions) ? transactions : [];
    
    const totalTransactions = txArray.length;
    const purchases = txArray.filter(tx => tx.type === 'Achat').length;
    const refunds = txArray.filter(tx => tx.type === 'Remboursement').length;
    const totalVolume = txArray.reduce((sum, tx) => sum + parseFloat(tx.value || 0), 0);

    return { totalTransactions, purchases, refunds, totalVolume };
  };

  const stats = getTransactionStats();

  if (error) {
    return (
      <Card className="bg-white dark:bg-neutral-950 border-0 dark:border-0">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={loadTransactions} variant="outline">
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-neutral-950 border-0 dark:border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart className="h-5 w-5 text-blue-500" />
            Historique des Transactions
          </div>
          <Badge variant="outline" className="text-sm">
            {stats.totalTransactions} transactions
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stats rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 dark:bg-neutral-900 rounded-lg">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.purchases}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Achats</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-neutral-900 rounded-lg">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.refunds}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Remboursements</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-neutral-900 rounded-lg">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalVolume.toFixed(4)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">ETH Total</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-neutral-900 rounded-lg">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {Array.isArray(transactions) ? new Set(transactions.map(tx => tx.investor)).size : 0}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Investisseurs uniques</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par adresse..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-50 dark:bg-neutral-900"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full md:w-48 bg-gray-50 dark:bg-neutral-900">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les transactions</SelectItem>
              <SelectItem value="buy">Achats uniquement</SelectItem>
              <SelectItem value="refund">Remboursements uniquement</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-48 bg-gray-50 dark:bg-neutral-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Plus récent</SelectItem>
              <SelectItem value="oldest">Plus ancien</SelectItem>
              <SelectItem value="amount_high">Montant décroissant</SelectItem>
              <SelectItem value="amount_low">Montant croissant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table des transactions */}
        <ScrollArea className="h-[400px] rounded-lg border border-gray-200 dark:border-gray-700">
          <Table>
            <TableHeader className="sticky top-0 bg-gray-50 dark:bg-neutral-900">
              <TableRow>
                <TableHead className="text-gray-700 dark:text-gray-300 font-medium">{t('transactionHistory.type')}</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300 font-medium">{t('transactionHistory.investor')}</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300 font-medium">{t('transactionHistory.nfts')}</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300 font-medium">{t('transactionHistory.amount')}</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300 font-medium">{t('transactionHistory.block')}</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300 font-medium">{t('transactionHistory.action')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div></TableCell>
                  </TableRow>
                ))
              ) : filteredAndSortedTransactions().length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 dark:text-gray-400 py-8">
                    {searchTerm || filter !== 'all' ? t('transactionHistory.noTransactionsFiltered') : t('transactionHistory.noTransactions')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedTransactions().map((tx, index) => (
                  <TableRow 
                    key={`${tx.id}-${index}`}
                    className="hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors duration-150"
                    onMouseEnter={() => onPreloadHover && onPreloadHover(tx.investor)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(tx.type)}
                        {getTransactionBadge(tx.type)}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-900 dark:text-gray-100 font-mono">
                      {formatAddress(tx.investor)}
                    </TableCell>
                    <TableCell className="text-gray-900 dark:text-gray-100 font-semibold">
                      {tx.nftCount}
                    </TableCell>
                    <TableCell className="text-gray-900 dark:text-gray-100 font-semibold">
                      {parseFloat(tx.value).toFixed(6)} ETH
                    </TableCell>
                    <TableCell className="text-gray-500 dark:text-gray-400 font-mono text-sm">
                      #{tx.id}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`https://sepolia.basescan.org/tx/${tx.id}`, '_blank')}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>

        {filteredAndSortedTransactions().length > 0 && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={loadTransactions}
              className="text-gray-600 dark:text-gray-400"
            >
              Actualiser les données
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}