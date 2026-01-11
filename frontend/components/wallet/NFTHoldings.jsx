"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from '@/hooks/useLanguage';
import {
  Award,
  Search,
  TrendingUp,
  ExternalLink,
  Calendar,
  DollarSign,
  Eye,
  Grid3x3,
  List
} from 'lucide-react';

const NFTCard = ({ nft, onViewDetails }) => {
  const { t } = useTranslation();

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const progressPercentage = nft.dividends ?
    (parseFloat(nft.dividends) / parseFloat(nft.amount)) * 100 : 0;

  return (
    <div className="group bg-card border border-border rounded-2xl shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 overflow-hidden relative flex flex-col h-full">
      {/* Header with token info */}
      <div className="p-4 pb-3 flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center border border-primary/10">
            <Award className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-bold text-foreground text-sm">
              {t('wallet.nft.token', { id: nft.id.split('-').pop() }, `Token #${nft.id.split('-').pop()}`)}
            </h4>
            <p className="text-xs text-muted-foreground font-medium truncate max-w-[120px]">
              {nft.campaign}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="bg-muted/50 border-border text-muted-foreground">
          {t('wallet.nft.shares_count', { count: nft.shares }, `${nft.shares} shares`)}
        </Badge>
      </div>

      <div className="px-4 py-2 space-y-4 flex-1">
        {/* Investment details */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-xl border border-border/50">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{t('wallet.nft.investment', 'Investi')}</p>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground text-sm">
                {parseFloat(nft.amount).toFixed(3)} Ξ
              </span>
            </div>
          </div>

          <div className="space-y-1 border-l border-border/50 pl-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{t('wallet.nft.dividends', 'Reçus')}</p>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-green-500 text-sm">
                +{nft.dividends || '0.00'} Ξ
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar for ROI */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('wallet.nft.roi_progress', 'ROI Progress')}</span>
            <span className="text-xs font-bold text-primary">
              {progressPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-auto px-4 py-3 border-t border-border/50 flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
          <Calendar className="h-3 w-3" />
          {formatDate(nft.timestamp)}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(nft)}
            className="h-7 px-3 text-xs font-bold text-primary hover:text-primary hover:bg-primary/10 rounded-lg"
          >
            {t('wallet.nft.details', 'Détails')}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
            onClick={() => window.open(`https://sepolia.basescan.org/address/${nft.txHash}`, '_blank')}
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function NFTHoldings({ nftHoldings, isLoading, onViewDetails }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('date');

  // Filter and sort NFTs
  const filteredAndSortedNFTs = React.useMemo(() => {
    let filtered = nftHoldings.filter(nft =>
      nft.campaign.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nft.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    switch (sortBy) {
      case 'amount':
        filtered.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
        break;
      case 'dividends':
        filtered.sort((a, b) => parseFloat(b.dividends || 0) - parseFloat(a.dividends || 0));
        break;
      case 'date':
      default:
        filtered.sort((a, b) => b.timestamp - a.timestamp);
    }

    return filtered;
  }, [nftHoldings, searchTerm, sortBy]);

  const totalValue = nftHoldings.reduce((sum, nft) => sum + parseFloat(nft.amount), 0);
  const totalDividends = nftHoldings.reduce((sum, nft) => sum + parseFloat(nft.dividends || 0), 0);

  return (
    <div className="rounded-3xl bg-card border border-border shadow-xl overflow-hidden">
      <div className="p-6 border-b border-border bg-muted/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              {t('wallet.nft.title', 'Mes Actifs')}
              <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 ml-2">
                {nftHoldings.length}
              </Badge>
            </h2>
            <p className="text-sm text-muted-foreground font-medium">
              {t('wallet.nft.totalValue', { value: totalValue.toFixed(4), dividends: totalDividends.toFixed(4) })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:flex-none group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder={t('wallet.nft.search', 'Rechercher un token...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-48 pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/50 cursor-pointer outline-none font-medium"
            >
              <option value="date">{t('wallet.nft.sortDate', 'Date')}</option>
              <option value="amount">{t('wallet.nft.sortAmount', 'Montant')}</option>
              <option value="dividends">{t('wallet.nft.sortDividends', 'Dividendes')}</option>
            </select>

            {/* View mode toggle */}
            <div className="flex border border-border rounded-xl overflow-hidden bg-background p-1 gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={`h-8 w-8 p-0 rounded-lg ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className={`h-8 w-8 p-0 rounded-lg ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-muted/5 min-h-[400px]">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl h-64 animate-pulse relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 animate-shimmer" />
              </div>
            ))}
          </div>
        ) : filteredAndSortedNFTs.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center">
            <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mb-6 shadow-inner">
              <Award className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              {searchTerm ? t('wallet.nft.noResults', 'Aucun résultat trouvé') : t('wallet.nft.noNFTs', 'Portefeuille vide')}
            </h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
              {searchTerm
                ? t('wallet.nft.trySearch', 'Essayez de modifier votre recherche.')
                : t('wallet.nft.startInvesting', 'Vous n\'avez pas encore d\'actifs. Explorez les campagnes pour commencer.')
              }
            </p>
            {!searchTerm && (
              <Button className="rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                Explore Campaigns
              </Button>
            )}
          </div>
        ) : (
          <ScrollArea className="h-[600px] pr-4 -mr-4">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                {filteredAndSortedNFTs.map((nft, index) => (
                  <div
                    key={`${nft.id}-${nft.campaign}-${index}`}
                    className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <NFTCard nft={nft} onViewDetails={onViewDetails} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 pb-4">
                {filteredAndSortedNFTs.map((nft, index) => (
                  <div
                    key={`${nft.id}-${nft.campaign}-${index}`}
                    className="flex items-center justify-between p-4 border border-border rounded-2xl bg-card hover:bg-muted/30 transition-all duration-200 group animate-in fade-in slide-in-from-bottom-2"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Award className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-sm">
                          Token #{nft.id.split('-').pop()}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">
                          {nft.campaign}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{t('wallet.nft.shares', 'Parts')}</p>
                        <Badge variant="secondary" className="bg-muted text-foreground">{nft.shares}</Badge>
                      </div>

                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{t('wallet.nft.investment', 'Valeur')}</p>
                        <p className="font-bold text-foreground tabular-nums">
                          {parseFloat(nft.amount).toFixed(4)} ETH
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetails(nft)}
                          className="bg-muted/50 hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-all rounded-lg"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        )}
      </div>
    </div>
  );
}