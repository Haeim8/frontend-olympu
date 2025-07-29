"use client";

import React from 'react';
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Star, TrendingUp, Users, Calendar } from 'lucide-react';

export default function ProjectHeader({ 
  project, 
  isFavorite, 
  onFavorite, 
  onShare 
}) {
  const getProjectStatus = () => {
    const endDate = new Date(project.endDate);
    const now = new Date();
    const progress = (parseFloat(project.raised) / parseFloat(project.goal)) * 100;
    
    if (endDate < now) return { status: 'expired', label: 'Terminé', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' };
    if (progress >= 100) return { status: 'success', label: 'Objectif atteint', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' };
    if (progress >= 80) return { status: 'near', label: 'Bientôt complet', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' };
    return { status: 'active', label: 'En cours', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' };
  };

  const projectStatus = getProjectStatus();
  const progress = (parseFloat(project.raised) / parseFloat(project.goal)) * 100;

  return (
    <div className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-lime-50 via-white to-emerald-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 opacity-60"></div>
      
      <div className="relative">
        <div className="flex justify-between items-start mb-6">
          <DialogHeader className="space-y-4 flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <div className="w-3 h-3 bg-lime-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 bg-lime-500 rounded-full animate-ping opacity-75"></div>
              </div>
              <Badge className={`${projectStatus.color} px-3 py-1 font-medium`}>
                {projectStatus.label}
              </Badge>
              <Badge className="bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 px-3 py-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                {progress.toFixed(1)}% financé
              </Badge>
            </div>

            <DialogTitle className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-gray-100 dark:via-gray-200 dark:to-gray-300 bg-clip-text text-transparent leading-tight">
              {project.name}
              <span className="block text-xl md:text-2xl bg-gradient-to-r from-lime-500 to-emerald-600 bg-clip-text text-transparent mt-2">
                Projet d'investissement
              </span>
            </DialogTitle>
            
            <DialogDescription className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
              Consultez les détails complets du projet et investissez en achetant des shares pour participer au financement.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center space-x-2 ml-6">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onShare}
              className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border-gray-200/50 dark:border-neutral-700/50 hover:bg-white dark:hover:bg-neutral-800 group"
            >
              <Share2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onFavorite}
              className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border-gray-200/50 dark:border-neutral-700/50 hover:bg-white dark:hover:bg-neutral-800 group"
            >
              <Star className={`h-5 w-5 transition-all duration-300 ${
                isFavorite 
                  ? 'text-yellow-400 fill-yellow-400 scale-110' 
                  : 'group-hover:text-yellow-400 group-hover:scale-110'
              }`} />
            </Button>
          </div>
        </div>

        {/* Quick stats preview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-neutral-700/50">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-lime-600" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Levé</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {project.raised} ETH
            </p>
          </div>

          <div className="bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-neutral-700/50">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Objectif</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {project.goal} ETH
            </p>
          </div>

          <div className="bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-neutral-700/50">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Prix</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {project.sharePrice} ETH
            </p>
          </div>

          <div className="bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-neutral-700/50">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Fin</span>
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {project.endDate}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-neutral-700/50">
          <div className="flex mb-2 items-center justify-between">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Progression du financement</span>
            <span className="text-sm font-semibold text-lime-600 dark:text-lime-400">
              {progress.toFixed(2)}%
            </span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              style={{ width: `${Math.min(progress, 100)}%` }}
              className="h-full bg-gradient-to-r from-lime-500 to-emerald-600 rounded-full transition-all duration-1000 ease-out"
            />
          </div>
          <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{project.raised} ETH levés</span>
            <span>{project.goal} ETH objectif</span>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-lime-400/20 to-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-emerald-400/20 to-lime-500/20 rounded-full blur-lg animate-pulse delay-1000"></div>
      </div>
    </div>
  );
}