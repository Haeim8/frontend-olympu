import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const articles = [
  {
    id: 1, titre: "Projet blockchain énergie verte", categorie: "Tech", image: "/placeholder.svg?height=200&width=400",
    description: "Révolutionner le marché de l'énergie verte avec la blockchain.", lien: "#", idCampagne: "campaign123"
  },
  {
    id: 2, titre: "Levée de fonds DevarPay", categorie: "Startup", image: "/placeholder.svg?height=200&width=400",
    description: "50 millions d'euros levés pour le paiement décentralisé.", lien: "#", idCampagne: "campaign456"
  },
  {
    id: 3, titre: "IA pour l'agriculture", categorie: "Tech", image: "/placeholder.svg?height=200&width=400",
    description: "IA optimisant les rendements agricoles.", lien: "#", idCampagne: "campaign789"
  },
  {
    id: 4, titre: "NFT révolutionne l'art digital", categorie: "Art", image: "/placeholder.svg?height=200&width=400",
    description: "Comment les NFT transforment le marché de l'art.", lien: "#"
  },
  {
    id: 5, titre: "Nouvelle plateforme DeFi", categorie: "Startup", image: "/placeholder.svg?height=200&width=400",
    description: "Une startup lance une plateforme DeFi innovante.", lien: "#"
  },
  {
    id: 6, titre: "Art génératif et blockchain", categorie: "Art", image: "/placeholder.svg?height=200&width=400",
    description: "L'intersection entre l'art génératif et la technologie blockchain.", lien: "#"
  }
];

const investissementsUtilisateur = ['campaign123', 'campaign456'];

const CarteArticle = ({ article, estInvesti }) => (
  <Card className="bg-white dark:bg-neutral-900 shadow hover:shadow-md transition-shadow duration-300">
    <img src={article.image} alt={article.titre} className="w-full h-48 object-cover" />
    <CardContent className="p-4">
      <div className="flex justify-between items-start mb-2">
        <Badge variant="secondary" className="bg-lime-100 text-lime-800 dark:bg-lime-700 dark:text-lime-100">
          {article.categorie}
        </Badge>
        {estInvesti && (
          <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-100">
            Investi
          </Badge>
        )}
      </div>
      <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 mb-2">{article.titre}</h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">{article.description}</p>
      <div className="flex justify-between items-center">
        <Button variant="link" size="sm" className="text-lime-600 dark:text-lime-400 p-0" asChild>
          <a href={article.lien} target="_blank" rel="noopener noreferrer" className="flex items-center">
            Lire <ExternalLink className="ml-1 h-4 w-4" />
          </a>
        </Button>
        {article.idCampagne && (
          <Button variant="link" size="sm" className="text-neutral-600 hover:text-lime-600 dark:text-neutral-400 dark:hover:text-lime-400 p-0" asChild>
            <a href={`/campaign/${article.idCampagne}`}>Voir campagne</a>
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
);

const SectionArticles = ({ titre, articles }) => (
  <div className="mb-8">
    <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-4">{titre}</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map(article => (
        <CarteArticle 
          key={article.id} 
          article={article} 
          estInvesti={investissementsUtilisateur.includes(article.idCampagne)} 
        />
      ))}
    </div>
  </div>
);

export default function Actualites() {
  const articlesInvestis = articles.filter(article => investissementsUtilisateur.includes(article.idCampagne));
  const articlesParCategorie = {
    Tech: articles.filter(article => article.categorie === "Tech"),
    Startup: articles.filter(article => article.categorie === "Startup"),
    Art: articles.filter(article => article.categorie === "Art"),
  };

  return (
    <div className="p-6 bg-gray-100 dark:bg-neutral-900">
      <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 dark:text-neutral-100 mb-8">Actualités Devar</h1>
      {articlesInvestis.length > 0 && (
        <SectionArticles titre="Vos Investissements" articles={articlesInvestis} />
      )}
      {Object.entries(articlesParCategorie).map(([categorie, articlesCategorie]) => (
        <SectionArticles key={categorie} titre={categorie} articles={articlesCategorie} />
      ))}
    </div>
  );
}