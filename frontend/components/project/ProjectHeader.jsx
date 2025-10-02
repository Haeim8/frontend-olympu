"use client";

import React from 'react';
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Star, TrendingUp, Sparkles } from 'lucide-react';
import { useTranslation } from '@/hooks/useLanguage';

export default function ProjectHeader({
  project,
  projectData,
  isFavorite,
  onFavorite,
  onShare
}) {
  const { t } = useTranslation();

  const getProjectStatus = () => {
    const endDate = new Date(project.endDate);
    const now = new Date();
    const progress = (parseFloat(project.raised) / parseFloat(project.goal)) * 100;

    if (endDate < now) return { status: 'expired', label: t('projectHeader.projectStatus.expired'), color: 'bg-gray-600 text-white dark:bg-gray-700 dark:text-white' };
    if (progress >= 100) return { status: 'success', label: t('projectHeader.projectStatus.success'), color: 'bg-green-600 text-white dark:bg-green-700 dark:text-white' };
    if (progress >= 80) return { status: 'near', label: t('projectHeader.projectStatus.near'), color: 'bg-lime-500 text-white dark:bg-lime-600 dark:text-white' };
    return { status: 'active', label: t('projectHeader.projectStatus.active'), color: 'bg-lime-500 text-white dark:bg-lime-600 dark:text-white' };
  };

  const projectStatus = getProjectStatus();
  const progress = (parseFloat(project.raised) / parseFloat(project.goal)) * 100;

  return (
    <div className="relative">
      <div className="flex justify-between items-start gap-4">
        <DialogHeader className="space-y-3 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Indicateur live */}
            <div className="relative flex items-center gap-2">
              <div className="w-2 h-2 bg-lime-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-2 h-2 bg-lime-500 rounded-full animate-ping opacity-75"></div>
            </div>

            <Badge className={`${projectStatus.color} px-3 py-1.5 font-semibold text-sm shadow-sm`}>
              {projectStatus.label}
            </Badge>

            <Badge className="bg-gradient-to-r from-lime-500 to-green-500 text-white px-3 py-1.5 font-semibold text-sm shadow-sm">
              <TrendingUp className="h-4 w-4 mr-1" />
              {t('projectHeader.fundedPercent', { percent: progress.toFixed(1) })}
            </Badge>
          </div>

          <DialogTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-gray-100 dark:via-gray-200 dark:to-gray-300 bg-clip-text text-transparent leading-tight">
            {project.name}
          </DialogTitle>

          <DialogDescription className="text-base text-gray-600 dark:text-gray-400">
            {t('projectHeader.consultDetails')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 ml-4 mr-12">
          <Button
            variant="outline"
            size="icon"
            onClick={onShare}
            className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border-gray-200/50 dark:border-neutral-700/50 hover:bg-lime-50 dark:hover:bg-lime-900/20 hover:border-lime-300 dark:hover:border-lime-700 group transition-all shadow-sm hover:shadow"
          >
            <Share2 className="h-5 w-5 group-hover:scale-110 transition-transform text-gray-600 dark:text-gray-400 group-hover:text-lime-600" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onFavorite}
            className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border-gray-200/50 dark:border-neutral-700/50 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:border-yellow-300 dark:hover:border-yellow-700 group transition-all shadow-sm hover:shadow"
          >
            <Star className={`h-5 w-5 transition-all duration-300 ${
              isFavorite
                ? 'text-yellow-400 fill-yellow-400 scale-110'
                : 'text-gray-600 dark:text-gray-400 group-hover:text-yellow-400 group-hover:scale-110'
            }`} />
          </Button>
        </div>
      </div>
    </div>
  );
}
