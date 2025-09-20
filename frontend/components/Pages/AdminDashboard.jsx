"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { apiManager } from '@/lib/services/api-manager';
import { supabase } from '@/lib/supabase/client';
import { useTranslation } from '@/hooks/useLanguage';

export default function AdminDashboard() {
  const { t } = useTranslation();
  // Récupérer l'adresse du wallet (comme Campaign.jsx)
  const [address, setAddress] = useState(null);
  
  useEffect(() => {
    // Récupérer l'adresse du wallet connecté
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) {
            setAddress(accounts[0]);
          }
        })
        .catch(console.error);
    }
  }, []);
  
  const [promotions, setPromotions] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activePromotions: 0,
    totalPromotions: 0
  });
  const [loading, setLoading] = useState(false);

  // Adresse treasury autorisée (à remplacer par la vraie adresse)
  const TREASURY_ADDRESS = '0x...'; // Remplacer par l'adresse treasury

  const isAuthorized = address && address.toLowerCase() === TREASURY_ADDRESS.toLowerCase();

  const fetchPromotions = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('campaign_promotions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromotions(data || []);
    } catch (error) {
      console.error(t('admin.error.promotions'), error);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const fetchStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_promotions')
        .select('eth_amount, is_active');

      if (error) throw error;

      const totalRevenue = data?.reduce((sum, promo) => sum + parseFloat(promo.eth_amount || 0), 0) || 0;
      const activePromotions = data?.filter(p => p.is_active)?.length || 0;
      const totalPromotions = data?.length || 0;

      setStats({
        totalRevenue,
        activePromotions,
        totalPromotions
      });
    } catch (error) {
      console.error(t('admin.error.stats'), error);
    }
  }, [t]);

  useEffect(() => {
    if (isAuthorized) {
      fetchPromotions();
      fetchStats();
    }
  }, [isAuthorized, fetchPromotions, fetchStats]);

  const formatBoostType = (type) => {
    const types = {
      0: { name: 'FEATURED', color: 'text-blue-600', duration: '24h' },
      1: { name: 'TRENDING', color: 'text-yellow-600', duration: '7j' },
      2: { name: 'SPOTLIGHT', color: 'text-purple-600', duration: '30j' }
    };
    return types[type] || { name: 'UNKNOWN', color: 'text-gray-600', duration: '?' };
  };

  const formatAddress = (address) => {
    return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
  };

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAddress(accounts[0]);
        }
      } catch (error) {
        console.error('Erreur connexion wallet:', error);
      }
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
  };

  if (!address) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4 text-center">Admin Dashboard</h1>
          <p className="text-gray-600 mb-6 text-center">
            Connectez votre wallet treasury
          </p>
          <button
            onClick={connectWallet}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Connecter Wallet
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4 text-center text-red-600">Accès Refusé</h1>
          <p className="text-gray-600 mb-4 text-center">
            Wallet: {formatAddress(address)}
          </p>
          <p className="text-gray-600 mb-6 text-center">
            Seul le treasury peut accéder
          </p>
          <button
            onClick={disconnectWallet}
            className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
          >
            Déconnecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {formatAddress(address)}
              </span>
              <button
                onClick={disconnectWallet}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Déconnecter
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <span className="text-green-600 text-xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Revenus Totaux</p>
                <p className="text-2xl font-bold">{stats.totalRevenue.toFixed(4)} ETH</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <span className="text-blue-600 text-xl">🔥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Promotions Actives</p>
                <p className="text-2xl font-bold">{stats.activePromotions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <span className="text-purple-600 text-xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Promotions</p>
                <p className="text-2xl font-bold">{stats.totalPromotions}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Historique Promotions</h2>
              <button
                onClick={fetchPromotions}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Chargement...' : 'Actualiser'}
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campagne</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Créateur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Round</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {promotions.map((promo, index) => {
                  const boostInfo = formatBoostType(promo.boost_type);
                  return (
                    <tr key={index}>
                      <td className="px-6 py-4 text-sm">{formatAddress(promo.campaign_address)}</td>
                      <td className="px-6 py-4 text-sm">{formatAddress(promo.creator)}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={boostInfo.color}>
                          {boostInfo.name} ({boostInfo.duration})
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">{parseFloat(promo.eth_amount || 0).toFixed(4)} ETH</td>
                      <td className="px-6 py-4 text-sm">#{promo.round_number}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={promo.is_active ? 'text-green-600' : 'text-gray-500'}>
                          {promo.is_active ? 'ACTIF' : 'EXPIRÉ'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(promo.start_time).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {promotions.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                Aucune promotion trouvée
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
