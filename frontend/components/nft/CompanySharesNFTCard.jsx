"use client";

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  niveauLivar,
  investmentReturns,
  isPreview = false // Nouveau prop pour différencier la prévisualisation
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

  const getLivarBadgeColor = () => {
    switch (niveauLivar) {
      case 'vert': return 'bg-green-500';
      case 'orange': return 'bg-orange-500';
      case 'rouge': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRewardBadges = () => {
    const badges = [];
    if (investmentReturns?.dividends?.enabled) badges.push('Dividendes');
    if (investmentReturns?.airdrops?.enabled) badges.push('Airdrops');
    if (investmentReturns?.revenueSplit?.enabled) badges.push('Revenue Split');
    if (investmentReturns?.customReward?.enabled) badges.push(investmentReturns.customReward.name);
    return badges;
  };

  const badges = getRewardBadges();
  const halfLength = Math.ceil(badges.length / 2);
  const leftBadges = badges.slice(0, halfLength);
  const rightBadges = badges.slice(halfLength);

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

  const badgeStyles = isPreview ? {
    fontSize: '0.75rem',
    padding: '0.25rem 0.5rem',
    minWidth: '60px'
  } : {
    fontSize: '0.875rem',
    padding: '0.5rem 1rem',
    minWidth: '80px'
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

        <CardFooter className="p-4 flex flex-col items-center">
        <Badge 
  className={`text-xs text-white mb-4 ${getLivarBadgeColor()}`}
  style={badgeStyles}
>
  Livar
</Badge>
          
          <div className="flex justify-between w-full gap-4">
            <div className="flex flex-col gap-2">
              {leftBadges.map((badge, index) => (
                <Badge 
                  key={`left-${index}`}
                  className="flex justify-center"
                  style={{
                    ...badgeStyles,
                    backgroundColor: `${textColor}20`,
                    color: textColor,
                    border: `1px solid ${textColor}40`
                  }}
                >
                  {badge}
                </Badge>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              {rightBadges.map((badge, index) => (
                <Badge 
                  key={`right-${index}`}
                  className="flex justify-center"
                  style={{
                    ...badgeStyles,
                    backgroundColor: `${textColor}20`,
                    color: textColor,
                    border: `1px solid ${textColor}40`
                  }}
                >
                  {badge}
                </Badge>
              ))}
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CompanySharesNFTCard;
