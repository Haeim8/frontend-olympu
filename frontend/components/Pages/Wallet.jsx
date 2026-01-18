'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { apiManager } from '@/lib/services/api-manager';
import { useTranslation } from '@/hooks/useLanguage';

// Import des composants modulaires
import WalletHeader from '@/components/wallet/WalletHeader';
import WalletStats from '@/components/wallet/WalletStats';
import NFTHoldings from '@/components/wallet/NFTHoldings';
import TransactionHistory from '@/components/wallet/TransactionHistory';

// Import des modals/dialogs
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import config from '@/lib/config';

export default function Wallet() {
  const { address } = useAccount();
  const { t } = useTranslation();

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

      const toTimestampSeconds = (value) => {
        if (!value && value !== 0) {
          return Math.floor(Date.now() / 1000);
        }

        if (typeof value === 'object' && typeof value.toNumber === 'function') {
          try {
            return value.toNumber();
          } catch (error) {
            console.warn('Impossible de convertir le timestamp en utilisant toNumber:', error);
          }
        }

        const asNumber = Number(value);
        if (Number.isFinite(asNumber) && asNumber > 0) {
          return Math.floor(asNumber);
        }

        return Math.floor(Date.now() / 1000);
      };

      // Transformer les données pour le format attendu
      const nftData = [];
      const transactionData = [];
      const investmentsArray = Array.isArray(investments) ? investments : [];

      investmentsArray.forEach(investment => {
        const investmentArray = Array.isArray(investment.investments) ? investment.investments : [];
        investmentArray.forEach((inv, index) => {
          const timestampSeconds = toTimestampSeconds(inv.timestamp);

          const nftItem = {
            id: `${investment.campaignAddress}-${inv.tokenIds?.[0]?.toString() || index}`,
            amount: apiManager.formatEthValue(inv.amount),
            shares: inv.shares?.toString() || '0',
            campaign: investment.campaignName,
            timestamp: timestampSeconds,
            txHash: investment.campaignAddress,
            dividends: '0.0000' // TODO: Récupérer les vraies données de dividendes
          };

          nftData.push(nftItem);

          // Créer une transaction correspondante
          transactionData.push({
            id: `${investment.campaignAddress}-${index}`,
            type: t('wallet.investment', 'Investissement'),
            project: investment.campaignName,
            amount: `${apiManager.formatEthValue(inv.amount)} ETH`,
            date: new Date(timestampSeconds * 1000).toLocaleDateString('fr-FR'),
            txHash: investment.campaignAddress
          });
        });
      });

      setNftHoldings(nftData);
      setTransactions(transactionData);

      // Calculer les statistiques du portefeuille
      const nftDataArray = Array.isArray(nftData) ? nftData : [];
      const stats = {
        totalNFTs: nftDataArray.reduce((acc, nft) => acc + parseInt(nft.shares), 0),
        totalInvested: nftDataArray.reduce((acc, nft) => acc + parseFloat(nft.amount), 0).toFixed(4),
        activeProjects: new Set(nftDataArray.map(nft => nft.campaign)).size,
        totalDividends: nftDataArray.reduce((acc, nft) => acc + parseFloat(nft.dividends || 0), 0).toFixed(4)
      };

      setWalletInfo(stats);

      // Précharger les données des campagnes dans lesquelles l'utilisateur a investi
      const uniqueCampaigns = [...new Set(investmentsArray.map(inv => inv.campaignAddress))];
      const uniqueCampaignsArray = Array.isArray(uniqueCampaigns) ? uniqueCampaigns : [];
      uniqueCampaignsArray.forEach(campaignAddress => {
        apiManager.preloadCampaignDetails(campaignAddress);
      });

    } catch (error) {
      console.error('Erreur lors du chargement du portefeuille:', error);
      setError(error.message || t('wallet.error.loadFailed', 'Échec du chargement des données.'));
    } finally {
      setIsLoading(false);
    }
  }, [address, t]);

  // Effet principal pour charger les données au montage
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center space-y-8 p-8 bg-card border border-border rounded-3xl relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2" />

          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-glow border border-primary/20">
              <WifiOff className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-foreground">
                {t('wallet.notConnected.title', 'Portefeuille Non Connecté')}
              </h2>
              <p className="text-muted-foreground font-medium">
                {t('wallet.notConnected.description', 'Veuillez connecter votre portefeuille pour accéder à votre tableau de bord personnel.')}
              </p>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-start text-left gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Wifi className="h-5 w-5 text-primary flex-shrink-0" />
            </div>
            <p className="text-sm text-foreground/80 font-medium pt-1">
              {t('wallet.notConnected.instruction', 'Utilisez le bouton de connexion en haut à droite pour commencer.')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8 relative z-10 animate-fade-in">

        {/* Header principal */}
        <WalletHeader
          address={address}
          onRefresh={handleRefresh}
          isLoading={isLoading}
          walletInfo={walletInfo}
        />

        {/* Message d'erreur global */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-500 text-sm font-medium">
                <strong>{t('error', 'Erreur')}:</strong> {error}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="mt-2 text-red-500 hover:text-red-600 hover:bg-red-500/10 h-8 p-2"
              >
                {t('wallet.error.retry', 'Réessayer')}
              </Button>
            </div>
          </div>
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
            <DialogContent className="sm:max-w-md bg-card border-border text-foreground rounded-3xl shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-foreground">
                  {t('wallet.nftDetails.title', { id: selectedNFT.id.split('-').pop() }, `Token #${selectedNFT.id.split('-').pop()}`)}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-muted/50 border border-border/50">
                    <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">{t('wallet.nftDetails.campaign', 'Campagne')}</p>
                    <p className="font-bold text-foreground text-lg">
                      {selectedNFT.campaign}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-muted/50 border border-border/50">
                      <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">{t('wallet.nftDetails.shares', 'Parts')}</p>
                      <p className="font-bold text-foreground text-lg">
                        {selectedNFT.shares}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-muted/50 border border-border/50">
                      <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">{t('wallet.nftDetails.invested', 'Investi')}</p>
                      <p className="font-bold text-primary text-lg">
                        {parseFloat(selectedNFT.amount).toFixed(4)} ETH
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
                    <p className="text-xs uppercase tracking-wider font-bold text-green-600 dark:text-green-400 mb-1">{t('wallet.nftDetails.dividends', 'Dividendes Cumulés')}</p>
                    <p className="font-bold text-green-600 dark:text-green-400 text-lg">
                      {selectedNFT.dividends} ETH
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-border/50">
                  <Button
                    variant="outline"
                    onClick={() => window.open(config.helpers.getExplorerAddressUrl(selectedNFT.txHash), '_blank')}
                    className="border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl"
                  >
                    {t('wallet.nftDetails.viewOnBasescan', 'Voir sur Basescan')}
                  </Button>
                  <Button onClick={handleCloseNFTDetails} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/25">
                    {t('close', 'Fermer')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
