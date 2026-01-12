"use client";

import React from 'react';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/hooks/useLanguage';

const StepIndicator = ({ currentStep, totalSteps }) => {
  const { t } = useTranslation();

  const steps = [
    { number: 1, title: t('campaignSteps.information', 'Informations'), description: t('campaignSteps.informationDesc', 'Détails du projet') },
    { number: 2, title: t('campaignSteps.documents', 'Documents'), description: t('campaignSteps.documentsDesc', 'Whitepaper & Deck') },
    { number: 3, title: t('campaignSteps.team', 'Équipe'), description: t('campaignSteps.teamDesc', 'Membres clés') },
    { number: 4, title: t('campaignSteps.nft', 'NFT'), description: t('campaignSteps.nftDesc', 'Design de la carte') },
    { number: 5, title: t('campaignSteps.verification', 'Vérification'), description: t('campaignSteps.verificationDesc', 'Revue finale') }
  ];

  return (
    <div className="w-full py-2">
      <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-4 md:gap-0">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;

          return (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center space-y-3 z-10 w-1/5 min-w-[80px]">
                {/* Cercle de l'étape */}
                <div className={`
                  relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border-2 font-bold text-sm transition-all duration-500
                  ${isCompleted
                    ? 'bg-primary border-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]'
                    : isCurrent
                      ? 'bg-background border-primary text-primary ring-4 ring-primary/20 shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)] scale-110'
                      : 'bg-muted/30 border-muted text-muted-foreground'
                  }
                `}>
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 md:w-6 md:h-6" />
                  ) : (
                    <span>{step.number}</span>
                  )}

                  {/* Animation pulse pour l'étape active */}
                  {isCurrent && (
                    <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
                  )}
                </div>

                {/* Labels */}
                <div className="text-center space-y-0.5 hidden md:block">
                  <div className={`
                    text-xs font-bold uppercase tracking-wider transition-colors
                    ${isCurrent || isCompleted
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                    }
                  `}>
                    {step.title}
                  </div>
                  {/* description is optional, hidden on mobile or small screens usually, shown here for completeness */}
                </div>
              </div>

              {/* Ligne de connexion entre les étapes */}
              {index < steps.length - 1 && (
                <div className="hidden md:flex flex-1 items-center px-2">
                  <div className="relative w-full h-0.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`absolute left-0 top-0 bottom-0 transition-all duration-700 ease-out bg-primary ${isCompleted ? 'w-full' : 'w-0'
                        }`}
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile Only Progress Bar Description */}
      <div className="md:hidden mt-4 text-center">
        <p className="text-sm font-bold text-foreground">
          {steps[currentStep - 1]?.title}
        </p>
        <p className="text-xs text-muted-foreground">
          {currentStep} / {totalSteps}
        </p>
      </div>
    </div>
  );
};

export default StepIndicator;