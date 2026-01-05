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
  ExternalLink,
  Linkedin,
  Share2
} from 'lucide-react';

const SocialIcon = ({ platform, className }) => {
  const icons = {
    website: Globe,
    twitter: Twitter,
    github: Github,
    discord: MessageCircle,
    telegram: Send,
    medium: Edit3,
    linkedin: Linkedin
  };

  const Icon = icons[platform] || Globe;
  return <Icon className={className} />;
};

const SocialInput = ({ platform, value, onChange, placeholder }) => {
  const socialConfig = {
    website: { color: 'text-primary' },
    twitter: { color: 'text-sky-400' },
    github: { color: 'text-foreground' },
    discord: { color: 'text-indigo-400' },
    telegram: { color: 'text-blue-400' },
    medium: { color: 'text-green-400' },
    linkedin: { color: 'text-blue-500' }
  };

  const config = socialConfig[platform] || {};

  return (
    <div className="relative group">
      <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${config.color} opacity-70 group-hover:opacity-100 transition-opacity`}>
        <SocialIcon platform={platform} className="h-4 w-4" />
      </div>
      <Input
        name={platform}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="pl-9 bg-background/50 border-input/50 focus:border-primary/50 text-foreground text-sm placeholder:text-muted-foreground/50 transition-all"
      />
      {value && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        </div>
      )}
    </div>
  );
};

const TeamMemberCard = ({ member, index, onChange, onRemove, canRemove }) => {
  const { t } = useTranslation();

  return (
    <div className="glass-card p-6 rounded-xl border border-border group hover:border-primary/30 transition-all duration-300 relative overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full pointer-events-none" />

      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-inner">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">
              {t('campaignTeam.member', 'Membre #')}{index + 1}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('campaignTeam.memberInfo', 'Informations du profil')}
            </p>
          </div>
        </div>
        {canRemove && (
          <Button
            onClick={() => onRemove(index)}
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('campaignTeam.fullName', 'Nom Complet')} <span className="text-primary">*</span>
          </Label>
          <Input
            placeholder={t('campaignTeam.fullNamePlaceholder', 'Jean Dupont')}
            value={member.name}
            onChange={(e) => onChange(index, 'name', e.target.value)}
            className="bg-background/40 border-input/50 focus:border-primary/50 text-foreground"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('campaignTeam.role', 'Rôle')} <span className="text-primary">*</span>
          </Label>
          <Input
            placeholder={t('campaignTeam.rolePlaceholder', 'CEO, CTO, Lead Dev...')}
            value={member.role}
            onChange={(e) => onChange(index, 'role', e.target.value)}
            className="bg-background/40 border-input/50 focus:border-primary/50 text-foreground"
          />
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-border/50">
        <Label className="text-xs font-semibold text-foreground flex items-center gap-2">
          <Share2 className="h-3 w-3" />
          {t('campaignTeam.socials', 'Réseaux Sociaux du Membre')}
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <SocialInput
              platform="twitter"
              value={member.socials.twitter}
              onChange={(e) => onChange(index, 'socials', e.target.value, 'twitter')}
              placeholder={t('campaignTeam.twitterPlaceholder', '@username')}
            />
          </div>
          <div>
            <SocialInput
              platform="linkedin"
              value={member.socials.linkedin}
              onChange={(e) => onChange(index, 'socials', e.target.value, 'linkedin')}
              placeholder={t('campaignTeam.linkedinPlaceholder', 'linkedin.com/in/...')}
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-blue-500/10 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
          <Users className="w-8 h-8 text-blue-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            {t('campaignTeam.title', 'Équipe & Communauté')}
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mt-1">
            {t('campaignTeam.subtitle', 'Présentez les porteurs du projet et vos canaux de communication.')}
          </p>
        </div>
      </div>

      {/* Réseaux sociaux du projet */}
      <div className="glass-card p-6 rounded-xl border border-border">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">
              {t('campaignTeam.projectSocials', 'Réseaux du Projet')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('campaignTeam.socialDesc', 'Où les investisseurs peuvent-ils vous trouver ?')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground ml-1">{t('campaignTeam.website', 'Site Web')}</Label>
            <SocialInput
              platform="website"
              value={formData.socials.website}
              onChange={(e) => onInputChange(e, 'socials')}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground ml-1">{t('campaignTeam.twitter', 'Twitter / X')}</Label>
            <SocialInput
              platform="twitter"
              value={formData.socials.twitter}
              onChange={(e) => onInputChange(e, 'socials')}
              placeholder="@votre_projet"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground ml-1">{t('campaignTeam.github', 'GitHub')}</Label>
            <SocialInput
              platform="github"
              value={formData.socials.github}
              onChange={(e) => onInputChange(e, 'socials')}
              placeholder="github.com/..."
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground ml-1">{t('campaignTeam.discord', 'Discord')}</Label>
            <SocialInput
              platform="discord"
              value={formData.socials.discord}
              onChange={(e) => onInputChange(e, 'socials')}
              placeholder="discord.gg/..."
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground ml-1">{t('campaignTeam.telegram', 'Telegram')}</Label>
            <SocialInput
              platform="telegram"
              value={formData.socials.telegram}
              onChange={(e) => onInputChange(e, 'socials')}
              placeholder="t.me/..."
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground ml-1">{t('campaignTeam.medium', 'Medium / Blog')}</Label>
            <SocialInput
              platform="medium"
              value={formData.socials.medium}
              onChange={(e) => onInputChange(e, 'socials')}
              placeholder="medium.com/..."
            />
          </div>
        </div>
      </div>

      {/* Section équipe */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-foreground">
              {t('campaignTeam.teamMembers', 'Membres de l\'équipe')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('campaignTeam.teamMembersDesc', 'Ajoutez les membres clés (min. 1)')}
            </p>
          </div>
          <Button
            onClick={onAddTeamMember}
            className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('campaignTeam.addMember', 'Ajouter un Membre')}
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
              canRemove={formData.teamMembers.length > 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}