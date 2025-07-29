"use client";

import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Upload, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  FileVideo,
  FileImage,
  File
} from 'lucide-react';

const DocumentType = {
  WHITEPAPER: 'whitepaper',
  PITCH_DECK: 'pitchDeck',
  LEGAL_DOCUMENTS: 'legalDocuments',
  MEDIA: 'media'
};

const documentConfig = {
  [DocumentType.WHITEPAPER]: {
    title: 'Whitepaper',
    description: 'Document technique détaillé de votre projet',
    accept: '.pdf,.doc,.docx',
    required: true,
    multiple: false,
    icon: FileText,
    color: 'text-blue-600'
  },
  [DocumentType.PITCH_DECK]: {
    title: 'Pitch Deck',
    description: 'Présentation de votre projet pour les investisseurs',
    accept: '.pdf,.ppt,.pptx',
    required: false,
    multiple: false,
    icon: FileText,
    color: 'text-purple-600'
  },
  [DocumentType.LEGAL_DOCUMENTS]: {
    title: 'Documents Légaux',
    description: 'Statuts, contrats, certifications légales',
    accept: '.pdf,.doc,.docx',
    required: false,
    multiple: true,
    icon: File,
    color: 'text-orange-600'
  },
  [DocumentType.MEDIA]: {
    title: 'Médias',
    description: 'Images, vidéos promotionnelles, logos',
    accept: 'image/*,video/*',
    required: false,
    multiple: true,
    icon: FileImage,
    color: 'text-green-600'
  }
};

const FileIcon = ({ file }) => {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  
  if (isImage) return <FileImage className="h-4 w-4" />;
  if (isVideo) return <FileVideo className="h-4 w-4" />;
  return <File className="h-4 w-4" />;
};

const FileItem = ({ file, index, onRemove, type }) => {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex items-center justify-between p-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg group hover:bg-gray-50 dark:hover:bg-neutral-750 transition-colors">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className={`p-2 rounded-lg bg-gray-100 dark:bg-neutral-700 ${documentConfig[type]?.color || 'text-gray-600'}`}>
          <FileIcon file={file} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {file.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatFileSize(file.size)}
          </p>
        </div>
      </div>
      <Button
        onClick={() => onRemove(index)}
        variant="ghost"
        size="sm"
        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

const DocumentUpload = ({ type, files, onFileChange, onRemoveFile, error }) => {
  const config = documentConfig[type];
  const Icon = config.icon;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-gray-100 dark:bg-neutral-800 ${config.color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {config.title}
              </Label>
              {config.required && (
                <span className="text-red-500 text-xs">*</span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {config.description}
            </p>
          </div>
        </div>
        {files.length > 0 && (
          <div className="flex items-center space-x-1 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-xs font-medium">
              {files.length} fichier{files.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Zone de drop */}
      <div className="relative">
        <Input
          type="file"
          accept={config.accept}
          multiple={config.multiple}
          onChange={(e) => onFileChange(e, type)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          key={`${type}-upload`}
        />
        <div className={`
          border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200
          ${error ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-neutral-600 hover:border-lime-400 hover:bg-lime-50 dark:hover:bg-lime-900/20'}
        `}>
          <Upload className={`h-8 w-8 mx-auto mb-2 ${error ? 'text-red-500' : 'text-gray-400'}`} />
          <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
            Cliquez ou glissez vos fichiers ici
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {config.accept.replace(/\./g, '').toUpperCase()} • Max 10MB par fichier
            {config.multiple && ' • Plusieurs fichiers acceptés'}
          </p>
        </div>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Liste des fichiers */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Fichiers sélectionnés:
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {files.map((file, index) => (
              <FileItem
                key={`${file.name}-${index}`}
                file={file}
                index={index}
                onRemove={onRemoveFile}
                type={type}
              />
            ))}
          </div>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl mb-4">
          <FileText className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Documents et Médias
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Téléchargez les documents nécessaires pour présenter votre projet
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-50 dark:bg-neutral-900 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Progression des documents
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {completion}%
          </span>
        </div>
        <Progress 
          value={completion} 
          className="h-2"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {completion < 25 
            ? "Commencez par télécharger votre whitepaper" 
            : completion < 50 
            ? "Bon début ! Ajoutez plus de documents" 
            : completion < 75 
            ? "Presque terminé !" 
            : "Excellent ! Vos documents sont complets"
          }
        </p>
      </div>

      {/* Documents Upload */}
      <div className="grid gap-6">
        {Object.values(DocumentType).map(type => (
          <div key={type} className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl p-6">
            <DocumentUpload
              type={type}
              files={formData.documents[type] || []}
              onFileChange={onFileChange}
              onRemoveFile={(index) => onRemoveFile(index, type)}
              error={error?.[type]}
            />
          </div>
        ))}
      </div>

      {/* Conseils */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          💡 Conseils pour vos documents
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Le whitepaper doit être détaillé et professionnel</li>
          <li>• Utilisez des formats standard (PDF recommandé)</li>
          <li>• Les images doivent être en haute résolution</li>
          <li>• Vérifiez que tous vos documents sont à jour</li>
        </ul>
      </div>
    </div>
  );
}