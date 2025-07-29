import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProjectCard from '../shared/ProjectCard';

export default function Favorites({ projects = [], favorites = [], toggleFavorite, setSelectedProject }) {
  const favoriteProjects = Array.isArray(projects) && Array.isArray(favorites)
    ? projects.filter(project => favorites.includes(project.id))
    : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Levées de fonds favorites</h2>
        {favoriteProjects.length === 0 ? (
          <Card className="bg-white dark:bg-neutral-900 shadow-md border border-gray-200 dark:border-neutral-800">
            <CardContent className="p-6">
              <p className="text-gray-600 dark:text-gray-400">Vous n'avez pas encore de projets favoris.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {favoriteProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isFavorite={true}
                toggleFavorite={toggleFavorite}
                onViewDetails={() => setSelectedProject(project)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}