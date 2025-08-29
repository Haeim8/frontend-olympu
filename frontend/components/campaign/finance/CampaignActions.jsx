"use client";

import React, { useState } from 'react';
import { useTranslation } from '@/hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Share2, Repeat, Megaphone, ShieldCheck } from 'lucide-react';
import { apiManager } from '@/lib/services/api-manager';

export default function CampaignActions({ 
  campaignData, 
  campaignAddress, 
  onReopenClick, 
  onPromoteClick, 
  onCertifyClick,
  onActionComplete 
}) {
  const { t } = useTranslation();
  const [isReleasingEscrow, setIsReleasingEscrow] = useState(false);
  const [escrowError, setEscrowError] = useState(null);

  const handleReleaseEscrow = async () => {
    try {
      setIsReleasingEscrow(true);
      setEscrowError(null);
      
      await apiManager.claimEscrow(campaignAddress);
      
      if (onActionComplete) {
        onActionComplete('escrow_released');
      }
      
      alert(t('campaignActions.escrowSuccess'));
      
    } catch (error) {
      console.error("Erreur lors de la libération de l'escrow:", error);
      setEscrowError(error.message || t('campaignActions.escrowError'));
      alert(error.message);
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
    <Card className="bg-white dark:bg-neutral-950 border-0 dark:border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Repeat className="h-5 w-5 text-blue-500" />
          {t('campaignActions.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {escrowError && (
            <div className="p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-200 text-sm">{escrowError}</p>
            </div>
          )}

          <Button 
            className="w-full bg-gray-200 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors duration-200" 
            onClick={onReopenClick}
            disabled={!canReopenCampaign()}
          >
            <Repeat className="mr-2 h-4 w-4" />
            {t('campaignActions.reopen')}
            {!canReopenCampaign() && (
              <span className="ml-2 text-xs opacity-60">({t('campaignActions.activeStatus')})</span>
            )}
          </Button>
          
          <Button 
            className="w-full bg-gray-200 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors duration-200"
            onClick={handleShareCampaign}
          >
            <Share2 className="mr-2 h-4 w-4" />
            {t('campaignActions.share')}
          </Button>
          
          <Button 
            className="w-full bg-green-600 hover:bg-green-700 text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleReleaseEscrow}
            disabled={!canReleaseEscrow() || isReleasingEscrow}
          >
            <DollarSign className="mr-2 h-4 w-4" />
            {isReleasingEscrow ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {t('campaignActions.releasing')}
              </div>
            ) : (
              <>
                {t('campaignActions.releaseEscrow')}
                {!canReleaseEscrow() && (
                  <span className="ml-2 text-xs opacity-80">
                    ({t('campaignActions.goalNotReached')})
                  </span>
                )}
              </>
            )}
          </Button>
          
          <Button 
            className="w-full bg-purple-600 hover:bg-purple-700 text-white transition-colors duration-200" 
            onClick={onPromoteClick}
          >
            <Megaphone className="mr-2 h-4 w-4" />
{t('campaignActions.promote')}
          </Button>
          
          {needsCertification() && (
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200" 
              onClick={onCertifyClick}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
{t('campaignActions.certify')}
              <span className="ml-2 px-2 py-1 bg-blue-500 text-xs rounded-full">
                {t('campaignActions.recommended')}
              </span>
            </Button>
          )}

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">{t('campaignActions.information')}:</h4>
              <p>• <strong>{t('campaignActions.releaseEscrow')}:</strong> {t('campaignActions.info1')}</p>
              <p>• <strong>{t('campaignActions.reopen')}:</strong> {t('campaignActions.info2')}</p>
              <p>• <strong>{t('campaignActions.certify')}:</strong> {t('campaignActions.info3')}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}