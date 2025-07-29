"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const colorClasses = {
    lime: "text-lime-600 bg-lime-50 dark:bg-lime-900/20 border-lime-200 dark:border-lime-800",
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    purple: "text-purple-600 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
    orange: "text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
    green: "text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
  };

  return (
    <Card className={`border-2 ${colorClasses[color]} bg-white/60 dark:bg-neutral-900/60 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:scale-105`}>
      <CardContent className="p-6">
        <div className="text-center space-y-3">
          <div className={`w-12 h-12 mx-auto rounded-2xl ${colorClasses[color]} flex items-center justify-center`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function ProjectOverview({ project }) {
  if (!project) return null;

  const progress = (parseFloat(project.raised) / parseFloat(project.goal)) * 100;
  const endDate = new Date(project.endDate);
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
  
  // Calculate estimated investors (assuming average investment)
  const avgInvestmentSize = parseFloat(project.sharePrice) * 5; // Estimation
  const estimatedInvestors = Math.floor(parseFloat(project.raised) / avgInvestmentSize);

  const getProgressColor = () => {
    if (progress >= 100) return 'from-green-500 to-emerald-600';
    if (progress >= 80) return 'from-orange-500 to-amber-600';
    if (progress >= 50) return 'from-blue-500 to-cyan-600';
    return 'from-lime-500 to-emerald-600';
  };

  const getTimeStatus = () => {
    if (endDate < now) return { text: 'Terminé', color: 'gray' };
    if (daysRemaining <= 7) return { text: `${daysRemaining} jour(s) restant(s)`, color: 'orange' };
    return { text: `${daysRemaining} jours restants`, color: 'blue' };
  };

  const timeStatus = getTimeStatus();

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={DollarSign}
          title="Levée en cours"
          value={`${project.raised} ETH`}
          subtitle={`sur ${project.goal} ETH`}
          color="lime"
        />

        <StatCard
          icon={Target}
          title="Prix unitaire"
          value={`${project.sharePrice} ETH`}
          subtitle="par share"
          color="blue"
        />

        <StatCard
          icon={Users}
          title="Investisseurs"
          value={estimatedInvestors.toString()}
          subtitle="participants estimés"
          color="purple"
        />

        <StatCard
          icon={Calendar}
          title="Échéance"
          value={timeStatus.text}
          subtitle={project.endDate}
          color={timeStatus.color}
        />
      </div>

      {/* Progress Section */}
      <Card className="bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-lg">
        <CardContent className="p-8">
          <div className="space-y-6">
            {/* Progress Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Progression du financement
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Suivi en temps réel de la collecte de fonds
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold bg-gradient-to-r from-lime-500 to-emerald-600 bg-clip-text text-transparent">
                  {progress.toFixed(1)}%
                </div>
                <Badge className={`${
                  progress >= 100 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                  progress >= 80 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' :
                  'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                }`}>
                  <Percent className="h-3 w-3 mr-1" />
                  {progress >= 100 ? 'Objectif atteint' : progress >= 80 ? 'Presque complet' : 'En cours'}
                </Badge>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-4">
              <div className="relative">
                <div className="h-4 bg-gray-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(progress, 100)}%` }}
                    className={`h-full bg-gradient-to-r ${getProgressColor()} transition-all duration-1000 ease-out relative`}
                  >
                    {progress > 10 && (
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    )}
                  </div>
                </div>
                
                {/* Progress milestones */}
                <div className="absolute -top-2 left-0 right-0 flex justify-between">
                  {[25, 50, 75, 100].map((milestone) => (
                    <div
                      key={milestone}
                      className={`w-2 h-8 rounded-full ${
                        progress >= milestone 
                          ? 'bg-lime-500' 
                          : 'bg-gray-300 dark:bg-neutral-600'
                      } transition-colors duration-500`}
                      style={{ marginLeft: milestone === 100 ? '-0.25rem' : '0' }}
                    />
                  ))}
                </div>
              </div>

              {/* Progress Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-lime-600 dark:text-lime-400">
                    {project.raised}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    ETH Levés
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                    {project.goal}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    ETH Objectif
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {(parseFloat(project.goal) - parseFloat(project.raised)).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    ETH Restants
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {Math.floor((parseFloat(project.goal) - parseFloat(project.raised)) / parseFloat(project.sharePrice))}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Shares disponibles
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-neutral-700">
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Vélocité</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {(parseFloat(project.raised) / Math.max(1, 30 - daysRemaining)).toFixed(3)} ETH/jour
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Award className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Taux de réussite</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {progress > 100 ? '100%' : `${Math.min(progress, 100).toFixed(0)}%`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Temps restant</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {daysRemaining > 0 ? `${daysRemaining}j` : 'Terminé'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}