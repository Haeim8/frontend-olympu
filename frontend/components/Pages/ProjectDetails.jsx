"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiManager } from '@/lib/services/api-manager';
import { useTranslation } from '@/hooks/useLanguage';
import { useToast } from '@/contexts/ToastContext';
import { useCampaignDocuments } from '@/hooks/useCampaignDocuments';
import { useCampaignTeam } from '@/hooks/useCampaignTeam';
import { motion } from 'framer-motion';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import {
  X, Share2, Star, TrendingUp, Users, Clock, Target, Shield,
  ExternalLink, Copy, Check, FileText, History, Wallet,
  Zap, Globe, Twitter, MessageCircle, Github, Info, Coins, CheckCircle, Loader2
} from 'lucide-react';
import ShareSelector from '@/components/project/ShareSelector';

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

export default function ProjectDetails({ selectedProject, onClose, toggleFavorite, isFavorite }) {
  const { t } = useTranslation();
  const { showError, showSuccess } = useToast();
  const project = { ...DEFAULT_PROJECT, ...selectedProject };
  const [showProjectDetails, setShowProjectDetails] = useState(true);
  const isFav = isFavorite ? isFavorite(project.address || project.id) : false;
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectData, setProjectData] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [shareCount, setShareCount] = useState(1);
  const [copied, setCopied] = useState(false);
  const [userAddress, setUserAddress] = useState(null);

  // Charger les documents depuis Supabase
  const { documents: campaignDocuments } = useCampaignDocuments(project?.id || project?.address);

  // Charger les team members depuis Supabase
  const { teamMembers } = useCampaignTeam(project?.id || project?.address);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => { if (accounts.length > 0) setUserAddress(accounts[0]); })
        .catch(console.error);
    }
  }, []);

  const [isBuying, setIsBuying] = useState(false);
  const [buyError, setBuyError] = useState(null);
  const [buySuccess, setBuySuccess] = useState(false);

  useEffect(() => { setShowProjectDetails(!!selectedProject); }, [selectedProject]);

  const loadProjectData = useCallback(async () => {
    if (!project?.id) return;
    try {
      setIsLoading(true);
      const [projectRes, txRes] = await Promise.all([
        fetch(`/api/campaigns/${project.id}`),
        fetch(`/api/campaigns/${project.id}/transactions`).then(r => r.json()).catch(() => ({ transactions: [] }))
      ]);

      const projectJson = await projectRes.json();
      const txData = txRes || { transactions: [] };

      if (projectJson.campaign) {
        setProjectData(projectJson.campaign);
      }
      if (txData.transactions) setTransactions(txData.transactions);
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

  const handleBuyShares = async (count) => {
    if (!project?.address || !userAddress) return;

    setIsBuying(true);
    setBuyError(null);
    setBuySuccess(false);

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const result = await apiManager.buyShares(project.address, count, signer);

      if (result.success) {
        setBuySuccess(true);
        // Recharger les données pour mettre à jour Raised/Progress
        loadProjectData();
      }
    } catch (err) {
      showError(err);
      setBuyError(err.reason || err.message || t('projectDetails.buyError'));
    } finally {
      setIsBuying(false);
    }
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
              <Button variant="ghost" size="icon" onClick={() => toggleFavorite && toggleFavorite(project.address || project.id)} className="w-8 h-8 rounded-lg hover:bg-neutral-800">
                <Star className={`w-4 h-4 ${isFav ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-500'}`} />
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

                {/* Documents */}
                {campaignDocuments && campaignDocuments.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-2">{t('projectDetails.documents', 'Documents')}</h3>
                    <div className="space-y-2">
                      {campaignDocuments.map((doc) => (
                        <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm">
                          <FileText className="w-4 h-4" />
                          <span className="flex-1">{doc.name}</span>
                          <Badge className="text-xs">{doc.category}</Badge>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Links */}
                {(projectData.twitter || projectData.discord || projectData.website || projectData.github || projectData.telegram || projectData.farcaster || projectData.medium || projectData.base) && (
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-2">{t('projectDetails.links')}</h3>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'website', icon: Globe, label: t('projectDetails.social.website') },
                        { key: 'twitter', icon: Twitter, label: 'Twitter' },
                        { key: 'discord', icon: MessageCircle, label: 'Discord' },
                        { key: 'github', icon: Github, label: 'GitHub' },
                        { key: 'telegram', icon: MessageCircle, label: 'Telegram' },
                        { key: 'farcaster', icon: Zap, label: 'Farcaster' },
                        { key: 'medium', icon: FileText, label: 'Medium' },
                        { key: 'base', icon: Zap, label: 'Base' },
                      ].map(({ key, icon: Icon, label }) => {
                        const url = projectData[key];
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

                {/* Team Members */}
                {teamMembers && teamMembers.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-2">{t('projectDetails.team', 'Équipe')}</h3>
                    <div className="space-y-2">
                      {teamMembers.map((member, idx) => (
                        <div key={member.id || idx} className="p-3 rounded-lg bg-neutral-800/50 border border-neutral-700">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-medium text-neutral-200">{member.name}</span>
                              {member.role && <span className="text-xs text-neutral-400 ml-2">- {member.role}</span>}
                            </div>
                            <div className="flex gap-2">
                              {member.twitter && (
                                <a href={member.twitter.startsWith('http') ? member.twitter : `https://twitter.com/${member.twitter}`} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-lime-400">
                                  <Twitter className="w-4 h-4" />
                                </a>
                              )}
                              {member.linkedin && (
                                <a href={member.linkedin.startsWith('http') ? member.linkedin : `https://linkedin.com/in/${member.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-lime-400">
                                  <Users className="w-4 h-4" />
                                </a>
                              )}
                              {member.github && (
                                <a href={member.github.startsWith('http') ? member.github : `https://github.com/${member.github}`} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-lime-400">
                                  <Github className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
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
              <div className="max-w-xl mx-auto space-y-4">
                {buySuccess ? (
                  <div className="text-center py-8 space-y-4">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white">{t('projectDetails.buySuccessTitle', 'Investissement réussi !')}</h3>
                    <p className="text-neutral-400">{t('projectDetails.buySuccessDesc', 'Vos parts ont été enregistrées sur la blockchain.')}</p>
                    <Button onClick={() => setBuySuccess(false)} variant="outline" className="border-neutral-700 text-neutral-400">
                      {t('projectDetails.buyAgain', 'Acheter plus')}
                    </Button>
                  </div>
                ) : (
                  <>
                    <ShareSelector
                      project={project}
                      onBuyShares={handleBuyShares}
                      isLoading={isLoading}
                      buying={isBuying}
                    />

                    {buyError && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center">
                        {buyError}
                      </div>
                    )}

                    {!userAddress && (
                      <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-sm text-center">
                        <Info className="w-4 h-4 inline mr-2" />
                        {t('projectDetails.connectWallet')}
                      </div>
                    )}
                  </>
                )}
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
                  <div className="overflow-x-auto">
                    {/* Table Header */}
                    <div className="grid grid-cols-6 gap-2 text-xs font-medium text-neutral-500 uppercase tracking-wider border-b border-neutral-800 pb-2 mb-2 min-w-[500px]">
                      <div>DATE</div>
                      <div>TYPE</div>
                      <div className="text-right">USD</div>
                      <div className="text-right">SHARES</div>
                      <div className="text-right">MAKER</div>
                      <div className="text-right">TXN</div>
                    </div>

                    {/* Table Rows */}
                    <div className="space-y-1 min-w-[500px]">
                      {transactions.slice(0, 20).map((tx, i) => {
                        // Calculate time ago
                        const now = Date.now();
                        const txTime = tx.timestamp ? new Date(tx.timestamp * 1000 || tx.timestamp).getTime() : now;
                        const diff = Math.floor((now - txTime) / 1000);
                        let timeAgo = 'now';
                        if (diff > 86400) timeAgo = `${Math.floor(diff / 86400)}d`;
                        else if (diff > 3600) timeAgo = `${Math.floor(diff / 3600)}h`;
                        else if (diff > 60) timeAgo = `${Math.floor(diff / 60)}m`;
                        else if (diff > 0) timeAgo = `${diff}s`;

                        // Type styling
                        const isBuy = tx.type === 'purchase' || tx.type === 'buy';
                        const typeColor = isBuy ? 'text-green-400' : 'text-red-400';
                        const typeLabel = isBuy ? 'Buy' : 'Refund';

                        // ETH to USD conversion (rough estimate ~3000 USD/ETH)
                        const ethValue = parseFloat(tx.value || tx.eth_value || tx.amount || 0);
                        const usdValue = (ethValue * 3000).toFixed(2);

                        // Shares
                        const shares = tx.shares || tx.amount || 1;

                        // Maker address
                        const maker = tx.buyer || tx.investor || '';
                        const makerShort = maker ? `${maker.slice(0, 4)}...${maker.slice(-4)}` : '—';

                        // TX hash
                        const txHash = tx.tx_hash || tx.hash || '';
                        const baseScanUrl = `https://sepolia.basescan.org/tx/${txHash}`;

                        return (
                          <div key={txHash || i} className="grid grid-cols-6 gap-2 items-center py-2 text-sm hover:bg-neutral-800/50 rounded transition-colors">
                            <div className="text-neutral-400">{timeAgo}</div>
                            <div className={`font-medium ${typeColor}`}>{typeLabel}</div>
                            <div className="text-right text-white font-medium">${usdValue}</div>
                            <div className="text-right text-neutral-300">{shares}</div>
                            <div className="text-right">
                              <span className="text-neutral-400 font-mono text-xs">{makerShort}</span>
                            </div>
                            <div className="text-right">
                              {txHash ? (
                                <a
                                  href={baseScanUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-lime-400 hover:text-lime-300 transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : '—'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
