"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Vote, 
  Clock, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  ArrowRightLeft,
  Shield
} from 'lucide-react';

export default function VotingPanel({ 
  campaignData, 
  onVote, 
  isLive = true,
  sessionDuration = 15 * 60 // 15 minutes par défaut
}) {
  const [hasVoted, setHasVoted] = useState(false);
  const [votesAgainst, setVotesAgainst] = useState(12);
  const [totalVoters, setTotalVoters] = useState(40);
  const [timeRemaining, setTimeRemaining] = useState(sessionDuration);
  const [voteProcessing, setVoteProcessing] = useState(false);

  useEffect(() => {
    if (!isLive) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isLive]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVote = async () => {
    if (hasVoted || !isLive || voteProcessing) return;
    
    setVoteProcessing(true);
    
    try {
      // Simulation d'appel au smart contract
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setHasVoted(true);
      setVotesAgainst(prev => prev + 1);
      onVote && onVote();
    } catch (error) {
      console.error('Erreur lors du vote:', error);
    } finally {
      setVoteProcessing(false);
    }
  };

  const votePercentage = (votesAgainst / totalVoters) * 100;
  const isVotingPeriod = timeRemaining > 180; // 3 dernières minutes = période de grâce
  const isEmergencyTime = timeRemaining < 300; // 5 dernières minutes
  const canVote = isLive && isVotingPeriod && !hasVoted && !voteProcessing;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Vote className="h-5 w-5" />
            Gouvernance DAO
          </CardTitle>
          <Badge 
            variant={isLive ? "default" : "secondary"}
            className={isLive ? "bg-green-500" : ""}
          >
            {isLive ? "Session Active" : "Session Fermée"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Timer principal */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className={`h-4 w-4 ${isEmergencyTime ? 'text-red-500' : 'text-orange-500'}`} />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isVotingPeriod ? 'Temps de vote' : 'Période de grâce'}
            </span>
          </div>
          <div className={`text-3xl font-bold ${isEmergencyTime ? 'text-red-500 animate-pulse' : 'text-orange-500'}`}>
            {formatTime(timeRemaining)}
          </div>
          
          {!isVotingPeriod && timeRemaining > 0 && (
            <Badge variant="outline" className="mt-2 text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20">
              <Shield className="h-3 w-3 mr-1" />
              Votes fermés - Période de grâce
            </Badge>
          )}
          
          {isEmergencyTime && isVotingPeriod && (
            <Badge variant="destructive" className="mt-2">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Dernières minutes !
            </Badge>
          )}
        </div>

        {/* Statistiques de vote */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Votes pour récupérer</span>
            <span className="text-sm font-bold text-red-600">
              {votesAgainst}/{totalVoters}
            </span>
          </div>
          
          <div className="space-y-2">
            <Progress 
              value={votePercentage} 
              className="h-3"
              // className={`h-3 ${votePercentage > 50 ? '[&>div]:bg-red-500' : '[&>div]:bg-orange-500'}`}
            />
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">
                {votePercentage.toFixed(1)}% veulent récupérer
              </span>
              <span className={`font-medium ${votePercentage > 50 ? 'text-red-600' : 'text-orange-600'}`}>
                {votePercentage > 50 ? 'Majorité atteinte' : 'Minorité'}
              </span>
            </div>
          </div>
        </div>

        {/* Interface de vote */}
        <div className="space-y-3">
          {!hasVoted && isLive ? (
            <div className="space-y-2">
              <Button 
                onClick={handleVote}
                disabled={!canVote}
                className={`w-full ${canVote ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-400'} text-white`}
              >
                {voteProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Traitement...
                  </div>
                ) : (
                  <>
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Récupérer 85% de mes fonds
                  </>
                )}
              </Button>
              
              <div className="text-xs text-center text-gray-500 space-y-1">
                <p>• 1 NFT = 1 vote par wallet</p>
                <p>• Vote définitif et immédiat</p>
                {!isVotingPeriod && (
                  <p className="text-yellow-600 font-medium">⚠️ Période de vote fermée</p>
                )}
              </div>
            </div>
          ) : hasVoted ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <CheckCircle className="h-5 w-5 text-red-500" />
                <span className="font-medium text-red-700 dark:text-red-400">
                  Vote enregistré sur la blockchain
                </span>
              </div>
              <div className="text-xs text-center text-gray-500">
                Vous recevrez 85% de vos fonds à la fin de la session
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg text-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Session fermée - Votes non disponibles
              </span>
            </div>
          )}
        </div>

        {/* Statistiques détaillées */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
            <Users className="h-4 w-4 mx-auto mb-1 text-blue-500" />
            <div className="text-xs text-gray-600 dark:text-gray-400">Holders</div>
            <div className="font-bold text-sm">{totalVoters}</div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-green-500" />
            <div className="text-xs text-gray-600 dark:text-gray-400">Participation</div>
            <div className="font-bold text-sm">
              {Math.round((votesAgainst / totalVoters) * 100)}%
            </div>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
            <Shield className="h-4 w-4 mx-auto mb-1 text-purple-500" />
            <div className="text-xs text-gray-600 dark:text-gray-400">Gardent NFT</div>
            <div className="font-bold text-sm">{totalVoters - votesAgainst}</div>
          </div>
        </div>

        {/* Prédiction des résultats */}
        {votePercentage > 0 && (
          <div className={`p-3 rounded-lg border ${
            votePercentage > 50 
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
              : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          }`}>
            <div className="text-xs font-medium mb-1">
              {votePercentage > 50 ? '🔴 Prédiction' : '🟢 Prédiction'}
            </div>
            <div className={`text-xs ${
              votePercentage > 50 
                ? 'text-red-700 dark:text-red-300' 
                : 'text-green-700 dark:text-green-300'
            }`}>
              {votePercentage > 50 
                ? `Majorité vote pour récupérer • Fonds distribués aux votants`
                : `Majorité garde les NFTs • Fonds débloqués au fondateur`
              }
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}