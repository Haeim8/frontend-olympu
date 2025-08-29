"use client";

import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from '@/hooks/useLanguage';
import { 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  Users, 
  Target,
  Clock,
  Percent,
  Award
} from 'lucide-react';

const StatCard = ({ icon: Icon, title, value, subtitle, color = "lime" }) => {
  const { t } = useTranslation();
  
  const colorClasses = {
    lime: "text-lime-600 bg-lime-50 dark:bg-lime-900/20 border-lime-200 dark:border-lime-800",
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    purple: "text-purple-600 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
    orange: "text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
    green: "text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
  };

  return (
    <Card className={`border ${colorClasses[color]} hover:shadow-md transition-shadow duration-200`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function ProjectOverview({ project }) {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    if (!project) return null;

    const progress = (parseFloat(project.raised) / parseFloat(project.goal)) * 100;
    const endDate = new Date(project.endDate);
    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
    const estimatedInvestors = Math.floor(parseFloat(project.raised) / parseFloat(project.sharePrice)) || 0;

    const getTimeStatus = () => {
      if (endDate < now) return { text: t('projectOverview.status.ended'), color: 'orange' };
      if (daysRemaining <= 7) return { text: `${daysRemaining}${t('projectOverview.daysUnit')}`, color: 'orange' };
      return { text: `${daysRemaining}${t('projectOverview.daysUnit')}`, color: 'blue' };
    };

    const getProgressColor = () => {
      if (progress >= 100) return 'from-green-500 to-emerald-600';
      if (progress >= 80) return 'from-orange-500 to-amber-600';
      return 'from-lime-500 to-green-500';
    };

    return {
      progress,
      daysRemaining,
      estimatedInvestors,
      timeStatus: getTimeStatus(),
      progressColor: getProgressColor(),
      remaining: (parseFloat(project.goal) - parseFloat(project.raised)).toFixed(2),
      sharesAvailable: Math.floor((parseFloat(project.goal) - parseFloat(project.raised)) / parseFloat(project.sharePrice))
    };
  }, [project, t]);

  if (!project || !stats) return null;

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={DollarSign}
          title={t('projectOverview.stats.raised')}
          value={`${project.raised} ETH`}
          subtitle={`/ ${project.goal} ETH`}
          color="lime"
        />

        <StatCard
          icon={Target}
          title={t('projectOverview.stats.unitPrice')}
          value={`${project.sharePrice} ETH`}
          subtitle={t('projectOverview.stats.perShare')}
          color="blue"
        />

        <StatCard
          icon={Users}
          title={t('projectOverview.stats.investors')}
          value={stats.estimatedInvestors.toString()}
          subtitle={t('projectOverview.stats.participants')}
          color="purple"
        />

        <StatCard
          icon={Calendar}
          title={t('projectOverview.stats.deadline')}
          value={stats.timeStatus.text}
          color={stats.timeStatus.color}
        />
      </div>

      {/* Progress Section */}
      <Card className="border border-gray-200 dark:border-neutral-800">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Progress Header */}
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
                <div className="text-2xl font-bold text-lime-600 dark:text-lime-400">
                  {stats.progress.toFixed(1)}%
                </div>
                <Badge variant="outline" className="text-xs">
                  {stats.progress >= 100 
                    ? t('projectOverview.progress.completed') 
                    : t('projectOverview.progress.inProgress')}
                </Badge>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.min(stats.progress, 100)}%` }}
                  className={`h-full bg-gradient-to-r ${stats.progressColor} transition-all duration-500`}
                />
              </div>
            </div>

            {/* Progress Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-lime-600 dark:text-lime-400">
                  {project.raised}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                  {t('projectOverview.progress.raised')}
                </p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-600 dark:text-gray-400">
                  {project.goal}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                  {t('projectOverview.progress.goal')}
                </p>
              </div>
              <div>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {stats.remaining}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                  {t('projectOverview.progress.remaining')}
                </p>
              </div>
              <div>
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {stats.sharesAvailable}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                  {t('projectOverview.progress.sharesAvailable')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}