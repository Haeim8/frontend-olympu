"use client";

import React from 'react';
import { useTranslation } from '@/hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function CampaignHeader({ campaignData, isLoading, error }) {
  const { t } = useTranslation();
  
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
        <Card className="bg-white dark:bg-neutral-950 border-0 dark:border-0">
          <CardHeader>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
              ))}
            </div>
            <div className="mt-4 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="mt-2 h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900 rounded-lg">
        <p className="text-red-600 dark:text-red-200">{t('campaignHeader.error')}: {error}</p>
      </div>
    );
  }

  if (!campaignData) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
        <p className="text-yellow-600 dark:text-yellow-200">{t('campaignHeader.noData')}</p>
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

  const getStatusColor = (status) => {
    switch (status) {
      case "En cours":
      case "Ongoing":
      case "En progreso":
        return "text-green-600 dark:text-green-400";
      case "Finalisée":
      case "Finalized":
      case "Finalizada":
        return "text-blue-600 dark:text-blue-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {t('campaignHeader.title')}
      </h1>

      <Card className="bg-white dark:bg-neutral-950 border-0 dark:border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center justify-between">
            <span>{campaignData.name}</span>
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${
              campaignData.status === "En cours" 
                ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                : "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
            }`}>
              {campaignData.status}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('campaignHeader.status')}</p>
              <p className={`text-lg font-semibold ${getStatusColor(campaignData.status)}`}>
                {campaignData.status}
              </p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('campaignHeader.raised')}</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {parseFloat(campaignData.raised).toFixed(4)} ETH
              </p>
              <p className="text-xs text-gray-400">
                {t('campaignHeader.ofGoal', { percent: progressPercentage.toFixed(1) })}
              </p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('campaignHeader.goal')}</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {parseFloat(campaignData.goal).toFixed(4)} ETH
              </p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('campaignHeader.investors')}</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {campaignData.investors}
              </p>
              <p className="text-xs text-gray-400">
                {t('campaignHeader.nftsMax', { count: campaignData.nftTotal })}
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('campaignHeader.progress')}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {progressPercentage.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-3 bg-gray-200 dark:bg-gray-700" 
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              {campaignData.status === "En cours" || campaignData.status === "Ongoing" || campaignData.status === "En progreso"
                ? formatTimeRemaining(campaignData.timeRemaining)
                : t('campaignHeader.ended')}
            </p>
          </div>

          {campaignData.lawyer && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    {t('campaignHeader.lawyerCertified')}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300">
                    Vérifiée par {campaignData.lawyer}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}