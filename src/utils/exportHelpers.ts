import { Campaign, CampaignShell } from '@/types';
import * as XLSX from 'xlsx';

export interface ExportRow {
  campaignName: string;
  campaignClient: string;
  campaignStartDate: string;
  campaignEndDate: string;
  campaignBudget: number;
  adSetName: string;
  adSetBudget: number;
  adSetTargeting: string;
  creativeName: string;
  creativeAssetType: string;
  creativeLandingPage: string;
  utmTerm: string;
  fullUTMUrl: string;
}

export const generateExportData = (campaigns: Campaign[]): ExportRow[] => {
  const rows: ExportRow[] = [];
  
  campaigns.forEach(campaign => {
    campaign.adSets.forEach(adSet => {
      adSet.creatives.forEach(creative => {
        const utmParams = new URLSearchParams();
        
        if (creative.utmParameters.term) {
          utmParams.set('utm_term', creative.utmParameters.term);
        }
        
        const fullUTMUrl = utmParams.toString() ? 
          `${creative.landingPage}?${utmParams.toString()}` : 
          creative.landingPage;
        
        rows.push({
          campaignName: campaign.name,
          campaignClient: campaign.client,
          campaignStartDate: campaign.startDate,
          campaignEndDate: campaign.endDate,
          campaignBudget: campaign.totalBudget,
          adSetName: adSet.name,
          adSetBudget: adSet.budget,
          adSetTargeting: adSet.targeting,
          creativeName: creative.name,
          creativeAssetType: creative.assetType,
          creativeLandingPage: creative.landingPage,
          utmTerm: creative.utmParameters.term || '',
          fullUTMUrl,
        });
      });
    });
  });
  
  return rows;
};

export const exportToCSV = (campaigns: Campaign[]): string => {
  const data = generateExportData(campaigns);
  
  if (data.length === 0) {
    return 'No data to export';
  }
  
  const headers = [
    'Campaign Name',
    'Client',
    'Start Date',
    'End Date',
    'Campaign Budget',
    'Ad Set Name',
    'Ad Set Budget',
    'Targeting',
    'Creative Name',
    'Asset Type',
    'Landing Page',
    'UTM Term',
    'Full UTM URL',
  ];
  
  const csvRows = [headers.join(',')];
  
  data.forEach(row => {
    const values = [
      escapeCSVField(row.campaignName),
      escapeCSVField(row.campaignClient),
      row.campaignStartDate,
      row.campaignEndDate,
      row.campaignBudget,
      escapeCSVField(row.adSetName),
      row.adSetBudget,
      escapeCSVField(row.adSetTargeting),
      escapeCSVField(row.creativeName),
      escapeCSVField(row.creativeAssetType),
      escapeCSVField(row.creativeLandingPage),
      escapeCSVField(row.utmTerm),
      escapeCSVField(row.fullUTMUrl),
    ];
    csvRows.push(values.join(','));
  });
  
  return csvRows.join('\n');
};

export const exportToExcel = (campaigns: Campaign[]): ArrayBuffer => {
  const data = generateExportData(campaigns);
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  
  // Create main data worksheet
  const worksheet = XLSX.utils.json_to_sheet(data, {
    header: [
      'campaignName',
      'campaignClient',
      'campaignStartDate',
      'campaignEndDate',
      'campaignBudget',
      'adSetName',
      'adSetBudget',
      'adSetTargeting',
      'creativeName',
      'creativeAssetType',
      'creativeLandingPage',
      'utmTerm',
      'fullUTMUrl',
    ],
  });
  
  // Add headers
  const headers = [
    'Campaign Name',
    'Client',
    'Start Date',
    'End Date',
    'Campaign Budget',
    'Ad Set Name',
    'Ad Set Budget',
    'Targeting',
    'Creative Name',
    'Asset Type',
    'Landing Page',
    'UTM Term',
    'Full UTM URL',
  ];
  
  XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: 'A1' });
  
  // Add the worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Campaign Data');
  
  // Generate Excel file
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
};

const escapeCSVField = (field: string | number): string => {
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const downloadFile = (content: string | ArrayBuffer, filename: string, type: string): void => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// New comprehensive export functions for CampaignShell structure

export interface CampaignShellExportRow {
  campaignName: string;
  accuticsCampaignName: string;
  channel: string;
  platform: string;
  objective: string;
  placements: string;
  impressions: string;
  workingMediaBudget: string;
  category: string;
  targetingLayerId: string;
  audienceName: string;
  accuticsLineItem: string;
  creativeId: string;
  creativeName: string;
  assetLink: string;
  youtubeUrl: string;
  landingPage: string;
  landingPageWithUTM: string;
  utmTerm: string;
}

export const generateCampaignShellExportData = (campaignShells: CampaignShell[]): CampaignShellExportRow[] => {
  const rows: CampaignShellExportRow[] = [];
  
  campaignShells.forEach(shell => {
    if (shell.targetingLayers.length === 0) {
      // If no targeting layers, create a row with just campaign data
      rows.push({
        campaignName: shell.name,
        accuticsCampaignName: shell.accuticsCampaignName,
        channel: shell.channel,
        platform: shell.platform,
        objective: shell.objective,
        placements: shell.placements,
        impressions: shell.impressions,
        workingMediaBudget: shell.workingMediaBudget,
        category: shell.category,
        targetingLayerId: '',
        audienceName: '',
        accuticsLineItem: '',
        creativeId: '',
        creativeName: '',
        assetLink: '',
        youtubeUrl: '',
        landingPage: '',
        landingPageWithUTM: '',
        utmTerm: '',
      });
    } else {
      shell.targetingLayers.forEach(layer => {
        if (layer.creatives.length === 0) {
          // If no creatives, create a row with campaign and targeting data
          rows.push({
            campaignName: shell.name,
            accuticsCampaignName: shell.accuticsCampaignName,
            channel: shell.channel,
            platform: shell.platform,
            objective: shell.objective,
            placements: shell.placements,
            impressions: shell.impressions,
            workingMediaBudget: shell.workingMediaBudget,
            category: shell.category,
            targetingLayerId: layer.id,
            audienceName: layer.audienceName,
            accuticsLineItem: layer.accuticsLineItem,
            creativeId: '',
            creativeName: '',
            assetLink: '',
            youtubeUrl: '',
            landingPage: '',
            landingPageWithUTM: '',
            utmTerm: '',
          });
        } else {
          layer.creatives.forEach(creative => {
            rows.push({
              campaignName: shell.name,
              accuticsCampaignName: shell.accuticsCampaignName,
              channel: shell.channel,
              platform: shell.platform,
              objective: shell.objective,
              placements: shell.placements,
              impressions: shell.impressions,
              workingMediaBudget: shell.workingMediaBudget,
              category: shell.category,
              targetingLayerId: layer.id,
              audienceName: layer.audienceName,
              accuticsLineItem: layer.accuticsLineItem,
              creativeId: creative.id,
              creativeName: creative.name,
              assetLink: creative.assetLink || '',
              youtubeUrl: creative.youtubeUrl || '',
              landingPage: creative.landingPage,
              landingPageWithUTM: creative.landingPageWithUTM,
              utmTerm: creative.utmParameters.term || '',
            });
          });
        }
      });
    }
  });
  
  return rows;
};

export const exportCampaignShellsToExcel = (campaignShells: CampaignShell[]): ArrayBuffer => {
  const data = generateCampaignShellExportData(campaignShells);
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  
  // Create main data worksheet
  const worksheet = XLSX.utils.json_to_sheet(data, {
    header: [
      'campaignName',
      'accuticsCampaignName',
      'channel',
      'platform',
      'objective',
      'placements',
      'impressions',
      'workingMediaBudget',
      'category',
      'targetingLayerId',
      'audienceName',
      'accuticsLineItem',
      'creativeId',
      'creativeName',
      'assetLink',
      'youtubeUrl',
      'landingPage',
      'landingPageWithUTM',
      'utmTerm',
    ],
  });
  
  // Add headers
  const headers = [
    'Campaign Name',
    'Accutics Campaign Name',
    'Channel',
    'Platform',
    'Objective',
    'Placements',
    'Impressions',
    'Working Media Budget',
    'Category',
    'Targeting Layer ID',
    'Audience Name',
    'Accutics Line Item',
    'Creative ID',
    'Creative Name',
    'Asset Link',
    'YouTube URL',
    'Landing Page',
    'Landing Page with UTM',
    'UTM Term',
  ];
  
  XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: 'A1' });
  
  // Set column widths
  const columnWidths = [
    { wch: 25 }, // Campaign Name
    { wch: 25 }, // Accutics Campaign Name
    { wch: 15 }, // Channel
    { wch: 15 }, // Platform
    { wch: 20 }, // Objective
    { wch: 20 }, // Placements
    { wch: 15 }, // Impressions
    { wch: 18 }, // Working Media Budget
    { wch: 20 }, // Category
    { wch: 20 }, // Targeting Layer ID
    { wch: 20 }, // Audience Name
    { wch: 20 }, // Accutics Line Item
    { wch: 15 }, // Creative ID
    { wch: 25 }, // Creative Name
    { wch: 30 }, // Asset Link
    { wch: 30 }, // YouTube URL
    { wch: 30 }, // Landing Page
    { wch: 35 }, // Landing Page with UTM
    { wch: 15 }, // UTM Term
  ];
  
  worksheet['!cols'] = columnWidths;
  
  // Add the worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Campaign Structure');
  
  // Create summary worksheet
  const summaryData = [
    ['Campaign Summary'],
    [''],
    ['Total Campaigns', campaignShells.length],
    ['Total Targeting Layers', campaignShells.reduce((sum, shell) => sum + shell.targetingLayers.length, 0)],
    ['Total Creatives', campaignShells.reduce((sum, shell) => 
      sum + shell.targetingLayers.reduce((layerSum, layer) => layerSum + layer.creatives.length, 0), 0)],
    [''],
    ['Campaign Breakdown'],
    ['Campaign Name', 'Channel', 'Platform', 'Targeting Layers', 'Creatives', 'Budget'],
    ...campaignShells.map(shell => [
      shell.name,
      shell.channel,
      shell.platform,
      shell.targetingLayers.length,
      shell.targetingLayers.reduce((sum, layer) => sum + layer.creatives.length, 0),
      shell.workingMediaBudget
    ])
  ];
  
  const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWorksheet['!cols'] = [
    { wch: 30 }, // Campaign Name
    { wch: 15 }, // Channel
    { wch: 15 }, // Platform
    { wch: 15 }, // Targeting Layers
    { wch: 15 }, // Creatives
    { wch: 18 }, // Budget
  ];
  
  XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');
  
  // Generate Excel file
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
};

export const exportCampaignShellsToCSV = (campaignShells: CampaignShell[]): string => {
  const data = generateCampaignShellExportData(campaignShells);
  
  if (data.length === 0) {
    return 'No data to export';
  }
  
  const headers = [
    'Campaign Name',
    'Accutics Campaign Name',
    'Channel',
    'Platform',
    'Objective',
    'Placements',
    'Impressions',
    'Working Media Budget',
    'Category',
    'Targeting Layer ID',
    'Audience Name',
    'Accutics Line Item',
    'Creative ID',
    'Creative Name',
    'Asset Link',
    'YouTube URL',
    'Landing Page',
    'Landing Page with UTM',
    'UTM Term',
  ];
  
  const csvRows = [headers.join(',')];
  
  data.forEach(row => {
    const values = [
      escapeCSVField(row.campaignName),
      escapeCSVField(row.accuticsCampaignName),
      escapeCSVField(row.channel),
      escapeCSVField(row.platform),
      escapeCSVField(row.objective),
      escapeCSVField(row.placements),
      escapeCSVField(row.impressions),
      escapeCSVField(row.workingMediaBudget),
      escapeCSVField(row.category),
      escapeCSVField(row.targetingLayerId),
      escapeCSVField(row.audienceName),
      escapeCSVField(row.accuticsLineItem),
      escapeCSVField(row.creativeId),
      escapeCSVField(row.creativeName),
      escapeCSVField(row.assetLink),
      escapeCSVField(row.youtubeUrl),
      escapeCSVField(row.landingPage),
      escapeCSVField(row.landingPageWithUTM),
      escapeCSVField(row.utmTerm),
    ];
    csvRows.push(values.join(','));
  });
  
  return csvRows.join('\n');
};
