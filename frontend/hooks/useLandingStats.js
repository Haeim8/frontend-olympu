"use client";

import { useCallback, useEffect, useState } from 'react';

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
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      const campaigns = data.campaigns || [];

      let totalRaised = 0;
      let totalInvestors = 0;

      campaigns.forEach((campaign) => {
        const raisedValue = parseFloat(campaign.raised ?? '0');
        if (!Number.isNaN(raisedValue)) {
          totalRaised += raisedValue;
        }

        const sharesSold = parseFloat(campaign.shares_sold ?? campaign.sharesSold ?? '0');
        if (Number.isFinite(sharesSold)) {
          totalInvestors += Math.floor(sharesSold / 10);
        }
      });

      setStats({
        users: totalInvestors,
        campaigns: campaigns.length,
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
