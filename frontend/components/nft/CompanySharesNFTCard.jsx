"use client";

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { BarChart2, Wallet, Hash, Calendar, Target } from 'lucide-react';

const CompanySharesNFTCard = ({
  name,
  creatorAddress,
  tokenId,
  issueDate,
  fundingRound,
  smartContract,
  totalShares,
  backgroundColor,
  textColor,
  logoUrl,
  sector, // Secteur pour correspondre au NFT on-chain
  isPreview = false
}) => {
  const [previewUrl, setPreviewUrl] = React.useState(null);

  React.useEffect(() => {
    if (logoUrl instanceof File) {
      const url = URL.createObjectURL(logoUrl);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(logoUrl);
    }
  }, [logoUrl]);

  // Styles conditionnels basés sur isPreview
  const containerStyles = isPreview ? {
    width: '100%',
    maxWidth: '500px',
    height: 'auto',
    margin: '0 auto'
  } : {
    width: '500px',
    height: '700px',
    margin: 0,
    padding: 0
  };

  return (
    <div className="inline-block" style={containerStyles}>
      <Card
        style={{
          backgroundColor,
          color: textColor,
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <CardHeader className={`${isPreview ? 'p-4' : 'p-6'} flex flex-col items-center justify-center`}>
          <h2 className={`${isPreview ? 'text-xl' : 'text-2xl'} font-bold mb-2`} style={{ color: textColor }}>{name}</h2>
          <p className={`${isPreview ? 'text-base' : 'text-lg'}`} style={{ color: textColor }}>Tokenized Equity</p>
        </CardHeader>

        <CardContent className="flex-grow p-4 flex flex-col justify-between">
          <div className="flex justify-center mb-4">
            <div
              className="rounded-full flex items-center justify-center"
              style={{
                backgroundColor: textColor,
                width: isPreview ? '4rem' : '6rem',
                height: isPreview ? '4rem' : '6rem'
              }}
            >
              {previewUrl ? (
                <div className="relative w-full h-full">
                  <Image
                    src={previewUrl}
                    alt="Company Logo"
                    fill
                    className="rounded-full object-cover"
                    sizes="(max-width: 768px) 96px, 144px"
                    unoptimized
                  />
                </div>
              ) : (
                <BarChart2 className={isPreview ? 'w-8 h-8' : 'w-12 h-12'} style={{ color: backgroundColor }} />
              )}
            </div>
          </div>

          <div className="space-y-3">
            {/* Info sections avec taille conditionnelle */}
            {[
              { Icon: Wallet, text: `Deployer: ${creatorAddress.slice(0, 6)}...${creatorAddress.slice(-4)}` },
              { Icon: Hash, text: `Token ID: ${tokenId}` },
              { Icon: Calendar, text: `Issued: ${issueDate}` },
              { Icon: Target, text: `Smart Contract: ${smartContract.slice(0, 6)}...${smartContract.slice(-4)}` }
            ].map(({ Icon, text }, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Icon className={isPreview ? 'w-4 h-4' : 'w-5 h-5'} style={{ color: textColor }} />
                <span className={isPreview ? 'text-xs' : 'text-sm'}>{text}</span>
              </div>
            ))}
          </div>
        </CardContent>

        {/* Footer simplifié - aligné sur le NFT on-chain */}
        <CardFooter className="p-4 flex flex-col items-center">
          <div
            className="w-full rounded-lg p-4 text-center"
            style={{ backgroundColor: `${textColor}10` }}
          >
            <p className={`${isPreview ? 'text-sm' : 'text-base'} font-medium mb-1`} style={{ color: textColor }}>
              Sector: {sector || 'N/A'}
            </p>
            <p className={`${isPreview ? 'text-xs' : 'text-sm'} opacity-70`} style={{ color: textColor }}>
              Powered by Livar Protocol
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CompanySharesNFTCard;
