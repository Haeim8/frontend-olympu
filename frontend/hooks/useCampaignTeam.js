import { useState, useEffect, useCallback } from 'react';

/**
 * Hook pour charger les membres de l'équipe d'une campagne
 * @param {string} campaignAddress - Adresse de la campagne
 * @returns {object} - { teamMembers, loading, error, refresh }
 */
export function useCampaignTeam(campaignAddress) {
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadTeam = useCallback(async () => {
        if (!campaignAddress) {
            setTeamMembers([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/team?address=${campaignAddress.toLowerCase()}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            setTeamMembers(data.teamMembers || []);
        } catch (err) {
            console.error('[useCampaignTeam] Error:', err);
            setError(err.message);
            setTeamMembers([]);
        } finally {
            setLoading(false);
        }
    }, [campaignAddress]);

    useEffect(() => {
        loadTeam();
    }, [loadTeam]);

    return {
        teamMembers,
        loading,
        error,
        refresh: loadTeam
    };
}

export default useCampaignTeam;
