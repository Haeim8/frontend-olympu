"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useLanguage, useTranslation } from "@/hooks/useLanguage";
import { 
  Globe, 
  ChevronDown, 
  Check 
} from 'lucide-react';

const languages = [
  { 
    code: 'fr', 
    name: 'Français', 
    flag: '🇫🇷',
    nativeName: 'Français'
  },
  { 
    code: 'en', 
    name: 'English', 
    flag: '🇺🇸',
    nativeName: 'English'
  },
  { 
    code: 'es', 
    name: 'Español', 
    flag: '🇪🇸',
    nativeName: 'Español'
  },
  { 
    code: 'de', 
    name: 'Deutsch', 
    flag: '🇩🇪',
    nativeName: 'Deutsch'
  },
  { 
    code: 'it', 
    name: 'Italiano', 
    flag: '🇮🇹',
    nativeName: 'Italiano'
  },
  { 
    code: 'pt', 
    name: 'Português', 
    flag: '🇵🇹',
    nativeName: 'Português'
  },
  { 
    code: 'zh', 
    name: 'Chinese', 
    flag: '🇨🇳',
    nativeName: '中文'
  },
  { 
    code: 'ja', 
    name: 'Japanese', 
    flag: '🇯🇵',
    nativeName: '日本語'
  },
  { 
    code: 'ko', 
    name: 'Korean', 
    flag: '🇰🇷',
    nativeName: '한국어'
  },
  { 
    code: 'ar', 
    name: 'Arabic', 
    flag: '🇸🇦',
    nativeName: 'العربية'
  }
];

export default function LanguageSelector({ 
  compact = false,
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { currentLanguage, changeLanguage, getAvailableLanguages } = useLanguage();
  const { t } = useTranslation();
  
  // Utiliser les langues du contexte ou fallback vers les langues statiques
  const availableLanguages = getAvailableLanguages ? getAvailableLanguages() : languages;
  const selectedLanguage = availableLanguages.find(lang => lang.code === currentLanguage) || availableLanguages[0];

  const handleLanguageSelect = (langCode) => {
    changeLanguage(langCode);
    setIsOpen(false);
  };

  const handleClickOutside = (e) => {
    if (!e.target.closest('.language-selector')) {
      setIsOpen(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  if (compact) {
    return (
      <div className={`relative language-selector ${className}`}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-800"
          aria-label={`Langue actuelle: ${selectedLanguage.nativeName}`}
        >
          <Globe className="h-5 w-5" />
        </Button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-950 rounded-xl shadow-lg border border-gray-200 dark:border-neutral-800 z-50">
            <div className="p-3 border-b border-gray-200 dark:border-neutral-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Globe className="h-4 w-4 text-lime-600" />
                {t('chooseLanguage', 'Choisir la langue')}
              </h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {availableLanguages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageSelect(language.code)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors flex items-center justify-between group ${
                    currentLanguage === language.code 
                      ? 'bg-lime-50 dark:bg-lime-900/20 border-r-2 border-lime-500' 
                      : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{language.flag}</span>
                    <div>
                      <div className={`font-medium ${
                        currentLanguage === language.code 
                          ? 'text-lime-700 dark:text-lime-300' 
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {language.nativeName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {language.name}
                      </div>
                    </div>
                  </div>
                  {currentLanguage === language.code && (
                    <Check className="h-4 w-4 text-lime-600 dark:text-lime-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative language-selector ${className}`}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800"
      >
        <span className="text-lg">{selectedLanguage.flag}</span>
        <span className="hidden sm:inline font-medium text-gray-900 dark:text-gray-100">
          {selectedLanguage.nativeName}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-950 rounded-xl shadow-lg border border-gray-200 dark:border-neutral-800 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-neutral-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Globe className="h-5 w-5 text-lime-600" />
              {t('chooseLanguage', 'Choisir la langue')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('selectLanguage', 'Sélectionnez votre langue préférée')}
            </p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {availableLanguages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageSelect(language.code)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-neutral-900 transition-all duration-200 flex items-center justify-between group ${
                  currentLanguage === language.code 
                    ? 'bg-lime-50 dark:bg-lime-900/20 border-r-4 border-lime-500' 
                    : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl group-hover:scale-110 transition-transform">
                    {language.flag}
                  </span>
                  <div>
                    <div className={`font-medium ${
                      currentLanguage === language.code 
                        ? 'text-lime-700 dark:text-lime-300' 
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {language.nativeName}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {language.name}
                    </div>
                  </div>
                </div>
                {currentLanguage === language.code && (
                  <Check className="h-5 w-5 text-lime-600 dark:text-lime-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}