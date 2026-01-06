"use client";

import { motion } from "framer-motion";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ExternalLink, Users, Clock, CheckCircle, Zap, Star, Diamond, Wallet, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { apiManager } from '@/lib/services/api-manager';
import { PromotionService } from '@/lib/services/promotion-service';
import { useTranslation } from '@/hooks/useLanguage';

// Simple deterministic gradient generator for fallback avatars
const getGradient = (address) => {
  const colors = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-emerald-500 to-green-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-violet-500'
  ];
  if (!address) return colors[0];
  const index = parseInt(address.slice(-1), 16) % colors.length;
  return colors[index];
};

export function ProjectsSection({ darkMode, isLandingPage = false, onViewProject }) {
  const { t } = useTranslation();
  const [address, setAddress] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoPlayRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) setAddress(accounts[0]);
        })
        .catch(console.error);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const campaignAddresses = await apiManager.getAllCampaigns();
      const activePromotions = await PromotionService.getActivePromotions();
      const projectsData = [];

      for (const campaignAddress of campaignAddresses.slice(0, 20)) {
        try {
          const campaignData = await apiManager.getCampaignData(campaignAddress);
          if (!campaignData) continue;

          const promotion = activePromotions.find(p =>
            p.campaign_address?.toLowerCase() === campaignAddress.toLowerCase()
          );

          const progress = ((parseFloat(campaignData.raised || 0) / parseFloat(campaignData.goal || 1)) * 100) || 0;
          let status = 'active';
          if (progress >= 100) status = 'funded';
          else if (progress >= 80) status = 'nearly_funded';

          projectsData.push({
            address: campaignAddress,
            title: campaignData.name || 'Unknown Venture',
            description: campaignData.description || '',
            raised: parseFloat(campaignData.raised || 0).toFixed(2),
            target: parseFloat(campaignData.goal || 0).toFixed(2),
            backers: campaignData.investorCount || 0,
            timeLeft: campaignData.isActive ? t('campaign.status.ongoing') : t('campaign.status.completed'),
            status: status,
            image: campaignData.logo, // Raw logo URL
            tags: [campaignData.category || 'DeFi'],
            progress: Math.min(progress, 100),
            isActive: campaignData.isActive,
            isCertified: campaignData.isCertified || false, // Assuming this prop exists or defaulting
            promotion: promotion
          });
        } catch (error) {
          console.warn(`Project fetch error ${campaignAddress}:`, error);
        }
      }

      projectsData.sort((a, b) => {
        if (a.promotion && !b.promotion) return -1;
        if (!a.promotion && b.promotion) return 1;
        return b.backers - a.backers;
      });

      setProjects(projectsData.slice(0, 6)); // Show up to 6
    } catch (error) {
      console.error('Projects load error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  // Auto-scroll logic
  useEffect(() => {
    if (projects.length <= 3) return;
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % projects.length);
    }, 5000);
    return () => clearInterval(autoPlayRef.current);
  }, [projects.length]);

  const handleProjectClick = (project) => {
    if (isLandingPage && !address) {
      // Logic to trigger wallet connect usually goes here, but for now we just allow view if desired
      // connectWallet();
    }
    if (onViewProject) onViewProject(project);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "nearly_funded": return "bg-orange-500/10 text-orange-400 border border-orange-500/20";
      case "funded": return "bg-green-500/10 text-green-400 border border-green-500/20";
      default: return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
    }
  };

  if (isLoading) {
    return (
      <section id="projets" className="relative z-10 py-16 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-96 rounded-2xl bg-white/5 animate-pulse border border-white/10" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section id="projets" className="relative z-10 py-24 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">{t('landing.projects.title')}</h2>
            <p className="text-gray-400">{t('landing.projects.subtitle')}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentIndex((prev) => (prev - 1 + projects.length) % projects.length)}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentIndex((prev) => (prev + 1) % projects.length)}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="overflow-hidden">
          <motion.div
            className="flex gap-6"
            animate={{ x: `-${currentIndex * (100 / (window.innerWidth >= 768 ? 3 : 1))}%` }}
            // Note: Simple logic for responsive slide width assumption. Real prod usually uses a library or specific hook for width
            transition={{ duration: 0.6, ease: "easeInOut" }}
            style={{ width: `${projects.length * (window.innerWidth >= 768 ? 33.333 : 100)}%` }} // Approximate container width logic
          >
            {projects.map((project, index) => (
              <div key={project.address} className="w-full md:w-1/3 flex-shrink-0 pr-6 last:pr-0">
                <div className="group relative bg-[#0a0a0f] border border-white/10 rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(101,163,13,0.1)] flex flex-col h-full">
                  {/* Top Banner / Image Area */}
                  <div className={`h-32 w-full bg-gradient-to-br ${getGradient(project.address)} opacity-20 relative`}>
                    {project.isCertified && (
                      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur px-2 py-1 rounded flex items-center gap-1 text-xs text-green-400 border border-green-500/30">
                        <ShieldCheck className="w-3 h-3" /> {t('landing.projects.certified')}
                      </div>
                    )}
                  </div>

                  <div className="p-6 pt-0 flex-1 flex flex-col">
                    {/* Logo / Title */}
                    <div className="relative -mt-8 mb-4">
                      <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getGradient(project.address)} flex items-center justify-center text-2xl shadow-lg border-4 border-[#0a0a0f]`}>
                        {/* Better image handling: if generic or fail, show generic icon */}
                        {(!project.image || project.image.length > 200 || project.image.includes('example')) ? (
                          <span>🏛️</span>
                        ) : (
                          <Image
                            src={project.image}
                            alt={project.title}
                            fill
                            className="object-cover rounded-lg"
                            unoptimized
                            onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerText = '🏛️' }}
                          />
                        )}
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors">{project.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-6 flex-1">
                      {project.description || t('landing.projects.noDescription')}
                    </p>

                    {/* Progress */}
                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-gray-400">{t('landing.projects.raised')}</span>
                        <span className="text-white font-bold">{project.raised} / {project.target} ETH</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${project.progress}%` }} />
                      </div>
                      <div className="text-right text-xs text-primary">{project.progress.toFixed(0)}% {t('landing.projects.funded')}</div>
                    </div>

                    <Button className="w-full bg-white/5 hover:bg-primary hover:text-black text-white border border-white/10 transition-all" onClick={() => handleProjectClick(project)}>
                      {t('landing.projects.viewOpportunity')} <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}