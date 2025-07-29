"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Video, 
  Clock, 
  Users, 
  ArrowRight, 
  Calendar,
  TrendingUp,
  DollarSign,
  Zap,
  Eye,
  AlertCircle,
  Star,
  RefreshCw
} from 'lucide-react';

export default function LiveDashboard({ setActivePage }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mock data - à remplacer par vraies données
  const [exchangeableProjects] = useState([
    {
      id: 1,
      name: "EcoChain Project",
      symbol: "ECO",
      liveDate: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8h ago
      exchangeDeadline: new Date(Date.now() + 16 * 60 * 60 * 1000), // 16h left
      totalRaised: "45.2 ETH",
      myNFTs: 3,
      canExchange: true,
      viewers: 1247,
      satisfaction: 78,
      description: "Live de présentation terminé - Le fondateur a présenté la roadmap Q2 mais certains investisseurs ont des doutes sur l'équipe technique."
    },
    {
      id: 2,
      name: "Solar Panel DAO",
      symbol: "SPD",
      liveDate: new Date(Date.now() - 20 * 60 * 60 * 1000), // 20h ago
      exchangeDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4h left
      totalRaised: "32.8 ETH",
      myNFTs: 1,
      canExchange: true,
      viewers: 892,
      satisfaction: 65,
      description: "⚠️ Plus que 4h pour échanger ! Le live a révélé des retards dans le développement du produit."
    }
  ]);

  const [liveProjects] = useState([
    {
      id: 3,
      name: "DeFi Revolution",
      symbol: "DFR",
      status: "live", // live, scheduled, upcoming
      liveDate: new Date(),
      totalRaised: "78.5 ETH",
      currentViewers: 2341,
      scheduledFor: null,
      timeLeft: "12:34",
      satisfaction: null
    },
    {
      id: 4,
      name: "MetaVerse Land",
      symbol: "MVL",
      status: "scheduled",
      scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // in 2 days
      totalRaised: "156.7 ETH",
      currentViewers: 0,
      announcedHours: 96, // announced 4 days ago
      satisfaction: null
    },
    {
      id: 5,
      name: "AI Trading Bot",
      symbol: "ATB",
      status: "upcoming",
      totalRaised: "89.3 ETH",
      daysUntilDeadline: 12, // 12 days left to schedule
      satisfaction: null
    }
  ]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimeLeft = (deadline) => {
    const diff = deadline - currentTime;
    if (diff <= 0) return "Expiré";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatScheduledTime = (date) => {
    return date.toLocaleString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleJoinLive = () => {
    // Navigation vers la page live session dans l'app
    setActivePage && setActivePage('live-session');
  };

  const handleExchangeNFTs = () => {
    // Navigation vers la page live session avec tab exchange
    setActivePage && setActivePage('live-session');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'live':
        return <Badge className="bg-red-500 text-white animate-pulse">🔴 EN DIRECT</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500 text-white">📅 Programmé</Badge>;
      case 'upcoming':
        return <Badge className="bg-orange-500 text-white">⏳ En attente</Badge>;
      default:
        return null;
    }
  };

  const getSatisfactionColor = (satisfaction) => {
    if (satisfaction >= 70) return "text-green-600";
    if (satisfaction >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Live DAO Sessions
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Participez aux sessions de gouvernance en direct et décidez de l'avenir des projets
          </p>
        </div>

        {/* Section épinglée - Échanges possibles */}
        {exchangeableProjects.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-full p-2">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ⚡ Échange encore possible
              </h2>
              <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                {exchangeableProjects.length} projet{exchangeableProjects.length > 1 ? 's' : ''}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {exchangeableProjects.map((project) => (
                <Card key={project.id} className="border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
                          {project.name}
                        </CardTitle>
                        <Badge variant="outline" className="mt-1">{project.symbol}</Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {formatTimeLeft(project.exchangeDeadline)}
                        </div>
                        <div className="text-xs text-gray-500">restantes</div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-gray-700 dark:text-gray-300">Levé: {project.totalRaised}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-blue-600" />
                          <span className="text-gray-700 dark:text-gray-300">Mes NFTs: {project.myNFTs}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-purple-600" />
                          <span className="text-gray-700 dark:text-gray-300">{project.viewers} vues</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className={`h-4 w-4 ${getSatisfactionColor(project.satisfaction)}`} />
                          <span className={`${getSatisfactionColor(project.satisfaction)}`}>
                            {project.satisfaction}% satisfaits
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-3 mb-4">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {project.description}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleExchangeNFTs}
                        className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Échanger mes NFTs
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleJoinLive}
                        className="border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-300"
                      >
                        Revoir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Section principale - Lives en cours et programmés */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full p-2">
              <Video className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Sessions Live
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {liveProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-all duration-300 hover:scale-105">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
                        {project.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{project.symbol}</Badge>
                        {getStatusBadge(project.status)}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="text-sm space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span>Fonds levés: {project.totalRaised}</span>
                    </div>
                    
                    {project.status === 'live' && (
                      <>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span>{project.currentViewers.toLocaleString()} spectateurs</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-purple-600" />
                          <span>Durée: {project.timeLeft}</span>
                        </div>
                      </>
                    )}
                    
                    {project.status === 'scheduled' && (
                      <>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span className="text-xs">{formatScheduledTime(project.scheduledFor)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-green-600" />
                          <span className="text-green-600">Annoncé il y a {Math.floor(project.announcedHours / 24)} jours</span>
                        </div>
                      </>
                    )}
                    
                    {project.status === 'upcoming' && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <span className="text-orange-600">
                          {project.daysUntilDeadline} jours pour programmer
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    {project.status === 'live' && (
                      <Button 
                        onClick={handleJoinLive}
                        className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Rejoindre le Live
                      </Button>
                    )}
                    
                    {project.status === 'scheduled' && (
                      <Button 
                        variant="outline" 
                        className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Me notifier
                      </Button>
                    )}
                    
                    {project.status === 'upcoming' && (
                      <Button 
                        variant="outline" 
                        className="w-full border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-300"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        En attente de programmation
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats globales */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {liveProjects.filter(p => p.status === 'live').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Live maintenant</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {liveProjects.filter(p => p.status === 'scheduled').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Programmés</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {exchangeableProjects.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Échanges possibles</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {liveProjects.reduce((acc, p) => acc + (p.currentViewers || 0), 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Spectateurs total</div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}