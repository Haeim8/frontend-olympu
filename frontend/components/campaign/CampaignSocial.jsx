"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Twitter,
  Github,
  Share2,
  ExternalLink,
  Users,
  TrendingUp,
  Heart,
  Edit2,
  Copy,
  Check,
  Globe,
  Send
} from 'lucide-react';

export default function CampaignSocial({ campaignData, campaignAddress, onSocialUpdate }) {
  const { t } = useTranslation();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initialiser avec les données de la campagne
  const [socialLinks, setSocialLinks] = useState({
    twitter: campaignData?.twitter || '',
    github: campaignData?.github || '',
    discord: campaignData?.discord || '',
    telegram: campaignData?.telegram || '',
    medium: campaignData?.medium || '',
    website: campaignData?.website || '',
    farcaster: campaignData?.farcaster || '',
    base: campaignData?.base || ''
  });

  // Synchroniser quand campaignData change
  useEffect(() => {
    if (campaignData) {
      setSocialLinks({
        twitter: campaignData.twitter || '',
        github: campaignData.github || '',
        discord: campaignData.discord || '',
        telegram: campaignData.telegram || '',
        medium: campaignData.medium || '',
        website: campaignData.website || '',
        farcaster: campaignData.farcaster || '',
        base: campaignData.base || ''
      });
    }
  }, [campaignData]);

  const [isUpdating, setIsUpdating] = useState(false);

  const handleSocialLinkChange = (platform, value) => {
    setSocialLinks(prev => ({
      ...prev,
      [platform]: value
    }));
  };

  const handleUpdateSocialLinks = async () => {
    setIsUpdating(true);
    try {
      // Appeler l'API pour sauvegarder les liens
      const response = await fetch('/api/campaigns/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: campaignAddress,
          twitter: socialLinks.twitter,
          discord: socialLinks.discord,
          github: socialLinks.github,
          telegram: socialLinks.telegram,
          farcaster: socialLinks.farcaster,
          medium: socialLinks.medium,
          base: socialLinks.base,
          website: socialLinks.website
        })
      });

      if (response.ok) {
        if (onSocialUpdate) {
          onSocialUpdate(socialLinks);
        }
        setShowEditDialog(false);
      } else {
        console.error('Erreur sauvegarde liens sociaux');
      }
    } catch (error) {
      console.error('Erreur mise à jour liens sociaux:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const shareOnPlatform = (platform) => {
    const shareText = `${t('campaignSocial.shareText', 'Découvrez cette campagne incroyable :')} ${campaignData?.name || 'Projet'} ${t('campaignSocial.onLivar', 'sur Livar')} !`;
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erreur copie:', err);
    }
  };

  // Construire l'URL complète à partir du handle/nom
  const buildFullUrl = (platformId, value) => {
    if (!value) return '#';

    // Si c'est déjà une URL complète, la retourner
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }

    // Sinon, construire l'URL selon la plateforme
    const prefixes = {
      twitter: 'https://twitter.com/',
      discord: 'https://discord.gg/',
      github: 'https://github.com/',
      telegram: 'https://t.me/',
      farcaster: 'https://warpcast.com/',
      medium: 'https://medium.com/@',
      base: 'https://base.org/',
      website: 'https://'
    };

    return `${prefixes[platformId] || ''}${value}`;
  };

  const socialPlatforms = [
    {
      id: 'discord',
      name: 'Discord',
      icon: (
        <svg className="w-5 h-5" viewBox="0 -28.5 256 256" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
          <path d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031Z" />
        </svg>
      ),
      color: 'text-indigo-400',
      borderColor: 'border-indigo-500/20',
      hoverBg: 'hover:bg-indigo-500/10'
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: <Twitter className="w-5 h-5" />,
      color: 'text-sky-400',
      borderColor: 'border-sky-500/20',
      hoverBg: 'hover:bg-sky-500/10'
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: <Github className="w-5 h-5" />,
      color: 'text-foreground',
      borderColor: 'border-foreground/20',
      hoverBg: 'hover:bg-foreground/10'
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: <Send className="w-5 h-5" />,
      color: 'text-cyan-400',
      borderColor: 'border-cyan-500/20',
      hoverBg: 'hover:bg-cyan-500/10'
    },
    {
      id: 'farcaster',
      name: 'Farcaster',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 1000 1000" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M257.778 155.556H742.222V844.445H671.111V528.889H670.414C662.554 441.677 589.258 373.333 500 373.333C410.742 373.333 337.446 441.677 329.586 528.889H328.889V844.445H257.778V155.556Z" />
          <path d="M128.889 253.333L157.778 351.111H182.222V746.667C169.949 746.667 160 756.616 160 768.889V795.556H155.556C143.283 795.556 133.333 805.505 133.333 817.778V844.445H382.222V817.778C382.222 805.505 372.273 795.556 360 795.556H355.556V768.889C355.556 756.616 345.606 746.667 333.333 746.667H306.667V253.333H128.889Z" />
          <path d="M675.556 746.667C663.283 746.667 653.333 756.616 653.333 768.889V795.556H648.889C636.616 795.556 626.667 805.505 626.667 817.778V844.445H875.556V817.778C875.556 805.505 865.606 795.556 853.333 795.556H848.889V768.889C848.889 756.616 838.94 746.667 826.667 746.667V351.111H851.111L880 253.333H702.222V746.667H675.556Z" />
        </svg>
      ),
      color: 'text-purple-400',
      borderColor: 'border-purple-500/20',
      hoverBg: 'hover:bg-purple-500/10'
    },
    {
      id: 'base',
      name: 'Base',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 111 111" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M55.5 111C86.1518 111 111 86.1518 111 55.5C111 24.8482 86.1518 0 55.5 0C24.8482 0 0 24.8482 0 55.5C0 86.1518 24.8482 111 55.5 111Z" />
          <path d="M54.9995 91.6667C75.4605 91.6667 92.0828 75.2507 92.0828 55.0417C92.0828 34.8327 75.4605 18.4167 54.9995 18.4167C35.5765 18.4167 19.6286 33.3084 18.0245 52.0833H62.8328V58.0001H18.0245C19.6286 76.7749 35.5765 91.6667 54.9995 91.6667Z" fill="white" />
        </svg>
      ),
      color: 'text-blue-500',
      borderColor: 'border-blue-500/20',
      hoverBg: 'hover:bg-blue-500/10'
    },
    {
      id: 'website',
      name: 'Website',
      icon: <Globe className="w-5 h-5" />,
      color: 'text-primary',
      borderColor: 'border-primary/20',
      hoverBg: 'hover:bg-primary/10'
    }
  ];

  return (
    <Card className="glass-card border-border shadow-2xl relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {t('campaignSocial.title', 'Communauté & Social')}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('campaignSocial.subtitle', 'Gérez la présence sociale de votre campagne.')}
            </p>
          </div>

          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-primary/20 text-primary hover:bg-primary/10 hover:text-primary transition-all">
                <Edit2 className="h-3.5 w-3.5 mr-2" />
                {t('campaignSocial.edit', 'Modifier')}
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-border sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-foreground text-xl">
                  {t('campaignSocial.editSocialLinks', 'Modifier les liens sociaux')}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="twitter-link" className="text-foreground/80">Twitter</Label>
                  <div className="relative">
                    <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="twitter-link"
                      value={socialLinks.twitter}
                      onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                      placeholder="https://twitter.com/..."
                      className="pl-9 bg-muted/50 border-input/50 focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discord-link" className="text-foreground/80">Discord</Label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="discord-link"
                      value={socialLinks.discord}
                      onChange={(e) => handleSocialLinkChange('discord', e.target.value)}
                      placeholder="https://discord.gg/..."
                      className="pl-9 bg-muted/50 border-input/50 focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="github-link" className="text-foreground/80">GitHub</Label>
                  <div className="relative">
                    <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="github-link"
                      value={socialLinks.github}
                      onChange={(e) => handleSocialLinkChange('github', e.target.value)}
                      placeholder="https://github.com/..."
                      className="pl-9 bg-muted/50 border-input/50 focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telegram-link" className="text-foreground/80">Telegram</Label>
                  <div className="relative">
                    <Send className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="telegram-link"
                      value={socialLinks.telegram}
                      onChange={(e) => handleSocialLinkChange('telegram', e.target.value)}
                      placeholder="https://t.me/..."
                      className="pl-9 bg-muted/50 border-input/50 focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="farcaster-link" className="text-foreground/80">Farcaster</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
                    <Input
                      id="farcaster-link"
                      value={socialLinks.farcaster}
                      onChange={(e) => handleSocialLinkChange('farcaster', e.target.value)}
                      placeholder="https://warpcast.com/..."
                      className="pl-9 bg-muted/50 border-input/50 focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="base-link" className="text-foreground/80">Base</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                    <Input
                      id="base-link"
                      value={socialLinks.base}
                      onChange={(e) => handleSocialLinkChange('base', e.target.value)}
                      placeholder="https://base.org/..."
                      className="pl-9 bg-muted/50 border-input/50 focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website-link" className="text-foreground/80">{t('campaignSocial.website', 'Site Web')}</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website-link"
                      value={socialLinks.website}
                      onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                      placeholder="https://..."
                      className="pl-9 bg-muted/50 border-input/50 focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setShowEditDialog(false)}
                  disabled={isUpdating}
                  className="hover:bg-muted text-foreground"
                >
                  {t('campaignSocial.cancel', 'Annuler')}
                </Button>
                <Button
                  onClick={handleUpdateSocialLinks}
                  disabled={isUpdating}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20"
                >
                  {isUpdating ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"
                    />
                  ) : (
                    t('campaignSocial.save', 'Enregistrer')
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Liens sociaux - pas de métriques car les APIs ne sont pas disponibles */}

        {/* Links Grid */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            {t('campaignSocial.joinCommunity', 'Rejoindre la communauté')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {socialPlatforms.map((platform) => {
              const rawValue = socialLinks[platform.id];
              const fullUrl = buildFullUrl(platform.id, rawValue);
              const hasLink = !!rawValue;

              return (
                <a
                  key={platform.id}
                  href={fullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!hasLink) {
                      e.preventDefault();
                      setShowEditDialog(true);
                    }
                  }}
                  className={`
                    flex flex-col items-center justify-center p-3 gap-2 rounded-xl border border-dashed transition-all duration-300
                    ${!hasLink ? 'opacity-50 border-border grayscale hover:grayscale-0 hover:opacity-100 cursor-pointer' : `${platform.borderColor} bg-muted/20 ${platform.hoverBg} border-solid`}
                  `}
                >
                  <div className={`${platform.color}`}>{platform.icon}</div>
                  <span className={`text-xs font-bold ${platform.color}`}>{platform.name}</span>
                </a>
              );
            })}
          </div>
        </div>

        {/* Share Actions */}
        <div className="pt-4 border-t border-border/50">
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Share2 className="h-4 w-4 text-secondary" />
            {t('campaignSocial.shareCampaign', 'Partager cette campagne')}
          </h3>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => shareOnPlatform('twitter')}
              className="flex-1 bg-black hover:bg-gray-900 text-white rounded-xl border border-gray-800"
            >
              <Twitter className="h-4 w-4 mr-2" />
              Twitter
            </Button>
            <Button
              onClick={() => shareOnPlatform('linkedin')}
              className="flex-1 bg-[#0077b5] hover:bg-[#006396] text-white rounded-xl"
            >
              <Share2 className="h-4 w-4 mr-2" />
              LinkedIn
            </Button>
            <Button
              onClick={() => shareOnPlatform('telegram')}
              className="flex-1 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-xl"
            >
              <Send className="h-4 w-4 mr-2" />
              Telegram
            </Button>
            <Button
              onClick={copyToClipboard}
              variant="outline"
              className="flex-1 border-border text-foreground hover:bg-muted rounded-xl"
            >
              {copied ? <Check className="h-4 w-4 mr-2 text-green-500" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? t('campaignSocial.copied', 'Copié !') : t('campaignSocial.copyLink', 'Copier Lien')}
            </Button>
          </div>
        </div>

        {/* Pro Tip */}
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 flex items-start gap-4">
          <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
            <Heart className="h-5 w-5 fill-current" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-yellow-500 mb-1">{t('campaignSocial.engagementTips.title', 'Conseil de Pro')}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('campaignSocial.engagementTips.tip1', 'Interagissez régulièrement avec votre communauté pour maintenir l\'intérêt. Les campagnes avec des mises à jour fréquentes ont 40% de chances de succès en plus.')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}