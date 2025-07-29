"use client";

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Eye, 
  ArrowRight, 
  Shield, 
  TrendingUp, 
  Users, 
  Clock,
  DollarSign,
  Zap,
  Star,
  CheckCircle
} from 'lucide-react';

export default function CampaignCard({ 
  project, 
  onViewDetails, 
  onPreloadHover 
}) {
  const [isHovered, setIsHovered] = useState(false);

  const progressPercentage = ((parseFloat(project.raised) / parseFloat(project.goal)) * 100) || 0;
  const isNearCompletion = progressPercentage >= 80;
  const isHotProject = progressPercentage > 50 && project.isActive;

  const formatTimeRemaining = () => {
    if (!project.isActive) return 'Terminé';
    
    // Simuler le temps restant basé sur la date de fin
    const now = new Date();
    const endDate = new Date(project.endDate);
    const timeRemaining = endDate - now;
    
    if (timeRemaining <= 0) return 'Terminé';
    
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days}j restants`;
    
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    return `${hours}h restantes`;
  };

  const getStatusColor = () => {
    if (!project.isActive) return 'bg-gray-500';
    if (isNearCompletion) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getProgressBarColor = () => {
    if (progressPercentage >= 100) return 'bg-gradient-to-r from-green-500 to-emerald-600';
    if (isNearCompletion) return 'bg-gradient-to-r from-orange-500 to-red-500';
    return 'bg-gradient-to-r from-lime-500 to-green-500';
  };

  return (
    <Card 
      className="group relative overflow-hidden bg-white dark:bg-neutral-950 hover:shadow-2xl transition-all duration-500 cursor-pointer border-0 shadow-lg hover:-translate-y-2"
      onMouseEnter={() => {
        setIsHovered(true);
        if (onPreloadHover) {
          onPreloadHover(project.id);
        }
      }}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onViewDetails && onViewDetails(project)}
    >
      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-lime-400 via-blue-500 to-purple-600"></div>
      </div>

      {/* Hot Project Badge */}
      {isHotProject && (
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 px-2 py-1 text-xs animate-pulse">
            <Zap className="h-3 w-3 mr-1" />
            Hot
          </Badge>
        </div>
      )}

      {/* Status Indicator */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        {project.isCertified && (
          <div className="p-1.5 bg-blue-500 rounded-full">
            <Shield className="h-3 w-3 text-white" />
          </div>
        )}
        <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`}></div>
      </div>

      <CardContent className="p-0">
        {/* Header Section */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors duration-300">
                {project.name}
              </h3>
              <div className="flex items-center gap-2 mb-3">
                <Badge 
                  variant="outline" 
                  className="text-xs font-medium bg-gray-50 dark:bg-neutral-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-neutral-700"
                >
                  {project.sector}
                </Badge>
                {project.isActive ? (
                  <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    En cours
                  </Badge>
                ) : (
                  <Badge className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Finalisé
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <DollarSign className="h-4 w-4 text-lime-600 dark:text-lime-400" />
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {parseFloat(project.sharePrice).toFixed(3)}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Prix unitaire</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {project.investors || Math.floor(Math.random() * 50) + 10}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Investisseurs</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {progressPercentage.toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Progression</p>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="px-6 pb-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {parseFloat(project.raised).toFixed(2)} ETH
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  / {parseFloat(project.goal).toFixed(2)} ETH
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {formatTimeRemaining()}
                </span>
              </div>
            </div>
            
            <div className="relative">
              <div className="w-full bg-gray-200 dark:bg-neutral-800 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ease-out ${getProgressBarColor()}`}
                  style={{ 
                    width: `${Math.min(progressPercentage, 100)}%`,
                    transform: isHovered ? 'scaleX(1.02)' : 'scaleX(1)',
                    transformOrigin: 'left'
                  }}
                />
              </div>
              {progressPercentage >= 100 && (
                <div className="absolute right-2 top-0 bottom-0 flex items-center">
                  <CheckCircle className="h-4 w-4 text-white animate-bounce" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Section */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {project.isCertified && (
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    Certifié
                  </span>
                </div>
              )}
              {isHotProject && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-orange-500 fill-current" />
                  <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                    Populaire
                  </span>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="group/btn relative overflow-hidden bg-lime-50 dark:bg-lime-900/20 hover:bg-lime-100 dark:hover:bg-lime-900/40 text-lime-700 dark:text-lime-300 border-0 px-4 py-2 rounded-xl transition-all duration-300"
            >
              <span className="relative z-10 flex items-center gap-2 font-medium">
                <Eye className="h-4 w-4 transition-transform duration-300 group-hover/btn:scale-110" />
                Voir détails
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
              </span>
              
              {/* Button Background Animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-lime-500 to-green-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 rounded-xl"></div>
              <div className="absolute inset-0 bg-white dark:bg-neutral-950 opacity-100 group-hover/btn:opacity-0 transition-opacity duration-500 rounded-xl"></div>
            </Button>
          </div>
        </div>

        {/* Hover Effect Overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-lime-500 via-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
      </CardContent>

      {/* Floating Elements on Hover */}
      <div className={`absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-lime-400 to-blue-500 rounded-full blur-lg transition-opacity duration-500 ${
        isHovered ? 'opacity-60' : 'opacity-0'
      }`}></div>
      <div className={`absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full blur-md transition-opacity duration-500 delay-100 ${
        isHovered ? 'opacity-40' : 'opacity-0'
      }`}></div>
    </Card>
  );
}