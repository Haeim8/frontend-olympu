"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from '@/hooks/useLanguage';
import {
  CheckCircle2,
  AlertTriangle,
  Users,
  FileText,
  DollarSign,
  Calendar,
  Globe,
  Shield,
  Info,
  ExternalLink,
  Sparkles,
  Rocket
} from 'lucide-react';

const ReviewSection = ({ icon: Icon, title, children, status = 'complete' }) => {
  const statusColors = {
    complete: 'text-green-500 bg-green-500/10 border-green-500/20',
    warning: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    error: 'text-red-500 bg-red-500/10 border-red-500/20'
  };

  const statusIcons = {
    complete: CheckCircle2,
    warning: AlertTriangle,
    error: AlertTriangle
  };

  const StatusIcon = statusIcons[status];

  return (
    <div className="glass-card p-6 rounded-xl border border-border hover:border-primary/20 transition-all duration-300">
      <div className="flex items-start space-x-4">
        <div className={`p-2.5 rounded-xl border ${statusColors[status]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground text-lg">
              {title}
            </h3>
            <StatusIcon className={`h-5 w-5 ${statusColors[status].split(' ')[0]}`} />
          </div>
          <div className="space-y-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value, type = 'text', highlight = false }) => {
  const { t } = useTranslation();

  const formatValue = () => {
    switch (type) {
      case 'eth':
        return `${value} ETH`;
      case 'date':
        return new Date(value).toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      case 'percentage':
        return `${(value / 100).toFixed(2)}%`;
      case 'array':
        return Array.isArray(value) ? value.join(', ') : value;
      default:
        return value || t('campaignReview.notProvided', 'Non fourni');
    }
  };

  return (
    <div className={`flex justify-between items-start py-2 border-b border-border/30 last:border-0 ${highlight ? 'bg-primary/5 -mx-2 px-2 rounded-lg' : ''}`}>
      <span className="text-sm text-muted-foreground font-medium">
        {label}
      </span>
      <span className={`text-sm text-right max-w-xs font-medium ${highlight ? 'text-primary' : 'text-foreground'}`}>
        {formatValue()}
      </span>
    </div>
  );
};

const EstimatedCosts = ({ sharePrice, numberOfShares, royaltyFee }) => {
  const { t } = useTranslation();
  const targetAmount = parseFloat(sharePrice || 0) * parseFloat(numberOfShares || 0);
  const platformFee = 0.05; // Dummy: 5% platform fee
  const gasFees = 0.01; // Dummy: Gas fee estimation

  return (
    <div className="relative overflow-hidden rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent p-6">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      <h4 className="font-bold text-blue-400 mb-4 flex items-center gap-2">
        <DollarSign className="h-5 w-5" />
        {t('campaignReview.costEstimation', 'Estimation des coûts')}
      </h4>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t('campaignReview.fundingGoal', 'Objectif de levée')}:</span>
          <span className="font-bold text-foreground">{targetAmount.toFixed(6)} ETH</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t('campaignReview.creationFees', 'Frais de création (5%)')}:</span>
          <span className="font-bold text-foreground">{platformFee.toFixed(3)} ETH</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t('campaignReview.gasFees', 'Gas estimé')}:</span>
          <span className="font-bold text-foreground">~{gasFees.toFixed(3)} ETH</span>
        </div>

        <div className="border-t border-blue-500/20 pt-3 mt-2">
          <div className="flex justify-between items-center">
            <span className="text-blue-400 font-bold">{t('campaignReview.estimatedTotal', 'Total Estimé à Payer')}:</span>
            <span className="font-bold text-xl text-blue-400">
              {(platformFee + gasFees).toFixed(3)} ETH
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function CampaignReview({
  formData,
  error,
  isLoading,
  onAcceptTerms,
  onSubmit
}) {
  const { t } = useTranslation();

  const getDocumentCount = () => {
    return Object.values(formData.documents).reduce((count, docs) => {
      return count + (Array.isArray(docs) ? docs.length : 0);
    }, 0);
  };

  const getSocialLinksCount = () => {
    return Object.values(formData.socials).filter(link => link && link.trim()).length;
  };

  const validateForm = () => {
    const warnings = [];

    if (!formData.documents.whitepaper?.length) {
      warnings.push(t('campaignReview.noWhitepaper', 'Whitepaper manquant'));
    }

    if (formData.teamMembers.length < 2) {
      warnings.push(t('campaignReview.smallTeam', 'Équipe petite (< 2 membres)'));
    }

    if (getSocialLinksCount() < 2) {
      warnings.push(t('campaignReview.fewSocialLinks', 'Peu de liens sociaux'));
    }

    return warnings;
  };

  const warnings = validateForm();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-green-500/10 border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
          <Rocket className="w-8 h-8 text-green-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            {t('campaignReview.title', 'Vérification Finale')}
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mt-1">
            {t('campaignReview.subtitle', 'Relisez attentivement avant de déployer votre campagne sur la blockchain.')}
          </p>
        </div>
      </div>

      {/* Avertissements */}
      {warnings.length > 0 && (
        <Alert className="border-orange-500/20 bg-orange-500/10">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-orange-200 text-sm ml-2">
            <strong className="block mb-1 text-orange-400">{t('campaignReview.warnings', 'Recommandations')}:</strong>
            <ul className="list-disc list-inside space-y-0.5 opacity-80">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Informations de base */}
          <ReviewSection icon={Info} title={t('campaignReview.basicInfo', 'Infos Générales')}>
            <InfoRow label={t('campaignReview.projectName', 'Projet')} value={formData.name} highlight />
            <InfoRow label={t('campaignReview.symbol', 'Symbole')} value={formData.symbol} />
            <InfoRow label={t('campaignReview.sector', 'Secteur')} value={formData.sector === 'Autre' ? formData.otherSector : formData.sector} />
            <InfoRow label={t('campaignReview.pricePerShare', 'Prix Part')} value={formData.sharePrice} type="eth" />
            <InfoRow label={t('campaignReview.numberOfShares', 'Nb. Parts')} value={formData.numberOfShares} />
            <InfoRow label={t('campaignReview.goal', 'Objectif')} value={(parseFloat(formData.sharePrice || 0) * parseFloat(formData.numberOfShares || 0)).toFixed(6)} type="eth" highlight />
            <InfoRow label={t('campaignReview.endDate', 'Fin le')} value={formData.endDate} type="date" />
            <InfoRow label={t('campaignReview.royalties', 'Royalties')} value={formData.royaltyFee} type="percentage" />
          </ReviewSection>

          {/* Estimation des coûts */}
          <EstimatedCosts
            sharePrice={formData.sharePrice}
            numberOfShares={formData.numberOfShares}
            royaltyFee={formData.royaltyFee}
          />
        </div>

        <div className="space-y-6">
          {/* Documents */}
          <ReviewSection
            icon={FileText}
            title={t('campaignReview.documents', 'Documents')}
            status={getDocumentCount() === 0 ? 'warning' : 'complete'}
          >
            <InfoRow label={t('campaignReview.whitepaper', 'Whitepaper')} value={formData.documents.whitepaper?.length || 0} />
            <InfoRow label={t('campaignReview.pitchDeck', 'Pitch Deck')} value={formData.documents.pitchDeck?.length || 0} />
            <InfoRow label={t('campaignReview.legalDocuments', 'Légal')} value={formData.documents.legalDocuments?.length || 0} />
            <InfoRow label={t('campaignReview.media', 'Média')} value={formData.documents.media?.length || 0} />

            <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground flex items-center justify-end">
              {t('campaignReview.totalDocuments', 'Total Fichiers')}: <span className="font-bold ml-1 text-foreground">{getDocumentCount()}</span>
            </div>
          </ReviewSection>

          {/* Équipe */}
          <ReviewSection
            icon={Users}
            title={t('campaignReview.team', 'Équipe')}
            status={formData.teamMembers.length === 0 ? 'warning' : 'complete'}
          >
            <div className="space-y-2">
              {formData.teamMembers.map((member, index) => (
                <div key={index} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                  <span className="text-sm font-medium text-foreground">
                    {member.name || t('campaignReview.member', 'Membre') + ` ${index + 1}`}
                  </span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {member.role || 'N/A'}
                  </span>
                </div>
              ))}
            </div>
            {formData.teamMembers.length === 0 && (
              <p className="text-sm text-orange-400">
                {t('campaignReview.noTeamMembers', 'Aucun membre ajouté')}
              </p>
            )}
          </ReviewSection>

          {/* Réseaux sociaux */}
          <ReviewSection
            icon={Globe}
            title={t('campaignReview.socialNetworks', 'Réseaux')}
            status={getSocialLinksCount() === 0 ? 'warning' : 'complete'}
          >
            <div className="flex flex-wrap gap-2">
              {Object.entries(formData.socials).map(([platform, link]) => (
                link && (
                  <a
                    key={platform}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs bg-muted/50 hover:bg-primary/20 hover:text-primary text-muted-foreground px-2 py-1 rounded-md transition-colors border border-border"
                  >
                    <span className="capitalize">{platform}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )
              ))}
            </div>
            {getSocialLinksCount() === 0 && (
              <p className="text-sm text-orange-400">
                {t('campaignReview.noSocialLinks', 'Aucun lien social')}
              </p>
            )}
          </ReviewSection>
        </div>
      </div>



      {/* Conditions d'utilisation */}
      <div className="glass-card p-6 rounded-xl border border-border bg-background/30">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="acceptTerms"
            checked={formData.acceptTerms}
            onCheckedChange={onAcceptTerms}
            className="mt-1 border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          />
          <div className="flex-1">
            <Label
              htmlFor="acceptTerms"
              className="text-sm text-muted-foreground cursor-pointer leading-relaxed"
            >
              {t('campaignReview.acceptTerms', 'Je confirme que toutes les informations fournies sont exactes et j\'accepte les')}{' '}
              <a href="#" className="text-primary hover:underline font-bold">
                {t('campaignReview.termsOfService', 'Conditions Générales d\'Utilisation')}
              </a>{' '}
              {t('campaignReview.termsText', 'de la plateforme Livar. Je comprends que le déploiement sur la blockchain est irréversible.')}
            </Label>
          </div>
        </div>
        {error?.terms && (
          <p className="text-red-400 text-xs mt-2 ml-7 flex items-center gap-1 animate-in slide-in-from-left-2">
            <AlertTriangle className="h-3 w-3" />
            {error.terms}
          </p>
        )}
      </div>

      {/* Message d'erreur général */}
      {error?.general && (
        <Alert className="border-red-500/20 bg-red-500/10">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-200 text-sm ml-2">
            <strong>{t('campaignReview.errorGeneral', 'Erreur')}:</strong> {error.general}
          </AlertDescription>
        </Alert>
      )}

      {/* Informations importantes */}
      <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
        <h3 className="text-sm font-bold text-blue-400 mb-2 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          {t('campaignReview.importantInfo', 'Derniers rappels')}
        </h3>
        <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside mb-0">
          <li>{t('campaignReview.info1', 'Votre campagne sera visible publiquement immédiatement après validation.')}</li>
          <li>{t('campaignReview.info2', 'Les modifications post-déploiement sont limitées (chaîne de blocs immuable).')}</li>
        </ul>
      </div>
    </div>
  );
}