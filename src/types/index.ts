export interface UTMParameters {
  term?: string;
}

export interface CreativeShell {
  id: string;
  name: string;
  accuticsTaxonomyName: string;
  assetLink?: string;
  youtubeUrl?: string;
  landingPage: string;
  landingPageWithUTM: string;
  utmParameters: UTMParameters;
}

export interface TargetingLayer {
  id: string;
  audienceName: string;
  accuticsLineItem: string;
  creatives: CreativeShell[];
}

export interface CampaignShell {
  id: string;
  name: string;
  accuticsCampaignName: string;
  channel: string;
  platform: string;
  objective: string;
  placements: string;
  impressions: string;
  workingMediaBudget: string;
  category: 'brand_say_digital' | 'brand_say_social' | 'other_say_social' | 'uncategorized';
  targetingLayers: TargetingLayer[];
  startDate?: string;
  endDate?: string;
}

// Legacy types for backward compatibility
export interface Creative {
  id: string;
  name: string;
  assetType: string;
  landingPage: string;
  utmParameters: UTMParameters;
}

export interface AdSet {
  id: string;
  name: string;
  budget: number;
  targeting: string;
  creatives: Creative[];
}

export interface Campaign {
  id: string;
  name: string;
  client: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  adSets: AdSet[];
}

export interface ExportFormat {
  type: 'csv' | 'excel';
  platform?: 'dv360' | 'facebook' | 'google' | 'generic';
}
