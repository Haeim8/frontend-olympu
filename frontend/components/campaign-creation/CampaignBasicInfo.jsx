"use client";

import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, DollarSign, Hash, Calendar, Target, Wallet } from 'lucide-react';
import { useTranslation } from '@/hooks/useLanguage';

const getSectors = (t) => [
  { value: "Tech", label: t('filters.sectors.tech', 'Technologie') },
  { value: "Finance", label: t('filters.sectors.finance', 'Finance') },
  { value: "DeFi", label: t('filters.sectors.defi', 'DeFi') },
  { value: "Gaming", label: t('filters.sectors.gaming', 'Gaming') },
  { value: "NFT", label: t('filters.sectors.nft', 'NFT') },
  { value: "Blockchain", label: t('filters.sectors.blockchain', 'Blockchain') },
  { value: "Infrastructure", label: t('filters.sectors.infrastructure', 'Infrastructure') },
  { value: "Industry", label: t('filters.sectors.industry', 'Industrie') },
  { value: "Other", label: t('sectors.other', 'Autre') }
];

const InfoTooltip = ({ content }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="cursor-help p-1 rounded-full hover:bg-muted/50 transition-colors">
          <Info className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
        </div>
      </TooltipTrigger>
      <TooltipContent className="glass-card border-border text-foreground max-w-xs p-3">
        <p className="text-xs leading-relaxed">{content}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default function CampaignBasicInfo({
  formData,
  error,
  onInputChange,
  onSelectChange
}) {
  const { t } = useTranslation();
  const sectors = getSectors(t);
  const targetAmount = (parseFloat(formData.sharePrice || 0) * parseFloat(formData.numberOfShares || 0));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 border border-primary/20 shadow-[0_0_30px_rgba(var(--primary-rgb),0.2)]">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            {t('campaignBasic.title', 'Informations du Projet')}
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mt-1">
            {t('campaignBasic.subtitle', 'Commencez par définir les bases de votre campagne de financement.')}
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Adresse créateur */}
        <div className="group space-y-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="creatorAddress" className="text-sm font-medium text-foreground">
              {t('campaignBasic.creatorAddress', 'Adresse Createur')}
            </Label>
            <InfoTooltip content={t('campaignBasic.creatorTooltip', 'L\'adresse du portefeuille qui crée cette campagne.')} />
          </div>
          <div className="relative">
            <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="creatorAddress"
              name="creatorAddress"
              value={formData.creatorAddress || t('campaignBasic.connectWallet', 'Connectez votre wallet')}
              readOnly
              className="pl-10 bg-muted/30 border-input/50 text-muted-foreground cursor-not-allowed font-mono text-xs"
            />
          </div>
          {!formData.creatorAddress && (
            <p className="text-red-400 text-xs flex items-center gap-1.5 mt-1.5 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
              <Info className="h-3 w-3" />
              {t('campaignBasic.connectWalletWarning', 'Veuillez connecter votre portefeuille')}
            </p>
          )}
        </div>

        {/* Nom et symbole */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-foreground">
              {t('campaignBasic.campaignName', 'Nom de la Campagne')} <span className="text-primary">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={onInputChange}
              placeholder={t('campaignBasic.campaignNamePlaceholder', 'Ex: Nouveau Projet DeFi')}
              required
              className="bg-background/50 border-input/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground/50 transition-all font-medium"
            />
            {error?.name && (
              <p className="text-red-400 text-xs flex items-center gap-1 mt-1">
                <Info className="h-3 w-3" /> {error.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="symbol" className="text-sm font-medium text-foreground">
              {t('campaignBasic.symbol', 'Symbole (Token)')} <span className="text-primary">*</span>
            </Label>
            <Input
              id="symbol"
              name="symbol"
              value={formData.symbol}
              onChange={onInputChange}
              placeholder="TKN"
              maxLength={4}
              required
              className="bg-background/50 border-input/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground/50 transition-all font-mono uppercase tracking-wider"
              style={{ textTransform: 'uppercase' }}
            />
            {error?.symbol && (
              <p className="text-red-400 text-xs flex items-center gap-1 mt-1">
                <Info className="h-3 w-3" /> {error.symbol}
              </p>
            )}
          </div>
        </div>

        {/* Secteur */}
        <div className="space-y-2">
          <Label htmlFor="sector" className="text-sm font-medium text-foreground">
            {t('campaignBasic.sector', 'Secteur d\'Activité')} <span className="text-primary">*</span>
          </Label>
          <Select
            value={formData.sector}
            onValueChange={(value) => onSelectChange(value, 'sector')}
          >
            <SelectTrigger className="bg-background/50 border-input/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-foreground">
              <SelectValue placeholder={t('campaignBasic.sectorPlaceholder', 'Sélectionner un secteur')} />
            </SelectTrigger>
            <SelectContent className="glass-card border-border text-foreground">
              {sectors.map((sector) => (
                <SelectItem key={sector.value} value={sector.value} className="focus:bg-primary/10 focus:text-primary cursor-pointer">
                  {sector.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error?.sector && (
            <p className="text-red-400 text-xs flex items-center gap-1 mt-1">
              <Info className="h-3 w-3" /> {error.sector}
            </p>
          )}
        </div>

        {/* Secteur personnalisé */}
        {formData.sector === 'Autre' && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            <Label htmlFor="otherSector" className="text-sm font-medium text-foreground">
              {t('campaignBasic.otherSector', 'Précisez le secteur')} <span className="text-primary">*</span>
            </Label>
            <Input
              id="otherSector"
              name="otherSector"
              value={formData.otherSector}
              onChange={onInputChange}
              placeholder={t('campaignBasic.otherSectorPlaceholder', 'Ex: Biotech')}
              required
              className="bg-background/50 border-input/50 focus:border-primary/50 text-foreground"
            />
            {error?.otherSector && (
              <p className="text-red-400 text-xs flex items-center gap-1 mt-1">
                <Info className="h-3 w-3" /> {error.otherSector}
              </p>
            )}
          </div>
        )}

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium text-foreground">
            {t('campaignBasic.projectDescription', 'Description du Projet')} <span className="text-primary">*</span>
          </Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={onInputChange}
            placeholder={t('campaignBasic.descriptionPlaceholder', 'Décrivez votre projet, ses objectifs et pourquoi les investisseurs devraient s\'y intéresser...')}
            rows={5}
            required
            className="bg-background/50 border-input/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-foreground resize-none leading-relaxed"
          />
          <div className="flex justify-between items-center text-xs">
            {error?.description ? (
              <p className="text-red-400 flex items-center gap-1">
                <Info className="h-3 w-3" /> {error.description}
              </p>
            ) : <span />}
            <span className={formData.description.length > 900 ? "text-orange-400" : "text-muted-foreground"}>
              {formData.description.length}/1000
            </span>
          </div>
        </div>

        {/* Prix et nombre de parts Card */}
        <div className="glass-card p-6 rounded-xl border border-primary/10 relative overflow-hidden group hover:border-primary/20 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            {t('campaignBasic.financialConfig', 'Configuration Financière')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Label htmlFor="sharePrice" className="text-sm font-medium text-foreground">
                  {t('campaignBasic.sharePrice', 'Prix par Part (ETH)')} <span className="text-primary">*</span>
                </Label>
                <InfoTooltip content={t('campaignBasic.sharePriceTooltip', 'Le prix initial d\'une part en ETH.')} />
              </div>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="sharePrice"
                  name="sharePrice"
                  type="number"
                  step="0.000000000000000001"
                  value={formData.sharePrice}
                  onChange={onInputChange}
                  placeholder="0.001"
                  required
                  className="pl-9 bg-background/40 border-input/50 focus:border-primary/50 text-foreground font-mono"
                />
              </div>
              {error?.sharePrice && (
                <p className="text-red-400 text-xs flex items-center gap-1 mt-1">
                  <Info className="h-3 w-3" /> {error.sharePrice}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Label htmlFor="numberOfShares" className="text-sm font-medium text-foreground">
                  {t('campaignBasic.numberOfShares', 'Nombre de Parts')} <span className="text-primary">*</span>
                </Label>
                <InfoTooltip content={t('campaignBasic.numberOfSharesTooltip', 'Le nombre total de parts émises pour cette campagne.')} />
              </div>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="numberOfShares"
                  name="numberOfShares"
                  type="number"
                  value={formData.numberOfShares}
                  onChange={onInputChange}
                  placeholder="1000"
                  required
                  className="pl-9 bg-background/40 border-input/50 focus:border-primary/50 text-foreground font-mono"
                />
              </div>
              {error?.numberOfShares && (
                <p className="text-red-400 text-xs flex items-center gap-1 mt-1">
                  <Info className="h-3 w-3" /> {error.numberOfShares}
                </p>
              )}
            </div>
          </div>

          {/* Objectif calculé */}
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/10">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
              {t('campaignBasic.fundingGoal', 'Objectif de Financement')}
            </Label>
            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-mono flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {targetAmount.toFixed(6)} ETH
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {t('campaignBasic.calculatedAs', 'Calculé comme Prix x Nombre de Parts')}
            </p>
          </div>
        </div>

        {/* Date de fin et royalties */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Label htmlFor="endDate" className="text-sm font-medium text-foreground">
                {t('campaignBasic.endDate', 'Date de Fin')} <span className="text-primary">*</span>
              </Label>
              <InfoTooltip content={t('campaignBasic.endDateTooltip', 'La date de clôture de la campagne.')} />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="endDate"
                name="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={onInputChange}
                required
                className="pl-9 bg-background/50 border-input/50 focus:border-primary/50 text-foreground calendar-input"
              />
            </div>
            {error?.endDate && (
              <p className="text-red-400 text-xs flex items-center gap-1 mt-1">
                <Info className="h-3 w-3" /> {error.endDate}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Label htmlFor="royaltyFee" className="text-sm font-medium text-foreground">
                {t('campaignBasic.royaltyFee', 'Royalties (BPS)')}
              </Label>
              <InfoTooltip content={t('campaignBasic.royaltyTooltip', 'Frais de royalties en points de base (ex: 250 = 2.5%). Max 1000.')} />
            </div>
            <Input
              id="royaltyFee"
              name="royaltyFee"
              type="number"
              min="0"
              max="10000"
              value={formData.royaltyFee}
              onChange={onInputChange}
              placeholder="0"
              required
              className="bg-background/50 border-input/50 focus:border-primary/50 text-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              = {(formData.royaltyFee / 100).toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Adresse de réception des royalties */}
        <div className="group space-y-2">
          <Label htmlFor="royaltyReceiver" className="text-sm font-medium text-foreground">
            {t('campaignBasic.royaltyReceiver', 'Adresse Réception Royalties')} <span className="text-primary">*</span>
          </Label>
          <div className="relative">
            <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="royaltyReceiver"
              name="royaltyReceiver"
              value={formData.royaltyReceiver}
              onChange={onInputChange}
              placeholder="0x..."
              required
              className="pl-9 bg-background/50 border-input/50 focus:border-primary/50 text-foreground font-mono text-sm"
            />
          </div>
          {error?.royaltyReceiver && (
            <p className="text-red-400 text-xs flex items-center gap-1 mt-1">
              <Info className="h-3 w-3" /> {error.royaltyReceiver}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}