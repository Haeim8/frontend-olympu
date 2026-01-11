"use client";

import Image from 'next/image';
import ConnectWalletButton from '@/components/shared/ConnectWalletButton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLanguage } from '@/contexts/LanguageContext';

export default function ConnectPrompt() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">

        {/* Logo & Headline */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative w-20 h-20 bg-background rounded-2xl shadow-sm border border-border p-2">
            <div className="relative w-full h-full rounded-xl overflow-hidden">
              <Image
                src="/assets/miniapp-icon.png"
                alt="Livar logo"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {t('connect.welcome', 'Bienvenue sur Livar')}
            </h1>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              {t('connect.subtitle', 'Plateforme d\'investissement crypto sécurisée et transparente.')}
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-border shadow-sm">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-xl">{t('connect.login', 'Connexion')}</CardTitle>
            <CardDescription>
              {t('connect.description', 'Connectez votre portefeuille pour accéder au tableau de bord.')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg text-xs text-muted-foreground border border-border/50 text-center">
              {t('connect.terms', 'En vous connectant, vous acceptez nos conditions d\'utilisation et notre politique de confidentialité.')}
            </div>

            <div className="flex justify-center pt-2">
              <ConnectWalletButton className="w-full" />
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>{t('connect.poweredBy', 'Propulsé par Base & Coinbase Wallet')}</p>
        </div>

      </div>
    </div>
  );
}
