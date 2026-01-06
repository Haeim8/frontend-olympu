"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Search, Filter, ExternalLink, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { apiManager } from '@/lib/services/api-manager';

export default function TransactionHistory({ campaignAddress, onPreloadHover }) {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  const loadTransactions = useCallback(async () => {
    if (!campaignAddress) return;

    try {
      setIsLoading(true);
      setError(null);

      const transactionData = await apiManager.getCampaignTransactions(campaignAddress);
      setTransactions(transactionData || []);

    } catch (err) {
      console.error('Erreur chargement transactions:', err);
      setError(t('transactionHistory.errorLoading'));
    } finally {
      setIsLoading(false);
    }
  }, [campaignAddress, t]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const filteredAndSortedTransactions = () => {
    let filtered = Array.isArray(transactions) ? transactions : [];

    if (filter !== 'all') {
      filtered = filtered.filter(tx =>
        filter === 'buy' ? tx.type === t('transactionHistory.buy') : tx.type === t('transactionHistory.refund')
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
    return type === t('transactionHistory.buy') ?
      <div className="bg-green-500/20 p-1.5 rounded-full text-green-500"><ArrowUpRight className="h-3.5 w-3.5" /></div> :
      <div className="bg-red-500/20 p-1.5 rounded-full text-red-500"><ArrowDownLeft className="h-3.5 w-3.5" /></div>;
  };

  const getTransactionBadge = (type) => {
    return type === t('transactionHistory.buy') ?
      <span className="text-green-400 font-bold text-xs uppercase tracking-wider">{t('transactionHistory.buy', 'ACHAT')}</span> :
      <span className="text-red-400 font-bold text-xs uppercase tracking-wider">{t('transactionHistory.refund', 'REMBOURSEMENT')}</span>;
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getTransactionStats = () => {
    const txArray = Array.isArray(transactions) ? transactions : [];

    const totalTransactions = txArray.length;
    const purchases = txArray.filter(tx => tx.type === t('transactionHistory.buy')).length;
    const refunds = txArray.filter(tx => tx.type === t('transactionHistory.refund')).length;
    const totalVolume = txArray.reduce((sum, tx) => sum + parseFloat(tx.value || 0), 0);

    return { totalTransactions, purchases, refunds, totalVolume };
  };

  const stats = getTransactionStats();

  if (error) {
    return (
      <Card className="glass-card border-red-500/20">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={loadTransactions} variant="outline" className="border-red-500/20 hover:bg-red-500/10 text-red-400">
              {t('transactionHistory.retry', 'Réessayer')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-border shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <BarChart className="h-5 w-5 text-primary" />
              {t('transactionHistory.title', 'Historique des Transactions')}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {t('transactionHistory.subtitle', 'Suivi en temps réel des mouvements financiers.')}
            </p>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 backdrop-blur-md">
            {stats.totalTransactions} Txns
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats rapides */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-muted/20 border border-border/50 hover:border-green-500/20 transition-all group">
            <p className="text-2xl font-bold text-white group-hover:text-green-400 transition-colors">
              {stats.purchases}
            </p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground">{t('transactionHistory.purchases', 'Achats')}</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/20 border border-border/50 hover:border-red-500/20 transition-all group">
            <p className="text-2xl font-bold text-white group-hover:text-red-400 transition-colors">
              {stats.refunds}
            </p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground">{t('transactionHistory.refunds', 'Remboursements')}</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/20 border border-border/50 hover:border-primary/20 transition-all group">
            <p className="text-2xl font-bold text-white group-hover:text-primary transition-colors font-mono">
              {stats.totalVolume.toFixed(4)} <span className="text-sm text-muted-foreground">ETH</span>
            </p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground">{t('transactionHistory.totalETH', 'Volume Total')}</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/20 border border-border/50 hover:border-blue-500/20 transition-all group">
            <p className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
              {Array.isArray(transactions) ? new Set(transactions.map(tx => tx.investor)).size : 0}
            </p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground">{t('transactionHistory.uniqueInvestors', 'Investisseurs Uniques')}</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('transactionHistory.searchPlaceholder', 'Rechercher par adresse...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted/30 border-input/50 focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[140px] bg-muted/30 border-input/50 text-foreground">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-card border-border text-foreground">
                <SelectItem value="all">{t('transactionHistory.filterAll', 'Tout')}</SelectItem>
                <SelectItem value="buy">{t('transactionHistory.filterBuy', 'Achats')}</SelectItem>
                <SelectItem value="refund">{t('transactionHistory.filterRefund', 'Remboursements')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px] bg-muted/30 border-input/50 text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-card border-border text-foreground">
                <SelectItem value="recent">{t('transactionHistory.sortRecent', 'Plus récents')}</SelectItem>
                <SelectItem value="oldest">{t('transactionHistory.sortOldest', 'Plus anciens')}</SelectItem>
                <SelectItem value="amount_high">{t('transactionHistory.sortHighAmount', 'Montant: Haut')}</SelectItem>
                <SelectItem value="amount_low">{t('transactionHistory.sortLowAmount', 'Montant: Bas')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table des transactions */}
        <div className="rounded-xl border border-border/50 overflow-hidden bg-background/20 backdrop-blur-sm">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 backdrop-blur-md z-10">
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-bold text-xs uppercase w-[150px] pl-4">{t('transactionHistory.type', 'Type')}</TableHead>
                  <TableHead className="text-muted-foreground font-bold text-xs uppercase">{t('transactionHistory.investor', 'Investisseur')}</TableHead>
                  <TableHead className="text-muted-foreground font-bold text-xs uppercase text-right">{t('transactionHistory.nfts', 'Parts')}</TableHead>
                  <TableHead className="text-muted-foreground font-bold text-xs uppercase text-right">{t('transactionHistory.amount', 'Montant (ETH)')}</TableHead>
                  <TableHead className="text-muted-foreground font-bold text-xs uppercase text-right">{t('transactionHistory.block', 'Block #')}</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i} className="border-border/30">
                      <TableCell><div className="h-6 w-24 bg-muted/50 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-6 w-32 bg-muted/50 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-6 w-12 bg-muted/50 rounded animate-pulse ml-auto"></div></TableCell>
                      <TableCell><div className="h-6 w-20 bg-muted/50 rounded animate-pulse ml-auto"></div></TableCell>
                      <TableCell><div className="h-6 w-16 bg-muted/50 rounded animate-pulse ml-auto"></div></TableCell>
                      <TableCell><div className="h-8 w-8 bg-muted/50 rounded animate-pulse"></div></TableCell>
                    </TableRow>
                  ))
                ) : filteredAndSortedTransactions().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                      {searchTerm || filter !== 'all' ? t('transactionHistory.noTransactionsFiltered', 'Aucune transaction trouvée pour ces filtres') : t('transactionHistory.noTransactions', 'Aucune transaction enregistrée')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedTransactions().map((tx, index) => (
                    <TableRow
                      key={`${tx.id}-${index}`}
                      className="hover:bg-muted/30 transition-colors border-border/30 group"
                      onMouseEnter={() => onPreloadHover && onPreloadHover(tx.investor)}
                    >
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(tx.type)}
                          {getTransactionBadge(tx.type)}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-foreground opacity-80 group-hover:opacity-100 transition-opacity">
                        {formatAddress(tx.investor)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-foreground">
                        {tx.nftCount}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-foreground">
                        {parseFloat(tx.value).toFixed(6)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground font-mono text-xs">
                        #{tx.id}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(`https://sepolia.basescan.org/tx/${tx.id}`, '_blank')}
                          className="h-8 w-8 hover:bg-blue-500/20 hover:text-blue-400 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all"
                          title="Voir sur Etherscan"
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
        </div>

        {filteredAndSortedTransactions().length > 0 && (
          <div className="text-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadTransactions}
              className="text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              {t('transactionHistory.refresh', 'Rafraîchir les données')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
