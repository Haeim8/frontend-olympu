"use client";

import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Info, DollarSign, Hash, Calendar, Target } from 'lucide-react';

const SECTORS = [
  "Blockchain", "Finance", "Industrie", "Tech", "Influence", "Gaming",
  "NFT", "DeFi", "DAO", "Infrastructure", "Autre"
];

const InfoTooltip = ({ content }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" className="p-0 h-4 w-4 rounded-full">
          <Info className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </Button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="text-sm">{content}</p>
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
  const targetAmount = (parseFloat(formData.sharePrice || 0) * parseFloat(formData.numberOfShares || 0));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-lime-100 to-blue-100 dark:from-lime-900/20 dark:to-blue-900/20 rounded-2xl mb-4">
          <Target className="w-8 h-8 text-lime-600 dark:text-lime-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Informations de Base
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Définissez les éléments fondamentaux de votre campagne de financement
        </p>
      </div>

      <div className="grid gap-6">
        {/* Adresse créateur */}
        <div className="group">
          <div className="flex items-center space-x-2 mb-2">
            <Label htmlFor="creatorAddress" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Adresse du créateur
            </Label>
            <InfoTooltip content="L'adresse Ethereum du créateur de la campagne (connectée automatiquement)" />
          </div>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="creatorAddress"
              name="creatorAddress"
              value={formData.creatorAddress || 'Connectez votre wallet...'}
              readOnly
              className="pl-10 bg-gray-50 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 cursor-not-allowed border-gray-200 dark:border-neutral-700 font-mono text-sm"
              placeholder="Adresse du wallet connecté"
            />
          </div>
          {!formData.creatorAddress && (
            <p className="text-amber-600 dark:text-amber-400 text-sm mt-1 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Veuillez connecter votre wallet pour continuer
            </p>
          )}
        </div>

        {/* Nom et symbole */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="group">
            <Label htmlFor="name" className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 block">
              Nom de la campagne *
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={onInputChange}
              placeholder="Nom de votre projet"
              required
              className="transition-all duration-200 focus:ring-2 focus:ring-lime-500 focus:border-transparent"
            />
            {error?.name && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1 flex items-center gap-1 animate-in slide-in-from-left-2 duration-200">
                <Info className="h-3 w-3" />
                {error.name}
              </p>
            )}
          </div>

          <div className="group">
            <Label htmlFor="symbol" className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 block">
              Symbole *
            </Label>
            <Input
              id="symbol"
              name="symbol"
              value={formData.symbol}
              onChange={onInputChange}
              placeholder="3-4 caractères (ex: BTC)"
              maxLength={4}
              required
              className="transition-all duration-200 focus:ring-2 focus:ring-lime-500 focus:border-transparent uppercase"
              style={{ textTransform: 'uppercase' }}
            />
            {error?.symbol && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1 flex items-center gap-1 animate-in slide-in-from-left-2 duration-200">
                <Info className="h-3 w-3" />
                {error.symbol}
              </p>
            )}
          </div>
        </div>

        {/* Secteur */}
        <div className="group">
          <Label htmlFor="sector" className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 block">
            Secteur d'activité *
          </Label>
          <Select 
            value={formData.sector}
            onValueChange={(value) => onSelectChange(value, 'sector')}
          >
            <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-lime-500 focus:border-transparent">
              <SelectValue placeholder="Choisir un secteur" />
            </SelectTrigger>
            <SelectContent>
              {SECTORS.map((sector) => (
                <SelectItem key={sector} value={sector}>
                  {sector}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error?.sector && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1 flex items-center gap-1 animate-in slide-in-from-left-2 duration-200">
              <Info className="h-3 w-3" />
              {error.sector}
            </p>
          )}
        </div>

        {/* Secteur personnalisé */}
        {formData.sector === 'Autre' && (
          <div className="group animate-in slide-in-from-top-4 duration-300">
            <Label htmlFor="otherSector" className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 block">
              Précisez le secteur *
            </Label>
            <Input
              id="otherSector"
              name="otherSector"
              value={formData.otherSector}
              onChange={onInputChange}
              placeholder="Précisez le secteur d'activité"
              required
              className="transition-all duration-200 focus:ring-2 focus:ring-lime-500 focus:border-transparent"
            />
            {error?.otherSector && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1 flex items-center gap-1 animate-in slide-in-from-left-2 duration-200">
                <Info className="h-3 w-3" />
                {error.otherSector}
              </p>
            )}
          </div>
        )}

        {/* Description */}
        <div className="group">
          <Label htmlFor="description" className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 block">
            Description du projet *
          </Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={onInputChange}
            placeholder="Description détaillée de votre projet, ses objectifs, et sa valeur unique..."
            rows={5}
            required
            className="transition-all duration-200 focus:ring-2 focus:ring-lime-500 focus:border-transparent resize-none"
          />
          <div className="flex justify-between items-center mt-1">
            {error?.description ? (
              <p className="text-red-500 dark:text-red-400 text-sm flex items-center gap-1 animate-in slide-in-from-left-2 duration-200">
                <Info className="h-3 w-3" />
                {error.description}
              </p>
            ) : (
              <div />
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formData.description.length}/1000
            </span>
          </div>
        </div>

        {/* Prix et nombre de parts */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-neutral-900 dark:to-neutral-800 rounded-xl p-6 space-y-4 border border-gray-200 dark:border-neutral-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-lime-600 dark:text-lime-400" />
            Configuration financière
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="group">
              <div className="flex items-center space-x-2 mb-2">
                <Label htmlFor="sharePrice" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Prix par part (ETH) *
                </Label>
                <InfoTooltip content="Prix unitaire d'une part en ETH" />
              </div>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="sharePrice"
                  name="sharePrice"
                  type="number"
                  step="0.000000000000000001"
                  value={formData.sharePrice}
                  onChange={onInputChange}
                  placeholder="0.001"
                  required
                  className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                />
              </div>
              {error?.sharePrice && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1 flex items-center gap-1 animate-in slide-in-from-left-2 duration-200">
                  <Info className="h-3 w-3" />
                  {error.sharePrice}
                </p>
              )}
            </div>

            <div className="group">
              <div className="flex items-center space-x-2 mb-2">
                <Label htmlFor="numberOfShares" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Nombre de parts *
                </Label>
                <InfoTooltip content="Nombre total de parts à émettre" />
              </div>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="numberOfShares"
                  name="numberOfShares"
                  type="number"
                  value={formData.numberOfShares}
                  onChange={onInputChange}
                  placeholder="1000"
                  required
                  className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                />
              </div>
              {error?.numberOfShares && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1 flex items-center gap-1 animate-in slide-in-from-left-2 duration-200">
                  <Info className="h-3 w-3" />
                  {error.numberOfShares}
                </p>
              )}
            </div>
          </div>

          {/* Objectif calculé */}
          <div className="bg-gradient-to-r from-lime-50 to-green-50 dark:from-lime-900/20 dark:to-green-900/20 rounded-lg p-4 border border-lime-200 dark:border-lime-800 shadow-sm">
            <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 block flex items-center gap-2">
              <Target className="h-4 w-4 text-lime-600 dark:text-lime-400" />
              Objectif de financement
            </Label>
            <div className="text-2xl font-bold text-lime-700 dark:text-lime-300">
              {targetAmount.toFixed(6)} ETH
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Calculé automatiquement : {formData.sharePrice || 0} × {formData.numberOfShares || 0}
            </p>
          </div>
        </div>

        {/* Date de fin et royalties */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="group">
            <div className="flex items-center space-x-2 mb-2">
              <Label htmlFor="endDate" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Date de fin de campagne *
              </Label>
              <InfoTooltip content="Date et heure de fin de la campagne" />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="endDate"
                name="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={onInputChange}
                required
                className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-lime-500 focus:border-transparent"
              />
            </div>
            {error?.endDate && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1 flex items-center gap-1 animate-in slide-in-from-left-2 duration-200">
                <Info className="h-3 w-3" />
                {error.endDate}
              </p>
            )}
          </div>

          <div className="group">
            <div className="flex items-center space-x-2 mb-2">
              <Label htmlFor="royaltyFee" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Frais de royalties (basis points)
              </Label>
              <InfoTooltip content="100 basis points = 1%. Frais sur les transactions secondaires." />
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
              className="transition-all duration-200 focus:ring-2 focus:ring-lime-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {(formData.royaltyFee / 100).toFixed(2)}% de royalties
            </p>
          </div>
        </div>

        {/* Adresse de réception des royalties */}
        <div className="group">
          <Label htmlFor="royaltyReceiver" className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 block">
            Adresse de réception des royalties *
          </Label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="royaltyReceiver"
              name="royaltyReceiver"
              value={formData.royaltyReceiver}
              onChange={onInputChange}
              placeholder="0x..."
              required
              className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-lime-500 focus:border-transparent font-mono text-sm"
            />
          </div>
          {error?.royaltyReceiver && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1 flex items-center gap-1 animate-in slide-in-from-left-2 duration-200">
              <Info className="h-3 w-3" />
              {error.royaltyReceiver}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}