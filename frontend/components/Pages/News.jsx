'use client'

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink } from 'lucide-react';
import ModalArticle from './ModalArticle';

const articles = [
  {
    id: 1, titre: "Projet blockchain énergie verte", categorie: "Tech", image: "/placeholder.svg?height=200&width=400",
    description: "Révolutionner le marché de l'énergie verte avec la blockchain.", lien: "#", idCampagne: "campaign123",
    contenu: `<p>Notre projet de blockchain pour l'énergie verte vise à transformer radicalement le marché de l'énergie. En utilisant la technologie blockchain, nous créons un système décentralisé qui permet aux producteurs d'énergie renouvelable de vendre directement aux consommateurs.</p>
               <h2>Avantages du projet</h2>
               <ul>
                 <li>Réduction des coûts intermédiaires</li>
                 <li>Traçabilité accrue de l'origine de l'énergie</li>
                 <li>Encouragement à la production d'énergie verte</li>
               </ul>
               <p>Notre plateforme utilise des contrats intelligents pour automatiser les transactions, garantissant ainsi la transparence et l'efficacité du processus. Les consommateurs peuvent choisir leur source d'énergie préférée, soutenant ainsi directement les producteurs d'énergie renouvelable.</p>`,
    date: "2023-05-15"
  },
  {
    id: 2, titre: "Levée de fonds DevarPay", categorie: "Startup", image: "/placeholder.svg?height=200&width=400",
    description: "50 millions d'euros levés pour le paiement décentralisé.", lien: "#", idCampagne: "campaign456",
    contenu: `<p>DevarPay, notre startup spécialisée dans les solutions de paiement décentralisé, vient de réaliser une levée de fonds impressionnante de 50 millions d'euros. Cette injection de capital va nous permettre d'accélérer notre développement et d'étendre notre portée sur le marché international.</p>
               <h2>Objectifs de la levée de fonds</h2>
               <ul>
                 <li>Expansion de l'équipe de développement</li>
                 <li>Amélioration de l'infrastructure blockchain</li>
                 <li>Lancement de nouveaux produits financiers décentralisés</li>
               </ul>
               <p>Avec cette levée de fonds, DevarPay se positionne comme un acteur majeur dans le domaine des technologies financières décentralisées. Nous sommes impatients de révolutionner le monde des paiements et de rendre les transactions financières plus accessibles et sécurisées pour tous.</p>`,
    date: "2023-06-01"
  },
  {
    id: 3, titre: "IA pour l'agriculture", categorie: "Tech", image: "/placeholder.svg?height=200&width=400",
    description: "IA optimisant les rendements agricoles.", lien: "#", idCampagne: "campaign789",
    contenu: `<p>Notre projet d'Intelligence Artificielle pour l'agriculture vise à révolutionner la façon dont nous cultivons nos aliments. En utilisant des algorithmes d'apprentissage automatique avancés, nous sommes capables de prédire les conditions optimales pour chaque culture.</p>
               <h2>Fonctionnalités clés</h2>
               <ul>
                 <li>Prévisions météorologiques précises à l'échelle de la parcelle</li>
                 <li>Recommandations personnalisées pour l'irrigation et la fertilisation</li>
                 <li>Détection précoce des maladies des plantes</li>
               </ul>
               <p>Grâce à notre IA, les agriculteurs peuvent augmenter leurs rendements tout en réduisant leur utilisation d'eau et de pesticides. C'est une avancée majeure vers une agriculture plus durable et productive.</p>`,
    date: "2023-06-10"
  },
  {
    id: 4, titre: "NFT révolutionne l'art digital", categorie: "Art", image: "/placeholder.svg?height=200&width=400",
    description: "Comment les NFT transforment le marché de l'art.", lien: "#",
    contenu: `<p>Les NFT (Jetons Non Fongibles) sont en train de révolutionner le monde de l'art digital. Cette technologie blockchain permet aux artistes de créer des œuvres numériques uniques et vérifiables, ouvrant de nouvelles possibilités pour la création et la vente d'art en ligne.</p>
               <h2>Impact des NFT sur l'art digital</h2>
               <ul>
                 <li>Authentification et propriété vérifiable des œuvres d'art numériques</li>
                 <li>Nouvelles sources de revenus pour les artistes digitaux</li>
                 <li>Démocratisation de l'accès au marché de l'art</li>
               </ul>
               <p>Les NFT offrent aux artistes un moyen de monétiser directement leur travail, sans intermédiaires, tout en permettant aux collectionneurs d'acquérir et d'échanger des œuvres d'art numériques de manière sécurisée.</p>`,
    date: "2023-06-15"
  },
  {
    id: 5, titre: "Nouvelle plateforme DeFi", categorie: "Startup", image: "/placeholder.svg?height=200&width=400",
    description: "Une startup lance une plateforme DeFi innovante.", lien: "#",
    contenu: `<p>Notre startup vient de lancer une nouvelle plateforme de Finance Décentralisée (DeFi) qui promet de révolutionner le secteur financier. Cette plateforme permet aux utilisateurs d'accéder à une variété de services financiers sans intermédiaires traditionnels.</p>
               <h2>Caractéristiques de la plateforme</h2>
               <ul>
                 <li>Prêts et emprunts peer-to-peer</li>
                 <li>Staking et yield farming</li>
                 <li>Échange décentralisé de crypto-monnaies</li>
               </ul>
               <p>Notre plateforme DeFi vise à démocratiser l'accès aux services financiers, offrant des opportunités d'investissement et de gestion d'actifs auparavant réservées aux institutions financières traditionnelles.</p>`,
    date: "2023-06-20"
  },
  {
    id: 6, titre: "Art génératif et blockchain", categorie: "Art", image: "/placeholder.svg?height=200&width=400",
    description: "L'intersection entre l'art génératif et la technologie blockchain.", lien: "#",
    contenu: `<p>L'art génératif, créé par des algorithmes et des systèmes autonomes, trouve un nouveau terrain d'expression grâce à la technologie blockchain. Cette fusion ouvre des possibilités fascinantes pour la création et la distribution d'œuvres d'art uniques et vérifiables.</p>
               <h2>Innovations clés</h2>
               <ul>
                 <li>Création d'œuvres d'art uniques basées sur des transactions blockchain</li>
                 <li>Utilisation de smart contracts pour générer de l'art en temps réel</li>
                 <li>Nouvelles formes de collaboration entre artistes et technologues</li>
               </ul>
               <p>Cette intersection entre l'art génératif et la blockchain repousse les limites de la créativité, permettant la création d'œuvres d'art dynamiques et interactives qui évoluent avec le temps et les interactions des utilisateurs.</p>`,
    date: "2023-06-25"
  }
];

const investissementsUtilisateur = ['campaign123', 'campaign456'];

const CarteArticle = ({ article, estInvesti, onClick }) => (
  <Card className="bg-white dark:bg-neutral-900 shadow hover:shadow-md transition-shadow duration-300 border border-gray-200 dark:border-neutral-800">
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
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{article.titre}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{article.description}</p>
      <div className="flex justify-between items-center">
        <Button variant="link" size="sm" className="text-lime-600 dark:text-lime-400 p-0" onClick={() => onClick(article)}>
          Lire <ExternalLink className="ml-1 h-4 w-4" />
        </Button>
        {article.idCampagne && (
          <Button variant="link" size="sm" className="text-gray-600 hover:text-lime-600 dark:text-gray-400 dark:hover:text-lime-400 p-0" asChild>
            <a href={`/campaign/${article.idCampagne}`}>Voir campagne</a>
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
);

const SectionArticles = ({ titre, articles, onArticleClick }) => (
  <div className="mb-8">
    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">{titre}</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map(article => (
        <CarteArticle 
          key={article.id} 
          article={article} 
          estInvesti={investissementsUtilisateur.includes(article.idCampagne)}
          onClick={onArticleClick}
        />
      ))}
    </div>
  </div>
);

export default function Actualites() {
  const [filtreNom, setFiltreNom] = useState('');
  const [filtreSecteur, setFiltreSecteur] = useState('');
  const [filtreDate, setFiltreDate] = useState('');
  const [articleModal, setArticleModal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filtrerArticles = (articles) => {
    return articles.filter(article => 
      article.titre.toLowerCase().includes(filtreNom.toLowerCase()) &&
      (filtreSecteur === 'tous' || filtreSecteur === '' || article.categorie === filtreSecteur) &&
      (filtreDate === '' || article.date >= filtreDate)
    );
  };

  const articlesInvestis = filtrerArticles(articles.filter(article => investissementsUtilisateur.includes(article.idCampagne)));
  const articlesParCategorie = {
    Tech: filtrerArticles(articles.filter(article => article.categorie === "Tech")),
    Startup: filtrerArticles(articles.filter(article => article.categorie === "Startup")),
    Art: filtrerArticles(articles.filter(article => article.categorie === "Art")),
  };

  const handleArticleClick = (article) => {
    console.log("Article cliqué:", article);
    setArticleModal(article);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setArticleModal(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Actualités Livar</h1>
        
        <div className="mb-8 p-4 bg-white dark:bg-neutral-900 rounded-lg shadow-md border border-gray-200 dark:border-neutral-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Rechercher par nom de projet"
              value={filtreNom}
              onChange={(e) => setFiltreNom(e.target.value)}
              className="bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-neutral-700"
            />
            <Select onValueChange={setFiltreSecteur} value={filtreSecteur}>
              <SelectTrigger className="bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-neutral-700">
                <SelectValue placeholder="Filtrer par secteur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les secteurs</SelectItem>
                <SelectItem value="Tech">Tech</SelectItem>
                <SelectItem value="Startup">Startup</SelectItem>
                <SelectItem value="Art">Art</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={filtreDate}
              onChange={(e) => setFiltreDate(e.target.value)}
              className="bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-neutral-700"
            />
          </div>
        </div>

        {articlesInvestis.length > 0 && (
          <SectionArticles titre="Vos Investissements" articles={articlesInvestis} onArticleClick={handleArticleClick} />
        )}
        {Object.entries(articlesParCategorie).map(([categorie, articlesCategorie]) => (
          <SectionArticles key={categorie} titre={categorie} articles={articlesCategorie} onArticleClick={handleArticleClick} />
        ))}

        <ModalArticle 
          article={articleModal} 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
        />
      </div>
    </div>
  );
}

