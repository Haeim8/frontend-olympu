import React, { useState } from 'react';
import { X, Star, FileText, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProjectDetails({ project, onClose, favorites, toggleFavorite, handleInvest }) {
  const [shareCount, setShareCount] = useState(1);

  if (!project) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-3xl relative bg-white dark:bg-gray-950 shadow-2xl max-h-[90vh] overflow-y-auto">
        <Button 
          className="absolute top-2 right-2 p-1 rounded-full transition-all duration-300 ease-in-out bg-red-600 hover:bg-red-700 text-white"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center">
            {project.name}
            <div className="flex items-center space-x-2 mt-2 md:mt-0">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => toggleFavorite(project.id)}
                className={`flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 ${favorites.includes(project.id) ? 'bg-yellow-100 dark:bg-yellow-900 hover:bg-yellow-200 dark:hover:bg-yellow-800' : ''}`}
              >
                <Star className={`h-4 w-4 ${favorites.includes(project.id) ? 'fill-current text-yellow-500' : ''}`} />
                {favorites.includes(project.id) ? 'Favori' : 'Ajouter aux favoris'}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Share2 className="h-4 w-4" />
                Partager
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-900">
              <TabsTrigger value="details" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 text-gray-900 dark:text-gray-100">Détails</TabsTrigger>
              <TabsTrigger value="team" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 text-gray-900 dark:text-gray-100">Équipe</TabsTrigger>
              <TabsTrigger value="roadmap" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 text-gray-900 dark:text-gray-100">Roadmap</TabsTrigger>
            </TabsList>
            <TabsContent value="details">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Résumé du projet</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    {project.sector} - Objectif de levée : {project.goal} USDC
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Détails de l'investissement</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Prix par part : {project.sharePrice} USDC
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    Montant déjà levé : {project.raised} USDC
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Progression de la levée de fonds</h3>
                  <Progress value={(project.raised / project.goal) * 100} className="w-full bg-gray-200 dark:bg-gray-700">
                    <div className="h-full bg-lime-400" style={{ width: `${(project.raised / project.goal) * 100}%` }} />
                  </Progress>
                  <p className="mt-2 text-gray-700 dark:text-gray-300">
                    {project.raised} / {project.goal} USDC ({((project.raised / project.goal) * 100).toFixed(2)}%)
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Description du projet</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    {project.description || "Aucune description disponible."}
                  </p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="team">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Équipe</h3>
                {project.team ? (
                  project.team.map((member, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{member.name}</p>
                        <p className="text-gray-700 dark:text-gray-300">{member.role}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-700 dark:text-gray-300">Aucune information sur l'équipe disponible.</p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="roadmap">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Roadmap</h3>
                {project.roadmap ? (
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
                    {project.roadmap.map((milestone, index) => (
                      <li key={index}>{milestone}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-700 dark:text-gray-300">Aucune roadmap disponible.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col items-start space-y-4 border-t pt-4 border-gray-200 dark:border-gray-800">
          <div className="w-full">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Documents légaux</h3>
            {project.documents && project.documents.length > 0 ? (
              project.documents.map((doc, index) => (
                <div key={index} className="flex items-center space-x-2 mt-2">
                  <FileText className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  <a href={doc.url} className="text-lime-600 dark:text-lime-400 hover:underline">{doc.name}</a>
                </div>
              ))
            ) : (
              <p className="text-gray-700 dark:text-gray-300">Aucun document disponible.</p>
            )}
          </div>
          <div className="flex flex-col space-y-4 w-full">
            <div className="flex items-center space-x-4">
              <label htmlFor="shareCount" className="text-gray-800 dark:text-gray-200">Nombre de parts :</label>
              <Input 
                id="shareCount"
                type="number" 
                value={shareCount} 
                onChange={(e) => setShareCount(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                className="w-24 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
              />
            </div>
            <div className="text-gray-800 dark:text-gray-200">
              Montant total : {(shareCount * project.sharePrice).toFixed(2)} USDC
            </div>
            <Button onClick={() => handleInvest(project.id, shareCount * project.sharePrice)} className="w-full bg-lime-500 hover:bg-lime-600 text-white font-bold py-2 px-4 rounded transition-all duration-300 ease-in-out transform hover:scale-105">
              Investir maintenant
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}