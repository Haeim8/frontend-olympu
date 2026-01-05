"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useTranslation } from '@/hooks/useLanguage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiManager } from '@/lib/services/api-manager';

import CampaignHeader from '@/components/campaign/CampaignHeader';
import DividendDistribution from '@/components/campaign/finance/DividendDistribution';
import CampaignActions from '@/components/campaign/finance/CampaignActions';
import TransactionHistory from '@/components/campaign/finance/TransactionHistory';
import CampaignInvestors from '@/components/campaign/CampaignInvestors';
import CampaignDocuments from '@/components/campaign/CampaignDocuments';
import CampaignSocial from '@/components/campaign/CampaignSocial';
import ReopenCampaignDialog from '@/components/campaign/dialogs/ReopenCampaignDialog';
import PromoteCampaignDialog from '@/components/campaign/dialogs/PromoteCampaignDialog';
import CertifyCampaignDialog from '@/components/campaign/dialogs/CertifyCampaignDialog';

import { Wallet, BarChart3, Users, FileText, Share2, AlertCircle, Loader2 } from 'lucide-react';

const enrichCampaignData = (data) => {
  if (!data) return null;

  const goalValue = parseFloat(data.goal ?? '0');
  const sharePriceValue = parseFloat(data.sharePrice ?? data.nftPrice ?? '0');
  const raisedValue = parseFloat(data.raised ?? '0');
  const endDate = data.endDate ?? null;
  const endTimestamp = endDate ? new Date(endDate).getTime() : null;

  return {
    ...data,
    nftPrice: data.nftPrice ?? data.sharePrice ?? '0',
    nftTotal: data.nftTotal ?? (sharePriceValue > 0 ? Math.floor(goalValue / sharePriceValue) : 0),
    timeRemaining: data.timeRemaining ?? (endTimestamp ? Math.max(0, endTimestamp - Date.now()) : 0),
    progressPercentage: data.progressPercentage ?? (goalValue > 0 ? (raisedValue / goalValue) * 100 : 0),
  };
};

export default function Campaign() {
  const { t } = useTranslation();
  const { address } = useAccount();

  const [campaignAddress, setCampaignAddress] = useState(null);
  const [campaignData, setCampaignData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [showPromoteDialog, setShowPromoteDialog] = useState(false);
  const [showCertifyDialog, setShowCertifyDialog] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const initializeCampaign = async () => {
      if (!address) {
        setCampaignAddress(null);
        setCampaignData(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const campaigns = await apiManager.listCampaigns({ creator: address }, { useCache: false });
        if (cancelled) return;

        if (Array.isArray(campaigns) && campaigns.length > 0) {
          const firstCampaign = campaigns[0];
          setCampaignAddress(firstCampaign.address);
          const summaryData = enrichCampaignData(firstCampaign);
          if (summaryData) {
            setCampaignData(summaryData);
          }
        } else {
          setCampaignAddress(null);
          setCampaignData(null);
          setError(t('campaign.noCampaignFound', 'Aucune campagne trouvée.'));
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Erreur initialisation campagne:', err);
        setError(t('campaign.loadError', 'Impossible de charger la campagne.'));
        setCampaignAddress(null);
        setCampaignData(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    initializeCampaign();
    return () => { cancelled = true; };
  }, [address, t]);

  useEffect(() => {
    if (!campaignAddress) return;
    let cancelled = false;

    const loadCampaignData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data = await apiManager.getCampaignData(campaignAddress);
        if (cancelled) return;

        if (data) {
          setCampaignData(enrichCampaignData(data));
        } else {
          setError(t('campaign.loadDataError', 'Données de campagne introuvables.'));
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Erreur chargement campagne:', err);
        setError(t('campaign.dataLoadingError', 'Erreur lors du chargement des détails.'));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadCampaignData();
    return () => { cancelled = true; };
  }, [campaignAddress, t]);

  const handlePreloadHover = useCallback((identifier) => {
    if (identifier && identifier !== campaignAddress) {
      apiManager.getCampaignData(identifier);
    }
  }, [campaignAddress]);

  const handleDistributionComplete = useCallback(() => {
    if (!campaignAddress) return;
    apiManager.invalidateCampaign(campaignAddress);
    apiManager.getCampaignData(campaignAddress, false).then((data) => {
      setCampaignData(enrichCampaignData(data));
    });
  }, [campaignAddress]);

  const handleActionComplete = useCallback((actionType) => {
    if (!campaignAddress) return;

    switch (actionType) {
      case 'escrow_released':
      case 'campaign_reopened':
        apiManager.invalidateCampaign(campaignAddress);
        apiManager.getCampaignData(campaignAddress, false).then((data) => {
          setCampaignData(enrichCampaignData(data));
        });
        break;
      default:
        apiManager.invalidateCampaign(campaignAddress);
    }
  }, [campaignAddress]);

  const handleDocumentUpdate = useCallback(() => {
    if (!campaignAddress) return;
    apiManager.cache.invalidate(`campaign_documents_${campaignAddress}`);
  }, [campaignAddress]);

  const handleSocialUpdate = useCallback((socialData) => {
    console.log('Social links updated:', socialData);
  }, []);

  const handleReopenSuccess = useCallback(() => {
    handleActionComplete('campaign_reopened');
  }, [handleActionComplete]);

  const handlePromoteSuccess = useCallback((promotionData) => {
    console.log('Campaign promoted:', promotionData);
  }, []);

  const handleCertifySuccess = useCallback((certificationData) => {
    console.log('Campaign certification requested:', certificationData);
    setCampaignData((prev) => (prev ? { ...prev, certificationPending: true } : prev));
  }, []);

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 animate-in fade-in zoom-in duration-500">
        <div className="p-6 bg-primary/10 rounded-full animate-pulse">
          <Wallet className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          {t('campaign.connectWalletTitle', 'Portefeuille non connecté')}
        </h2>
        <p className="text-muted-foreground text-center max-w-md">
          {t('campaign.connectWalletMessage', 'Veuillez connecter votre portefeuille pour accéder à la gestion de votre campagne.')}
        </p>
      </div>
    );
  }

  if (isLoading && !campaignData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">{t('campaign.loading', 'Chargement de votre campagne...')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-20 animate-in fade-in duration-700">

      {error && !campaignData ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] space-y-4 glass-card p-8 border-red-500/30">
          <AlertCircle className="h-10 w-10 text-red-500" />
          <p className="text-red-400 font-medium text-lg">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors text-sm font-bold uppercase tracking-wider"
          >
            {t('campaign.retry', 'Réessayer')}
          </button>
        </div>
      ) : (
        <>
          <CampaignHeader
            campaignData={campaignData}
            isLoading={isLoading}
            error={error}
          />

          {campaignData && (
            <Tabs defaultValue="finance" className="space-y-8">
              <div className="sticky top-20 z-30 bg-background/80 backdrop-blur-xl py-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:rounded-xl border-b sm:border border-white/5 shadow-lg shadow-black/5">
                <TabsList className="bg-muted/30 p-1 rounded-lg w-full flex justify-start overflow-x-auto no-scrollbar gap-2 h-auto">
                  <TabsTrigger value="finance" className="flex items-center gap-2 px-4 py-2.5 rounded-md data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all">
                    <BarChart3 className="h-4 w-4" />
                    {t('campaign.finance', 'Finance & Gestion')}
                  </TabsTrigger>
                  <TabsTrigger value="investors" className="flex items-center gap-2 px-4 py-2.5 rounded-md data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 transition-all">
                    <Users className="h-4 w-4" />
                    {t('campaign.investors', 'Investisseurs')}
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="flex items-center gap-2 px-4 py-2.5 rounded-md data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 transition-all">
                    <FileText className="h-4 w-4" />
                    {t('campaign.documents', 'Documents')}
                  </TabsTrigger>
                  <TabsTrigger value="social" className="flex items-center gap-2 px-4 py-2.5 rounded-md data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400 transition-all">
                    <Share2 className="h-4 w-4" />
                    {t('campaign.social', 'Social & Partage')}
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="focus-visible:outline-none focus-visible:ring-0">
                <TabsContent value="finance" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div className="space-y-8">
                      <DividendDistribution
                        campaignData={campaignData}
                        campaignAddress={campaignAddress}
                        onDistributionComplete={handleDistributionComplete}
                      />
                      <CampaignActions
                        campaignData={campaignData}
                        campaignAddress={campaignAddress}
                        onReopenClick={() => setShowReopenDialog(true)}
                        onPromoteClick={() => setShowPromoteDialog(true)}
                        onCertifyClick={() => setShowCertifyDialog(true)}
                        onActionComplete={handleActionComplete}
                      />
                    </div>
                    <div className="h-full">
                      <TransactionHistory
                        campaignAddress={campaignAddress}
                        onPreloadHover={handlePreloadHover}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="investors" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <CampaignInvestors
                    campaignAddress={campaignAddress}
                    onPreloadHover={handlePreloadHover}
                  />
                </TabsContent>

                <TabsContent value="documents" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <CampaignDocuments
                    campaignAddress={campaignAddress}
                    campaignData={campaignData}
                    onDocumentUpdate={handleDocumentUpdate}
                  />
                </TabsContent>

                <TabsContent value="social" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <CampaignSocial
                    campaignData={campaignData}
                    campaignAddress={campaignAddress}
                    onSocialUpdate={handleSocialUpdate}
                  />
                </TabsContent>
              </div>
            </Tabs>
          )}

          <ReopenCampaignDialog
            isOpen={showReopenDialog}
            onClose={() => setShowReopenDialog(false)}
            campaignData={campaignData}
            campaignAddress={campaignAddress}
            onSuccess={handleReopenSuccess}
          />

          <PromoteCampaignDialog
            isOpen={showPromoteDialog}
            onClose={() => setShowPromoteDialog(false)}
            campaignData={campaignData}
            campaignAddress={campaignAddress}
            onSuccess={handlePromoteSuccess}
          />

          <CertifyCampaignDialog
            isOpen={showCertifyDialog}
            onClose={() => setShowCertifyDialog(false)}
            campaignData={campaignData}
            campaignAddress={campaignAddress}
            onSuccess={handleCertifySuccess}
          />

          {process.env.NODE_ENV === 'development' && campaignData && (
            <div className="mt-12 p-4 rounded-xl border border-dashed border-white/10 bg-black/20 font-mono text-xs text-muted-foreground">
              <p className="font-bold text-white mb-2 uppercase tracking-wide">Developer Debug Info</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="opacity-50 block">Campaign Address</span>
                  <span className="text-primary">{campaignAddress}</span>
                </div>
                <div>
                  <span className="opacity-50 block">Environment</span>
                  <span className="text-yellow-400">Development</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
