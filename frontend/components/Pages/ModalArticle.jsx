"use client";

import React from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from '@/hooks/useLanguage';
import { ExternalLink, X, Share2, Link } from 'lucide-react';

const ModalArticle = ({ article, isOpen, onClose }) => {
  const { t } = useTranslation();
  if (!article) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90vw] md:max-w-[700px] max-h-[90vh] overflow-y-auto bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-lime-600 dark:text-lime-400">{article.titre}</DialogTitle>
          <DialogDescription className="text-neutral-600 dark:text-neutral-300">
            {article.description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 mt-2">
          <Badge variant="secondary" className="bg-lime-100 text-lime-800 dark:bg-lime-700 dark:text-lime-100">
            {article.categorie}
          </Badge>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">{article.date}</span>
        </div>
        <Button
          className="absolute top-2 right-2 bg-transparent hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
          onClick={onClose}
          aria-label={t('article.close')}
        >
          <X className="h-4 w-4" />
        </Button>
        <div className="mt-4 space-y-4">
          <div className="relative w-full h-64">
            <Image
              src={article.image}
              alt={article.titre || 'Article image'}
              fill
              className="object-cover rounded-md"
              sizes="(max-width: 768px) 100vw, 700px"
              priority={false}
            />
          </div>
          <div className="prose dark:prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: article.contenu }} />
          </div>
          <div className="flex space-x-2 mt-4">
            <Button size="sm" variant="outline" onClick={() => navigator.share({ title: article.titre, text: article.description, url: window.location.href })} aria-label={t('article.share')}>
              <Share2 className="mr-2 h-4 w-4" />
              {t('article.shareButton')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(window.location.href)} aria-label={t('article.copyLink')}>
              <Link className="mr-2 h-4 w-4" />
              {t('article.copyLinkButton')}
            </Button>
          </div>
          <div className="flex justify-between items-center mt-6">
            {article.idCampagne && (
              <Button variant="outline" size="sm" className="bg-lime-500 text-white hover:bg-lime-600" asChild>
                <a href={`/campaign/${article.idCampagne}`}>{t('article.viewCampaign')}</a>
              </Button>
            )}
            <Button variant="link" size="sm" className="text-lime-600 dark:text-lime-400 hover:text-lime-700 dark:hover:text-lime-300" asChild>
              <a href={article.lien} target="_blank" rel="noopener noreferrer" className="flex items-center">
                Lien externe <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalArticle;
