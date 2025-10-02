"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, ExternalLink, FileText, Image as ImageIcon, Film } from 'lucide-react';
import { useTranslation } from '@/hooks/useLanguage';

/**
 * Composant pour visualiser les documents (PDF, images, vidéos) dans un modal
 * Évite d'ouvrir des onglets qui peuvent buguer l'interface
 */
export default function DocumentViewer({ document, isOpen, onClose }) {
  const { t } = useTranslation();
  const [error, setError] = useState(false);

  if (!document) return null;

  const fileType = getFileType(document);
  const fileName = document.name || document.fileName || 'Document';
  const fileUrl = document.url || '';

  // Déterminer le type de fichier
  function getFileType(doc) {
    const url = doc.url || '';
    const type = doc.type || '';
    const name = doc.name || doc.fileName || '';

    if (type.includes('image') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name)) {
      return 'image';
    }
    if (type.includes('video') || /\.(mp4|webm|mov|avi)$/i.test(name)) {
      return 'video';
    }
    if (type.includes('pdf') || /\.pdf$/i.test(name)) {
      return 'pdf';
    }
    return 'unknown';
  }

  // Rendu du contenu selon le type
  const renderContent = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <FileText className="h-16 w-16 text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('documentViewer.loadError') || 'Impossible de charger le document'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {t('documentViewer.loadErrorHint') || 'Essayez de télécharger le document ou réessayez plus tard'}
          </p>
        </div>
      );
    }

    switch (fileType) {
      case 'image':
        return (
          <div className="relative w-full h-full flex items-center justify-center bg-gray-100 dark:bg-neutral-900 rounded-lg overflow-hidden">
            <img
              src={fileUrl}
              alt={fileName}
              className="max-w-full max-h-[70vh] object-contain"
              onError={() => setError(true)}
            />
          </div>
        );

      case 'video':
        return (
          <div className="relative w-full bg-black rounded-lg overflow-hidden">
            <video
              src={fileUrl}
              controls
              className="w-full max-h-[70vh]"
              onError={() => setError(true)}
            >
              {t('documentViewer.videoNotSupported') || 'Votre navigateur ne supporte pas la vidéo.'}
            </video>
          </div>
        );

      case 'pdf':
        return (
          <div className="relative w-full h-[70vh] bg-gray-100 dark:bg-neutral-900 rounded-lg overflow-hidden">
            <iframe
              src={`${fileUrl}#view=FitH`}
              className="w-full h-full border-0"
              title={fileName}
              onError={() => setError(true)}
            />
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <FileText className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {t('documentViewer.previewNotAvailable') || 'Aperçu non disponible pour ce type de fichier'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">{fileName}</p>
            <Button
              onClick={() => {
                const link = document.createElement('a');
                link.href = fileUrl;
                link.download = fileName;
                link.click();
              }}
              className="gap-2 bg-lime-600 hover:bg-lime-700"
            >
              <Download className="h-4 w-4" />
              {t('documentViewer.download') || 'Télécharger'}
            </Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-gray-200 dark:border-neutral-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {fileType === 'image' && <ImageIcon className="h-5 w-5 text-lime-600 flex-shrink-0" />}
              {fileType === 'video' && <Film className="h-5 w-5 text-lime-600 flex-shrink-0" />}
              {fileType === 'pdf' && <FileText className="h-5 w-5 text-lime-600 flex-shrink-0" />}
              {fileType === 'unknown' && <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />}

              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white truncate">
                  {fileName}
                </DialogTitle>
                {document.category && (
                  <DialogDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {document.category}
                  </DialogDescription>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = fileUrl;
                  link.download = fileName;
                  link.click();
                }}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">{t('documentViewer.download') || 'Télécharger'}</span>
              </Button>

              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="p-6">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
