"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, ExternalLink, Crown, Trophy, Award, TrendingUp } from 'lucide-react';
import { apiManager } from '@/lib/services/api-manager';
import config from '@/lib/config';

export default function CampaignInvestors({ campaignAddress, onPreloadHover }) {
  const { t } = useTranslation();
  const [investors, setInvestors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadInvestors = useCallback(async () => {
    console.log('[CampaignInvestors] loadInvestors called, address:', campaignAddress);

    if (!campaignAddress) {
      console.log('[CampaignInvestors] No campaign address, skipping');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('[CampaignInvestors] Fetching investors for:', campaignAddress);
      const investorData = await apiManager.getCampaignInvestors(campaignAddress);
      console.log('[CampaignInvestors] Got investors:', investorData);
      setInvestors(investorData || []);

    } catch (err) {
      console.error('Erreur chargement investors:', err);
      setError(t('campaignInvestors.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [campaignAddress, t]);

  useEffect(() => {
    loadInvestors();
  }, [loadInvestors]);

  const filteredInvestors = () => {
    const investorArray = Array.isArray(investors) ? investors : [];
    if (!searchTerm) return investorArray;

    return investorArray.filter(investor =>
      investor.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const sortedInvestors = () => {
    return filteredInvestors().sort((a, b) =>
      parseInt(b.nftCount) - parseInt(a.nftCount)
    );
  };

  const getInvestorStats = () => {
    const investorArray = Array.isArray(investors) ? investors : [];
    const totalInvestors = investorArray.length;
    const totalNFTs = investorArray.reduce((sum, inv) => sum + parseInt(inv.nftCount || 0), 0);
    const avgNFTsPerInvestor = totalInvestors > 0 ? (totalNFTs / totalInvestors).toFixed(2) : 0;
    const topInvestor = investorArray.length > 0 ?
      Math.max(...investorArray.map(inv => parseInt(inv.nftCount || 0))) : 0;

    return { totalInvestors, totalNFTs, avgNFTsPerInvestor, topInvestor };
  };

  const getInvestorTier = (nftCount) => {
    const count = parseInt(nftCount);
    if (count >= 100) return { tier: 'Diamond', icon: Crown, color: 'text-cyan-400', bg: 'bg-cyan-400/10 border-cyan-400/20' };
    if (count >= 50) return { tier: 'Gold', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' };
    if (count >= 20) return { tier: 'Silver', icon: Award, color: 'text-slate-300', bg: 'bg-slate-300/10 border-slate-300/20' };
    return { tier: 'Bronze', icon: null, color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20' };
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const stats = getInvestorStats();

  if (error) {
    return (
      <Card className="glass-card border-red-500/20">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={loadInvestors} variant="outline" className="border-red-500/20 hover:bg-red-500/10 text-red-400">
              {t('campaignInvestors.retry', 'Réessayer')}
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
              <Users className="h-5 w-5 text-primary" />
              {t('campaignInvestors.title', 'Investisseurs')}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {t('campaignInvestors.subtitle', 'Top détenteurs et répartition des parts.')}
            </p>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 backdrop-blur-md">
            {stats.totalInvestors} {t('campaignInvestors.investors', 'Holders')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats rapides */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-muted/20 border border-border/50 hover:border-primary/20 transition-all group">
            <p className="text-2xl font-bold text-white group-hover:text-primary transition-colors">
              {stats.totalInvestors}
            </p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground">{t('campaignInvestors.investorsLabel', 'Investisseurs')}</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/20 border border-border/50 hover:border-blue-500/20 transition-all group">
            <p className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
              {stats.totalNFTs}
            </p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground">{t('campaignInvestors.totalNFTs', 'Shares Totales')}</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/20 border border-border/50 hover:border-purple-500/20 transition-all group">
            <p className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors">
              {stats.avgNFTsPerInvestor}
            </p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground">{t('campaignInvestors.averagePerInvestor', 'Moyenne / Inv.')}</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/20 border border-border/50 hover:border-yellow-500/20 transition-all group">
            <p className="text-2xl font-bold text-white group-hover:text-yellow-400 transition-colors">
              {stats.topInvestor}
            </p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground">{t('campaignInvestors.maxHeld', 'Top Holder')}</p>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('campaignInvestors.searchPlaceholder', 'Rechercher une adresse (0x...)')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-muted/30 border-input/50 focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50 transition-all"
          />
        </div>

        {/* Table des investisseurs */}
        <div className="rounded-xl border border-border/50 overflow-hidden bg-background/20 backdrop-blur-sm">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 backdrop-blur-md z-10">
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-bold text-xs uppercase w-[100px] pl-4">{t('campaignInvestors.rank', 'Rang')}</TableHead>
                  <TableHead className="text-muted-foreground font-bold text-xs uppercase">{t('campaignInvestors.investor', 'Investisseur')}</TableHead>
                  <TableHead className="text-muted-foreground font-bold text-xs uppercase text-right">{t('campaignInvestors.nftsHeld', 'Parts')}</TableHead>
                  <TableHead className="text-muted-foreground font-bold text-xs uppercase">{t('campaignInvestors.tier', 'Rang')}</TableHead>
                  <TableHead className="text-muted-foreground font-bold text-xs uppercase text-right">{t('campaignInvestors.share', '%')}</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i} className="border-border/30">
                      <TableCell><div className="h-6 w-8 bg-muted/50 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-6 w-32 bg-muted/50 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-6 w-12 bg-muted/50 rounded animate-pulse ml-auto"></div></TableCell>
                      <TableCell><div className="h-6 w-16 bg-muted/50 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-6 w-12 bg-muted/50 rounded animate-pulse ml-auto"></div></TableCell>
                      <TableCell><div className="h-8 w-8 bg-muted/50 rounded animate-pulse"></div></TableCell>
                    </TableRow>
                  ))
                ) : sortedInvestors().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                      {searchTerm ? t('campaignInvestors.noInvestorsFound', 'Aucun investisseur trouvé') : t('campaignInvestors.noInvestors', 'Aucun investisseur pour le moment')}
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedInvestors().map((investor, index) => {
                    const tier = getInvestorTier(investor.nftCount);
                    const percentage = stats.totalNFTs > 0 ?
                      ((parseInt(investor.nftCount) / stats.totalNFTs) * 100).toFixed(1) : 0;

                    return (
                      <TableRow
                        key={`${investor.address}-${index}`}
                        className="hover:bg-muted/30 transition-colors border-border/30 group"
                        onMouseEnter={() => onPreloadHover && onPreloadHover(investor.address)}
                      >
                        <TableCell className="pl-4">
                          <div className={`
                                flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                                ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                              index === 1 ? 'bg-slate-300/20 text-slate-300' :
                                index === 2 ? 'bg-orange-500/20 text-orange-500' : 'text-muted-foreground'}
                            `}>
                            {index + 1}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-foreground">
                          {formatAddress(investor.address)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-foreground">
                          {investor.nftCount}
                        </TableCell>
                        <TableCell>
                          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${tier.bg} ${tier.color}`}>
                            {tier.icon && <tier.icon className="h-3 w-3" />}
                            {tier.tier}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-muted-foreground">
                          {percentage}%
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(config.helpers.getExplorerAddressUrl(investor.address), '_blank')}
                            className="h-8 w-8 hover:bg-primary/20 hover:text-primary text-muted-foreground opacity-0 group-hover:opacity-100 transition-all font"
                            title="View on Explorer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {/* Légende des tiers */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground p-3 bg-muted/10 rounded-lg border border-border/20 justify-center">
          <div className="flex items-center gap-1.5 opacity-70">
            <Crown className="h-3 w-3 text-cyan-400" />
            <span className="font-medium">Diamond (100+)</span>
          </div>
          <div className="flex items-center gap-1.5 opacity-70">
            <Trophy className="h-3 w-3 text-yellow-400" />
            <span className="font-medium">Gold (50+)</span>
          </div>
          <div className="flex items-center gap-1.5 opacity-70">
            <Award className="h-3 w-3 text-slate-300" />
            <span className="font-medium">Silver (20+)</span>
          </div>
          <div className="flex items-center gap-1.5 opacity-70">
            <div className="h-2 w-2 rounded-full bg-orange-400"></div>
            <span className="font-medium">Bronze</span>
          </div>
        </div>

        {sortedInvestors().length > 0 && (
          <div className="text-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadInvestors}
              className="text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              {t('campaignInvestors.refreshData', 'Rafraîchir les données')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
