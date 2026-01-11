"use client";

import React, { forwardRef } from 'react';
import Image from 'next/image';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslation } from '@/hooks/useLanguage';
import {
  Palette,
  Upload,
  RotateCcw,
  Eye,
  Sparkles,
  Camera,
  Layers
} from 'lucide-react';
import CompanySharesNFTCard from '@/components/nft/CompanySharesNFTCard';

const ColorPicker = ({ label, value, onChange, description }) => {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <div className="flex items-center space-x-3 bg-muted/20 p-2 rounded-lg border border-border">
        <div className="relative group cursor-pointer">
          <Input
            type="color"
            value={value}
            onChange={onChange}
            className="w-10 h-10 p-0 border-0 rounded-md cursor-pointer absolute opacity-0 inset-0 z-10"
          />
          <div
            className="w-10 h-10 rounded-md border border-border shadow-sm group-hover:scale-105 transition-transform"
            style={{ backgroundColor: value }}
          />
        </div>
        <div className="flex-1">
          <div className="text-sm font-mono text-foreground font-bold">
            {value.toUpperCase()}
          </div>
          {description && (
            <div className="text-[10px] text-muted-foreground">
              {description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CampaignNFTPreview = forwardRef(({
  formData,
  contractAddress,
  onCustomizationChange
}, ref) => {
  const { t } = useTranslation();

  const handleColorChange = (field, value) => {
    onCustomizationChange({
      ...formData.nftCustomization,
      [field]: value
    });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onCustomizationChange({
        ...formData.nftCustomization,
        logo: file
      });
    }
  };

  const resetToDefaults = () => {
    onCustomizationChange({
      backgroundColor: '#000000',
      textColor: '#FFFFFF',
      logo: null,
      texture: 'default'
    });
  };

  const presets = [
    { name: 'Classic Dark', bg: '#000000', text: '#FFFFFF' },
    { name: 'Clean White', bg: '#FFFFFF', text: '#000000' },
    { name: 'Deep Space', bg: '#0f172a', text: '#38bdf8' },
    { name: 'Livar Green', bg: '#064e3b', text: '#ecfdf5' },
    { name: 'Luxury Gold', bg: '#292524', text: '#fbbf24' },
    { name: 'Royal Purple', bg: '#2e1065', text: '#e9d5ff' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-pink-500/10 border border-pink-500/20 shadow-[0_0_30px_rgba(236,72,153,0.2)]">
          <Palette className="w-8 h-8 text-pink-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            {t('campaignNFT.title', 'Design de votre NFT')}
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mt-1">
            {t('campaignNFT.subtitle', 'Personnalisez l\'apparence des parts numériques que vos investisseurs recevront.')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Prévisualisation */}
        <div className="space-y-6 lg:sticky lg:top-24">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-primary/20">
              <Eye className="h-3.5 w-3.5" />
              {t('campaignNFT.preview', 'Aperçu en temps réel')}
            </div>
          </div>

          <div className="flex justify-center perspective-1000">
            <div
              ref={ref}
              className="transform hover:scale-105 hover:-rotate-1 transition-all duration-500 drop-shadow-2xl"
            >
              <CompanySharesNFTCard
                name={formData.name || "Nom du Projet"}
                creatorAddress={formData.creatorAddress}
                tokenId="PREVIEW"
                sector={formData.sector === 'Autre' ? formData.otherSector : formData.sector || "SECTEUR"}
                issueDate={new Date().toLocaleDateString()}
                smartContract={contractAddress || "0x0000...0000"}
                backgroundColor={formData.nftCustomization.backgroundColor}
                textColor={formData.nftCustomization.textColor}
                logoUrl={formData.nftCustomization.logo}
                isPreview={true}
              />
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground italic">
              {t('campaignNFT.previewNote', '*Ceci est une représentation approximative du rendu final sur la blockchain.')}
            </p>
          </div>
        </div>

        {/* Contrôles de personnalisation */}
        <div className="space-y-6">
          <div className="glass-card border border-border rounded-xl p-6 space-y-8">
            <div className="pb-4 border-b border-border/50">
              <h3 className="font-bold text-foreground flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                {t('campaignNFT.customization', 'Personnalisation')}
              </h3>
            </div>

            {/* Logo */}
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('campaignNFT.logo', 'Logo du projet')}
              </Label>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 bg-muted/30 border border-dashed border-border rounded-lg flex items-center justify-center overflow-hidden hover:border-primary/50 transition-colors">
                  {formData.nftCustomization.logo ? (
                    <div className="w-full h-full relative group">
                      <Image src={URL.createObjectURL(formData.nftCustomization.logo)} alt="Logo Preview" fill className="object-cover" unoptimized />
                      <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center">
                        <label className="cursor-pointer text-white text-xs text-center p-1">
                          Change
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-muted-foreground hover:text-primary">
                      <Upload className="h-6 w-6 mb-1" />
                      <span className="text-[10px]">Upload</span>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                  )}
                </div>
                <div className="flex-1 text-sm text-muted-foreground">
                  <p>{t('campaignNFT.logoDesc', 'Formats: PNG, JPG (Max 2MB)')}</p>
                  <p className="text-xs opacity-70 mt-1">{t('campaignNFT.logoHint', 'Un logo avec fond transparent rend mieux.')}</p>
                </div>
              </div>
            </div>

            {/* Couleurs */}
            <div className="grid grid-cols-2 gap-4">
              <ColorPicker
                label={t('campaignNFT.backgroundColor', 'Fond')}
                value={formData.nftCustomization.backgroundColor}
                onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
              />

              <ColorPicker
                label={t('campaignNFT.textColor', 'Texte')}
                value={formData.nftCustomization.textColor}
                onChange={(e) => handleColorChange('textColor', e.target.value)}
              />
            </div>

            {/* Presets */}
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Layers className="h-3 w-3" />
                {t('campaignNFT.presets', 'Thèmes Prédéfinis')}
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {presets.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      handleColorChange('backgroundColor', preset.bg);
                      handleColorChange('textColor', preset.text);
                    }}
                    className="relative group p-3 rounded-lg border border-border hover:border-primary/50 transition-all text-left bg-muted/10 hover:bg-muted/20"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: preset.bg }} />
                      <div className="w-4 h-4 rounded-full border border-white/20 shadow-sm -ml-3" style={{ backgroundColor: preset.text }} />
                    </div>
                    <div className="text-xs font-medium text-foreground truncate">
                      {preset.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Reset */}
            <div className="pt-4 border-t border-border/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetToDefaults}
                className="w-full text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {t('campaignNFT.resetDefaults', 'Réinitialiser le design')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

CampaignNFTPreview.displayName = 'CampaignNFTPreview';

export default CampaignNFTPreview;