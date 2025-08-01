'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAddress } from '@thirdweb-dev/react';
import { apiManager } from '@/lib/services/api-manager';

// Import des composants modulaires
import WalletHeader from '@/components/wallet/WalletHeader';
import WalletStats from '@/components/wallet/WalletStats';
import NFTHoldings from '@/components/wallet/NFTHoldings';
import TransactionHistory from '@/components/wallet/TransactionHistory';

// Import des modals/dialogs si nécessaire
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';

export default function Wallet() {
  const address = useAddress();
  
  // États principaux
  const [nftHoldings, setNftHoldings] = useState([]);
  const [walletInfo, setWalletInfo] = useState({
    totalNFTs: 0,
    totalInvested: '0',
    activeProjects: 0,
    totalDividends: '0'
  });
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNFT, setSelectedNFT] = useState(null);

  // Fonction pour charger les données avec cache intelligent
  const loadWalletData = useCallback(async (useCache = true) => {
    if (!address) return;

    try {
      setIsLoading(true);
      setError(null);

      // Utiliser api-manager pour récupérer les investissements avec cache
      const investments = await apiManager.getUserInvestments(address);
      
      // Transformer les données pour le format attendu
      const nftData = [];
      const transactionData = [];
      
      investments.forEach(investment => {
        investment.investments.forEach((inv, index) => {
          const nftItem = {
            id: `${investment.campaignAddress}-${inv.tokenIds?.[0]?.toString() || index}`,
            amount: apiManager.formatEthValue(inv.amount),
            shares: inv.shares?.toString() || '0',
            campaign: investment.campaignName,
            timestamp: inv.timestamp?.toNumber() || Date.now() / 1000,
            txHash: investment.campaignAddress,
            dividends: '0.0000' // TODO: Récupérer les vraies données de dividendes
          };
          
          nftData.push(nftItem);
          
          // Créer une transaction correspondante
          transactionData.push({
            id: `${investment.campaignAddress}-${index}`,
            type: 'Investment',
            project: investment.campaignName,
            amount: `${apiManager.formatEthValue(inv.amount)} ETH`,
            date: new Date((inv.timestamp?.toNumber() || Date.now() / 1000) * 1000).toLocaleDateString('fr-FR'),
            txHash: investment.campaignAddress
          });
        });
      });

      setNftHoldings(nftData);
      setTransactions(transactionData);
      
      // Calculer les statistiques du portefeuille
      const stats = {
        totalNFTs: nftData.reduce((acc, nft) => acc + parseInt(nft.shares), 0),
        totalInvested: nftData.reduce((acc, nft) => acc + parseFloat(nft.amount), 0).toFixed(4),
        activeProjects: new Set(nftData.map(nft => nft.campaign)).size,
        totalDividends: nftData.reduce((acc, nft) => acc + parseFloat(nft.dividends || 0), 0).toFixed(4)
      };
      
      setWalletInfo(stats);

      // Précharger les données des campagnes dans lesquelles l'utilisateur a investi
      const uniqueCampaigns = [...new Set(investments.map(inv => inv.campaignAddress))];
      uniqueCampaigns.forEach(campaignAddress => {
        apiManager.preloadCampaignDetails(campaignAddress);
      });

    } catch (error) {
      console.error('Erreur lors du chargement du portefeuille:', error);
      setError(error.message || 'Impossible de charger les données du portefeuille');
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  // Effet principal pour charger les données
  useEffect(() => {
    if (address) {
      loadWalletData();
    } else {
      // Reset des données si pas d'adresse
      setNftHoldings([]);
      setTransactions([]);
      setWalletInfo({
        totalNFTs: 0,
        totalInvested: '0',
        activeProjects: 0,
        totalDividends: '0'
      });
      setIsLoading(false);
      setError(null);
    }
  }, [address, loadWalletData]);

  // Gestionnaires d'événements
  const handleRefresh = useCallback(() => {
    // Vider le cache et recharger
    apiManager.clearCache();
    loadWalletData(false);
  }, [loadWalletData]);

  const handleViewNFTDetails = useCallback((nft) => {
    setSelectedNFT(nft);
  }, []);

  const handleCloseNFTDetails = useCallback(() => {
    setSelectedNFT(null);
  }, []);

  // Rendu conditionnel si pas d'adresse connectée
  if (!address) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center space-y-6 p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl flex items-center justify-center mx-auto">
            <WifiOff className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Portefeuille non connecté
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Veuillez connecter votre portefeuille pour accéder à vos investissements et NFT.
            </p>
          </div>
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
            <Wifi className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              Utilisez le bouton "Connecter" en haut à droite pour vous connecter.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        
        {/* Header principal */}
        <WalletHeader
          address={address}
          onRefresh={handleRefresh}
          isLoading={isLoading}
          walletInfo={walletInfo}
        />

        {/* Message d'erreur global */}
        {error && (
          <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              <strong>Erreur:</strong> {error}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="ml-2 text-red-600 hover:text-red-700"
              >
                Réessayer
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Statistiques du portefeuille */}
        <WalletStats 
          walletInfo={walletInfo}
          isLoading={isLoading}
        />

        {/* Grille des NFT */}
        <NFTHoldings
          nftHoldings={nftHoldings}
          isLoading={isLoading}
          onViewDetails={handleViewNFTDetails}
        />

        {/* Historique des transactions */}
        <TransactionHistory
          transactions={transactions}
          isLoading={isLoading}
        />

        {/* Modal de détails NFT */}
        {selectedNFT && (
          <Dialog open={!!selectedNFT} onOpenChange={handleCloseNFTDetails}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  Détails du NFT #{selectedNFT.id.split('-').pop()}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Campagne</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {selectedNFT.campaign}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Parts détenues</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {selectedNFT.shares}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Montant investi</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {parseFloat(selectedNFT.amount).toFixed(4)} ETH
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Dividendes reçus</p>
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      {selectedNFT.dividends} ETH
                    </p>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => window.open(`https://sepolia.basescan.org/address/${selectedNFT.txHash}`, '_blank')}
                  >
                    Voir sur Basescan
                  </Button>
                  <Button onClick={handleCloseNFTDetails}>
                    Fermer
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Debug info en développement */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 dark:bg-neutral-900 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Debug Info (dev only)
            </h3>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p>Wallet Address: {address}</p>
              <p>NFT Holdings: {nftHoldings.length}</p>
              <p>Transactions: {transactions.length}</p>
              <p>Cache stats: {JSON.stringify(apiManager.getCacheStats(), null, 2)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}