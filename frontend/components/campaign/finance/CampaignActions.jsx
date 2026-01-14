"use client";

import React, { useState } from 'react';
import { useTranslation } from '@/hooks/useLanguage';
import { useToast } from '@/contexts/ToastContext';
import { useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Share2, Repeat, Megaphone, ShieldCheck, Zap } from 'lucide-react';
import { apiManager } from '@/lib/services/api-manager';

// Convertir WalletClient de wagmi en ethers Signer
function walletClientToSigner(walletClient) {
  const { account, chain, transport } = walletClient;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new ethers.providers.Web3Provider(transport, network);
  return provider.getSigner(account.address);
}

export default function CampaignActions({
  campaignData,
  campaignAddress,
  onReopenClick,
  onPromoteClick,
  onCertifyClick,
  onActionComplete
}) {
  const { t } = useTranslation();
  const { showError, showSuccess } = useToast();
  const { data: walletClient } = useWalletClient();
  const [isReleasingEscrow, setIsReleasingEscrow] = useState(false);
  const [escrowError, setEscrowError] = useState(null);

  const handleReleaseEscrow = async () => {
    if (!walletClient) {
      setEscrowError(t('campaignActions.walletNotConnected', 'Portefeuille non connecté'));
      return;
    }

    try {
      setIsReleasingEscrow(true);
      setEscrowError(null);

      const signer = walletClientToSigner(walletClient);
      await apiManager.claimEscrow(campaignAddress, signer);

      if (onActionComplete) {
        onActionComplete('escrow_released');
      }

      showSuccess(t('campaignActions.escrowSuccess'));

    } catch (error) {
      showError(error);
      setEscrowError(error.message || t('campaignActions.escrowError'));
    } finally {
      setIsReleasingEscrow(false);
    }
  };

  const handleShareCampaign = () => {
    if (navigator.share) {
      navigator.share({
        title: t('campaignActions.shareTitle', { name: campaignData.name }),
        text: t('campaignActions.shareText'),
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert(t('campaignActions.linkCopied'));
    }
  };

  const canReleaseEscrow = () => {
    return campaignData?.status === "Finalisée" &&
      parseFloat(campaignData?.raised || 0) >= parseFloat(campaignData?.goal || 0);
  };

  const canReopenCampaign = () => {
    return campaignData?.status === "Finalisée";
  };

  const needsCertification = () => {
    return !campaignData?.lawyer;
  };

  return (
    <Card className="glass-card border-white/10 overflow-hidden relative h-full">
      {/* Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <CardHeader>
        <CardTitle className="text-white flex items-center gap-3 text-xl">
          <div className="p-2 rounded-lg bg-white/5 border border-white/10 shadow-lg shadow-black/20">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          {t('campaignActions.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {escrowError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-sm font-medium">{escrowError}</p>
            </div>
          )}

          <div className="space-y-3">
            {/* Release Escrow - Primary Action */}
            <Button
              className={`w-full font-bold py-6 rounded-xl shadow-lg border-0 transition-all duration-300 relative overflow-hidden group ${canReleaseEscrow()
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-[1.02] shadow-green-500/20'
                : 'bg-white/5 text-gray-500 border border-white/10 hover:bg-white/10'
                }`}
              onClick={handleReleaseEscrow}
              disabled={!canReleaseEscrow() || isReleasingEscrow}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <div className="relative flex items-center justify-center">
                <DollarSign className={`mr-2 h-4 w-4 ${canReleaseEscrow() ? 'text-white' : 'text-gray-500'}`} />
                {isReleasingEscrow ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t('campaignActions.releasing')}
                  </div>
                ) : (
                  <>
                    <span className={canReleaseEscrow() ? 'text-white' : 'text-gray-500'}>
                      {t('campaignActions.releaseEscrow')}
                    </span>
                    {!canReleaseEscrow() && (
                      <span className="ml-2 text-xs opacity-60 font-normal">
                        ({t('campaignActions.goalNotReached')})
                      </span>
                    )}
                  </>
                )}
              </div>
            </Button>

            {/* Action Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                className={`w-full bg-white/5 text-white border border-white/10 hover:bg-primary/20 hover:border-primary/50 hover:text-primary transition-all duration-200 h-auto py-4 rounded-xl flex flex-col items-center gap-1 ${!canReopenCampaign() && 'opacity-50 cursor-not-allowed'}`}
                onClick={onReopenClick}
                disabled={!canReopenCampaign()}
              >
                <Repeat className="h-5 w-5 mb-1" />
                <span className="text-sm font-semibold">{t('campaignActions.reopen')}</span>
              </Button>

              <Button
                className="w-full bg-white/5 text-white border border-white/10 hover:bg-secondary/20 hover:border-secondary/50 hover:text-secondary transition-all duration-200 h-auto py-4 rounded-xl flex flex-col items-center gap-1"
                onClick={handleShareCampaign}
              >
                <Share2 className="h-5 w-5 mb-1" />
                <span className="text-sm font-semibold">{t('campaignActions.share')}</span>
              </Button>

              <Button
                className="w-full bg-white/5 text-white border border-white/10 hover:bg-accent/20 hover:border-accent/50 hover:text-accent transition-all duration-200 h-auto py-4 rounded-xl flex flex-col items-center gap-1 sm:col-span-2"
                onClick={onPromoteClick}
              >
                <Megaphone className="h-5 w-5 mb-1" />
                <div className="flex flex-col items-center">
                  <span className="text-sm font-semibold">{t('campaignActions.promote')}</span>
                  <span className="text-[10px] opacity-60 font-normal">{t('campaignActions.boostVisiblity', 'Booster la visibilité')}</span>
                </div>
              </Button>
            </div>

            {/* Certification désactivée pour le moment */}
            <Button
              className="w-full bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed opacity-50 py-6 rounded-xl"
              disabled={true}
            >
              <div className="flex items-center justify-center">
                <ShieldCheck className="mr-2 h-5 w-5" />
                <span className="font-bold">{t('campaignActions.certify')}</span>
                <span className="ml-2 px-2 py-0.5 bg-white/10 text-xs rounded-full">
                  {t('campaignActions.comingSoon', 'Bientôt')}
                </span>
              </div>
            </Button>
          </div>

          <div className="pt-4 border-t border-white/10">
            <div className="text-xs text-gray-500 space-y-1">
              <h4 className="font-bold text-gray-400 mb-2 uppercase tracking-wider">{t('campaignActions.information')}:</h4>
              <p className="flex gap-2"><span className="text-secondary">•</span> <span><strong>{t('campaignActions.releaseEscrow')}:</strong> {t('campaignActions.info1')}</span></p>
              <p className="flex gap-2"><span className="text-primary">•</span> <span><strong>{t('campaignActions.reopen')}:</strong> {t('campaignActions.info2')}</span></p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}