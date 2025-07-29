"use client";

import React from 'react';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';

const StepIndicator = ({ currentStep, totalSteps }) => {
  const steps = [
    { number: 1, title: 'Informations', description: 'Détails du projet' },
    { number: 2, title: 'Documents', description: 'Fichiers requis' },
    { number: 3, title: 'Équipe', description: 'Membres & réseaux' },
    { number: 4, title: 'NFT', description: 'Design & aperçu' },
    { number: 5, title: 'Vérification', description: 'Validation finale' }
  ];

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center space-y-2">
              {/* Cercle de l'étape */}
              <div className={`
                relative flex items-center justify-center w-12 h-12 rounded-full border-2 font-semibold text-sm transition-all duration-300
                ${currentStep > step.number 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : currentStep === step.number 
                  ? 'bg-lime-500 border-lime-500 text-white ring-4 ring-lime-200 dark:ring-lime-800' 
                  : 'bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-600 text-gray-500 dark:text-gray-400'
                }
              `}>
                {currentStep > step.number ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <span>{step.number}</span>
                )}
                
                {/* Animation pulse pour l'étape active */}
                {currentStep === step.number && (
                  <div className="absolute inset-0 rounded-full bg-lime-500 animate-ping opacity-20" />
                )}
              </div>

              {/* Labels */}
              <div className="text-center space-y-1">
                <div className={`
                  text-sm font-semibold transition-colors
                  ${currentStep >= step.number 
                    ? 'text-gray-900 dark:text-gray-100' 
                    : 'text-gray-500 dark:text-gray-400'
                  }
                `}>
                  {step.title}
                </div>
                <div className={`
                  text-xs transition-colors
                  ${currentStep >= step.number 
                    ? 'text-gray-600 dark:text-gray-300' 
                    : 'text-gray-400 dark:text-gray-500'
                  }
                `}>
                  {step.description}
                </div>
              </div>
            </div>

            {/* Flèche entre les étapes */}
            {index < steps.length - 1 && (
              <div className={`
                flex-1 max-w-24 mx-4 transition-colors duration-300
                ${currentStep > step.number 
                  ? 'text-green-500' 
                  : 'text-gray-300 dark:text-gray-600'
                }
              `}>
                <div className="flex items-center">
                  <div className={`
                    flex-1 h-0.5 transition-colors
                    ${currentStep > step.number 
                      ? 'bg-green-500' 
                      : 'bg-gray-300 dark:bg-gray-600'
                    }
                  `} />
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-6 relative">
        <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-lime-500 to-green-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
        <div className="absolute -top-1 right-0 text-xs font-medium text-gray-600 dark:text-gray-400">
          {Math.round((currentStep / totalSteps) * 100)}%
        </div>
      </div>
    </div>
  );
};

export default StepIndicator;