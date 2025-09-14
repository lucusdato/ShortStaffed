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
    targetingLayers: createInitialTargetingLayer(row),
    startDate: row.startDate,
    endDate: row.endDate
  }));
};

const generateCampaignShellName = (row: BlockingChartRow): string => {
  const channel = row.channel || '';
  const tactic = row.tactic || '';
  const platform = row.platform || '';
  
  // Check if platform is already included in the tactic name to avoid duplication
  const tacticLower = tactic.toLowerCase();
  const platformLower = platform.toLowerCase();
  
  if (platformLower && tacticLower.includes(platformLower)) {
    // Platform is already in tactic, just use tactic
    return tactic.trim();
  } else {
    // Platform not in tactic, combine channel and tactic
    return `${channel} ${tactic}`.trim();
  }
};

const generateAccuticsCampaignName = (row: BlockingChartRow): string => {
  // Return empty string for user input in Taxonomy Generator
  return '';
};

const createInitialTargetingLayer = (row: BlockingChartRow): TargetingLayer[] => {
  // Create audience name - prefer demoTargeting if it contains valid audience data
  let audienceName = '';
  
  // Check if demoTargeting contains valid audience information (not just numbers or CPM data)
  const demoTargeting = row.demoTargeting?.trim() || '';
  const isNumericValue = /^\d+\.?\d*$/.test(demoTargeting);
  const isCpmData = demoTargeting.includes('$') || demoTargeting.includes('CPM') || demoTargeting.includes('CPP');
  const hasValidAudienceInfo = demoTargeting && 
    !isNumericValue && 
    !isCpmData &&
    demoTargeting.length > 2;
  
  console.log(`\n=== AUDIENCE NAME GENERATION ===`);
  console.log(`Row: ${row.channel} ${row.tactic} ${row.platform}`);
  console.log(`Raw demoTargeting: "${row.demoTargeting}"`);
  console.log(`Cleaned demoTargeting: "${demoTargeting}"`);
  console.log(`Is numeric: ${isNumericValue}`);
  console.log(`Is CPM data: ${isCpmData}`);
  console.log(`Has valid audience info: ${hasValidAudienceInfo}`);
  
  if (hasValidAudienceInfo) {
    // Use demoTargeting as is (like "Flavour Seekers")
    audienceName = demoTargeting;
    console.log(`✅ Using audience name: "${audienceName}"`);
  } else {
    // Leave blank for user to fill in
    audienceName = '';
    console.log(`❌ No valid audience info, leaving blank`);
  }
  console.log(`Final audience name: "${audienceName}"`);
  console.log(`=== END AUDIENCE NAME GENERATION ===\n`);
  
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
