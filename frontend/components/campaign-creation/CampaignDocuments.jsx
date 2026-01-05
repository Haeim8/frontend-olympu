"use client";

import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from '@/hooks/useLanguage';
import {
  FileText,
  Upload,
  Trash2,
  CheckCircle,
  AlertCircle,
  FileVideo,
  FileImage,
  File,
  Shield,
  Eye
} from 'lucide-react';

const DocumentType = {
  WHITEPAPER: 'whitepaper',
  PITCH_DECK: 'pitchDeck',
  LEGAL_DOCUMENTS: 'legalDocuments',
  MEDIA: 'media'
};

const getDocumentConfig = (t) => ({
  [DocumentType.WHITEPAPER]: {
    title: t('campaignDocs.whitepaper', 'Whitepaper'),
    description: t('campaignDocs.whitepaperDesc', 'Le document technique détaillé de votre projet.'),
    accept: '.pdf,.doc,.docx',
    required: true,
    multiple: false,
    icon: FileText,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-400/20'
  },
  [DocumentType.PITCH_DECK]: {
    title: t('campaignDocs.pitchDeck', 'Pitch Deck'),
    description: t('campaignDocs.pitchDeckDesc', 'Présentation concise pour les investisseurs.'),
    accept: '.pdf,.ppt,.pptx',
    required: false,
    multiple: false,
    icon: FileId,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    borderColor: 'border-purple-400/20'
  },
  [DocumentType.LEGAL_DOCUMENTS]: {
    title: t('campaignDocs.legalDocs', 'Documents Légaux'),
    description: t('campaignDocs.legalDocsDesc', 'Statuts, K-bis, ou tout autre document juridique.'),
    accept: '.pdf,.doc,.docx',
    required: false,
    multiple: true,
    icon: Shield,
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
    borderColor: 'border-orange-400/20'
  },
  [DocumentType.MEDIA]: {
    title: t('campaignDocs.media', 'Médias & Visuels'),
    description: t('campaignDocs.mediaDesc', 'Images, vidéos promotionnelles et logos haute qualité.'),
    accept: 'image/*,video/*',
    required: false,
    multiple: true,
    icon: FileImage,
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    borderColor: 'border-green-400/20'
  }
});

// Helper component for Icon because FileId is not standard imported above? check imports. 
// Ah, used FileId but imported FileText. Let's fix imports first.
// Re-checking imports... I used FileId in map without defining it. Stick to standard icons.
const FileId = File;

const FileIcon = ({ file }) => {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  if (isImage) return <FileImage className="h-4 w-4" />;
  if (isVideo) return <FileVideo className="h-4 w-4" />;
  return <File className="h-4 w-4" />;
};

const FileItem = ({ file, index, onRemove, config }) => {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`
      flex items-center justify-between p-3 rounded-lg border transition-all duration-300
      bg-background/40 hover:bg-background/60
      ${config?.borderColor || 'border-border'}
    `}>
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className={`p-2 rounded-md ${config?.bgColor || 'bg-muted'} ${config?.color || 'text-muted-foreground'}`}>
          <FileIcon file={file} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {file.name}
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            {formatFileSize(file.size)}
          </p>
        </div>
      </div>
      <Button
        onClick={() => onRemove(index)}
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

const DocumentUpload = ({ type, files, onFileChange, onRemoveFile, error }) => {
  const { t } = useTranslation();
  const config = getDocumentConfig(t)[type];
  const Icon = config.icon || File;

  return (
    <div className="glass-card p-5 rounded-xl border border-border/50 hover:border-primary/20 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl border ${config.bgColor} ${config.borderColor} ${config.color}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">
                {config.title}
              </h3>
              {config.required && (
                <span className="text-[10px] font-bold uppercase text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm">Test</span>
              ).props.children === 'Test' ? <span className="text-[10px] font-bold uppercase text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded-sm">{t('required', 'Requis')}</span> : null}
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-[250px] leading-relaxed">
              {config.description}
            </p>
          </div>
        </div>

        {files.length > 0 && (
          <div className="flex items-center gap-1.5 bg-green-500/10 text-green-500 px-2 py-1 rounded-full border border-green-500/20">
            <CheckCircle className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold">
              {files.length} {files.length > 1 ? 'files' : 'file'}
            </span>
          </div>
        )}
      </div>

      {/* Zone de drop */}
      <div className="relative group/drop">
        <Input
          type="file"
          accept={config.accept}
          multiple={config.multiple}
          onChange={(e) => onFileChange(e, type)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div className={`
          border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
          flex flex-col items-center justify-center gap-2
          ${error
            ? 'border-red-500/50 bg-red-500/5'
            : 'border-border bg-background/30 group-hover/drop:border-primary/50 group-hover/drop:bg-primary/5'
          }
        `}>
          <div className={`p-3 rounded-full transition-transform duration-300 group-hover/drop:scale-110 ${error ? 'bg-red-500/10 text-red-500' : 'bg-muted/50 text-muted-foreground'}`}>
            <Upload className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {t('campaignDocs.dragDrop', 'Glissez-déposez ou cliquez')}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              {config.accept.replace(/\./g, ' ').toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="flex items-center gap-2 mt-3 text-red-400 text-xs bg-red-500/10 p-2.5 rounded-lg border border-red-500/20 animate-in slide-in-from-top-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Liste des fichiers */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2 animate-in slide-in-from-bottom-2">
          {files.map((file, index) => (
            <FileItem
              key={`${file.name}-${index}`}
              file={file}
              index={index}
              onRemove={onRemoveFile}
              config={config}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function CampaignDocuments({
  formData,
  error,
  onFileChange,
  onRemoveFile
}) {
  const { t } = useTranslation();
  const documentConfig = getDocumentConfig(t);

  const getCompletionPercentage = () => {
    const totalTypes = Object.keys(documentConfig).length;
    const completedTypes = Object.keys(documentConfig).filter(type => {
      const files = formData.documents[type];
      return files && files.length > 0;
    }).length;

    return Math.round((completedTypes / totalTypes) * 100);
  };

  const completion = getCompletionPercentage();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-purple-500/10 border border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
          <FileText className="w-8 h-8 text-purple-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            {t('campaignDocs.title', 'Documentation')}
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mt-1">
            {t('campaignDocs.subtitle', 'Fournissez les documents nécessaires pour rassurer vos investisseurs.')}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="glass-card p-6 rounded-xl border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground">
              {t('campaignDocs.progress', 'Complétude du Dossier')}
            </span>
            <span className="text-xs text-muted-foreground">
              {completion}% {t('campaignDocs.completed', 'complété')}
            </span>
          </div>
          <div className="h-10 w-10 relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-muted" />
            <div
              className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent origin-center rotate-45 transition-all duration-1000"
              style={{ transform: `rotate(${completion * 3.6}deg)` }}
            />
            <span className="text-[10px] font-bold text-primary">{completion}%</span>
          </div>
        </div>
        <Progress
          value={completion}
          className="h-2 bg-muted overflow-hidden"
          indicatorClassName="bg-gradient-to-r from-purple-500 to-blue-500"
        />
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-2">
          <Eye className="h-3 w-3 text-primary" />
          {completion < 25
            ? t('campaignDocs.progressStart', 'Ajoutez votre Whitepaper pour commencer.')
            : completion < 50
              ? t('campaignDocs.progressGood', 'Bon début ! Continuez avec le Pitch Deck.')
              : completion < 75
                ? t('campaignDocs.progressAlmost', 'Presque fini ! Les visuels sont importants.')
                : t('campaignDocs.progressExcellent', 'Dossier complet ! Vous êtes prêt.')
          }
        </p>
      </div>

      {/* Documents Upload Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.values(DocumentType).map(type => (
          <DocumentUpload
            key={type}
            type={type}
            files={formData.documents[type] || []}
            onFileChange={onFileChange}
            onRemoveFile={(index) => onRemoveFile(index, type)}
            error={error?.[type]}
          />
        ))}
      </div>

      {/* Conseils */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 flex gap-4 items-start">
        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 mt-1">
          <Shield className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-blue-400 mb-1">
            {t('campaignDocs.tipsTitle', 'Conseils de conformité')}
          </h3>
          <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed list-disc list-inside">
            <li>{t('campaignDocs.tip1', 'Le Whitepaper doit expliquer clairement la tokenomics.')}</li>
            <li>{t('campaignDocs.tip2', 'Assurez-vous que les documents légaux sont à jour.')}</li>
            <li>{t('campaignDocs.tip3', 'Utilisez des visuels haute définition pour une meilleure impression.')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
