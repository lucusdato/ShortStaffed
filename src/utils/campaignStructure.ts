import { v4 as uuidv4 } from 'uuid';
import { BlockingChartRow } from './blockingChartParser';
import { CampaignShell, TargetingLayer, CreativeShell, UTMParameters } from '@/types';

export const convertBlockingChartToCampaignShells = (rows: BlockingChartRow[]): CampaignShell[] => {
  return rows.map(row => ({
    id: uuidv4(),
    name: generateCampaignShellName(row),
    accuticsCampaignName: generateAccuticsCampaignName(row),
    channel: row.channel,
    platform: row.platform,
    objective: row.objective,
    placements: row.placements,
    impressions: row.impressionsGrps,
    workingMediaBudget: row.totalWorkingMediaBudget,
    category: row.category || 'uncategorized',
    targetingLayers: createInitialTargetingLayer(row)
  }));
};

const generateCampaignShellName = (row: BlockingChartRow): string => {
  const channel = row.channel || '';
  const tactic = row.tactic || '';
  
  return `${channel} ${tactic}`.trim();
};

const generateAccuticsCampaignName = (row: BlockingChartRow): string => {
  const channel = row.channel || '';
  const tactic = row.tactic || '';
  
  // Create a clean Accutics-style name
  return `${channel} ${tactic}`.replace(/\s+/g, ' ').trim();
};

const createInitialTargetingLayer = (row: BlockingChartRow): TargetingLayer[] => {
  // Extract audience name from the demoTargeting field if available
  const audienceName = row.demoTargeting || '';
  
  return [createTargetingLayer(audienceName, '')];
};

export const createTargetingLayer = (audienceName: string, accuticsLineItem: string): TargetingLayer => ({
  id: uuidv4(),
  audienceName,
  accuticsLineItem,
  creatives: []
});

export const createCreativeShell = (
  name: string,
  landingPage: string,
  assetLink?: string,
  youtubeUrl?: string,
  accuticsTaxonomyName?: string
): CreativeShell => {
  const utmParameters: UTMParameters = {
    term: undefined
  };

  return {
    id: uuidv4(),
    name,
    accuticsTaxonomyName: accuticsTaxonomyName || '',
    assetLink,
    youtubeUrl,
    landingPage,
    landingPageWithUTM: generateUTMUrl(landingPage, utmParameters),
    utmParameters
  };
};

export const generateUTMUrl = (baseUrl: string, params: UTMParameters): string => {
  if (!baseUrl || !baseUrl.trim()) return '';
  
  try {
    const url = new URL(baseUrl);
    const searchParams = new URLSearchParams(url.search);
    
    if (params.term) searchParams.set('utm_term', params.term);
    
    url.search = searchParams.toString();
    return url.toString();
  } catch {
    // If URL is invalid, just return the original
    return baseUrl;
  }
};

export const duplicateTargetingLayer = (layer: TargetingLayer, newAudienceName?: string): TargetingLayer => ({
  ...layer,
  id: uuidv4(),
  audienceName: newAudienceName || layer.audienceName,
  creatives: layer.creatives.map(creative => ({
    ...creative,
    id: uuidv4()
  }))
});

export const duplicateCreativeShell = (creative: CreativeShell, newName?: string): CreativeShell => ({
  ...creative,
  id: uuidv4(),
  name: newName || creative.name,
  utmParameters: {
    ...creative.utmParameters
  }
});

// Storage functions for campaign shells
const CAMPAIGN_SHELLS_KEY = 'media-planning-campaign-shells';

export const saveCampaignShells = (shells: CampaignShell[]): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CAMPAIGN_SHELLS_KEY, JSON.stringify(shells));
  }
};

export const loadCampaignShells = (): CampaignShell[] => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(CAMPAIGN_SHELLS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading campaign shells from localStorage:', error);
      return [];
    }
  }
  return [];
};

export const saveCampaignShell = (shell: CampaignShell): void => {
  const shells = loadCampaignShells();
  const existingIndex = shells.findIndex(s => s.id === shell.id);
  
  if (existingIndex >= 0) {
    shells[existingIndex] = shell;
  } else {
    shells.push(shell);
  }
  
  saveCampaignShells(shells);
};

export const deleteCampaignShell = (shellId: string): void => {
  const shells = loadCampaignShells();
  const filtered = shells.filter(s => s.id !== shellId);
  saveCampaignShells(filtered);
};
