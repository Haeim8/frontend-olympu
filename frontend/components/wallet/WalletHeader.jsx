"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from '@/hooks/useLanguage';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  RefreshCw,
  Download,
  Copy,
  Check,
  TrendingUp,
} from 'lucide-react';

export default function WalletHeader({
  address,
  onRefresh,
  isLoading,
  walletInfo
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getWalletStatus = () => {
    const totalValue = parseFloat(walletInfo.totalInvested);
    if (totalValue === 0) return { label: t('wallet.status.new', 'Nouveau'), color: 'bg-blue-500' };
    if (totalValue < 1) return { label: t('wallet.status.beginner', 'Débutant'), color: 'bg-cyan-500' };
    if (totalValue < 10) return { label: t('wallet.status.active', 'Actif'), color: 'bg-green-500' };
    return { label: t('wallet.status.investor', 'Investisseur'), color: 'bg-amber-500' };
  };

  const walletStatus = getWalletStatus();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-card border border-border shadow-xl">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      <div className="relative p-6 sm:p-8">
        {/* Top Row: Status badges */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-xs font-bold text-green-500 uppercase tracking-wider">
              {t('wallet.online', 'Online')}
            </span>
          </div>

          <Badge className={`${walletStatus.color} hover:${walletStatus.color} text-white border-none shadow-lg shadow-${walletStatus.color}/20 px-3 py-1 text-xs font-bold uppercase tracking-wider`}>
            {walletStatus.label}
          </Badge>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">

          {/* Left Side */}
          <div className="space-y-4 flex-1">
            {/* Title */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                {t('wallet.header.title', 'Mon Portefeuille')}
              </h1>
              <p className="text-muted-foreground font-medium mt-1">
                {t('wallet.header.subtitle', 'Gérez vos actifs et suivez vos performances.')}
              </p>
            </div>

            {/* Wallet Address */}
            <div className="inline-flex items-center gap-3 px-4 py-3 rounded-2xl bg-muted/30 border border-border/50 backdrop-blur-md">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">
                  {t('wallet.connectedAddress', 'Adresse Connectée')}
                </p>
                <button
                  onClick={() => copyToClipboard(address)}
                  className="group flex items-center gap-2 font-mono text-sm font-bold text-foreground hover:text-primary transition-colors"
                >
                  <span>{formatAddress(address)}</span>
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.span
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="copy"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Copy className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </div>
          </div>

          {/* Right Side - Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={onRefresh}
              disabled={isLoading}
              variant="outline"
              className="group rounded-xl border-border bg-card hover:bg-muted text-foreground font-semibold"
            >
              <RefreshCw className={`h-4 w-4 mr-2 transition-transform duration-500 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
              {t('wallet.refresh', 'Actualiser')}
            </Button>

            <Button className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 font-bold">
              <Download className="h-4 w-4 mr-2" />
              {t('wallet.export', 'Exporter CSV')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}