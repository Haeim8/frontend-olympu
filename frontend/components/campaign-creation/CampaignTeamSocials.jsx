"use client";

import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslation } from '@/hooks/useLanguage';
import { 
  Plus, 
  Trash2, 
  Users, 
  Globe, 
  Twitter, 
  Github, 
  MessageCircle,
  Send,
  Edit3,
  ExternalLink
} from 'lucide-react';

const SocialIcon = ({ platform }) => {
  const icons = {
    website: Globe,
    twitter: Twitter,
    github: Github,
    discord: MessageCircle,
    telegram: Send,
    medium: Edit3
  };
  
  const Icon = icons[platform] || Globe;
  return <Icon className="h-4 w-4" />;
};

const SocialInput = ({ platform, value, onChange, placeholder }) => {
  const socialConfig = {
    website: { prefix: 'https://', color: 'text-blue-600' },
    twitter: { prefix: '@', color: 'text-sky-600' },
    github: { prefix: 'github.com/', color: 'text-gray-800 dark:text-gray-200' },
    discord: { prefix: 'discord.gg/', color: 'text-indigo-600' },
    telegram: { prefix: 't.me/', color: 'text-blue-500' },
    medium: { prefix: '@', color: 'text-green-600' }
  };

  const config = socialConfig[platform] || {};

  return (
    <div className="relative">
      <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${config.color}`}>
        <SocialIcon platform={platform} />
      </div>
      <Input
        name={platform}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-lime-500 focus:border-transparent"
      />
      {value && (
        <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
          <ExternalLink className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

const TeamMemberCard = ({ member, index, onChange, onRemove, canRemove }) => {
  const { t } = useTranslation();
  
  return (
    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl p-6 space-y-4 group hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-lime-100 to-blue-100 dark:from-lime-900/20 dark:to-blue-900/20 rounded-full flex items-center justify-center">
            <Users className="h-6 w-6 text-lime-600 dark:text-lime-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {t('campaignTeam.member', { number: index + 1 })}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('campaignTeam.memberInfo')}
            </p>
          </div>
        </div>
        {canRemove && (
          <Button
            onClick={() => onRemove(index)}
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 block">
            {t('campaignTeam.fullName')} *
          </Label>
          <Input
            placeholder={t('campaignTeam.fullNamePlaceholder')}
            value={member.name}
            onChange={(e) => onChange(index, 'name', e.target.value)}
            className="transition-all duration-200 focus:ring-2 focus:ring-lime-500 focus:border-transparent"
          />
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 block">
            {t('campaignTeam.role')} *
          </Label>
          <Input
            placeholder={t('campaignTeam.rolePlaceholder')}
            value={member.role}
            onChange={(e) => onChange(index, 'role', e.target.value)}
            className="transition-all duration-200 focus:ring-2 focus:ring-lime-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {t('campaignTeam.socials')}
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
              {t('campaignTeam.twitter')}
            </Label>
            <SocialInput
              platform="twitter"
              value={member.socials.twitter}
              onChange={(e) => onChange(index, 'socials', e.target.value, 'twitter')}
              placeholder={t('campaignTeam.twitterPlaceholder')}
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
              {t('campaignTeam.linkedin')}
            </Label>
            <SocialInput
              platform="website"
              value={member.socials.linkedin}
              onChange={(e) => onChange(index, 'socials', e.target.value, 'linkedin')}
              placeholder={t('campaignTeam.linkedinPlaceholder')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default function CampaignTeamSocials({
  formData,
  onInputChange,
  onTeamMemberChange,
  onAddTeamMember,
  onRemoveTeamMember
}) {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl mb-4">
          <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t('campaignTeam.title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('campaignTeam.subtitle')}
        </p>
      </div>

      {/* Réseaux sociaux du projet */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {t('campaignTeam.projectSocials')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('campaignTeam.socialDesc')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 block">
              {t('campaignTeam.website')}
            </Label>
            <SocialInput
              platform="website"
              value={formData.socials.website}
              onChange={(e) => onInputChange(e, 'socials')}
              placeholder={t('campaignTeam.websitePlaceholder')}
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 block">
              {t('campaignTeam.twitter')}
            </Label>
            <SocialInput
              platform="twitter"
              value={formData.socials.twitter}
              onChange={(e) => onInputChange(e, 'socials')}
              placeholder="@votre_projet"
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 block">
              {t('campaignTeam.github')}
            </Label>
            <SocialInput
              platform="github"
              value={formData.socials.github}
              onChange={(e) => onInputChange(e, 'socials')}
              placeholder={t('campaignTeam.githubPlaceholder')}
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 block">
              {t('campaignTeam.discord')}
            </Label>
            <SocialInput
              platform="discord"
              value={formData.socials.discord}
              onChange={(e) => onInputChange(e, 'socials')}
              placeholder={t('campaignTeam.discordPlaceholder')}
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 block">
              {t('campaignTeam.telegram')}
            </Label>
            <SocialInput
              platform="telegram"
              value={formData.socials.telegram}
              onChange={(e) => onInputChange(e, 'socials')}
              placeholder={t('campaignTeam.telegramPlaceholder')}
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 block">
              {t('campaignTeam.medium')}
            </Label>
            <SocialInput
              platform="medium"
              value={formData.socials.medium}
              onChange={(e) => onInputChange(e, 'socials')}
              placeholder={t('campaignTeam.mediumPlaceholder')}
            />
          </div>
        </div>
      </div>

      {/* Section équipe */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {t('campaignTeam.teamMembers')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('campaignTeam.teamMembersDesc')}
            </p>
          </div>
          <Button
            onClick={onAddTeamMember}
            className="bg-lime-500 hover:bg-lime-600 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('campaignTeam.addMember')}
          </Button>
        </div>

        <div className="grid gap-6">
          {formData.teamMembers.map((member, index) => (
            <TeamMemberCard
              key={index}
              member={member}
              index={index}
              onChange={onTeamMemberChange}
              onRemove={onRemoveTeamMember}
              canRemove={index > 0}
            />
          ))}
        </div>

        {formData.teamMembers.length === 0 && (
          <div className="text-center py-12 bg-gray-50 dark:bg-neutral-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-neutral-700">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {t('campaignTeam.noTeamMembers')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('campaignTeam.addFirstMember')}
            </p>
            <Button
              onClick={onAddTeamMember}
              className="bg-lime-500 hover:bg-lime-600 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('campaignTeam.addFirstMember')}
            </Button>
          </div>
        )}
      </div>

      {/* Conseils */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
        <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
          {t('campaignTeam.socialTips')}
        </h3>
        <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
          <li>{t('campaignTeam.socialTip1')}</li>
          <li>{t('campaignTeam.socialTip2')}</li>
          <li>{t('campaignTeam.socialTip3')}</li>
        </ul>
      </div>
    </div>
  );
}