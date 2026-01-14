"use client";

import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from '@/hooks/useLanguage';
import NFTPreviewCard from '@/components/project/NFTPreviewCard';
import {
  DollarSign,
  Calendar,
  TrendingUp,
  Users,
  Target,
  FileText,
  Briefcase
} from 'lucide-react';

export default function ProjectOverview({ project, projectData }) {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    if (!project) return null;

    const progress = (parseFloat(project.raised) / parseFloat(project.goal)) * 100;
    const endDate = new Date(project.endDate);
    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
    const estimatedInvestors = Math.floor(parseFloat(project.raised) / parseFloat(project.sharePrice));

    const getProgressColor = () => {
      if (progress >= 100) return 'from-green-500 to-emerald-600';
      if (progress >= 80) return 'from-lime-500 to-green-500';
      if (progress >= 50) return 'from-yellow-500 to-lime-500';
      return 'from-orange-500 to-yellow-500';
    };

    return {
      progress,
      daysRemaining,
      estimatedInvestors,
      progressColor: getProgressColor(),
      remaining: (parseFloat(project.goal) - parseFloat(project.raised)).toFixed(4),
      sharesAvailable: Math.floor((parseFloat(project.goal) - parseFloat(project.raised)) / parseFloat(project.sharePrice))
    };
  }, [project]);

  if (!project || !stats) return null;

  // Use direct columns from projectData

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NFT Preview */}
        <NFTPreviewCard projectData={projectData} project={project} />

        {/* Stats clés */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('projectOverview.stats.keyInfo') || 'Informations clés'}
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-lime-50 dark:bg-lime-900/20 border border-lime-200 dark:border-lime-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-lime-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">{t('projectOverview.stats.raised')}</span>
              </div>
              <p className="text-xl font-bold text-lime-700 dark:text-lime-300">{project.raised} ETH</p>
              <p className="text-xs text-gray-500">/ {project.goal} ETH</p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-green-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">{t('projectOverview.stats.unitPrice')}</span>
              </div>
              <p className="text-xl font-bold text-green-700 dark:text-green-300">{project.sharePrice} ETH</p>
              <p className="text-xs text-gray-500">{t('projectOverview.stats.perShare')}</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-gray-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">{t('projectOverview.stats.investors')}</span>
              </div>
              <p className="text-xl font-bold text-gray-700 dark:text-gray-300">{stats.estimatedInvestors}</p>
              <p className="text-xs text-gray-500">{t('projectOverview.stats.participants')}</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-gray-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">{t('projectOverview.stats.deadline')}</span>
              </div>
              <p className="text-xl font-bold text-gray-700 dark:text-gray-300">{stats.daysRemaining}{t('projectOverview.daysUnit')}</p>
              <p className="text-xs text-gray-500">{new Date(project.endDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Barre de progression */}
      <Card className="border border-gray-200 dark:border-neutral-800">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('projectOverview.progress.title')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('projectOverview.progress.subtitle')}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-lime-600 dark:text-lime-400">
                  {stats.progress.toFixed(1)}%
                </div>
                <Badge className={`text-xs font-semibold ${stats.progress >= 100 ? 'bg-green-600 text-white' : 'bg-lime-500 text-white'}`}>
                  {stats.progress >= 100 ? t('projectOverview.progress.completed') : t('projectOverview.progress.inProgress')}
                </Badge>
              </div>
            </div>

            <div className="h-3 bg-gray-200 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(stats.progress, 100)}%` }}
                className={`h-full bg-gradient-to-r ${stats.progressColor} transition-all duration-500`}
              />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-lime-600 dark:text-lime-400">{project.raised}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">{t('projectOverview.progress.raised')}</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-600 dark:text-gray-400">{project.goal}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">{t('projectOverview.progress.goal')}</p>
              </div>
              <div>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">{stats.remaining}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">{t('projectOverview.progress.remaining')}</p>
              </div>
              <div>
                <p className="text-lg font-bold text-lime-600 dark:text-lime-400">{stats.sharesAvailable}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">{t('projectOverview.progress.sharesAvailable')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      {(projectData?.description || project.description) && (
        <Card className="border border-gray-200 dark:border-neutral-800">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-lime-600" />
              {t('projectDetailsTab.projectDescription')}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {projectData?.description || project.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Secteur */}
      {projectData?.category && (
        <Card className="border border-gray-200 dark:border-neutral-800">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-lime-600" />
              {t('projectOverview.stats.sectorLabel') || 'Secteur d\'activité'}
            </h3>
            <Badge className="bg-lime-100 dark:bg-lime-900/20 text-lime-700 dark:text-lime-300 text-base px-4 py-2">
              {projectData.category}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Team section removed - use direct DB columns if needed */}
    </div>
  );
}
