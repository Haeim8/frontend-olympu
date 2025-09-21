"use client";

import { useCallback, useEffect, useState } from 'react';
import { apiManager } from '@/lib/services/api-manager';

const EMPTY_STATS = {
  users: 0,
  campaigns: 0,
  totalRaised: 0,
};

export function useLandingStats() {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const addresses = await apiManager.getAllCampaigns();

      if (!Array.isArray(addresses) || addresses.length === 0) {
        setStats(EMPTY_STATS);
        setLoading(false);
        return;
      }

      const summaries = await Promise.all(
        addresses.map(async (address) => {
          try {
            return await apiManager.getCampaignSummary(address, { useCache: true });
          } catch (summaryError) {
            console.warn('Landing stats - summary error:', summaryError);
            return null;
          }
        })
      );

      let totalRaised = 0;
      let totalInvestors = 0;

      summaries.forEach((summary) => {
        if (!summary) return;

        const raisedValue = parseFloat(summary.raised ?? summary.fundsRaised ?? summary.totalRaised ?? '0');
        if (!Number.isNaN(raisedValue)) {
          totalRaised += raisedValue;
        }

        const investorCount = Number(summary.investors ?? summary.investorCount ?? 0);
        if (Number.isFinite(investorCount)) {
          totalInvestors += investorCount;
        }
      });

      setStats({
        users: totalInvestors,
        campaigns: addresses.length,
        totalRaised,
      });
    } catch (err) {
      console.error('Landing stats load failed:', err);
      setError(err);
      setStats(EMPTY_STATS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    stats,
    loading,
    error,
    refetch: load,
  };
}

export default useLandingStats;
