import { Campaign } from '@/types';
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
