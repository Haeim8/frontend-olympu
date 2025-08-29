"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, ExternalLink, Crown, Trophy, Award } from 'lucide-react';
import { apiManager } from '@/lib/services/api-manager';

export default function CampaignInvestors({ campaignAddress, onPreloadHover }) {
  const { t } = useTranslation();
  const [investors, setInvestors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadInvestors();
  }, [campaignAddress]);

  const loadInvestors = async () => {
    if (!campaignAddress) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const investorData = await apiManager.getCampaignInvestors(campaignAddress);
      setInvestors(investorData || []);
      
    } catch (err) {
      console.error('Erreur chargement investors:', err);
      setError(t('campaignInvestors.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

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
    if (count >= 100) return { tier: 'Diamond', icon: Crown, color: 'text-purple-600 dark:text-purple-400' };
    if (count >= 50) return { tier: 'Gold', icon: Trophy, color: 'text-yellow-600 dark:text-yellow-400' };
    if (count >= 20) return { tier: 'Silver', icon: Award, color: 'text-gray-600 dark:text-gray-400' };
    return { tier: 'Bronze', icon: null, color: 'text-orange-600 dark:text-orange-400' };
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const stats = getInvestorStats();

  if (error) {
    return (
      <Card className="bg-white dark:bg-neutral-950 border-0 dark:border-0">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={loadInvestors} variant="outline">
              {t('campaignInvestors.retry')}
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
            <Users className="h-5 w-5 text-green-500" />
            {t('campaignInvestors.title')}
          </div>
          <Badge variant="outline" className="text-sm">
            {stats.totalInvestors} {t('campaignInvestors.investors')}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stats rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 dark:bg-neutral-900 rounded-lg">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.totalInvestors}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('campaignInvestors.investorsLabel')}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-neutral-900 rounded-lg">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalNFTs}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('campaignInvestors.totalNFTs')}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-neutral-900 rounded-lg">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.avgNFTsPerInvestor}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('campaignInvestors.averagePerInvestor')}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-neutral-900 rounded-lg">
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stats.topInvestor}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('campaignInvestors.maxHeld')}</p>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t('campaignInvestors.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-50 dark:bg-neutral-900"
          />
        </div>

        {/* Table des investisseurs */}
        <ScrollArea className="h-[400px] rounded-lg border border-gray-200 dark:border-gray-700">
          <Table>
            <TableHeader className="sticky top-0 bg-gray-50 dark:bg-neutral-900">
              <TableRow>
                <TableHead className="text-gray-700 dark:text-gray-300 font-medium">{t('campaignInvestors.rank')}</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300 font-medium">{t('campaignInvestors.investor')}</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300 font-medium">{t('campaignInvestors.nftsHeld')}</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300 font-medium">{t('campaignInvestors.tier')}</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300 font-medium">{t('campaignInvestors.share')}</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300 font-medium">{t('campaignInvestors.action')}</TableHead>
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
              ) : sortedInvestors().length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 dark:text-gray-400 py-8">
                    {searchTerm ? t('campaignInvestors.noInvestorsFound') : t('campaignInvestors.noInvestors')}
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
                      className="hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors duration-150"
                      onMouseEnter={() => onPreloadHover && onPreloadHover(investor.address)}
                    >
                      <TableCell className="text-gray-900 dark:text-gray-100 font-semibold">
                        <div className="flex items-center gap-2">
                          {index === 0 && <Crown className="h-4 w-4 text-yellow-500" />}
                          #{index + 1}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100 font-mono">
                        {formatAddress(investor.address)}
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100 font-bold text-lg">
                        {investor.nftCount}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {tier.icon && <tier.icon className={`h-4 w-4 ${tier.color}`} />}
                          <Badge variant="outline" className={tier.color}>
                            {tier.tier}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100 font-semibold">
                        {percentage}%
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`https://sepolia.basescan.org/address/${investor.address}`, '_blank')}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
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

        {/* Légende des tiers */}
        <div className="mt-4 p-4 bg-gray-50 dark:bg-neutral-900 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('campaignInvestors.investorTiers')}:
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Crown className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              <span className="text-purple-600 dark:text-purple-400">{t('campaignInvestors.diamondTier')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
              <span className="text-yellow-600 dark:text-yellow-400">{t('campaignInvestors.goldTier')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Award className="h-3 w-3 text-gray-600 dark:text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">{t('campaignInvestors.silverTier')}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-orange-600 dark:bg-orange-400"></div>
              <span className="text-orange-600 dark:text-orange-400">{t('campaignInvestors.bronzeTier')}</span>
            </div>
          </div>
        </div>

        {sortedInvestors().length > 0 && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={loadInvestors}
              className="text-gray-600 dark:text-gray-400"
            >
              {t('campaignInvestors.refreshData')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}