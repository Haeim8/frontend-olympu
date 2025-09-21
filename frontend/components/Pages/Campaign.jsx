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
          setError(t('campaign.noCampaignFound'));
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Erreur initialisation campagne:', err);
        setError(t('campaign.loadError'));
        setCampaignAddress(null);
        setCampaignData(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    initializeCampaign();
  }, [address]);

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
          setError(t('campaign.loadDataError'));
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Erreur chargement campagne:', err);
        setError(t('campaign.dataLoadingError'));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadCampaignData();
  }, [campaignAddress]);

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
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600 dark:text-gray-400">
          {t('campaign.connectWalletMessage')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      <CampaignHeader
        campaignData={campaignData}
        isLoading={isLoading}
        error={error}
      />

      {!isLoading && !error && campaignData && (
        <Tabs defaultValue="finance" className="space-y-6">
          <TabsList className="bg-gray-100 dark:bg-neutral-900 p-1 rounded-lg">
            <TabsTrigger
              value="finance"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 px-6 py-2"
            >
              {t('campaign.finance')}
            </TabsTrigger>
            <TabsTrigger
              value="investors"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 px-6 py-2"
            >
              {t('campaign.investors')}
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 px-6 py-2"
            >
              {t('campaign.documents')}
            </TabsTrigger>
            <TabsTrigger
              value="social"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 px-6 py-2"
            >
              {t('campaign.social')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="finance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <TransactionHistory
              campaignAddress={campaignAddress}
              onPreloadHover={handlePreloadHover}
            />
          </TabsContent>

          <TabsContent value="investors">
            <CampaignInvestors
              campaignAddress={campaignAddress}
              onPreloadHover={handlePreloadHover}
            />
          </TabsContent>

          <TabsContent value="documents">
            <CampaignDocuments
              campaignAddress={campaignAddress}
              campaignData={campaignData}
              onDocumentUpdate={handleDocumentUpdate}
            />
          </TabsContent>

          <TabsContent value="social">
            <CampaignSocial
              campaignData={campaignData}
              campaignAddress={campaignAddress}
              onSocialUpdate={handleSocialUpdate}
            />
          </TabsContent>
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
        <div className="mt-8 p-4 bg-gray-100 dark:bg-neutral-900 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Debug Info (dev only)
          </h3>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <p>Campaign Address: {campaignAddress}</p>
            <p>Cache Stats: {JSON.stringify(apiManager.getCacheStats?.() ?? {}, null, 2)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
