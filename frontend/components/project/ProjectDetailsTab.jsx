"use client";

import React, { useState } from 'react';
import NextImage from 'next/image';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from '@/hooks/useLanguage';
import DocumentViewer from './DocumentViewer';
import {
  FileText,
  Download,
  ExternalLink,
  Image as ImageIcon,
  Play,
  Eye,
  Folder,
  Star,
  Calendar,
  MapPin,
  Building,
  Users,
  Trophy,
  TrendingUp,
  Globe,
  Twitter,
  Github,
  MessageCircle,
  Send,
  Briefcase,
  X
} from 'lucide-react';

const DocumentLink = ({ title, url, type = 'document', t, onPreview }) => {
  const getIcon = () => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-5 w-5 text-lime-500" />;
      case 'video':
        return <Play className="h-5 w-5 text-green-500" />;
      default:
        return <FileText className="h-5 w-5 text-lime-500" />;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'image': return t('projectDetailsTab.image');
      case 'video': return t('projectDetailsTab.video');
      default: return t('projectDetailsTab.document');
    }
  };

  return (
    <div className="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white dark:from-neutral-800 dark:to-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-700 hover:border-lime-300 dark:hover:border-lime-700 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-sm group-hover:scale-110 group-hover:bg-lime-50 dark:group-hover:bg-lime-900/20 transition-all">
          {getIcon()}
        </div>
        <div>
          <span className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">
            {title}
          </span>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {getTypeLabel()}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPreview({ name: title, url, type })}
          className="h-8 px-3 hover:bg-lime-50 dark:hover:bg-lime-900/20"
        >
          <Eye className="h-3 w-3 mr-1" />
          {t('projectDetailsTab.preview')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(url, '_blank')}
          className="h-8 px-3 border-lime-200 dark:border-lime-800 hover:bg-lime-50 dark:hover:bg-lime-900/20"
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          {t('projectDetailsTab.open')}
        </Button>
      </div>
    </div>
  );
};

const MediaGallery = ({ media = [], t, onPreview }) => {
  if (!media || media.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-neutral-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-neutral-700">
        <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">{t('projectDetailsTab.noMedia')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {media.map((mediaItem, index) => {
          const mediaUrl = typeof mediaItem === 'string' ? mediaItem : mediaItem?.url;
          const mediaName = typeof mediaItem === 'object' ? mediaItem?.name : t('projectDetailsTab.media', { index: index + 1 });

          if (!mediaUrl) return null;

          return (
            <div
              key={index}
              className="relative group cursor-pointer bg-gray-100 dark:bg-neutral-800 rounded-xl overflow-hidden aspect-square hover:shadow-xl transition-all duration-300"
              onClick={() => onPreview({ name: mediaName, url: mediaUrl, type: 'image' })}
            >
              <NextImage
                src={mediaUrl}
                alt={mediaName || t('projectDetailsTab.media', { index: index + 1 })}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center p-4">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const InvestmentReturns = ({ investmentReturns = {}, t }) => {
  const enabledReturns = Object.entries(investmentReturns)
    .filter(([key, value]) => value.enabled);

  if (enabledReturns.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-neutral-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-neutral-700">
        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          {t('projectDetailsTab.noInvestmentReturns')}
        </p>
      </div>
    );
  }

  const getReturnIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'dividend':
        return <Star className="h-5 w-5 text-lime-500" />;
      case 'revenue':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'equity':
        return <Building className="h-5 w-5 text-lime-500" />;
      default:
        return <Trophy className="h-5 w-5 text-green-500" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {enabledReturns.map(([type, data]) => (
        <Card
          key={type}
          className="border-2 border-lime-200 dark:border-lime-800 bg-gradient-to-br from-white to-lime-50 dark:from-neutral-900 dark:to-lime-900/10 hover:shadow-xl transition-all duration-300"
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-lime-100 dark:bg-lime-900/20 rounded-xl">
                  {getReturnIcon(type)}
                </div>
                <div>
                  <h4 className="font-semibold text-lg text-gray-900 dark:text-white capitalize">
                    {type.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </h4>
                  <Badge variant="outline" className="mt-1 border-lime-300 dark:border-lime-700 text-lime-700 dark:text-lime-300">
                    {t('projectDetailsTab.active')}
                  </Badge>
                </div>
              </div>
            </div>

            {data.details && (
              <div className="space-y-2">
                {Object.entries(data.details).map(([detailKey, detailValue]) => (
                  <div key={detailKey} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-neutral-700 last:border-0">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                      {detailKey.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {detailValue}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default function ProjectDetailsTab({ projectData }) {
  const { t } = useTranslation();
  const [viewerDocument, setViewerDocument] = useState(null);

  const handlePreview = (document) => {
    setViewerDocument(document);
  };

  if (!projectData) {
    return (
      <div className="text-center py-12">
        <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
        <p className="text-gray-500 dark:text-gray-400">
          {t('projectDetailsTab.loading')}
        </p>
      </div>
    );
  }

  const { ipfs } = projectData;

  return (
    <ScrollArea className="h-[calc(95vh-200px)]">
      <div className="space-y-6 pr-4">

        {/* Description du projet */}
        <Card className="border-2 border-gray-200 dark:border-neutral-800 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-lime-100 dark:bg-lime-900/20 rounded-lg">
                <FileText className="h-5 w-5 text-lime-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('projectDetailsTab.projectDescription')}
              </h3>
            </div>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base whitespace-pre-wrap">
                {ipfs?.description || projectData.description || t('projectDetailsTab.noDescription')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Secteur */}
        {ipfs?.sector && (
          <Card className="border-2 border-lime-200 dark:border-lime-800 bg-gradient-to-r from-lime-50 to-green-50 dark:from-lime-900/20 dark:to-green-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-neutral-800 rounded-lg">
                    <Briefcase className="h-5 w-5 text-lime-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                      {t('projectOverview.stats.sector') || 'Secteur d\'activité'}
                    </h3>
                    <Badge className="mt-1 bg-lime-500 text-white text-base px-4 py-1.5">
                      {ipfs.sector}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documents officiels */}
        <Card className="border-2 border-gray-200 dark:border-neutral-800 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-lime-100 dark:bg-lime-900/20 rounded-lg">
                  <Folder className="h-5 w-5 text-lime-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('projectDetailsTab.officialDocuments')}
                </h3>
              </div>
              <Badge className="bg-lime-100 dark:bg-lime-900/20 text-lime-700 dark:text-lime-300 border border-lime-200 dark:border-lime-800">
                {t('projectDetailsTab.documentsCount', {
                  count: [
                    ...(ipfs?.documents?.whitepaper || []),
                    ...(ipfs?.documents?.pitchDeck || []),
                    ...(ipfs?.documents?.legalDocuments || [])
                  ].length
                })}
              </Badge>
            </div>

            <div className="space-y-3">
              {/* Whitepaper */}
              {ipfs?.documents?.whitepaper?.map((doc, index) => (
                <DocumentLink
                  key={`whitepaper-${index}`}
                  title={doc.name || t('projectDetailsTab.whitepaper')}
                  url={doc.url}
                  type={doc.type?.startsWith('image') ? 'image' : 'document'}
                  t={t}
                  onPreview={handlePreview}
                />
              ))}

              {/* Pitch Deck */}
              {ipfs?.documents?.pitchDeck?.map((doc, index) => (
                <DocumentLink
                  key={`pitchDeck-${index}`}
                  title={doc.name || t('projectDetailsTab.pitchDeck')}
                  url={doc.url}
                  type={doc.type?.startsWith('image') ? 'image' : 'document'}
                  t={t}
                  onPreview={handlePreview}
                />
              ))}

              {/* Documents légaux */}
              {ipfs?.documents?.legalDocuments?.map((doc, index) => (
                <DocumentLink
                  key={`legal-${index}`}
                  title={doc.name || t('projectDetailsTab.legalDocument', { index: index + 1 })}
                  url={doc.url}
                  type={doc.type?.startsWith('image') ? 'image' : 'document'}
                  t={t}
                  onPreview={handlePreview}
                />
              ))}

              {/* Message si aucun document */}
              {(!ipfs?.documents || (
                (!ipfs.documents.whitepaper?.length) &&
                (!ipfs.documents.pitchDeck?.length) &&
                (!ipfs.documents.legalDocuments?.length)
              )) && (
                <div className="text-center py-12 bg-gray-50 dark:bg-neutral-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-neutral-700">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {t('projectDetailsTab.noDocuments')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Galerie média */}
        <Card className="border-2 border-gray-200 dark:border-neutral-800 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-lime-100 dark:bg-lime-900/20 rounded-lg">
                  <ImageIcon className="h-5 w-5 text-lime-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('projectDetailsTab.mediaGallery')}
                </h3>
              </div>
              <Badge className="bg-lime-100 dark:bg-lime-900/20 text-lime-700 dark:text-lime-300 border border-lime-200 dark:border-lime-800">
                {t('projectDetailsTab.mediaCount', { count: ipfs?.documents?.media?.length || 0 })}
              </Badge>
            </div>

            <MediaGallery media={ipfs?.documents?.media} t={t} onPreview={handlePreview} />
          </CardContent>
        </Card>

        {/* Équipe */}
        {ipfs?.teamMembers && ipfs.teamMembers.length > 0 && (
          <Card className="border-2 border-gray-200 dark:border-neutral-800 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-lime-100 dark:bg-lime-900/20 rounded-lg">
                  <Users className="h-5 w-5 text-lime-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('projectDetailsTab.teamMembers')}
                </h3>
                <Badge className="bg-lime-100 dark:bg-lime-900/20 text-lime-700 dark:text-lime-300 border border-lime-200 dark:border-lime-800">
                  {t('projectDetailsTab.teamMembersCount', { count: ipfs.teamMembers.length })}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ipfs.teamMembers.map((member, index) => (
                  <Card key={index} className="border border-gray-200 dark:border-neutral-800 hover:border-lime-300 dark:hover:border-lime-700 hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-lime-100 dark:bg-lime-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <Users className="h-6 w-6 text-lime-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                            {member.name || t('projectDetailsTab.memberNameNotSpecified')}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {member.role || t('projectDetailsTab.memberRoleNotSpecified')}
                          </p>
                          {member.socials && (Object.keys(member.socials).length > 0) && (
                            <div className="flex gap-2 mt-2">
                              {member.socials.twitter && (
                                <a href={member.socials.twitter} target="_blank" rel="noopener noreferrer" className="text-lime-600 hover:text-lime-700 transition-colors">
                                  <Twitter className="h-4 w-4" />
                                </a>
                              )}
                              {member.socials.linkedin && (
                                <a href={member.socials.linkedin} target="_blank" rel="noopener noreferrer" className="text-lime-600 hover:text-lime-700 transition-colors">
                                  <Users className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Réseaux sociaux */}
        {ipfs?.socials && Object.values(ipfs.socials).some(social => social) && (
          <Card className="border-2 border-lime-200 dark:border-lime-800 bg-gradient-to-r from-lime-50 to-green-50 dark:from-lime-900/20 dark:to-green-900/20">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-lime-600" />
                {t('projectDetailsTab.socialLinks')}
              </h3>
              <div className="flex flex-wrap gap-3">
                {ipfs.socials.website && (
                  <a href={ipfs.socials.website} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border-2 border-lime-200 dark:border-lime-800 rounded-lg hover:bg-lime-50 dark:hover:bg-lime-900/20 transition-all shadow-sm hover:shadow">
                    <Globe className="h-4 w-4 text-lime-600" />
                    <span className="text-sm font-medium text-lime-700 dark:text-lime-300">{t('projectDetailsTab.website')}</span>
                  </a>
                )}
                {ipfs.socials.twitter && (
                  <a href={ipfs.socials.twitter} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border-2 border-lime-200 dark:border-lime-800 rounded-lg hover:bg-lime-50 dark:hover:bg-lime-900/20 transition-all shadow-sm hover:shadow">
                    <Twitter className="h-4 w-4 text-lime-600" />
                    <span className="text-sm font-medium text-lime-700 dark:text-lime-300">{t('projectDetailsTab.twitter')}</span>
                  </a>
                )}
                {ipfs.socials.github && (
                  <a href={ipfs.socials.github} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border-2 border-lime-200 dark:border-lime-800 rounded-lg hover:bg-lime-50 dark:hover:bg-lime-900/20 transition-all shadow-sm hover:shadow">
                    <Github className="h-4 w-4 text-lime-600" />
                    <span className="text-sm font-medium text-lime-700 dark:text-lime-300">{t('projectDetailsTab.github')}</span>
                  </a>
                )}
                {ipfs.socials.discord && (
                  <a href={ipfs.socials.discord} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border-2 border-lime-200 dark:border-lime-800 rounded-lg hover:bg-lime-50 dark:hover:bg-lime-900/20 transition-all shadow-sm hover:shadow">
                    <MessageCircle className="h-4 w-4 text-lime-600" />
                    <span className="text-sm font-medium text-lime-700 dark:text-lime-300">{t('projectDetailsTab.discord')}</span>
                  </a>
                )}
                {ipfs.socials.telegram && (
                  <a href={ipfs.socials.telegram} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border-2 border-lime-200 dark:border-lime-800 rounded-lg hover:bg-lime-50 dark:hover:bg-lime-900/20 transition-all shadow-sm hover:shadow">
                    <Send className="h-4 w-4 text-lime-600" />
                    <span className="text-sm font-medium text-lime-700 dark:text-lime-300">{t('projectDetailsTab.telegram')}</span>
                  </a>
                )}
                {ipfs.socials.medium && (
                  <a href={ipfs.socials.medium} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border-2 border-lime-200 dark:border-lime-800 rounded-lg hover:bg-lime-50 dark:hover:bg-lime-900/20 transition-all shadow-sm hover:shadow">
                    <FileText className="h-4 w-4 text-lime-600" />
                    <span className="text-sm font-medium text-lime-700 dark:text-lime-300">{t('projectDetailsTab.medium')}</span>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informations supplémentaires */}
        <Card className="border-2 border-gray-200 dark:border-neutral-800 bg-gradient-to-br from-gray-50 to-white dark:from-neutral-800 dark:to-neutral-900">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-lime-100 dark:bg-lime-900/20 rounded-lg">
                <Building className="h-5 w-5 text-lime-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('projectDetailsTab.additionalInfo')}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700">
                <Calendar className="h-5 w-5 text-lime-600" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('projectDetailsTab.lastUpdate')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700">
                <Users className="h-5 w-5 text-lime-600" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('projectDetailsTab.projectType')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {t('projectDetailsTab.participatoryCrowdfunding')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewer
        document={viewerDocument}
        isOpen={!!viewerDocument}
        onClose={() => setViewerDocument(null)}
      />
    </ScrollArea>
  );
}
