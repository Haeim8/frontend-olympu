"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Wallet, 
  TrendingUp, 
  Award, 
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = "lime" }) => {
  const colorClasses = {
    lime: "from-lime-500 to-green-600",
    blue: "from-blue-500 to-cyan-600", 
    purple: "from-purple-500 to-pink-600",
    orange: "from-orange-500 to-red-600"
  };

  const iconColorClasses = {
    lime: "text-lime-600 bg-lime-100 dark:bg-lime-900/20",
    blue: "text-blue-600 bg-blue-100 dark:bg-blue-900/20",
    purple: "text-purple-600 bg-purple-100 dark:bg-purple-900/20", 
    orange: "text-orange-600 bg-orange-100 dark:bg-orange-900/20"
  };

  return (
    <Card className="relative overflow-hidden bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 shadow-lg hover:shadow-xl transition-all duration-300 group">
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${iconColorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        <div className="flex items-baseline space-x-2">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {value}
          </div>
          {trend && (
            <div className={`flex items-center text-xs font-medium ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend === 'up' ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              )}
              {trendValue}
            </div>
          )}
        </div>
        
        {/* Progress bar pour certaines stats */}
        {title === "Nombre de NFT" && parseInt(value) > 0 && (
          <div className="w-full bg-gray-200 dark:bg-neutral-800 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full bg-gradient-to-r ${colorClasses[color]}`}
              style={{ width: `${Math.min((parseInt(value) / 100) * 100, 100)}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function WalletStats({ walletInfo, isLoading }) {
  const stats = [
    {
      title: "Nombre de NFT",
      value: isLoading ? "..." : walletInfo.totalNFTs.toString(),
      icon: Award,
      color: "lime",
      trend: walletInfo.totalNFTs > 0 ? "up" : null,
      trendValue: walletInfo.totalNFTs > 0 ? "+12%" : null
    },
    {
      title: "Valeur investie", 
      value: isLoading ? "..." : `${walletInfo.totalInvested} ETH`,
      icon: Wallet,
      color: "blue",
      trend: parseFloat(walletInfo.totalInvested) > 0 ? "up" : null,
      trendValue: parseFloat(walletInfo.totalInvested) > 0 ? "+8%" : null
    },
    {
      title: "Projets soutenus",
      value: isLoading ? "..." : walletInfo.activeProjects.toString(),
      icon: TrendingUp,
      color: "purple",
      trend: walletInfo.activeProjects > 0 ? "up" : null,
      trendValue: walletInfo.activeProjects > 0 ? "+3" : null
    },
    {
      title: "Dividendes perçus",
      value: isLoading ? "..." : `${walletInfo.totalDividends} ETH`,
      icon: DollarSign,
      color: "orange",
      trend: parseFloat(walletInfo.totalDividends) > 0 ? "up" : null,
      trendValue: parseFloat(walletInfo.totalDividends) > 0 ? "+5%" : null
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Statistiques du portefeuille
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Aperçu de vos investissements et NFT
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <Activity className="h-4 w-4" />
          <span>Mis à jour il y a quelques instants</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={stat.title}
            className="animate-in fade-in slide-in-from-bottom-4"
            style={{
              animationDelay: `${index * 100}ms`,
              animationDuration: '600ms',
              animationFillMode: 'both'
            }}
          >
            <StatCard {...stat} />
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      {!isLoading && walletInfo.totalNFTs === 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
              <Wallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Commencez à investir !
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                Vous n'avez pas encore d'investissements. Découvrez les projets disponibles pour commencer.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}