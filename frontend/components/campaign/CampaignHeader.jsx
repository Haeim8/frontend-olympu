"use client";

import React from 'react';
import { useTranslation } from '@/hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatEth } from '@/lib/utils/formatNumber';
import { Shield, Clock, TrendingUp, Users, Target } from "lucide-react";

export default function CampaignHeader({ campaignData, isLoading, error }) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-48 mb-4"></div>
        <div className="h-40 bg-muted rounded-xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
        <p className="text-destructive">{t('campaignHeader.error')}: {error}</p>
      </div>
    );
  }

  if (!campaignData) {
    return (
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
        <p className="text-yellow-600 dark:text-yellow-400">{t('campaignHeader.noData')}</p>
      </div>
    );
  }

  const progressPercentage = ((parseFloat(campaignData.raised) / parseFloat(campaignData.goal)) * 100) || 0;

  const formatTimeRemaining = (timeRemaining) => {
    if (timeRemaining <= 0) return t('campaignHeader.ended');
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return t('campaignHeader.daysLeft', { count: days, plural: days > 1 ? 's' : '' });
    } else if (hours > 0) {
      return t('campaignHeader.hoursLeft', { count: hours, plural: hours > 1 ? 's' : '' });
    } else {
      return t('campaignHeader.lessThanHour');
    }
  };

  const statusConfig = {
    "En cours": { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800" },
    "Ongoing": { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800" },
    "Finalisée": { color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/20", border: "border-green-200 dark:border-green-800" },
    "Finalized": { color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/20", border: "border-green-200 dark:border-green-800" },
  };

  const getStatusStyle = (status) => statusConfig[status] || { color: "text-muted-foreground", bg: "bg-muted", border: "border-border" };
  const statusStyle = getStatusStyle(campaignData.status);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t('campaignHeader.title')}
        </h1>
        <div className={`px-3 py-1 rounded-full text-sm font-semibold border ${statusStyle.bg} ${statusStyle.border} ${statusStyle.color}`}>
          {campaignData.status}
        </div>
      </div>

      <Card className="border-border shadow-sm bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            {campaignData.name}
            {campaignData.lawyer && <Shield className="w-5 h-5 text-primary" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-2">
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground font-medium">{t('campaignHeader.raised')}</p>
              </div>
              <p className="text-xl font-bold text-foreground">
                {formatEth(campaignData.raised)}
              </p>
              <p className="text-xs text-primary mt-1 font-medium">
                {progressPercentage.toFixed(1)}% {t('campaignHeader.ofGoal', { percent: '' })}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground font-medium">{t('campaignHeader.goal')}</p>
              </div>
              <p className="text-xl font-bold text-foreground">
                {formatEth(campaignData.goal)}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground font-medium">{t('campaignHeader.investors')}</p>
              </div>
              <p className="text-xl font-bold text-foreground">
                {campaignData.investors}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('campaignHeader.nftsMax', { count: campaignData.nftTotal })}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground font-medium">{t('campaignHeader.timeRemaining', 'Temps restant')}</p>
              </div>
              <p className="text-lg font-bold text-foreground">
                {campaignData.status === "En cours" || campaignData.status === "Ongoing"
                  ? formatTimeRemaining(campaignData.timeRemaining)
                  : t('campaignHeader.ended')}
              </p>
            </div>
          </div>

          <div className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">
                {t('campaignHeader.progress')}
              </span>
              <span className="text-sm font-bold text-primary">
                {progressPercentage.toFixed(1)}%
              </span>
            </div>
            <Progress
              value={progressPercentage}
              className="h-2.5 bg-muted"
            // shadcn Progress uses bg-primary for indicator by default, no need for custom class
            />
          </div>

          {campaignData.lawyer && (
            <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-primary">
                  {t('campaignHeader.lawyerCertified')}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Vérifiée par <span className="text-foreground font-medium">{campaignData.lawyer}</span>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}