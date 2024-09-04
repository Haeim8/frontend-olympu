'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Home, Wallet, MessageSquare, Newspaper, ChevronDown, Sun, Moon, X, Share2, FileText } from "lucide-react"

export default function AppInterface() {
  const [activePage, setActivePage] = useState('home')
  const [selectedProject, setSelectedProject] = useState(null)
  const [darkMode, setDarkMode] = useState(false)
  const [hasDividends, setHasDividends] = useState(true)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const projects = [
    { id: 1, name: "Projet A", sector: "Tech", sharePrice: "100 USDC", raised: "500 USDC", goal: "1000 USDC" },
    { id: 2, name: "Projet B", sector: "Finance", sharePrice: "50 USDC", raised: "200 USDC", goal: "500 USDC" },
  ]

  const walletInfo = {
    pnl: "+500 USDC",
    investedValue: "2000 USDC",
    projectsInvested: 5,
    unlockTime: "30 jours"
  }

  const transactions = [
    { id: 1, type: 'Achat', project: 'Projet A', amount: '100 USDC', date: '2023-09-01' },
    { id: 2, type: 'Vente', project: 'Projet B', amount: '50 USDC', date: '2023-09-15' },
    { id: 3, type: 'Achat', project: 'Projet C', amount: '200 USDC', date: '2023-09-30' },
  ]

  const getIconColorClass = (pageName) => {
    if (activePage === pageName) {
      return darkMode ? 'text-primary-dark' : 'text-primary'
    }
    return darkMode ? 'text-gray-400 group-hover:text-gray-200' : 'text-gray-600 group-hover:text-gray-900'
  }

  const renderContent = () => {
    switch (activePage) {
      case 'home':
        return (
          <>
            <h2 className="text-2xl font-bold mb-6 dark:text-white">Projets en cours de financement</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-6 gap-4 px-4 py-2 font-semibold text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div>Nom</div>
                <div>Domaine</div>
                <div>Prix de la part</div>
                <div>Déjà levé</div>
                <div>Objectif</div>
                <div></div>
              </div>
              {projects.map((project) => (
                <Card key={project.id} className="w-full dark:bg-gray-800">
                  <CardContent className="grid grid-cols-6 gap-4 items-center p-4">
                    <div className="dark:text-white">{project.name}</div>
                    <div className="dark:text-white">{project.sector}</div>
                    <div className="dark:text-white">{project.sharePrice}</div>
                    <div className="dark:text-white">{project.raised}</div>
                    <div className="dark:text-white">{project.goal}</div>
                    <div className="flex justify-end">
                      <Button 
                        onClick={() => setSelectedProject(project)}
                        className="transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
                      >
                        Voir détails
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        );
      case 'wallet':
        return (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold mb-6 dark:text-white">Votre portefeuille</h2>
            <div className="grid grid-cols-4 gap-6">
              <Card className="dark:bg-gray-800 border dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-sm font-medium dark:text-white">PNL</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold dark:text-white">{walletInfo.pnl}</p>
                </CardContent>
              </Card>
              <Card className="dark:bg-gray-800 border dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-sm font-medium dark:text-white">Valeur investie</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold dark:text-white">{walletInfo.investedValue}</p>
                </CardContent>
              </Card>
              <Card className="dark:bg-gray-800 border dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-sm font-medium dark:text-white">Projets investis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold dark:text-white">{walletInfo.projectsInvested}</p>
                </CardContent>
              </Card>
              <Card className="dark:bg-gray-800 border dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-sm font-medium dark:text-white">Temps avant déblocage</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold dark:text-white">{walletInfo.unlockTime}</p>
                </CardContent>
              </Card>
            </div>
            <Card className="dark:bg-gray-800 border dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-medium dark:text-white">Dividendes</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <p className={`text-xl font-bold ${hasDividends ? 'text-green-500' : 'text-red-500'}`}>
                  {hasDividends ? 'Disponibles' : 'Non disponibles'}
                </p>
                <Button 
                  disabled={!hasDividends}
                  className={`${hasDividends ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400'} text-white`}
                >
                  Claim
                </Button>
              </CardContent>
            </Card>
            <Card className="dark:bg-gray-800 border dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-medium dark:text-white">Historique des transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left dark:text-gray-300">
                        <th className="pb-2">Type</th>
                        <th className="pb-2">Projet</th>
                        <th className="pb-2">Montant</th>
                        <th className="pb-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="border-t dark:border-gray-700">
                          <td className={`py-2 ${tx.type === 'Achat' ? 'text-green-500' : 'text-red-500'}`}>{tx.type}</td>
                          <td className="py-2 dark:text-white">{tx.project}</td>
                          <td className="py-2 dark:text-white">{tx.amount}</td>
                          <td className="py-2 dark:text-white">{tx.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        );
      case 'discussions':
        return (
          <>
            <h2 className="text-2xl font-bold mb-6 dark:text-white">Discussions</h2>
            <Card className="dark:bg-gray-800">
              <CardContent className="p-6">
                <p className="dark:text-white">Espace de discussion à implémenter</p>
              </CardContent>
            </Card>
          </>
        );
      case 'news':
        return (
          <>
            <h2 className="text-2xl font-bold mb-6 dark:text-white">Actualités</h2>
            <Card className="dark:bg-gray-800">
              <CardContent className="p-6">
                <p className="dark:text-white">Flux d'actualités à implémenter</p>
              </CardContent>
            </Card>
          </>
        );
      default:
        return null;
    }
  }

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900' : 'bg-background'}`}>
      <aside className={`w-16 border-r flex flex-col items-center py-6 space-y-6 ${darkMode ? 'border-gray-700 bg-gray-800' : 'bg-white'}`}>
        <Button 
          variant={activePage === 'home' ? "default" : "ghost"} 
          size="icon"
          onClick={() => setActivePage('home')}
          className={`group transition-all duration-300 ease-in-out ${activePage === 'home' ? (darkMode ? 'bg-gray-700' : 'bg-gray-200') : ''}`}
        >
          <Home className={`h-6 w-6 ${getIconColorClass('home')}`} />
        </Button>
        <Button 
          variant={activePage === 'wallet' ? "default" : "ghost"} 
          size="icon"
          onClick={() => setActivePage('wallet')}
          className={`group transition-all duration-300 ease-in-out ${activePage === 'wallet' ? (darkMode ? 'bg-gray-700' : 'bg-gray-200') : ''}`}
        >
          <Wallet className={`h-6 w-6 ${getIconColorClass('wallet')}`} />
        </Button>
        <Button 
          variant={activePage === 'discussions' ? "default" : "ghost"} 
          size="icon"
          onClick={() => setActivePage('discussions')}
          className={`group transition-all duration-300 ease-in-out ${activePage === 'discussions' ? (darkMode ? 'bg-gray-700' : 'bg-gray-200') : ''}`}
        >
          <MessageSquare className={`h-6 w-6 ${getIconColorClass('discussions')}`} />
        </Button>
        <Button 
          variant={activePage === 'news' ? "default" : "ghost"} 
          size="icon"
          onClick={() => setActivePage('news')}
          className={`group transition-all duration-300 ease-in-out ${activePage === 'news' ? (darkMode ? 'bg-gray-700' : 'bg-gray-200') : ''}`}
        >
          <Newspaper className={`h-6 w-6 ${getIconColorClass('news')}`} />
        </Button>
      </aside>

      <div className="flex-1 flex flex-col relative">
        <div className="absolute top-6 right-6 z-10 flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setDarkMode(!darkMode)}
            className={`transition-all duration-300 ease-in-out ${darkMode ? 'text-white hover:text-yellow-400' : 'text-gray-800 hover:text-yellow-600'}`}
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button 
            variant="ghost" 
            className={`flex items-center space-x-2 transition-all duration-300 ease-in-out transform hover:scale-105 ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-background hover:bg-background'}`}
          >
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="font-medium">0x1234...5678</span>
            <ChevronDown className="h-4 w-4 transition-transform duration-300 ease-in-out group-hover:rotate-180" />
          </Button>
        </div>
        <main className="flex-1 p-8 overflow-auto">
          {renderContent()}
        </main>
      </div>

      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className={`w-full max-w-3xl relative ${darkMode ? 'bg-gray-800 text-white' : ''}`}>
            <Button 
              className="absolute top-2 right-2 p-1 rounded-full transition-all duration-300 ease-in-out bg-red-500 hover:bg-red-600 text-white"
              onClick={() => setSelectedProject(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex justify-between items-center">
                {selectedProject.name}
                <Button variant="outline" size="sm" className="flex items-center gap-2 dark:text-white dark:hover:bg-gray-700">
                  <Share2 className="h-4 w-4" />
                  Partager
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3 dark:bg-gray-700">
                  <TabsTrigger value="details" className="dark:data-[state=active]:bg-gray-600 dark:text-white">Détails</TabsTrigger>
                  <TabsTrigger value="team" className="dark:data-[state=active]:bg-gray-600 dark:text-white">Équipe</TabsTrigger>
                  <TabsTrigger value="roadmap" className="dark:data-[state=active]:bg-gray-600 dark:text-white">Roadmap</TabsTrigger>
                </TabsList>
                <TabsContent value="details">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2 dark:text-white">Résumé du projet</h3>
                      <p className="dark:text-gray-300">
                        {selectedProject.sector} - Objectif de levée : {selectedProject.goal}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2 dark:text-white">Détails de l'investissement</h3>
                      <p className="dark:text-gray-300">
                        Prix par part : {selectedProject.sharePrice}
                      </p>
                      <p className="dark:text-gray-300">
                        Montant déjà levé : {selectedProject.raised}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2 dark:text-white">Description du projet</h3>
                      <p className="dark:text-gray-300">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisi vel consectetur
                        interdum, nisl nunc egestas nunc, vitae tincidunt nisl nunc euismod nunc.
                      </p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="team">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-2 dark:text-white">Équipe</h3>
                    <p className="dark:text-gray-300">
                      John Doe - CEO
                      <br />
                      Jane Smith - CTO
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="roadmap">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-2 dark:text-white">Roadmap</h3>
                    <ul className="list-disc list-inside dark:text-gray-300">
                      <li>Phase 1 : Développement du prototype</li>
                      <li>Phase 2 : Tests et validation</li>
                      <li>Phase 3 : Lancement sur le marché</li>
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex flex-col items-start space-y-4 border-t pt-4 dark:border-gray-700">
              <div className="w-full">
                <h3 className="text-lg font-semibold mb-2 dark:text-white">Documents légaux</h3>
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 dark:text-white" />
                  <a href="#" className="text-blue-500 hover:underline dark:text-blue-400">Whitepaper.pdf</a>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <FileText className="h-5 w-5 dark:text-white" />
                  <a href="#" className="text-blue-500 hover:underline dark:text-blue-400">Termes_et_conditions.pdf</a>
                </div>
              </div>
              <Button className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded transition-all duration-300 ease-in-out transform hover:scale-105 dark:bg-blue-600 dark:hover:bg-blue-700">
                Investir maintenant
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}