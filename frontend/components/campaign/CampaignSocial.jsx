"use client";

import React, { useState } from 'react';
import { useTranslation } from '@/hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Twitter, 
  Github, 
  Share2, 
  ExternalLink,
  Users,
  TrendingUp,
  Heart,
  Edit,
  Plus
} from 'lucide-react';

export default function CampaignSocial({ campaignData, campaignAddress, onSocialUpdate }) {
  const { t } = useTranslation();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [socialLinks, setSocialLinks] = useState({
    twitter: '',
    github: '',
    discord: '',
    telegram: '',
    medium: '',
    website: ''
  });
  const [socialStats, setSocialStats] = useState({
    followers: 0,
    engagement: 0,
    mentions: 0,
    shares: 0
  });
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
      // API call pour mettre à jour les liens sociaux
      // await apiManager.updateSocialLinks(campaignAddress, socialLinks);
      
      if (onSocialUpdate) {
        onSocialUpdate(socialLinks);
      }
      
      setShowEditDialog(false);
      alert(t('campaignSocial.updateSuccess'));
      
    } catch (error) {
      console.error('Erreur mise à jour liens sociaux:', error);
      alert(t('campaignSocial.updateError'));
    } finally {
      setIsUpdating(false);
    }
  };

  const shareOnPlatform = (platform) => {
    const shareText = `${t('campaignSocial.shareText')} ${campaignData?.name || t('campaignSocial.thisCampaign')} ${t('campaignSocial.onLivar')} !`;
    const shareUrl = window.location.href;
    
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      reddit: `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`
    };
    
    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert(t('campaignSocial.linkCopied'));
    } catch (err) {
      console.error('Erreur copie:', err);
    }
  };

  const socialPlatforms = [
    {
      id: 'discord',
      name: 'Discord',
      icon: (
        <svg className="w-6 h-6" viewBox="0 -28.5 256 256" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031Z"
            fill="currentColor"
          />
        </svg>
      ),
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      hoverColor: 'hover:bg-indigo-100 dark:hover:bg-indigo-900/40'
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6">
          <path
            fill="currentColor"
            d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
          />
        </svg>
      ),
      color: 'text-black dark:text-white',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20',
      hoverColor: 'hover:bg-gray-100 dark:hover:bg-gray-900/40'
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 98 96" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
            fill="currentColor"
          />
        </svg>
      ),
      color: 'text-gray-800 dark:text-gray-200',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20',
      hoverColor: 'hover:bg-gray-100 dark:hover:bg-gray-900/40'
    },
    {
      id: 'medium',
      name: 'Medium',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 1043.63 592.71">
          <path
            d="M588.67 296.36c0 163.67-131.78 296.35-294.33 296.35S0 460 0 296.36 131.78 0 294.34 0s294.33 132.69 294.33 296.36M911.56 296.36c0 154.06-65.89 279-147.17 279s-147.17-124.94-147.17-279 65.88-279 147.16-279 147.17 124.9 147.17 279M1043.63 296.36c0 138-23.17 249.94-51.76 249.94s-51.75-111.91-51.75-249.94 23.17-249.94 51.75-249.94 51.76 111.9 51.76 249.94"
            fill="currentColor"
          />
        </svg>
      ),
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      hoverColor: 'hover:bg-green-100 dark:hover:bg-green-900/40'
    },
    {
      id: 'forum',
      name: 'Forum',
      icon: <MessageSquare className="w-6 h-6" />,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      hoverColor: 'hover:bg-blue-100 dark:hover:bg-blue-900/40'
    }
  ];

  return (
    <Card className="bg-white dark:bg-neutral-950 border-0 dark:border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-500" />
            {t('campaignSocial.title')}
          </div>
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-gray-600 dark:text-gray-400">
                <Edit className="h-4 w-4 mr-2" />
                {t('campaignSocial.edit')}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-neutral-950 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-gray-100">
                  {t('campaignSocial.editSocialLinks')}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="twitter-link" className="text-gray-700 dark:text-gray-300">
                    Twitter
                  </Label>
                  <Input
                    id="twitter-link"
                    value={socialLinks.twitter}
                    onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                    placeholder={t('campaignSocial.twitterPlaceholder')}
                    className="bg-gray-50 dark:bg-neutral-900 mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="discord-link" className="text-gray-700 dark:text-gray-300">
                    Discord
                  </Label>
                  <Input
                    id="discord-link"
                    value={socialLinks.discord}
                    onChange={(e) => handleSocialLinkChange('discord', e.target.value)}
                    placeholder={t('campaignSocial.discordPlaceholder')}
                    className="bg-gray-50 dark:bg-neutral-900 mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="github-link" className="text-gray-700 dark:text-gray-300">
                    GitHub
                  </Label>
                  <Input
                    id="github-link"
                    value={socialLinks.github}
                    onChange={(e) => handleSocialLinkChange('github', e.target.value)}
                    placeholder={t('campaignSocial.githubPlaceholder')}
                    className="bg-gray-50 dark:bg-neutral-900 mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="website-link" className="text-gray-700 dark:text-gray-300">
                    {t('campaignSocial.website')}
                  </Label>
                  <Input
                    id="website-link"
                    value={socialLinks.website}
                    onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                    placeholder={t('campaignSocial.websitePlaceholder')}
                    className="bg-gray-50 dark:bg-neutral-900 mt-1"
                  />
                </div>
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowEditDialog(false)}
                    disabled={isUpdating}
                  >
                    {t('campaignSocial.cancel')}
                  </Button>
                  <Button
                    onClick={handleUpdateSocialLinks}
                    disabled={isUpdating}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isUpdating ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {t('campaignSocial.updating')}
                      </div>
                    ) : (
                      t('campaignSocial.save')
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stats sociales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {socialStats.followers}
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('campaignSocial.followers')}</p>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {socialStats.engagement}%
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('campaignSocial.engagement')}</p>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {socialStats.mentions}
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('campaignSocial.mentions')}</p>
          </div>
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Share2 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {socialStats.shares}
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('campaignSocial.shares')}</p>
          </div>
        </div>

        {/* Plateformes sociales */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t('campaignSocial.joinCommunity')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {socialPlatforms.map((platform) => (
              <Button
                key={platform.id}
                variant="outline"
                className={`w-full p-4 h-auto flex flex-col items-center gap-3 ${platform.bgColor} ${platform.color} ${platform.hoverColor} border-0 transition-all duration-200 hover:scale-105`}
                onClick={() => {
                  if (socialLinks[platform.id]) {
                    window.open(socialLinks[platform.id], '_blank');
                  } else {
                    alert(t('campaignSocial.linkNotConfigured', { platform: platform.name }));
                  }
                }}
              >
                {platform.icon}
                <span className="text-sm font-medium">{platform.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Actions de partage */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t('campaignSocial.shareCampaign')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              onClick={() => shareOnPlatform('twitter')}
              className="bg-black hover:bg-gray-800 text-white"
            >
              <Twitter className="h-4 w-4 mr-2" />
              Twitter
            </Button>
            <Button
              onClick={() => shareOnPlatform('linkedin')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
              </svg>
              LinkedIn
            </Button>
            <Button
              onClick={() => shareOnPlatform('facebook')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd" />
              </svg>
              Facebook
            </Button>
            <Button
              onClick={copyToClipboard}
              variant="outline"
              className="border-gray-300 dark:border-gray-600"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {t('campaignSocial.copyLink')}
            </Button>
          </div>
        </div>

        {/* Conseils de communication */}
        <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-3">
            <Heart className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                {t('campaignSocial.engagementTips.title')}
              </h4>
              <ul className="text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• {t('campaignSocial.engagementTips.tip1')}</li>
                <li>• {t('campaignSocial.engagementTips.tip2')}</li>
                <li>• {t('campaignSocial.engagementTips.tip3')}</li>
                <li>• {t('campaignSocial.engagementTips.tip4')}</li>
                <li>• {t('campaignSocial.engagementTips.tip5')}</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}