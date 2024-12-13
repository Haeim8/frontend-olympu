import React from 'react';
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
  optionsRemuneration = []
}) => {
  const getLivarBadgeColor = () => {
    switch (niveauLivar) {
      case 'vert': return 'bg-green-500';
      case 'orange': return 'bg-orange-500';
      case 'rouge': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="inline-block">
      <Card 
        className="w-[500px] h-[700px]"
        style={{ 
          backgroundColor,
          color: textColor,
          margin: 0,
          padding: 0,
        }}
      >
        <CardHeader className="h-1/4 p-4 flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold mb-2" style={{ color: textColor }}>{name}</h2>
          <p className="text-lg" style={{ color: textColor }}>Tokenized Equity</p>
        </CardHeader>

        <CardContent className="h-2/4 p-4 flex flex-col justify-between">
          <div className="flex justify-center mb-4">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{ backgroundColor: textColor }}
            >
              {logoUrl ? (
                <img src={logoUrl} alt="Company Logo" className="w-full h-full rounded-full object-cover" />
              ) : (
                <BarChart2 className="w-12 h-12" style={{ color: backgroundColor }} />
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Wallet className="w-5 h-5" style={{ color: textColor }} />
              <span className="text-sm">Deployer: {creatorAddress.slice(0, 6)}...{creatorAddress.slice(-4)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Hash className="w-5 h-5" style={{ color: textColor }} />
              <span className="text-sm">Token ID: {tokenId}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" style={{ color: textColor }} />
              <span className="text-sm">Issued: {issueDate}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5" style={{ color: textColor }} />
              <span className="text-sm">Funding Round: {fundingRound}</span>
            </div>
          </div>

          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: `${textColor}20` }}
          >
            <p className="text-sm font-mono">
              Smart Contract: {smartContract.slice(0, 6)}...{smartContract.slice(-4)}
            </p>
            <p className="text-sm font-mono">
              Total Shares: {totalShares.toLocaleString()}
            </p>
          </div>
        </CardContent>

        <CardFooter className="h-1/4 p-4 justify-between">
          <div className="flex gap-2">
            {optionsRemuneration.slice(0, 2).map((option, index) => (
              <Badge 
                key={index}
                className="text-xs"
                style={{ 
                  backgroundColor: `${textColor}20`,
                  color: textColor,
                  border: `1px solid ${textColor}40`
                }}
              >
                {option === 'dividendes' && 'Dividendes'}
                {option === 'airdrops' && 'Airdrops'}
                {option === 'vc' && 'VC'}
                {option === 'accesAnticipe' && 'Accès anticipé'}
              </Badge>
            ))}
          </div>
          <Badge 
            className={`text-xs text-white ${getLivarBadgeColor()}`}
          >
            Livar {niveauLivar}
          </Badge>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CompanySharesNFTCard;