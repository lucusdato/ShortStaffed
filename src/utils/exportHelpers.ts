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

// Save/Load functionality for campaign structure builder
export interface CampaignStructureSaveData {
  version: string;
  timestamp: string;
  campaignShells: CampaignShell[];
  metadata: {
    totalCampaigns: number;
    totalTargetingLayers: number;
    totalCreatives: number;
  };
}

export const saveCampaignStructure = (campaignShells: CampaignShell[]): void => {
  const saveData: CampaignStructureSaveData = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    campaignShells,
    metadata: {
      totalCampaigns: campaignShells.length,
      totalTargetingLayers: campaignShells.reduce((sum, shell) => sum + shell.targetingLayers.length, 0),
      totalCreatives: campaignShells.reduce((sum, shell) => 
        sum + shell.targetingLayers.reduce((layerSum, layer) => layerSum + layer.creatives.length, 0), 0)
    }
  };

  const jsonString = JSON.stringify(saveData, null, 2);
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `shortstaffed-campaign-structure-${timestamp}.json`;
  
  downloadFile(jsonString, filename, 'application/json');
};

export const loadCampaignStructure = (file: File): Promise<CampaignShell[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const jsonString = event.target?.result as string;
        const saveData: CampaignStructureSaveData = JSON.parse(jsonString);
        
        // Validate the save data structure
        if (!saveData.version || !saveData.campaignShells || !Array.isArray(saveData.campaignShells)) {
          throw new Error('Invalid save file format');
        }
        
        // Validate each campaign shell has required properties
        const validatedShells = saveData.campaignShells.filter(shell => 
          shell.id && shell.name && shell.channel && shell.platform
        );
        
        if (validatedShells.length === 0) {
          throw new Error('No valid campaign data found in file');
        }
        
        resolve(validatedShells);
      } catch (error) {
        reject(new Error(`Failed to load campaign structure: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
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
  audienceName: string;
  accuticsLineItem: string;
  creativeName: string;
  accuticsTaxonomyName: string;
  assetLinkYoutubeUrl: string;
  landingPage: string;
  landingPageWithUTM: string;
  startDate: string;
  endDate: string;
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
        audienceName: '',
        accuticsLineItem: '',
        creativeName: '',
        accuticsTaxonomyName: '',
        assetLinkYoutubeUrl: '',
        landingPage: '',
        landingPageWithUTM: '',
        startDate: shell.startDate || '',
        endDate: shell.endDate || '',
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
            audienceName: layer.audienceName,
            accuticsLineItem: layer.accuticsLineItem,
            creativeName: '',
            accuticsTaxonomyName: '',
            assetLinkYoutubeUrl: '',
            landingPage: '',
            landingPageWithUTM: '',
            startDate: shell.startDate || '',
            endDate: shell.endDate || '',
          });
        } else {
          layer.creatives.forEach(creative => {
            // Combine assetLink and youtubeUrl into one field
            const assetLinkYoutubeUrl = [creative.assetLink, creative.youtubeUrl]
              .filter(link => link && link.trim())
              .join(' | ');

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
              audienceName: layer.audienceName,
              accuticsLineItem: layer.accuticsLineItem,
              creativeName: creative.name,
              accuticsTaxonomyName: creative.accuticsTaxonomyName || '',
              assetLinkYoutubeUrl: assetLinkYoutubeUrl,
              landingPage: creative.landingPage,
              landingPageWithUTM: creative.landingPageWithUTM,
              startDate: shell.startDate || '',
              endDate: shell.endDate || '',
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
      'audienceName',
      'accuticsLineItem',
      'creativeName',
      'accuticsTaxonomyName',
      'assetLinkYoutubeUrl',
      'landingPage',
      'landingPageWithUTM',
      'startDate',
      'endDate',
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
    'Audience Name',
    'Accutics Line Item',
    'Creative Name',
    'Accutics Taxonomy Name',
    'Asset Link/YouTube URL',
    'Landing Page',
    'Landing Page with UTM',
    'Start Date',
    'End Date',
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
    { wch: 20 }, // Audience Name
    { wch: 20 }, // Accutics Line Item
    { wch: 25 }, // Creative Name
    { wch: 25 }, // Accutics Taxonomy Name
    { wch: 40 }, // Asset Link/YouTube URL
    { wch: 30 }, // Landing Page
    { wch: 35 }, // Landing Page with UTM
    { wch: 12 }, // Start Date
    { wch: 12 }, // End Date
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
    'Audience Name',
    'Accutics Line Item',
    'Creative Name',
    'Accutics Taxonomy Name',
    'Asset Link/YouTube URL',
    'Landing Page',
    'Landing Page with UTM',
    'Start Date',
    'End Date',
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
      escapeCSVField(row.audienceName),
      escapeCSVField(row.accuticsLineItem),
      escapeCSVField(row.creativeName),
      escapeCSVField(row.accuticsTaxonomyName),
      escapeCSVField(row.assetLinkYoutubeUrl),
      escapeCSVField(row.landingPage),
      escapeCSVField(row.landingPageWithUTM),
      escapeCSVField(row.startDate),
      escapeCSVField(row.endDate),
    ];
    csvRows.push(values.join(','));
  });
  
  return csvRows.join('\n');
};

