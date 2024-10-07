"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, Calendar, FileText, Twitter, Facebook, Share2, Star } from 'lucide-react'

export default function ProjectDetails({ selectedProject, onClose }) {
  const [showProjectDetails, setShowProjectDetails] = useState(true)
  const [nftCount, setNftCount] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    setShowProjectDetails(!!selectedProject)
  }, [selectedProject])

  const handleMint = () => {
    console.log(`Minting ${nftCount} NFTs for a total of ${nftCount * selectedProject.sharePrice} ETH`)
    // Implement minting logic here to interact with the smart contract
  }

  const handleShare = () => {
    console.log("Sharing project")
    // Implement share logic here
  }

  const handleFavorite = () => {
    setIsFavorite(!isFavorite)
    console.log(isFavorite ? "Removed from favorites" : "Added to favorites")
    // Implement favorite logic here
  }

  const NFTSelector = () => (
    <Card className="mt-6 bg-gradient-to-br from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-800 border border-lime-400 dark:border-lime-400 shadow-lg rounded-xl overflow-hidden">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Sélectionner le nombre de NFTs</h3>
        <div className="flex items-center justify-between mb-4">
          <label htmlFor="nftCount" className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre de NFT</label>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setNftCount(Math.max(1, nftCount - 1))}
              className="w-8 h-8 rounded-full bg-gray-200 dark:bg-neutral-900 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-neutral-900 transition-colors duration-200"
            >
              -
            </Button>
            <input
              id="nftCount"
              type="number"
              value={nftCount}
              onChange={(e) => setNftCount(Math.max(1, parseInt(e.target.value)))}
              min="1"
              className="w-16 text-center bg-white dark:bg-neutral-900 border border-lime-400 dark:border-lime-400 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
            />
            <Button
              onClick={() => setNftCount(nftCount + 1)}
              className="w-8 h-8 rounded-full bg-gray-200 dark:bg-neutral-900 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              +
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Prix unitaire</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{selectedProject.sharePrice} ETH</span>
        </div>
        <div className="flex justify-between items-center mb-6">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Prix total</span>
          <span className="text-lg font-bold text-lime-600 dark:text-lime-400">{nftCount * selectedProject.sharePrice} ETH</span>
        </div>
        <Button onClick={handleMint} className="w-full bg-lime-500 hover:bg-lime-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-opacity-50">
          Mint : {nftCount} NFT{nftCount > 1 ? 's' : ''}
        </Button>
      </CardContent>
    </Card>
  )

  if (!selectedProject) return null

  return (
    <Dialog open={showProjectDetails} onOpenChange={() => { setShowProjectDetails(false); onClose(); }}>
     <DialogContent className="bg-white dark:bg-neutral-950 text-gray-900 dark:text-gray-100 max-w-4xl max-h-[90vh] overflow-y-auto p-6 rounded-lg shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-gray-900 dark:text-white">{selectedProject.name}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={handleShare} className="hover:bg-gray-100 dark:hover:bg-neutral-950 transition-colors duration-200">
              <Share2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleFavorite} className="hover:bg-gray-100 dark:hover:bg-neutral-950 transition-colors duration-200">
              <Star className={`h-5 w-5 ${isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600 dark:text-gray-400'}`} />
            </Button>
          </div>
        </div>
        <NFTSelector />
        <Tabs defaultValue="overview" className="w-full mt-8">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-neutral-900 rounded-lg p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white rounded-md transition-all duration-200">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="details" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white rounded-md transition-all duration-200">Détails et Documents</TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white rounded-md transition-all duration-200">Transactions</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white dark:bg-neutral-900 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="text-center">
                    <DollarSign className="w-8 h-8 mx-auto text-lime-500" />
                    <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">Levée en cours</h3>
                    <p className="text-2xl font-bold text-lime-600 dark:text-lime-400">{selectedProject.raised.toLocaleString()} ETH</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">sur {selectedProject.goal.toLocaleString()} ETH</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white dark:bg-neutral-900 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="text-center">
                    <DollarSign className="w-8 h-8 mx-auto text-lime-500" />
                    <h3 className="mt-2 text-lg font-semibold text-neutral-900 dark:text-white">Prix unitaire NFT</h3>
                    <p className="text-2xl font-bold text-lime-600 dark:text-lime-400">{selectedProject.sharePrice} USDC</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white dark:bg-neutral-900 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Calendar className="w-8 h-8 mx-auto text-lime-500" />
                    <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">Date de fin</h3>
                    <p className="text-2xl font-bold text-lime-600 dark:text-lime-400">{selectedProject.endDate}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="bg-gray-50 dark:bg-neutral-900 p-6 rounded-lg shadow-inner">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-lime-600 bg-lime-200 dark:bg-lime-900 dark:text-lime-300">
                    Progression
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-lime-600 dark:text-lime-400">
                    {((selectedProject.raised / selectedProject.goal) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-lime-200 dark:bg-lime-900">
                <div style={{ width: `${(selectedProject.raised / selectedProject.goal) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-lime-500 dark:bg-lime-400 transition-all duration-500 ease-in-out"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-neutral-900 dark:text-white">Documents légaux</h3>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  {selectedProject.documents.map((doc, index) => (
                    <li key={index}>{doc.name}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Équipe</h3>
                {selectedProject.teamMembers.map((member, index) => (
                  <div key={index} className="mb-4 text-sm">
                    <p className="font-semibold text-gray-900 dark:text-white">{member.name} - <span className="font-normal text-gray-600 dark:text-gray-400">{member.role}</span></p>
                    <div className="flex space-x-2 mt-2">
                      <a href={`https://twitter.com/${member.twitter}`} target="_blank" rel="noopener noreferrer" className="text-lime-500 hover:text-lime-600 transition-colors duration-200">
                        <Twitter className="w-5 h-5" />
                      </a>
                      <a href={`https://facebook.com/${member.facebook}`} target="_blank" rel="noopener noreferrer"className="text-lime-500 hover:text-lime-600 transition-colors duration-200">
                        <Facebook className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {selectedProject.hasLawyer && (
              <Card className="bg-white dark:bg-neutral-900 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Avocat associé</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300"><strong>Nom :</strong> {selectedProject.lawyer.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300"><strong>Contact :</strong> {selectedProject.lawyer.contact}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300"><strong>Téléphone :</strong> {selectedProject.lawyer.phone}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="details" className="mt-6 space-y-6">
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Résumé du projet</h3>
              <p className="text-gray-600 dark:text-gray-300">{selectedProject.description}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Conditions de rémunération des investisseurs</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
                <li><strong>Type de rémunération :</strong> {selectedProject.investmentTerms.remunerationType}</li>
                <li><strong>Distribution de tokens :</strong> {selectedProject.investmentTerms.tokenDistribution}</li>
                <li><strong>Temps de retour sur investissement estimé :</strong> {selectedProject.investmentTerms.roi}</li>
              </ul>
            </div>
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Informations sur les parts de la société</h3>
              <p className="text-gray-600 dark:text-gray-300"><strong>Pourcentage de la société minté :</strong> {selectedProject.companyShares.percentageMinted}%</p>
              <p className="text-gray-600 dark:text-gray-300"><strong>Lien vers le portail Verte :</strong> <a href={selectedProject.companyShares.vertePortalLink} target="_blank" rel="noopener noreferrer" className="text-lime-500 hover:text-lime-600 hover:underline transition-colors duration-200">{selectedProject.companyShares.vertePortalLink}</a></p>
            </div>
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Documents légaux de la société</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedProject.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-950 rounded-lg">
                    <span className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <FileText className="w-5 h-5 mr-2 text-lime-500" />
                      {doc.name}
                    </span>
                    <Button variant="outline" size="sm" asChild className="hover:bg-lime-50 dark:hover:bg-lime-900 transition-colors duration-200">
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">Télécharger</a>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Médias</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedProject.media.map((media, index) => (
                  <div key={index} className="space-y-2">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{media.name}</h4>
                    <div className="relative" style={{ paddingBottom: '56.25%', height: 0 }}>
                      <iframe
                        src={media.url}
                        title={media.name}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute top-0 left-0 w-full h-full rounded-lg shadow-md"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="transactions" className="mt-6 space-y-6">
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Historique des transactions</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4"><strong>Nombre d'investisseurs uniques :</strong> {selectedProject.transactions.length}</p>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-900">
                  <thead className="bg-gray-50 dark:bg-neutral-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre de NFT</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Valeur</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">NFT en possession</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-neutral-950 dark:divide-lime-400">
                    {selectedProject.transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-lime-700 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{transaction.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{transaction.nftCount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{transaction.value} ETH</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{transaction.totalOwned}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}