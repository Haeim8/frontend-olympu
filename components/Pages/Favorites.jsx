import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProjectCard from '../shared/ProjectCard';

export default function Favorites({ projects = [], favorites = [], toggleFavorite, setSelectedProject }) {
  const favoriteProjects = Array.isArray(projects) && Array.isArray(favorites)
    ? projects.filter(project => favorites.includes(project.id))
    : [];

  return (
    <div className="space-y-6">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">Levées de fonds favorites</h2>
      {favoriteProjects.length === 0 ? (
        <Card className="bg-white dark:bg-gray-950 shadow-md">
          <CardContent className="p-6">
            <p className="text-gray-700 dark:text-gray-300">Vous n'avez pas encore de projets favoris.</p>
          </CardContent>
        </Card>
      ) : (
        favoriteProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            isFavorite={true}
            toggleFavorite={toggleFavorite}
            onViewDetails={() => setSelectedProject(project)}
          />
        ))
      )}
    </div>
  );
}