import { Campaign } from '@/types';

const CAMPAIGNS_KEY = 'media-planning-campaigns';

export const saveCampaigns = (campaigns: Campaign[]): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));
  }
};

export const loadCampaigns = (): Campaign[] => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(CAMPAIGNS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading campaigns from localStorage:', error);
      return [];
    }
  }
  return [];
};

export const saveCampaign = (campaign: Campaign): void => {
  const campaigns = loadCampaigns();
  const existingIndex = campaigns.findIndex(c => c.id === campaign.id);
  
  if (existingIndex >= 0) {
    campaigns[existingIndex] = campaign;
  } else {
    campaigns.push(campaign);
  }
  
  saveCampaigns(campaigns);
};

export const deleteCampaign = (campaignId: string): void => {
  const campaigns = loadCampaigns();
  const filtered = campaigns.filter(c => c.id !== campaignId);
  saveCampaigns(filtered);
};

export const getCampaign = (campaignId: string): Campaign | null => {
  const campaigns = loadCampaigns();
  return campaigns.find(c => c.id === campaignId) || null;
};
