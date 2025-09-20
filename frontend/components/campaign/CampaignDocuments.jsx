"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Plus, 
  Calendar,
  User,
  Shield,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { apiManager } from '@/lib/services/api-manager';
import { useTranslation } from '@/hooks/useLanguage';

export default function CampaignDocuments({ campaignAddress, campaignData, onDocumentUpdate }) {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    file: null,
    name: '',
    description: '',
    category: 'legal',
    isPublic: true
  });

  const loadDocuments = useCallback(async () => {
    if (!campaignAddress) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const documentData = await apiManager.getCampaignDocuments(campaignAddress);
      setDocuments(documentData || []);
      
    } catch (err) {
      console.error('Erreur chargement documents:', err);
      setError(t('campaignDocuments.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [campaignAddress, t]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB max
        setError(t('campaignDocuments.fileSizeError'));
        return;
      }
      
      setUploadForm(prev => ({
        ...prev,
        file,
        name: prev.name || file.name.replace(/\.[^/.]+$/, "")
      }));
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.name.trim()) {
      setError(t('campaignDocuments.fileAndNameRequired'));
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Simuler upload IPFS - à remplacer par votre service IPFS réel
      const mockIpfsHash = `Qm${Math.random().toString(36).substring(2, 15)}`;
      
      await apiManager.addDocument(
        campaignAddress,
        mockIpfsHash,
        uploadForm.name
      );

      // Réinitialiser le form
      setUploadForm({
        file: null,
        name: '',
        description: '',
        category: 'legal',
        isPublic: true
      });
      
      setShowUploadDialog(false);
      await loadDocuments();
      
      if (onDocumentUpdate) {
        onDocumentUpdate();
      }

      alert(t('campaignDocuments.uploadSuccess'));
      
    } catch (error) {
      console.error('Erreur upload document:', error);
      setError(t('campaignDocuments.uploadError'));
    } finally {
      setIsUploading(false);
    }
  };

  const getDocumentIcon = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileText className="h-5 w-5 text-green-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getCategoryBadge = (category) => {
    const categories = {
      legal: { label: t('campaignDocuments.categories.legal'), color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      financial: { label: t('campaignDocuments.categories.financial'), color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      technical: { label: t('campaignDocuments.categories.technical'), color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
      marketing: { label: t('campaignDocuments.categories.marketing'), color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
      other: { label: t('campaignDocuments.categories.other'), color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' }
    };
    
    const cat = categories[category] || categories.other;
    return <Badge className={cat.color}>{cat.label}</Badge>;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDocumentStats = () => {
    const totalDocs = documents.length;
    const categories = documents.reduce((acc, doc) => {
      acc[doc.category || 'other'] = (acc[doc.category || 'other'] || 0) + 1;
      return acc;
    }, {});

    return { totalDocs, categories };
  };

  const stats = getDocumentStats();

  if (error && !showUploadDialog) {
    return (
      <Card className="bg-white dark:bg-neutral-950 border-0 dark:border-0">
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={loadDocuments} variant="outline">
              {t('campaignDocuments.retry')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-neutral-950 border-0 dark:border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-500" />
          {t('campaignDocuments.title')}
          <Badge variant="outline" className="text-sm ml-2">
            {stats.totalDocs} {t('campaignDocuments.documents')}
          </Badge>
        </CardTitle>
        
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              {t('campaignDocuments.add')}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white dark:bg-neutral-950 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-gray-100">
                {t('campaignDocuments.addDocument')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-200 text-sm">{error}</p>
                </div>
              )}

              <div>
                <Label htmlFor="file-upload" className="text-gray-700 dark:text-gray-300">
                  {t('campaignDocuments.file')} *
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                  className="bg-gray-50 dark:bg-neutral-900 mt-1"
                  disabled={isUploading}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('campaignDocuments.acceptedFormats')}
                </p>
              </div>

              <div>
                <Label htmlFor="doc-name" className="text-gray-700 dark:text-gray-300">
                  {t('campaignDocuments.documentName')} *
                </Label>
                <Input
                  id="doc-name"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('campaignDocuments.namePlaceholder')}
                  className="bg-gray-50 dark:bg-neutral-900 mt-1"
                  disabled={isUploading}
                />
              </div>

              <div>
                <Label htmlFor="doc-description" className="text-gray-700 dark:text-gray-300">
                  {t('campaignDocuments.description')}
                </Label>
                <Textarea
                  id="doc-description"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('campaignDocuments.descriptionPlaceholder')}
                  className="bg-gray-50 dark:bg-neutral-900 mt-1 h-20"
                  disabled={isUploading}
                />
              </div>

              <div>
                <Label htmlFor="doc-category" className="text-gray-700 dark:text-gray-300">
                  {t('campaignDocuments.category')}
                </Label>
                <Select 
                  value={uploadForm.category} 
                  onValueChange={(value) => setUploadForm(prev => ({ ...prev, category: value }))}
                  disabled={isUploading}
                >
                  <SelectTrigger className="bg-gray-50 dark:bg-neutral-900 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="legal">{t('campaignDocuments.categories.legal')}</SelectItem>
                    <SelectItem value="financial">{t('campaignDocuments.categories.financial')}</SelectItem>
                    <SelectItem value="technical">{t('campaignDocuments.categories.technical')}</SelectItem>
                    <SelectItem value="marketing">{t('campaignDocuments.categories.marketing')}</SelectItem>
                    <SelectItem value="other">{t('campaignDocuments.categories.other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowUploadDialog(false)}
                  disabled={isUploading}
                >
                  {t('campaignDocuments.cancel')}
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!uploadForm.file || !uploadForm.name.trim() || isUploading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {t('campaignDocuments.uploading')}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      {t('campaignDocuments.add')}
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {/* Stats rapides */}
        {stats.totalDocs > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {Object.entries(stats.categories).map(([category, count]) => {
              const categoryInfo = {
                legal: { label: t('campaignDocuments.categoriesPlural.legal'), color: 'text-blue-600 dark:text-blue-400' },
                financial: { label: t('campaignDocuments.categoriesPlural.financial'), color: 'text-green-600 dark:text-green-400' },
                technical: { label: t('campaignDocuments.categoriesPlural.technical'), color: 'text-purple-600 dark:text-purple-400' },
                marketing: { label: t('campaignDocuments.categoriesPlural.marketing'), color: 'text-orange-600 dark:text-orange-400' },
                other: { label: t('campaignDocuments.categoriesPlural.other'), color: 'text-gray-600 dark:text-gray-400' }
              };
              
              const info = categoryInfo[category] || categoryInfo.other;
              
              return (
                <div key={category} className="text-center p-2 bg-gray-50 dark:bg-neutral-900 rounded-lg">
                  <p className={`text-xl font-bold ${info.color}`}>{count}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{info.label}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Liste des documents */}
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-900 rounded-lg animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    </div>
                  </div>
                  <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {t('campaignDocuments.noDocuments')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {t('campaignDocuments.noDocumentsDescription')}
              </p>
              <Button 
                onClick={() => setShowUploadDialog(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('campaignDocuments.addFirstDocument')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc, index) => (
                <div 
                  key={`${doc.hash || index}-${doc.name}`}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-900 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors duration-150"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getDocumentIcon(doc.name)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {doc.name}
                        </h4>
                        {getCategoryBadge(doc.category)}
                        {doc.isVerified && (
                          <CheckCircle className="h-4 w-4 text-green-500" title={t('campaignDocuments.verified')} />
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(doc.timestamp)}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {t('campaignDocuments.creator')}
                        </div>
                        {doc.size && (
                          <span>{formatFileSize(doc.size)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(doc.url || `https://ipfs.io/ipfs/${doc.hash}`, '_blank')}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = doc.url || `https://ipfs.io/ipfs/${doc.hash}`;
                        link.download = doc.name;
                        link.click();
                      }}
                      className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Notes importantes */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                {t('campaignDocuments.importance.title')}
              </h4>
              <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                <li>• {t('campaignDocuments.importance.point1')}</li>
                <li>• {t('campaignDocuments.importance.point2')}</li>
                <li>• {t('campaignDocuments.importance.point3')}</li>
                <li>• {t('campaignDocuments.importance.point4')}</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
