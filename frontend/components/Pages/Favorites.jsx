import React, { useMemo, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from '@/hooks/useLanguage';
import ProjectCard from '../shared/ProjectCard';
import ProjectDetails from './ProjectDetails';
import { Heart, TrendingUp, Loader2 } from 'lucide-react';

export default function Favorites({
  projects = [],
  favorites = [],
  investments = [],
  toggleFavorite,
  isFavorite,
  hasInvested,
  isLoading = false
}) {
  const { t } = useTranslation();
  const [selectedProject, setSelectedProject] = useState(null);

  // Combiner favoris + investissements (sans doublons)
  const trackedCampaignIds = useMemo(() => {
    const combined = new Set([...favorites, ...investments]);
    return Array.from(combined);
  }, [favorites, investments]);

  // Filtrer les projets suivis
  const trackedProjects = useMemo(() => {
    if (!Array.isArray(projects)) return [];

    return projects
      .filter(project => trackedCampaignIds.includes(project.id?.toLowerCase()))
      .sort((a, b) => {
        // Mettre les investissements en premier
        const aInvested = investments.includes(a.id?.toLowerCase());
        const bInvested = investments.includes(b.id?.toLowerCase());

        if (aInvested && !bInvested) return -1;
        if (!aInvested && bInvested) return 1;
        return 0;
      });
  }, [projects, trackedCampaignIds, investments]);

  // Statistiques
  const stats = useMemo(() => ({
    totalTracked: trackedProjects.length,
    invested: trackedProjects.filter(p => investments.includes(p.id?.toLowerCase())).length,
    favoriteOnly: trackedProjects.filter(p =>
      favorites.includes(p.id?.toLowerCase()) &&
      !investments.includes(p.id?.toLowerCase())
    ).length,
  }), [trackedProjects, favorites, investments]);

  const handleCloseDetails = () => {
    setSelectedProject(null);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 relative z-10">
        {/* Header avec stats */}
        <div className="space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            {t('favorites.title')}
          </h2>

          {/* Badges de statistiques */}
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="px-3 py-1.5 bg-primary/10 border-primary/30 backdrop-blur-md">
              <TrendingUp className="h-4 w-4 mr-2 text-primary-light" />
              <span className="text-sm font-medium text-white">
                {stats.invested} {t('favorites.invested') || 'Investissements'}
              </span>
            </Badge>

            <Badge variant="outline" className="px-3 py-1.5 bg-accent/10 border-accent/30 backdrop-blur-md">
              <Heart className="h-4 w-4 mr-2 text-accent" />
              <span className="text-sm font-medium text-white">
                {stats.favoriteOnly} {t('favorites.favoriteOnly') || 'Favoris uniquement'}
              </span>
            </Badge>
          </div>
        </div>

        {/* Contenu */}
        {isLoading ? (
          <Card className="glass-card border-white/10">
            <CardContent className="p-12 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
              <p className="text-gray-400">
                {t('favorites.loading') || 'Chargement de vos projets suivis...'}
              </p>
            </CardContent>
          </Card>
        ) : trackedProjects.length === 0 ? (
          <Card className="glass-card border-white/10">
            <CardContent className="p-8 text-center">
              <Heart className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {t('favorites.empty')}
              </h3>
              <p className="text-gray-400 text-sm">
                {t('favorites.emptyDescription') || 'Ajoutez des projets en favoris ou investissez pour les suivre ici'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {trackedProjects.map((project) => {
              const isInvested = investments.includes(project.id?.toLowerCase());
              const isFav = favorites.includes(project.id?.toLowerCase());

              return (
                <div key={project.id} className="relative group">
                  {/* Badge "Investi" */}
                  {isInvested && (
                    <div className="absolute -top-2 -left-2 z-20">
                      <Badge className="bg-gradient-to-r from-primary to-secondary text-white border-none shadow-[0_0_15px_rgba(112,0,255,0.5)]">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {t('favorites.investedBadge') || 'Investi'}
                      </Badge>
                    </div>
                  )}

                  <ProjectCard
                    project={project}
                    isFavorite={isFav}
                    toggleFavorite={toggleFavorite}
                    onViewDetails={() => setSelectedProject(project)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal ProjectDetails */}
      {selectedProject && (
        <ProjectDetails
          selectedProject={selectedProject}
          onClose={handleCloseDetails}
          toggleFavorite={toggleFavorite}
          isFavorite={isFavorite}
        />
      )}
    </div>
  );
}
