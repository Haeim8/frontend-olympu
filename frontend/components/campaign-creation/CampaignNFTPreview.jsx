"use client";

import React, { forwardRef } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Palette, 
  Upload, 
  RotateCcw,
  Eye,
  Sparkles,
  Camera
} from 'lucide-react';
import CompanySharesNFTCard from '@/components/nft/CompanySharesNFTCard';

const ColorPicker = ({ label, value, onChange, description }) => {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {label}
      </Label>
      <div className="flex items-center space-x-3">
        <div className="relative">
          <Input
            type="color"
            value={value}
            onChange={onChange}
            className="w-14 h-10 p-1 border-2 border-gray-200 dark:border-neutral-700 rounded-lg cursor-pointer hover:border-lime-400 transition-colors"
          />
          <div 
            className="absolute inset-1 rounded-md pointer-events-none border border-white/20"
            style={{ backgroundColor: value }}
          />
        </div>
        <div className="flex-1">
          <div className="text-sm font-mono text-gray-600 dark:text-gray-400">
            {value.toUpperCase()}
          </div>
          {description && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
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
      backgroundColor: '#ffffff',
      textColor: '#000000',
      logo: null,
      texture: 'default'
    });
  };

  const presets = [
    { name: 'Classique', bg: '#ffffff', text: '#000000' },
    { name: 'Sombre', bg: '#1f2937', text: '#ffffff' },
    { name: 'Lime', bg: '#ecfdf5', text: '#064e3b' },
    { name: 'Bleu', bg: '#eff6ff', text: '#1e3a8a' },
    { name: 'Violet', bg: '#f3e8ff', text: '#581c87' },
    { name: 'Orange', bg: '#fff7ed', text: '#9a3412' }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl mb-4">
          <Palette className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Prévisualisation NFT
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Personnalisez l'apparence de vos NFT de parts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Prévisualisation */}
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium mb-4">
              <Eye className="h-4 w-4" />
              Aperçu en temps réel
            </div>
          </div>

          <div className="flex justify-center">
            <div 
              ref={ref}
              className="transform hover:scale-105 transition-transform duration-300"
            >
              <CompanySharesNFTCard
                name={formData.name || "Nom du Projet"}
                creatorAddress={formData.creatorAddress}
                tokenId="Preview"
                sector={formData.sector === 'Autre' ? formData.otherSector : formData.sector || "Secteur"}
                issueDate={new Date().toLocaleDateString()}
                smartContract={contractAddress}
                backgroundColor={formData.nftCustomization.backgroundColor}
                textColor={formData.nftCustomization.textColor}
                logoUrl={formData.nftCustomization.logo}
                niveauLivar="orange"
                investmentReturns={formData.investmentReturns}
                isPreview={true}
              />
            </div>
          </div>

          <div className="text-center">
            <Button
              variant="outline"
              size="sm"
              className="bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300"
            >
              <Camera className="h-4 w-4 mr-2" />
              Capturer l'aperçu
            </Button>
          </div>
        </div>

        {/* Contrôles de personnalisation */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-lime-600" />
              Personnalisation
            </h3>

            <div className="space-y-6">
              {/* Logo */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Logo du projet
                </Label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="relative overflow-hidden"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Télécharger
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </Button>
                  {formData.nftCustomization.logo && (
                    <span className="text-sm text-green-600 dark:text-green-400">
                      Logo ajouté ✓
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Format recommandé: PNG/SVG, 200x200px maximum
                </p>
              </div>

              {/* Couleurs */}
              <div className="grid grid-cols-1 gap-4">
                <ColorPicker
                  label="Couleur de fond"
                  value={formData.nftCustomization.backgroundColor}
                  onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                  description="Arrière-plan principal du NFT"
                />
                
                <ColorPicker
                  label="Couleur du texte"
                  value={formData.nftCustomization.textColor}
                  onChange={(e) => handleColorChange('textColor', e.target.value)}
                  description="Couleur des textes et icônes"
                />
              </div>

              {/* Presets de couleurs */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Thèmes prédéfinis
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {presets.map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        handleColorChange('backgroundColor', preset.bg);
                        handleColorChange('textColor', preset.text);
                      }}
                      className="group relative p-3 border-2 border-gray-200 dark:border-neutral-700 rounded-lg hover:border-lime-400 transition-all duration-200"
                      style={{ 
                        backgroundColor: preset.bg,
                        color: preset.text
                      }}
                    >
                      <div className="text-xs font-medium truncate">
                        {preset.name}
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-lg transition-colors" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset */}
              <div className="pt-4 border-t border-gray-200 dark:border-neutral-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetToDefaults}
                  className="w-full text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
              </div>
            </div>
          </div>

          {/* Info sur les NFT */}
          <div className="bg-gradient-to-br from-green-50 to-lime-50 dark:from-green-900/10 dark:to-lime-900/10 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
              📝 À propos des NFT de parts
            </h3>
            <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
              <li>• Chaque investisseur recevra un NFT unique représentant ses parts</li>
              <li>• Le design sera identique pour tous mais avec des données personnalisées</li>
              <li>• Les NFT peuvent être échangés sur les marketplaces compatibles</li>
              <li>• Ils donnent accès aux dividendes et aux droits de vote</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
});

CampaignNFTPreview.displayName = 'CampaignNFTPreview';

export default CampaignNFTPreview;