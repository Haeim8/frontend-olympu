"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Award, 
  Search, 
  Filter,
  TrendingUp,
  ExternalLink,
  Calendar,
  DollarSign,
  Eye,
  Grid3x3,
  List
} from 'lucide-react';

const NFTCard = ({ nft, onViewDetails }) => {
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
    <Card className="group bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Header with token info */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-lime-600" />
              <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Token #{nft.id.split('-').pop()}
              </CardTitle>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {nft.campaign}
            </p>
          </div>
          <Badge 
            variant="outline" 
            className="bg-lime-50 dark:bg-lime-900/20 text-lime-700 dark:text-lime-300 border-lime-200 dark:border-lime-800"
          >
            {nft.shares} parts
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Investment details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">Investissement</p>
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-blue-600" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {parseFloat(nft.amount).toFixed(4)} ETH
              </span>
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">Dividendes</p>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="font-semibold text-green-600 dark:text-green-400">
                {nft.dividends || '0.0000'} ETH
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar for ROI */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">ROI</span>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {progressPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-neutral-800 rounded-full h-2">
            <div 
              className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Date and actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-neutral-800">
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="h-3 w-3" />
            {formatDate(nft.timestamp)}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewDetails(nft)}
              className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Eye className="h-3 w-3 mr-1" />
              Détails
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => window.open(`https://sepolia.basescan.org/address/${nft.txHash}`, '_blank')}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function NFTHoldings({ nftHoldings, isLoading, onViewDetails }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('date'); // 'date', 'amount', 'dividends'

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
    <Card className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Award className="h-5 w-5 text-lime-600" />
              Vos NFTs
              <Badge className="bg-lime-100 dark:bg-lime-900/20 text-lime-700 dark:text-lime-300">
                {nftHoldings.length}
              </Badge>
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Valeur totale: {totalValue.toFixed(4)} ETH • Dividendes: {totalDividends.toFixed(4)} ETH
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
                className="pl-10 pr-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-lime-500 focus:border-transparent"
            >
              <option value="date">Date</option>
              <option value="amount">Montant</option>
              <option value="dividends">Dividendes</option>
            </select>

            {/* View mode toggle */}
            <div className="flex border border-gray-200 dark:border-neutral-700 rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-none"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-neutral-800 rounded-lg h-48 animate-pulse" />
            ))}
          </div>
        ) : filteredAndSortedNFTs.length === 0 ? (
          <div className="text-center py-12">
            <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {searchTerm ? 'Aucun NFT trouvé' : 'Aucun NFT détenu'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm 
                ? 'Essayez de modifier votre recherche'
                : 'Commencez par investir dans des projets pour obtenir vos premiers NFT'
              }
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAndSortedNFTs.map((nft, index) => (
                  <div
                    key={`${nft.id}-${nft.campaign}-${index}`}
                    className="animate-in fade-in slide-in-from-bottom-4"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animationDuration: '400ms',
                      animationFillMode: 'both'
                    }}
                  >
                    <NFTCard nft={nft} onViewDetails={onViewDetails} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAndSortedNFTs.map((nft, index) => (
                  <div
                    key={`${nft.id}-${nft.campaign}-${index}`}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-neutral-800 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors group"
                  >
                    <div className="flex items-center space-x-4">
                      <Award className="h-8 w-8 text-lime-600 bg-lime-100 dark:bg-lime-900/20 rounded-lg p-2" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          Token #{nft.id.split('-').pop()}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {nft.campaign} • {nft.shares} parts
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {parseFloat(nft.amount).toFixed(4)} ETH
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          +{nft.dividends || '0.0000'} ETH
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(nft)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}