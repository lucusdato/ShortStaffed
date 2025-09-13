import { UTMParameters } from '@/types';

export const generateCampaignName = (client: string, campaignType: string, startDate: string): string => {
  const date = new Date(startDate);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${client}_${campaignType}_${month}${year}`;
};

export const generateAdSetName = (campaignName: string, targeting: string, adSetType: string): string => {
  const cleanTargeting = targeting.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
  return `${campaignName}_${adSetType}_${cleanTargeting}`;
};

export const generateCreativeName = (campaignName: string, assetType: string, dimensions?: string): string => {
  const cleanAssetType = assetType.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
  const suffix = dimensions ? `_${dimensions}` : '';
  return `${campaignName}_${cleanAssetType}${suffix}`;
};

export const generateUTMParameters = (): UTMParameters => {
  return {
    term: undefined
  };
};


export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
