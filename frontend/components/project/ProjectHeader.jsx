"use client";

import React from 'react';
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Star, TrendingUp, Users, Calendar, ExternalLink, Globe, Twitter, Github } from 'lucide-react';

export default function ProjectHeader({ 
  project, 
  projectData,
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

        {/* Équipe du projet */}
        {projectData?.ipfs?.teamMembers && projectData.ipfs.teamMembers.length > 0 && (
          <div className="bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-neutral-700/50 mt-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Équipe du projet
              </h3>
              <Badge className="bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300">
                {projectData.ipfs.teamMembers.length} membre(s)
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {projectData.ipfs.teamMembers.map((member, index) => (
                <div key={index} className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-sm rounded-lg p-4 border border-gray-200/30 dark:border-neutral-700/30 hover:shadow-md transition-all">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                        {member.name || 'Nom non spécifié'}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {member.role || 'Rôle non spécifié'}
                      </p>
                    </div>
                  </div>
                  
                  {member.socials && (Object.keys(member.socials).length > 0) && (
                    <div className="flex space-x-2">
                      {member.socials.twitter && (
                        <a 
                          href={member.socials.twitter} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                        >
                          Twitter
                        </a>
                      )}
                      {member.socials.linkedin && (
                        <a 
                          href={member.socials.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                        >
                          LinkedIn
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Réseaux sociaux */}
        {projectData?.ipfs?.socials && Object.values(projectData.ipfs.socials).some(social => social) && (
          <div className="bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-neutral-700/50 mt-4">
            <div className="flex items-center gap-3 mb-4">
              <ExternalLink className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Liens et réseaux sociaux
              </h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {projectData.ipfs.socials.website && (
                <a 
                  href={projectData.ipfs.socials.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-white/70 dark:bg-neutral-900/70 rounded-lg border border-blue-200/50 dark:border-blue-800/50 hover:shadow-md hover:scale-105 transition-all group"
                >
                  <ExternalLink className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Site web</span>
                </a>
              )}
              
              {projectData.ipfs.socials.twitter && (
                <a 
                  href={projectData.ipfs.socials.twitter} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-white/70 dark:bg-neutral-900/70 rounded-lg border border-sky-200/50 dark:border-sky-800/50 hover:shadow-md hover:scale-105 transition-all group"
                >
                  <ExternalLink className="h-4 w-4 text-sky-600 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-sky-600 dark:text-sky-400">Twitter</span>
                </a>
              )}
              
              {projectData.ipfs.socials.github && (
                <a 
                  href={projectData.ipfs.socials.github} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-white/70 dark:bg-neutral-900/70 rounded-lg border border-gray-200/50 dark:border-gray-800/50 hover:shadow-md hover:scale-105 transition-all group"
                >
                  <ExternalLink className="h-4 w-4 text-gray-600 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">GitHub</span>
                </a>
              )}
              
              {projectData.ipfs.socials.discord && (
                <a 
                  href={projectData.ipfs.socials.discord} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-white/70 dark:bg-neutral-900/70 rounded-lg border border-indigo-200/50 dark:border-indigo-800/50 hover:shadow-md hover:scale-105 transition-all group"
                >
                  <ExternalLink className="h-4 w-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Discord</span>
                </a>
              )}
              
              {projectData.ipfs.socials.telegram && (
                <a 
                  href={projectData.ipfs.socials.telegram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-white/70 dark:bg-neutral-900/70 rounded-lg border border-blue-200/50 dark:border-blue-800/50 hover:shadow-md hover:scale-105 transition-all group"
                >
                  <ExternalLink className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Telegram</span>
                </a>
              )}
              
              {projectData.ipfs.socials.medium && (
                <a 
                  href={projectData.ipfs.socials.medium} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-white/70 dark:bg-neutral-900/70 rounded-lg border border-green-200/50 dark:border-green-800/50 hover:shadow-md hover:scale-105 transition-all group"
                >
                  <ExternalLink className="h-4 w-4 text-green-600 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">Medium</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-lime-400/20 to-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-emerald-400/20 to-lime-500/20 rounded-full blur-lg animate-pulse delay-1000"></div>
      </div>
    </div>
  );
}