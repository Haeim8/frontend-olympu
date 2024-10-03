import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Star, ChevronRight } from 'lucide-react';

export default function ProjectCard({ project, isFavorite, toggleFavorite, onViewDetails }) {
  const progress = (project.currentRaise / project.goal) * 100;

  return (
    <Card className="bg-white dark:bg-gray-950 shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-4">
        <div className="md:hidden mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{project.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{project.sector}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
          <div className="hidden md:block">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{project.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{project.sector}</p>
          </div>
          <div className="text-center md:text-left">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Prix unitaire</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{project.unitPrice} USDC</p>
          </div>
          <div className="text-center md:text-left">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Levée en cours</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{project.currentRaise} USDC</p>
          </div>
          <div className="text-center md:text-left">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Objectif</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{project.goal} USDC</p>
          </div>
          <div className="col-span-2 space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-600 dark:text-gray-400 text-right">{progress.toFixed(2)}% atteint</p>
          </div>
          <div className="flex justify-between items-center md:justify-end space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleFavorite(project.id)}
              className={`${isFavorite ? 'text-yellow-500' : 'text-gray-400'} hover:text-yellow-600`}
            >
              <Star className="h-5 w-5" />
            </Button>
            <Button onClick={() => onViewDetails(project)} className="bg-lime-500 hover:bg-lime-600 text-white">
              <span className="hidden md:inline">Voir détails</span>
              <ChevronRight className="h-5 w-5 md:ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}