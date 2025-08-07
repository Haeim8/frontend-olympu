"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Image, 
  Play,
  Eye,
  Folder,
  Star,
  Calendar,
  MapPin,
  Building,
  Users,
  Trophy,
  TrendingUp
} from 'lucide-react';

const DocumentLink = ({ title, url, type = 'document' }) => {
  const getIcon = () => {
    switch (type) {
      case 'image':
        return <Image className="h-5 w-5 text-blue-500" />;
      case 'video':
        return <Play className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-lime-500" />;
    }
  };

  return (
    <div className="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white dark:from-neutral-800 dark:to-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-700 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
          {getIcon()}
        </div>
        <div>
          <span className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">
            {title}
          </span>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {type === 'image' ? 'Image' : type === 'video' ? 'Vidéo' : 'Document'}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => window.open(url, '_blank')}
          className="h-8 px-3"
        >
          <Eye className="h-3 w-3 mr-1" />
          Aperçu
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.open(url)}
          className="h-8 px-3 border-lime-200 dark:border-lime-800 hover:bg-lime-50 dark:hover:bg-lime-900/20"
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          Ouvrir
        </Button>
      </div>
    </div>
  );
};

const MediaGallery = ({ media = [] }) => {
  const [selectedMedia, setSelectedMedia] = useState(null);

  if (!media || media.length === 0) {
    return (
      <div className="text-center py-12">
        <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Aucun média disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {media.map((mediaItem, index) => {
          // Gérer les deux formats : objet {url, name, etc.} ou simple string
          const mediaUrl = typeof mediaItem === 'string' ? mediaItem : mediaItem?.url;
          const mediaName = typeof mediaItem === 'object' ? mediaItem?.name : `Media ${index + 1}`;
          
          if (!mediaUrl) return null;
          
          return (
            <div 
              key={index} 
              className="relative group cursor-pointer bg-gray-100 dark:bg-neutral-800 rounded-xl overflow-hidden aspect-square"
              onClick={() => setSelectedMedia(mediaUrl)}
            >
              <img 
                src={mediaUrl}
                alt={mediaName}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
              />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <Eye className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* Modal pour média sélectionné */}
      {selectedMedia && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img 
              src={selectedMedia}
              alt="Media sélectionné"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMedia(null);
              }}
              className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30"
            >
              Fermer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const InvestmentReturns = ({ investmentReturns = {} }) => {
  const enabledReturns = Object.entries(investmentReturns)
    .filter(([key, value]) => value.enabled);

  if (enabledReturns.length === 0) {
    return (
      <div className="text-center py-8">
        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          Aucun retour sur investissement configuré
        </p>
      </div>
    );
  }

  const getReturnIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'dividend':
        return <Star className="h-5 w-5 text-yellow-500" />;
      case 'revenue':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'equity':
        return <Building className="h-5 w-5 text-blue-500" />;
      default:
        return <Trophy className="h-5 w-5 text-purple-500" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {enabledReturns.map(([type, data]) => (
        <div 
          key={type}
          className="bg-gradient-to-br from-white to-gray-50 dark:from-neutral-900 dark:to-neutral-800 p-6 rounded-xl border border-gray-200 dark:border-neutral-700 shadow-sm hover:shadow-lg transition-all duration-300"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-neutral-700 rounded-lg">
                {getReturnIcon(type)}
              </div>
              <div>
                <h4 className="font-semibold text-lg text-gray-900 dark:text-white capitalize">
                  {type.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </h4>
                <Badge variant="outline" className="mt-1">
                  Actif
                </Badge>
              </div>
            </div>
          </div>

          {data.details && (
            <div className="space-y-3">
              {Object.entries(data.details).map(([detailKey, detailValue]) => (
                <div key={detailKey} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-neutral-700 last:border-0">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                    {detailKey.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {detailValue}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default function ProjectDetailsTab({ projectData }) {
  if (!projectData) {
    return (
      <div className="text-center py-12">
        <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          Chargement des détails du projet...
        </p>
      </div>
    );
  }

  const { ipfs, firebase } = projectData;
  
  console.log('🔍 ProjectDetailsTab received:', { ipfs, firebase });
  console.log('🔍 IPFS structure détaillée:', {
    documents: ipfs?.documents,
    teamMembers: ipfs?.teamMembers,
    socials: ipfs?.socials,
    allKeys: Object.keys(ipfs || {}),
    fullData: ipfs
  });

  return (
    <ScrollArea className="h-[600px] pr-4">
      <div className="space-y-8">
        {/* Description du projet */}
        <section className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-lime-100 dark:bg-lime-900/20 rounded-lg">
                <FileText className="h-5 w-5 text-lime-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Description du projet
              </h3>
            </div>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                {ipfs?.description || firebase?.description || projectData.description || "Aucune description disponible pour ce projet."}
              </p>
            </div>
          </div>
        </section>

        {/* Documents */}
        <section className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Folder className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Documents officiels
                </h3>
              </div>
              <Badge className="bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                {[
                  ipfs?.documents?.whitepaper || firebase?.documents?.whitepaper,
                  ipfs?.documents?.pitchDeck || firebase?.documents?.pitchDeck,
                  ...(Array.isArray(ipfs?.documents?.legalDocuments || firebase?.documents?.legalDocuments) ? (ipfs?.documents?.legalDocuments || firebase?.documents?.legalDocuments) : [])
                ].filter(Boolean).length} document(s)
              </Badge>
            </div>

            <div className="space-y-4">
              {/* Whitepaper */}
              {ipfs?.documents?.whitepaper?.map((doc, index) => (
                <DocumentLink
                  key={`whitepaper-${index}`}
                  title={doc.name || "Whitepaper"}
                  url={doc.url}
                  type={doc.type?.startsWith('image') ? 'image' : 'document'}
                  fileName={doc.fileName}
                  size={doc.size}
                />
              ))}
              
              {/* Pitch Deck */}
              {ipfs?.documents?.pitchDeck?.map((doc, index) => (
                <DocumentLink
                  key={`pitchDeck-${index}`}
                  title={doc.name || "Pitch Deck"}
                  url={doc.url}
                  type={doc.type?.startsWith('image') ? 'image' : 'document'}
                  fileName={doc.fileName}
                  size={doc.size}
                />
              ))}
              
              {/* Documents légaux */}
              {ipfs?.documents?.legalDocuments?.map((doc, index) => (
                <DocumentLink
                  key={`legal-${index}`}
                  title={doc.name || `Document légal ${index + 1}`}
                  url={doc.url}
                  type={doc.type?.startsWith('image') ? 'image' : 'document'}
                  fileName={doc.fileName}
                  size={doc.size}
                />
              ))}
              
              {/* Fallback pour ancienne structure */}
              {firebase?.documents?.whitepaper && (
                <DocumentLink
                  title="Whitepaper"
                  url={firebase.documents.whitepaper}
                  type="document"
                />
              )}
              
              {firebase?.documents?.pitchDeck && (
                <DocumentLink
                  title="Pitch Deck"
                  url={firebase.documents.pitchDeck}
                  type="document"
                />
              )}
              
              {/* Message si aucun document */}
              {(!ipfs?.documents || (
                (!ipfs.documents.whitepaper?.length) && 
                (!ipfs.documents.pitchDeck?.length) && 
                (!ipfs.documents.legalDocuments?.length)
              )) && !firebase?.documents && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucun document disponible pour ce projet
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Médias */}
        <section className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Image className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Galerie média
                </h3>
              </div>
              <Badge className="bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300">
                {(ipfs?.documents?.media || firebase?.documents?.media)?.length || 0} média(s)
              </Badge>
            </div>

            <MediaGallery media={ipfs?.documents?.media || firebase?.documents?.media} />
            
            {/* Affichage en liste si pas de galerie */}
            {ipfs?.documents?.media?.map((media, index) => (
              <DocumentLink
                key={`media-${index}`}
                title={media.name || `Média ${index + 1}`}
                url={media.url}
                type={media.type?.startsWith('image') ? 'image' : media.type?.startsWith('video') ? 'video' : 'document'}
                fileName={media.fileName}
                size={media.size}
              />
            ))}
          </div>
        </section>


        {/* Retours sur investissement */}
        {firebase?.investmentReturns && (
          <section className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Retours sur investissement
                </h3>
              </div>

              <InvestmentReturns investmentReturns={firebase.investmentReturns} />
            </div>
          </section>
        )}

        {/* Informations supplémentaires */}
        <section className="bg-gradient-to-br from-gray-50 to-white dark:from-neutral-800 dark:to-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-700">
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Building className="h-5 w-5 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Informations complémentaires
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-neutral-800 rounded-lg">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Dernière mise à jour</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date().toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white dark:bg-neutral-800 rounded-lg">
              <Users className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Type de projet</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  Financement participatif
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </ScrollArea>
  );
}