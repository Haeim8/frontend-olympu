"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Sparkles
} from 'lucide-react';

const ReviewSection = ({ icon: Icon, title, children, status = 'complete' }) => {
  const statusColors = {
    complete: 'text-green-600 bg-green-50 dark:bg-green-900/20',
    warning: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
    error: 'text-red-600 bg-red-50 dark:bg-red-900/20'
  };

  const statusIcons = {
    complete: CheckCircle2,
    warning: AlertTriangle,
    error: AlertTriangle
  };

  const StatusIcon = statusIcons[status];

  return (
    <div className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl p-6">
      <div className="flex items-start space-x-4">
        <div className={`p-2 rounded-lg ${statusColors[status]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            <StatusIcon className={`h-5 w-5 ${statusColors[status].split(' ')[0]}`} />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value, type = 'text' }) => {
  const formatValue = () => {
    switch (type) {
      case 'eth':
        return `${value} ETH`;
      case 'date':
        return new Date(value).toLocaleString('fr-FR', {
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
        return value || 'Non renseigné';
    }
  };

  return (
    <div className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-neutral-800 last:border-b-0">
      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
        {label}
      </span>
      <span className="text-sm text-gray-900 dark:text-gray-100 text-right max-w-xs">
        {formatValue()}
      </span>
    </div>
  );
};

const EstimatedCosts = ({ sharePrice, numberOfShares, royaltyFee }) => {
  const targetAmount = parseFloat(sharePrice || 0) * parseFloat(numberOfShares || 0);
  const platformFee = 0.05; // 5% de frais de plateforme estimés
  const gasFees = 0.01; // Frais de gas estimés

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
        <DollarSign className="h-4 w-4" />
        Estimation des coûts
      </h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-blue-800 dark:text-blue-200">Objectif de financement:</span>
          <span className="font-semibold text-blue-900 dark:text-blue-100">{targetAmount.toFixed(6)} ETH</span>
        </div>
        <div className="flex justify-between">
          <span className="text-blue-800 dark:text-blue-200">Frais de création (estimation):</span>
          <span className="font-semibold text-blue-900 dark:text-blue-100">{platformFee.toFixed(3)} ETH</span>
        </div>
        <div className="flex justify-between">
          <span className="text-blue-800 dark:text-blue-200">Frais de gas (estimation):</span>
          <span className="font-semibold text-blue-900 dark:text-blue-100">{gasFees.toFixed(3)} ETH</span>
        </div>
        <div className="border-t border-blue-200 dark:border-blue-700 pt-2 mt-2">
          <div className="flex justify-between">
            <span className="text-blue-800 dark:text-blue-200 font-semibold">Total estimé:</span>
            <span className="font-bold text-blue-900 dark:text-blue-100">
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
      warnings.push("Aucun whitepaper téléchargé");
    }
    
    if (formData.teamMembers.length < 2) {
      warnings.push("Équipe réduite (moins de 2 membres)");
    }
    
    if (getSocialLinksCount() < 2) {
      warnings.push("Peu de liens sociaux (moins de 2)");
    }

    return warnings;
  };

  const warnings = validateForm();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Vérification Finale
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Vérifiez attentivement toutes les informations avant de créer votre campagne
        </p>
      </div>

      {/* Avertissements */}
      {warnings.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            <strong>Points d'attention:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {/* Informations de base */}
        <ReviewSection icon={Info} title="Informations de Base">
          <div className="space-y-1">
            <InfoRow label="Nom du projet" value={formData.name} />
            <InfoRow label="Symbole" value={formData.symbol} />
            <InfoRow label="Secteur" value={formData.sector === 'Autre' ? formData.otherSector : formData.sector} />
            <InfoRow label="Prix par part" value={formData.sharePrice} type="eth" />
            <InfoRow label="Nombre de parts" value={formData.numberOfShares} />
            <InfoRow label="Objectif" value={(parseFloat(formData.sharePrice || 0) * parseFloat(formData.numberOfShares || 0)).toFixed(6)} type="eth" />
            <InfoRow label="Date de fin" value={formData.endDate} type="date" />
            <InfoRow label="Royalties" value={formData.royaltyFee} type="percentage" />
          </div>
        </ReviewSection>

        {/* Documents */}
        <ReviewSection 
          icon={FileText} 
          title="Documents" 
          status={getDocumentCount() === 0 ? 'warning' : 'complete'}
        >
          <div className="space-y-1">
            <InfoRow label="Whitepaper" value={formData.documents.whitepaper?.length || 0} />
            <InfoRow label="Pitch Deck" value={formData.documents.pitchDeck?.length || 0} />
            <InfoRow label="Documents légaux" value={formData.documents.legalDocuments?.length || 0} />
            <InfoRow label="Médias" value={formData.documents.media?.length || 0} />
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Total: {getDocumentCount()} document{getDocumentCount() > 1 ? 's' : ''} téléchargé{getDocumentCount() > 1 ? 's' : ''}
          </div>
        </ReviewSection>

        {/* Équipe */}
        <ReviewSection 
          icon={Users} 
          title="Équipe" 
          status={formData.teamMembers.length === 0 ? 'warning' : 'complete'}
        >
          <div className="space-y-2">
            {formData.teamMembers.map((member, index) => (
              <div key={index} className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {member.name || `Membre ${index + 1}`}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {member.role}
                </span>
              </div>
            ))}
          </div>
          {formData.teamMembers.length === 0 && (
            <p className="text-sm text-orange-600 dark:text-orange-400">
              Aucun membre d'équipe ajouté
            </p>
          )}
        </ReviewSection>

        {/* Réseaux sociaux */}
        <ReviewSection 
          icon={Globe} 
          title="Réseaux Sociaux" 
          status={getSocialLinksCount() === 0 ? 'warning' : 'complete'}
        >
          <div className="space-y-1">
            {Object.entries(formData.socials).map(([platform, link]) => (
              link && (
                <div key={platform} className="flex items-center justify-between py-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {platform}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-900 dark:text-gray-100 truncate max-w-xs">
                      {link}
                    </span>
                    <ExternalLink className="h-3 w-3 text-gray-400" />
                  </div>
                </div>
              )
            ))}
          </div>
          {getSocialLinksCount() === 0 && (
            <p className="text-sm text-orange-600 dark:text-orange-400">
              Aucun lien social ajouté
            </p>
          )}
        </ReviewSection>
      </div>

      {/* Estimation des coûts */}
      <EstimatedCosts 
        sharePrice={formData.sharePrice}
        numberOfShares={formData.numberOfShares}
        royaltyFee={formData.royaltyFee}
      />

      {/* Conditions d'utilisation */}
      <div className="bg-gray-50 dark:bg-neutral-900 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="acceptTerms"
            checked={formData.acceptTerms}
            onCheckedChange={onAcceptTerms}
            className="mt-1"
          />
          <div className="flex-1">
            <Label 
              htmlFor="acceptTerms" 
              className="text-sm text-gray-900 dark:text-gray-100 cursor-pointer leading-relaxed"
            >
              J'accepte les{' '}
              <a href="#" className="text-lime-600 hover:text-lime-700 underline">
                conditions générales d'utilisation
              </a>{' '}
              et je confirme que toutes les informations fournies sont exactes et véridiques.
              Je comprends que la création de cette campagne engagera des frais sur la blockchain.
            </Label>
          </div>
        </div>
        {error?.terms && (
          <p className="text-red-500 text-sm mt-2 ml-6 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {error.terms}
          </p>
        )}
      </div>

      {/* Bouton de soumission */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={onSubmit}
          disabled={!formData.acceptTerms || isLoading}
          className="bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-white font-semibold px-8 py-3 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Création en cours...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5" />
              <span>Créer ma campagne</span>
            </div>
          )}
        </Button>
      </div>

      {/* Message d'erreur général */}
      {error?.general && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <strong>Erreur:</strong> {error.general}
          </AlertDescription>
        </Alert>
      )}

      {/* Informations importantes */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Informations importantes
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Une fois créée, la campagne ne pourra plus être modifiée</li>
          <li>• Les fonds collectés seront bloqués jusqu'à la fin de la campagne</li>
          <li>• Vous recevrez un email de confirmation après la création</li>
          <li>• La campagne sera visible publiquement sur la plateforme</li>
        </ul>
      </div>
    </div>
  );
}