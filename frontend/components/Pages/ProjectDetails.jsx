"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiManager } from '@/lib/services/api-manager';
import { useTranslation } from '@/hooks/useLanguage';
import { motion } from 'framer-motion';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import {
  X, Share2, Star, TrendingUp, Users, Clock, Target, Shield,
  ExternalLink, Copy, Check, FileText, History, Wallet,
  Zap, Globe, Twitter, MessageCircle, Github, Info, Coins, CheckCircle
} from 'lucide-react';

const DEFAULT_PROJECT = {
  name: "",
  raised: "0",
  goal: "0",
  sharePrice: "0",
  endDate: null,
  description: "",
  isActive: false,
  isFinalized: false,
};

export default function ProjectDetails({ selectedProject, onClose }) {
  const { t } = useTranslation();
  const project = { ...DEFAULT_PROJECT, ...selectedProject };
  const [showProjectDetails, setShowProjectDetails] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectData, setProjectData] = useState({ ipfs: null });
  const [activeTab, setActiveTab] = useState('overview');
  const [shareCount, setShareCount] = useState(1);
  const [copied, setCopied] = useState(false);
  const [userAddress, setUserAddress] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => { if (accounts.length > 0) setUserAddress(accounts[0]); })
        .catch(console.error);
    }
  }, []);

  useEffect(() => { setShowProjectDetails(!!selectedProject); }, [selectedProject]);

  const loadProjectData = useCallback(async () => {
    if (!project?.id) return;
    try {
      setIsLoading(true);
      const [projectDetails, txData] = await Promise.all([
        apiManager.getCampaignData(project.id, false),
        fetch(`/api/campaigns/${project.id}/transactions`).then(r => r.json()).catch(() => ({ transactions: [] }))
      ]);
      if (projectDetails) {
        setProjectData({ ...projectDetails, ipfs: null });
        // IPFS metadata fetching removed - all data now comes from PostgreSQL
      }
      if (txData?.transactions) setTransactions(txData.transactions);
    } catch (err) { console.error('Error:', err); }
    finally { setIsLoading(false); }
  }, [project?.id]);

  useEffect(() => { if (project?.id) loadProjectData(); }, [project?.id, loadProjectData]);

  // Calculs basés sur les vraies données
  const progress = (parseFloat(project.raised) / parseFloat(project.goal)) * 100 || 0;
  const sharePrice = parseFloat(project.sharePrice) || 0;
  const totalCost = (shareCount * sharePrice).toFixed(4);

  // Vérification du VRAI statut
  const getProjectStatus = () => {
    const endDate = project.endDate ? new Date(project.endDate) : null;
    const now = new Date();

    // Si finalisé
    if (project.isFinalized) {
      return { key: 'finalized', color: 'bg-neutral-500/20 text-neutral-400' };
    }

    // Si pas actif
    if (!project.isActive) {
      return { key: 'inactive', color: 'bg-neutral-500/20 text-neutral-400' };
    }

    // Si date de fin passée
    if (endDate && endDate < now) {
      return { key: 'ended', color: 'bg-red-500/20 text-red-400' };
    }

    // Objectif atteint
    if (progress >= 100) {
      return { key: 'funded', color: 'bg-green-500/20 text-green-400' };
    }

    // En cours
    return { key: 'active', color: 'bg-green-500/20 text-green-400' };
  };

  const projectStatus = getProjectStatus();
  const isLive = projectStatus.key === 'active';

  // Temps restant - VRAIE logique
  const formatTime = () => {
    if (!project.endDate) return t('projectDetails.time.notSpecified');

    const endDate = new Date(project.endDate);
    const now = new Date();
    const diff = endDate - now;

    if (diff <= 0 || project.isFinalized || !project.isActive) {
      return t('projectDetails.time.ended');
    }

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);

    if (days > 0) return `${days}${t('projectDetails.time.days')} ${hours}${t('projectDetails.time.hours')}`;
    return `${hours}${t('projectDetails.time.hours')}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(project.address || project.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setShowProjectDetails(false);
    onClose();
  };

  return (
    <Dialog open={showProjectDetails} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-3xl w-[95vw] max-h-[90vh] p-0 bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden"
        aria-describedby="project-description"
      >
        <VisuallyHidden>
          <DialogTitle>{project.name}</DialogTitle>
          <DialogDescription id="project-description">{t('projectDetails.description', { name: project.name })}</DialogDescription>
        </VisuallyHidden>

        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b border-neutral-800">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Badges - VRAIS STATUTS */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge className={`${projectStatus.color} border-0 px-2 py-0.5 text-xs font-semibold`}>
                  {isLive && <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1 animate-pulse" />}
                  {projectStatus.key === 'active' && t('projectDetails.status.active')}
                  {projectStatus.key === 'funded' && t('projectDetails.status.funded')}
                  {projectStatus.key === 'ended' && t('projectDetails.status.ended')}
                  {projectStatus.key === 'finalized' && t('projectDetails.status.finalized')}
                  {projectStatus.key === 'inactive' && t('projectDetails.status.inactive')}
                </Badge>
                <Badge className="bg-lime-500/20 text-lime-400 border-0 px-2 py-0.5 text-xs">
                  {progress.toFixed(0)}% {t('projectDetails.funded')}
                </Badge>
                {project.isCertified && (
                  <Badge className="bg-blue-500/20 text-blue-400 border-0 px-2 py-0.5 text-xs">
                    <Shield className="w-3 h-3 mr-1" />{t('projectDetails.verified')}
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-bold text-white truncate">{project.name}</h2>

              {/* Meta */}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="outline" className="bg-neutral-800 border-neutral-700 text-neutral-400 text-xs">
                  {project.sector || project.category || t('projectDetails.defaultSector')}
                </Badge>
                <button onClick={handleCopy} className="flex items-center gap-1 text-neutral-500 hover:text-white text-xs font-mono">
                  {(project.address || project.id)?.slice(0, 8)}...{(project.address || project.id)?.slice(-4)}
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button variant="ghost" size="icon" onClick={() => setIsFavorite(!isFavorite)} className="w-8 h-8 rounded-lg hover:bg-neutral-800">
                <Star className={`w-4 h-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-500'}`} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(window.location.href)} className="w-8 h-8 rounded-lg hover:bg-neutral-800">
                <Share2 className="w-4 h-4 text-neutral-500" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleClose} className="w-8 h-8 rounded-lg hover:bg-red-500/20 hover:text-red-400">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-4 gap-2 px-4 sm:px-5 py-3 bg-neutral-900/50 border-b border-neutral-800">
          {[
            { icon: Target, label: t('projectDetails.stats.goal'), value: `${parseFloat(project.goal).toFixed(2)} Ξ` },
            { icon: TrendingUp, label: t('projectDetails.stats.raised'), value: `${parseFloat(project.raised).toFixed(2)} Ξ` },
            { icon: Users, label: t('projectDetails.stats.investors'), value: project.investors || project.sharesSold || transactions.length || 0 },
            { icon: Clock, label: t('projectDetails.stats.time'), value: formatTime() },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <s.icon className="w-3 h-3 text-lime-500" />
                <span className="text-[10px] text-neutral-500 hidden sm:inline">{s.label}</span>
              </div>
              <p className="text-sm sm:text-base font-bold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* CONTENT SCROLL */}
        <div className="overflow-y-auto max-h-[60vh]">

          {/* TABS */}
          <div className="flex gap-1 px-4 sm:px-5 py-3 border-b border-neutral-800 sticky top-0 bg-neutral-950 z-10">
            {[
              { id: 'overview', label: t('projectDetails.tabs.overview'), icon: Info },
              { id: 'invest', label: t('projectDetails.tabs.invest'), icon: Coins },
              { id: 'history', label: t('projectDetails.tabs.history'), icon: History },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-lime-500/20 text-lime-400' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* TAB CONTENT */}
          <div className="p-4 sm:p-5">

            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-5">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-400">{t('projectDetails.progress')}</span>
                    <span className="font-bold text-white">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="h-3 bg-neutral-800 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${progress >= 100 ? 'bg-green-500' : 'bg-gradient-to-r from-lime-500 to-green-500'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progress, 100)}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-2">{t('projectDetails.descriptionTitle')}</h3>
                  <p className="text-neutral-300 text-sm leading-relaxed">
                    {projectData.description || project.description || t('projectDetails.noDescription')}
                  </p>
                </div>

                {/* Links */}
                {(projectData.socials || projectData.ipfs?.socials) && (
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-2">{t('projectDetails.links')}</h3>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'website', icon: Globe, label: t('projectDetails.social.website') },
                        { key: 'twitter', icon: Twitter, label: 'Twitter' },
                        { key: 'discord', icon: MessageCircle, label: 'Discord' },
                        { key: 'github', icon: Github, label: 'GitHub' },
                      ].map(({ key, icon: Icon, label }) => {
                        const url = projectData.socials?.[key] || projectData.ipfs?.socials?.[key];
                        if (!url) return null;
                        return (
                          <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm">
                            <Icon className="w-4 h-4" />{label}<ExternalLink className="w-3 h-3" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Contract */}
                <div>
                  <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-2">{t('projectDetails.contract')}</h3>
                  <div className="p-3 rounded-lg bg-neutral-800/50 border border-neutral-700 flex items-center justify-between">
                    <span className="text-xs text-neutral-500">{t('projectDetails.contractAddress')}</span>
                    <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs font-mono text-neutral-300 hover:text-lime-400">
                      {(project.address || project.id)?.slice(0, 14)}...{(project.address || project.id)?.slice(-8)}
                      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* INVEST */}
            {activeTab === 'invest' && (
              <div className="max-w-sm mx-auto space-y-4">
                {/* Price */}
                <div className="text-center">
                  <span className="text-xs text-neutral-500">{t('projectDetails.pricePerShare')}</span>
                  <div className="text-3xl font-bold text-white mt-1">{sharePrice.toFixed(4)} <span className="text-neutral-500 text-lg">Ξ</span></div>
                </div>

                {/* Quantity */}
                <div>
                  <span className="text-xs text-neutral-500 block mb-2">{t('projectDetails.numberOfShares')}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShareCount(Math.max(1, shareCount - 1))}
                      className="w-12 h-12 rounded-xl bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-white text-lg font-bold">−</button>
                    <input type="number" min="1" value={shareCount}
                      onChange={(e) => setShareCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="flex-1 h-12 text-center text-xl font-bold bg-neutral-800 border-0 rounded-xl text-white" />
                    <button onClick={() => setShareCount(shareCount + 1)}
                      className="w-12 h-12 rounded-xl bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-white text-lg font-bold">+</button>
                  </div>
                </div>

                {/* Total */}
                <div className="p-4 rounded-xl bg-lime-500/10 border border-lime-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">{t('projectDetails.total')}</span>
                    <span className="text-2xl font-bold text-white">{totalCost} Ξ</span>
                  </div>
                </div>

                {/* Buy Button - disabled if not active */}
                <Button
                  className="w-full py-4 rounded-xl bg-lime-500 hover:bg-lime-600 text-black font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!isLive || !userAddress}
                >
                  <Wallet className="w-5 h-5 mr-2" />{t('projectDetails.investNow')}
                </Button>

                {!userAddress && <p className="text-xs text-center text-neutral-500">{t('projectDetails.connectWallet')}</p>}
                {!isLive && <p className="text-xs text-center text-red-400">{t('projectDetails.campaignNotActive')}</p>}
              </div>
            )}

            {/* HISTORY */}
            {activeTab === 'history' && (
              <div>
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="w-10 h-10 text-neutral-700 mx-auto mb-2" />
                    <p className="text-neutral-500 text-sm">{t('projectDetails.noTransactions')}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {transactions.slice(0, 10).map((tx, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/50 border border-neutral-700">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-lime-500/20 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-lime-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {tx.shares || tx.amount || 1} {t('projectDetails.share')}{(tx.shares || tx.amount || 1) > 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-neutral-500 font-mono">{tx.buyer?.slice(0, 6)}...{tx.buyer?.slice(-4)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-white">{tx.value || tx.eth_value || '0'} Ξ</p>
                          <p className="text-xs text-neutral-500">{tx.timestamp ? new Date(tx.timestamp).toLocaleDateString() : t('projectDetails.recent')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
