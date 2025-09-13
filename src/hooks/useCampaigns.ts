'use client';

import { useState, useEffect } from 'react';
import { Campaign } from '@/types';
import { loadCampaigns, saveCampaign, deleteCampaign } from '@/utils/storage';

export const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadedCampaigns = loadCampaigns();
    setCampaigns(loadedCampaigns);
    setLoading(false);
  }, []);

  const addCampaign = (campaign: Campaign) => {
    saveCampaign(campaign);
    setCampaigns(prev => {
      const existingIndex = prev.findIndex(c => c.id === campaign.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = campaign;
        return updated;
      }
      return [...prev, campaign];
    });
  };

  const updateCampaign = (campaign: Campaign) => {
    addCampaign(campaign); // Same logic as add
  };

  const removeCampaign = (campaignId: string) => {
    deleteCampaign(campaignId);
    setCampaigns(prev => prev.filter(c => c.id !== campaignId));
  };

  const getCampaignById = (campaignId: string): Campaign | undefined => {
    return campaigns.find(c => c.id === campaignId);
  };

  return {
    campaigns,
    loading,
    addCampaign,
    updateCampaign,
    removeCampaign,
    getCampaignById,
  };
};
