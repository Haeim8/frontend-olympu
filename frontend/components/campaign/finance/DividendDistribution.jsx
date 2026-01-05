"use client";

import React, { useState } from 'react';
import { useTranslation } from '@/hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DollarSign, Calculator, Info } from 'lucide-react';
import { apiManager } from '@/lib/services/api-manager';

export default function DividendDistribution({ campaignData, campaignAddress, onDistributionComplete }) {
  const { t } = useTranslation();
  const [distributeForm, setDistributeForm] = useState({
    amount: "",
    token: "ETH",
    message: ""
  });
  const [isDistributing, setIsDistributing] = useState(false);
  const [error, setError] = useState(null);

  const handleDistributeChange = (field, value) => {
    setDistributeForm(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const calculateDividendPerNFT = () => {
    const amount = parseFloat(distributeForm.amount);
    if (isNaN(amount) || amount <= 0) return 0;
    return (amount / (campaignData?.nftTotal || 1)).toFixed(6);
  };

  const calculateTotalRecipients = () => {
    return campaignData?.investors || 0;
  };

  const handleDistributeDividends = async () => {
    if (!distributeForm.amount || parseFloat(distributeForm.amount) <= 0) {
      setError(t('dividends.invalidAmount'));
      return;
    }

    setIsDistributing(true);
    setError(null);

    try {
      await apiManager.distributeDividends(
        campaignAddress,
        distributeForm.amount,
        distributeForm.message
      );

      setDistributeForm({ amount: "", token: "ETH", message: "" });

      if (onDistributionComplete) {
        onDistributionComplete();
      }

      // Success notification
      alert(t('dividends.distributionSuccess'));

    } catch (error) {
      console.error("Erreur lors de la distribution:", error);
      setError(error.message || t('dividends.distributionError'));
    } finally {
      setIsDistributing(false);
    }
  };

  const isFormValid = () => {
    return distributeForm.amount &&
      parseFloat(distributeForm.amount) > 0 &&
      !isDistributing;
  };

  return (
    <Card className="glass-card border-white/10 overflow-hidden relative group">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-primary/30 transition-colors" />

      <CardHeader>
        <CardTitle className="text-white flex items-center gap-3 text-xl">
          <div className="p-2 rounded-lg bg-white/5 border border-white/10 shadow-lg shadow-black/20">
            <DollarSign className="h-5 w-5 text-secondary" />
          </div>
          {t('dividends.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {error && (
            <Alert className="bg-red-500/10 border-red-500/20">
              <AlertTitle className="text-red-400 font-bold">{t('dividends.error')}</AlertTitle>
              <AlertDescription className="text-red-300">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="distributeAmount" className="text-gray-300 text-sm font-medium mb-2 block">
              {t('dividends.amountToDistribute')} <span className="text-secondary">*</span>
            </Label>
            <div className="relative mt-1">
              <Input
                id="distributeAmount"
                type="number"
                step="0.000001"
                min="0"
                value={distributeForm.amount}
                onChange={(e) => handleDistributeChange('amount', e.target.value)}
                placeholder="0.000000"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 rounded-xl pr-12 transition-all"
                disabled={isDistributing}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                <span className="text-secondary font-bold text-sm">ETH</span>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="distributeToken" className="text-gray-300 text-sm font-medium mb-2 block">
              {t('dividends.tokenToDistribute')}
            </Label>
            <Select
              onValueChange={(value) => handleDistributeChange('token', value)}
              defaultValue={distributeForm.token}
              disabled={isDistributing}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl focus:ring-secondary/50 mt-1">
                <SelectValue placeholder={t('dividends.selectToken')} />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a1a] border-white/10 text-white">
                <SelectItem value="ETH" className="focus:bg-white/10 focus:text-white">{t('dividends.ethToken')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="distributeMessage" className="text-gray-300 text-sm font-medium mb-2 block">
              {t('dividends.investorMessage')}
            </Label>
            <Input
              id="distributeMessage"
              value={distributeForm.message}
              onChange={(e) => handleDistributeChange('message', e.target.value)}
              placeholder={t('dividends.messagePlaceholder')}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 rounded-xl mt-1 transition-all"
              disabled={isDistributing}
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1.5 flex justify-end">
              {t('dividends.characterCount', { count: distributeForm.message.length })}
            </p>
          </div>

          {distributeForm.amount && parseFloat(distributeForm.amount) > 0 && (
            <Alert className="bg-gradient-to-r from-primary/10 to-secondary/10 border-white/10 backdrop-blur-md">
              <Calculator className="h-4 w-4 text-secondary" />
              <AlertTitle className="text-white font-bold mb-2">
                {t('dividends.distributionPreview')}
              </AlertTitle>
              <AlertDescription className="text-gray-300 space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                    <span className="block text-xs text-gray-400 mb-0.5">{t('dividends.perNFT')}</span>
                    <span className="text-lg font-bold text-secondary shadow-glow">{calculateDividendPerNFT()} ETH</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                    <span className="block text-xs text-gray-400 mb-0.5">{t('dividends.totalRecipients')}</span>
                    <span className="text-lg font-bold text-white">{t('dividends.investorsCount', { count: calculateTotalRecipients() })}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between items-center mt-2">
                  <span className="font-medium text-gray-400">{t('dividends.totalAmount')}: </span>
                  <span className="text-lg font-bold text-white">{distributeForm.amount} ETH</span>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleDistributeDividends}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark text-white font-bold py-6 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 border-0"
            disabled={!isFormValid()}
          >
            {isDistributing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {t('dividends.distributing')}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {t('dividends.distribute')}
              </div>
            )}
          </Button>

          <div className="text-xs text-gray-500 space-y-2 bg-white/5 p-3 rounded-xl border border-white/5">
            <div className="flex items-center gap-1 text-gray-400 mb-1">
              <Info className="w-3 h-3" />
              <span className="font-bold">Info</span>
            </div>
            <p className="ml-4">• {t('dividends.info1')}</p>
            <p className="ml-4">• {t('dividends.info2')}</p>
            <p className="ml-4">• {t('dividends.info3')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}