"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

export default function NFTPreviewCard({ projectData, project }) {
  const ipfs = projectData?.ipfs;
  const nftCustomization = ipfs?.nftCustomization || {};

  const name = project?.name || 'Campaign NFT';
  const symbol = project?.symbol || ipfs?.symbol || '';

  // Gérer les différents formats d'image (string ou objet)
  let imageUrl = '';
  if (nftCustomization.logo) {
    imageUrl = typeof nftCustomization.logo === 'string' ? nftCustomization.logo : nftCustomization.logo?.url || '';
  } else if (ipfs?.documents?.media?.[0]) {
    const media = ipfs.documents.media[0];
    imageUrl = typeof media === 'string' ? media : media?.url || '';
  }

  const backgroundColor = nftCustomization.backgroundColor || '#0f172a';
  const textColor = nftCustomization.textColor || '#84cc16';

  // Convertir hex en style
  const bgStyle = backgroundColor?.startsWith?.('#') ? backgroundColor : `#${backgroundColor}`;
  const textStyle = textColor?.startsWith?.('#') ? textColor : `#${textColor}`;

  return (
    <div className="space-y-4">
      {/* Carte NFT */}
      <Card
        className="overflow-hidden border-2 border-gray-200 dark:border-neutral-700 shadow-lg hover:shadow-xl transition-shadow"
        style={{
          background: `linear-gradient(135deg, ${bgStyle} 0%, ${bgStyle}dd 100%)`
        }}
      >
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Image du NFT */}
            <div className="relative w-full aspect-square max-w-xs rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm">
              {imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http') ? (
                <img
                  src={imageUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Sparkles className="w-24 h-24" style={{ color: textStyle }} />
                </div>
              )}
            </div>

            {/* Nom du NFT */}
            <div>
              <h3
                className="text-2xl font-bold mb-2"
                style={{ color: textStyle }}
              >
                {name}
              </h3>
              {symbol && (
                <p
                  className="text-sm opacity-90"
                  style={{ color: textStyle }}
                >
                  {symbol}
                </p>
              )}
            </div>

            {/* Badge "NFT Share" */}
            <Badge
              className="text-xs font-semibold px-3 py-1"
              style={{
                backgroundColor: textStyle,
                color: bgStyle
              }}
            >
              Certificat NFT d&apos;investissement
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Infos NFT */}
      <div className="bg-gradient-to-br from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-800 p-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-lime-600" />
          Informations NFT
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-3 border border-lime-200 dark:border-lime-800">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Prix unitaire</div>
            <div className="text-sm font-bold text-lime-700 dark:text-lime-300">
              {project?.sharePrice} ETH
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-3 border border-gray-200 dark:border-neutral-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Parts</div>
            <div className="text-sm font-bold text-gray-700 dark:text-gray-300">
              {project?.goal && project?.sharePrice ? Math.floor(parseFloat(project.goal) / parseFloat(project.sharePrice)) : 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
