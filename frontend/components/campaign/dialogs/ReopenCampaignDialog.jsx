"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from '@/hooks/useLanguage';
import { Calendar, DollarSign, Repeat, AlertTriangle, Info } from 'lucide-react';
import { apiManager } from '@/lib/services/api-manager';

export default function ReopenCampaignDialog({ 
  isOpen, 
  onClose, 
  campaignData, 
  campaignAddress, 
  onSuccess 
}) {
  const { t } = useTranslation();
  const [reopenForm, setReopenForm] = useState({
    goal: "",
    sharePrice: "",
    endDate: "",
    description: ""
  });
  const [isReopening, setIsReopening] = useState(false);
  const [error, setError] = useState(null);

  const handleFormChange = (field, value) => {
    setReopenForm(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const validateForm = () => {
    if (!reopenForm.goal || parseFloat(reopenForm.goal) <= 0) {
      return t('dialog.reopen.validation.goalPositive');
    }
    
    if (!reopenForm.sharePrice || parseFloat(reopenForm.sharePrice) <= 0) {
      return t('dialog.reopen.validation.pricePositive');
    }
    
    if (parseFloat(reopenForm.sharePrice) < parseFloat(campaignData?.nftPrice || 0)) {
      return t('dialog.reopen.validation.priceLowerThanPrevious');
    }

    if (!reopenForm.endDate) {
      return t('dialog.reopen.validation.endDateRequired');
    }

    const endDate = new Date(reopenForm.endDate);
    const now = new Date();
    if (endDate <= now) {
      return t('dialog.reopen.validation.endDateFuture');
    }

    const minDuration = 7 * 24 * 60 * 60 * 1000; // 7 jours
    if (endDate.getTime() - now.getTime() < minDuration) {
      return t('dialog.reopen.validation.minDuration');
    }
    
    return null;
  };

  const calculateEstimatedNFTs = () => {
    const goal = parseFloat(reopenForm.goal);
    const price = parseFloat(reopenForm.sharePrice);
    if (goal > 0 && price > 0) {
      return Math.floor(goal / price);
    }
    return 0;
  };

  const calculateDuration = () => {
    if (!reopenForm.endDate) return 0;
    const endDate = new Date(reopenForm.endDate);
    const now = new Date();
    return Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleReopenCampaign = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsReopening(true);
    setError(null);

    try {
      const targetAmount = reopenForm.goal;
      const sharePrice = reopenForm.sharePrice;
      const endDate = new Date(reopenForm.endDate);
      const duration = Math.floor((endDate.getTime() - Date.now()) / 1000);

      await apiManager.startNewRound(
        campaignAddress,
        targetAmount,
        sharePrice,
        duration
      );

      // Réinitialiser le formulaire
      setReopenForm({
        goal: "",
        sharePrice: "",
        endDate: "",
        description: ""
      });

      if (onSuccess) {
        onSuccess();
      }

      onClose();
      alert(t('dialog.reopen.success'));

    } catch (error) {
      console.error("Erreur lors de la réouverture:", error);
      setError(error.message || t('dialog.reopen.error'));
    } finally {
      setIsReopening(false);
    }
  };

  const isFormValid = () => {
    return validateForm() === null && !isReopening;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-neutral-950 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Repeat className="h-5 w-5 text-lime-500" />
            {t('dialog.reopen.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert className="bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-800">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertTitle className="text-red-800 dark:text-red-200">{t('dialog.reopen.errorTitle')}</AlertTitle>
              <AlertDescription className="text-red-700 dark:text-red-300">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Informations sur la campagne actuelle */}
          <div className="p-4 bg-lime-50 dark:bg-lime-900/20 rounded-lg border border-lime-200 dark:border-lime-800">
            <h4 className="font-medium text-lime-800 dark:text-lime-200 mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              {t('dialog.reopen.previousCampaign')}
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-lime-600 dark:text-lime-400">{t('dialog.reopen.goal')}:</span>
                <p className="font-semibold text-lime-800 dark:text-lime-200">
                  {campaignData?.goal || 0} ETH
                </p>
              </div>
              <div>
                <span className="text-lime-600 dark:text-lime-400">{t('dialog.reopen.raised')}:</span>
                <p className="font-semibold text-lime-800 dark:text-lime-200">
                  {campaignData?.raised || 0} ETH
                </p>
              </div>
              <div>
                <span className="text-lime-600 dark:text-lime-400">{t('dialog.reopen.nftPrice')}:</span>
                <p className="font-semibold text-lime-800 dark:text-lime-200">
                  {campaignData?.nftPrice || 0} ETH
                </p>
              </div>
              <div>
                <span className="text-lime-600 dark:text-lime-400">{t('dialog.reopen.investors')}:</span>
                <p className="font-semibold text-lime-800 dark:text-lime-200">
                  {campaignData?.investors || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Formulaire */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="reopen-goal" className="text-gray-700 dark:text-gray-300 font-medium">
                {t('dialog.reopen.newGoal')}
              </Label>
              <div className="relative mt-1">
                <Input
                  id="reopen-goal"
                  type="number"
                  step="0.01"
                  min="0"
                  value={reopenForm.goal}
                  onChange={(e) => handleFormChange('goal', e.target.value)}
                  placeholder={t('dialog.reopen.goalPlaceholder')}
                  className="bg-gray-50 dark:bg-neutral-900 pr-12"
                  disabled={isReopening}
                />
                <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <Label htmlFor="reopen-price" className="text-gray-700 dark:text-gray-300 font-medium">
                {t('dialog.reopen.newNftPrice')}
              </Label>
              <div className="relative mt-1">
                <Input
                  id="reopen-price"
                  type="number"
                  step="0.001"
                  min={campaignData?.nftPrice || "0"}
                  value={reopenForm.sharePrice}
                  onChange={(e) => handleFormChange('sharePrice', e.target.value)}
                  placeholder={t('dialog.reopen.pricePlaceholder')}
                  className="bg-gray-50 dark:bg-neutral-900 pr-12"
                  disabled={isReopening}
                />
                <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('dialog.reopen.minimum')}: {campaignData?.nftPrice || 0} ETH ({t('dialog.reopen.previousPrice')})
              </p>
            </div>

            <div>
              <Label htmlFor="reopen-date" className="text-gray-700 dark:text-gray-300 font-medium">
                {t('dialog.reopen.newEndDate')}
              </Label>
              <div className="relative mt-1">
                <Input
                  id="reopen-date"
                  type="datetime-local"
                  value={reopenForm.endDate}
                  onChange={(e) => handleFormChange('endDate', e.target.value)}
                  min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                  className="bg-gray-50 dark:bg-neutral-900 pr-12"
                  disabled={isReopening}
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              {reopenForm.endDate && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('dialog.reopen.duration')}: {calculateDuration()} {t('dialog.reopen.days')}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="reopen-description" className="text-gray-700 dark:text-gray-300 font-medium">
                {t('dialog.reopen.messageInvestors')}
              </Label>
              <Textarea
                id="reopen-description"
                value={reopenForm.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder={t('dialog.reopen.messagePlaceholder')}
                className="bg-gray-50 dark:bg-neutral-900 mt-1 h-20"
                disabled={isReopening}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {reopenForm.description.length}/500 {t('dialog.reopen.characters')}
              </p>
            </div>
          </div>

          {/* Aperçu */}
          {reopenForm.goal && reopenForm.sharePrice && (
            <Alert className="bg-lime-50 dark:bg-lime-900/20 border-lime-200 dark:border-lime-800">
              <Info className="h-4 w-4 text-lime-600 dark:text-lime-400" />
              <AlertTitle className="text-lime-800 dark:text-lime-200">
                {t('dialog.reopen.previewTitle')}
              </AlertTitle>
              <AlertDescription className="text-lime-700 dark:text-lime-300">
                <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                  <div>
                    <span className="font-medium">{t('dialog.reopen.availableNfts')}:</span>
                    <br />
                    <span className="text-lg font-bold">{calculateEstimatedNFTs()}</span>
                  </div>
                  <div>
                    <span className="font-medium">{t('dialog.reopen.duration')}:</span>
                    <br />
                    <span className="text-lg font-bold">{calculateDuration()} {t('dialog.reopen.days')}</span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isReopening}
              className="min-w-[100px]"
            >
              {t('dialog.reopen.cancel')}
            </Button>
            <Button
              onClick={handleReopenCampaign}
              disabled={!isFormValid()}
              className="bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-white min-w-[140px]"
            >
              {isReopening ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t('dialog.reopen.reopening')}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Repeat className="h-4 w-4" />
                  {t('dialog.reopen.reopenButton')}
                </div>
              )}
            </Button>
          </div>

          {/* Notes importantes */}
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700">
            <p><strong>{t('dialog.reopen.important')}:</strong></p>
            <p>• {t('dialog.reopen.note1')}</p>
            <p>• {t('dialog.reopen.note2')}</p>
            <p>• {t('dialog.reopen.note3')}</p>
            <p>• {t('dialog.reopen.note4')}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
