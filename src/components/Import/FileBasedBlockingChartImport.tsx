'use client';

import React, { useState, useCallback } from 'react';
import { Upload, AlertCircle, CheckCircle, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { BlockingChartRow } from '@/utils/blockingChartParser';
import * as XLSX from 'xlsx';

interface FileBasedBlockingChartImportProps {
  onImportComplete: (selectedRows: BlockingChartRow[]) => void;
}

interface ParsedData {
  headers: string[];
  rows: string[][];
  fileName: string;
  fileType: 'excel' | 'csv';
}

export function FileBasedBlockingChartImport({ onImportComplete }: FileBasedBlockingChartImportProps) {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [parsedRows, setParsedRows] = useState<BlockingChartRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [manualFlighting, setManualFlighting] = useState<Record<string, {start: string, end: string}>>({});
  const [copiedFlighting, setCopiedFlighting] = useState<{start: string, end: string} | null>(null);

  const findBestSheet = (workbook: XLSX.WorkBook): string => {
    const sheetNames = workbook.SheetNames;
    
    // Look for sheets with "blocking" in the name first
    const blockingSheets = sheetNames.filter(name => 
      name.toLowerCase().includes('blocking')
    );
    if (blockingSheets.length > 0) {
      console.log('Found blocking sheet:', blockingSheets[0]);
      return blockingSheets[0];
    }
    
    // Look for sheets with "chart" in the name
    const chartSheets = sheetNames.filter(name => 
      name.toLowerCase().includes('chart')
    );
    if (chartSheets.length > 0) {
      console.log('Found chart sheet:', chartSheets[0]);
      return chartSheets[0];
    }
    
    // Look for sheets with "data" in the name
    const dataSheets = sheetNames.filter(name => 
      name.toLowerCase().includes('data')
    );
    if (dataSheets.length > 0) {
      console.log('Found data sheet:', dataSheets[0]);
      return dataSheets[0];
    }
    
    // Fall back to first sheet
    console.log('Using first sheet:', sheetNames[0]);
    return sheetNames[0];
  };

  const parseExcelFile = (file: File, sheetName?: string): Promise<ParsedData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          console.log('Workbook sheets:', workbook.SheetNames);
          console.log('Workbook:', workbook);
          
          // Set available sheets for selection
          setAvailableSheets(workbook.SheetNames);
          
          // If no sheet specified, try to find the best one
          let targetSheet = sheetName;
          if (!targetSheet) {
            targetSheet = findBestSheet(workbook);
            console.log('Auto-selected sheet:', targetSheet);
          }
          
          const worksheet = workbook.Sheets[targetSheet];
          
          console.log('Worksheet:', worksheet);
          console.log('Worksheet range:', worksheet['!ref']);
          
          // Try different parsing options
          const jsonData1 = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });
          const jsonData2 = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: true });
          const jsonData3 = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
          
          console.log('JSON data (raw: false):', jsonData1);
          console.log('JSON data (raw: true):', jsonData2);
          console.log('JSON data (defval: null):', jsonData3);
          
          // Use the first non-empty result
          const jsonData = jsonData1.length > 0 ? jsonData1 : (jsonData2.length > 0 ? jsonData2 : jsonData3);
          
          if (jsonData.length === 0) {
            reject(new Error('Excel file appears to be empty'));
            return;
          }

          // Try to find the header row (look for row with multiple non-empty cells that look like headers)
          let headerRowIndex = 0;
          let bestHeaderRow = 0;
          let maxHeaderCount = 0;
          
          for (let i = 0; i < Math.min(10, jsonData.length); i++) {
            const row = jsonData[i] as unknown[];
            if (row) {
              const nonEmptyCells = row.filter(cell => cell && String(cell).trim());
              const headerLikeCells = nonEmptyCells.filter(cell => {
                const str = String(cell).toLowerCase();
                return str.includes('channel') || str.includes('platform') || str.includes('tactic') || 
                       str.includes('audience') || str.includes('objective') || str.includes('placement') ||
                       str.includes('budget') || str.includes('impression') || str.includes('cpm') ||
                       str.includes('cost') || str.includes('kpi') || str.includes('optimization');
              });
              
              console.log(`Row ${i}: ${nonEmptyCells.length} non-empty cells, ${headerLikeCells.length} header-like cells`);
              console.log(`Row ${i} content:`, nonEmptyCells);
              
              if (headerLikeCells.length > maxHeaderCount) {
                maxHeaderCount = headerLikeCells.length;
                bestHeaderRow = i;
              }
              
              // If we find a row with multiple header-like terms, use it
              if (headerLikeCells.length >= 3) {
                headerRowIndex = i;
                break;
              }
            }
          }
          
          // If no good header row found, use the one with most header-like terms
          if (maxHeaderCount > 0) {
            headerRowIndex = bestHeaderRow;
          }
          
          console.log('Using header row index:', headerRowIndex);
          
          const headers = (jsonData[headerRowIndex] as unknown[]).map(h => {
            const val = h ? String(h).trim() : '';
            console.log('Header value:', h, '-> processed:', val);
            return val;
          });
          
          const rows = jsonData.slice(headerRowIndex + 1).map(row => 
            (row as unknown[]).map(cell => String(cell || '').trim())
          );

          console.log('Final headers:', headers);
          console.log('Final rows count:', rows.length);
          console.log('First few rows:', rows.slice(0, 3));

          resolve({
            headers,
            rows,
            fileName: file.name,
            fileType: 'excel'
          });
        } catch (err) {
          console.error('Excel parsing error:', err);
          reject(new Error('Failed to parse Excel file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const parseCSVFile = (file: File): Promise<ParsedData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          
          console.log('CSV lines:', lines);
          
          if (lines.length === 0) {
            reject(new Error('CSV file appears to be empty'));
            return;
          }

          // Simple CSV parsing (handles basic cases)
          const parseCSVLine = (line: string): string[] => {
            const result: string[] = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            result.push(current.trim());
            return result;
          };

          const headers = parseCSVLine(lines[0]);
          const rows = lines.slice(1).map(line => parseCSVLine(line));

          console.log('CSV Headers:', headers);
          console.log('CSV Rows:', rows);

          resolve({
            headers,
            rows,
            fileName: file.name,
            fileType: 'csv'
          });
        } catch (err) {
          console.error('CSV parsing error:', err);
          reject(new Error('Failed to parse CSV file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;

    const fileType = file.name.toLowerCase().endsWith('.csv') ? 'csv' : 'excel';
    
    if (!file.name.toLowerCase().match(/\.(xlsx?|csv)$/)) {
      setError('Please upload an Excel (.xlsx, .xls) or CSV (.csv) file');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const data = fileType === 'csv' ? await parseCSVFile(file) : await parseExcelFile(file, selectedSheet);
      setParsedData(data);
      
      // Convert to BlockingChartRow format
      const rows = convertToBlockingChartRows(data);
      console.log('Converted rows:', rows);
      setParsedRows(rows);
      setShowPreview(true);
    } catch (err) {
      console.error('File upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedSheet]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleSheetSelect = (sheetName: string) => {
    setSelectedSheet(sheetName);
    // Re-parse the file with the selected sheet
    if (parsedData) {
      handleFileUpload(new File([], parsedData.fileName));
    }
  };

  const convertToBlockingChartRows = (data: ParsedData): BlockingChartRow[] => {
    const { headers, rows } = data;
    
    console.log('Converting data:', { headers, rows });
    
    // Create column mapping using the same logic as copy-paste version
    const columnMap = createColumnMapping(headers);
    console.log('Column mapping:', columnMap);
    
    // Note: Flighting data is now handled via manual date inputs in the table
    
    const convertedRows: BlockingChartRow[] = [];
    let currentChannel = ''; // Track current channel for merged cell handling
    
    // Process data rows with the same filtering logic as copy-paste version
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row.some(cell => cell && cell.trim())) continue; // Skip empty rows
      
      const cleanValue = (val: string) => val.trim().replace(/^\$/, '').replace(/,/g, '');
      
      // Convert row to string for filtering (same as copy-paste logic)
      const line = row.join('\t');
      const lineLower = line.toLowerCase();
      
      // Apply the same filtering logic as copy-paste version
      if (lineLower.includes('total') || lineLower.includes('subtotal') || 
          lineLower.includes('grand total') || lineLower.match(/^\s*\d+\s*$/) ||
          // Skip channel separator rows (often just contain channel name)
          lineLower.includes('digital video') && !lineLower.includes('trade desk') ||
          lineLower.includes('digital display') && !lineLower.includes('trade desk') ||
          lineLower.includes('paid social') && !lineLower.includes('meta') && !lineLower.includes('tiktok') ||
          // Skip rows that are clearly headers or separators
          lineLower.match(/^\s*(digital|paid|social|video|display)\s*$/) ||
          // Skip flighting/calendar rows (contain dates, numbers for calendar)
          lineLower.includes('september') || lineLower.includes('october') || lineLower.includes('november') ||
          lineLower.includes('december') || lineLower.includes('january') || lineLower.includes('february') ||
          lineLower.includes('march') || lineLower.includes('april') || lineLower.includes('may') ||
          lineLower.includes('june') || lineLower.includes('july') || lineLower.includes('august') ||
          // Skip rows with lots of small numbers (typical of calendar rows)
          lineLower.match(/\b\d{1,2}\s+\d{1,2}\s+\d{1,2}/) ||
          // Skip rows that are mostly numbers and spaces (flight calendar)
          line.replace(/[\d\s]/g, '').length < 10 ||
          // Skip variance/rates sections
          lineLower.includes('variance') || lineLower.includes('rates') || lineLower.includes('adserving') ||
          lineLower.includes('channels') && lineLower.includes('rates') ||
          lineLower.includes('pre-bid') || lineLower.includes('y/n') ||
          lineLower.includes('youtube') && lineLower.includes('cpm') ||
          lineLower.includes('meta') && lineLower.includes('cpm') && !lineLower.includes('video') && !lineLower.includes('traffic') ||
          lineLower.includes('tiktok') && lineLower.includes('no associated') ||
          lineLower.includes('ttd') && lineLower.includes('cpm') ||
          lineLower.includes('amz') && lineLower.includes('cpm')) {
        console.log(`Skipping row ${i}: ${line.substring(0, 50)}...`);
        continue;
      }
      
      // Debug: Log all rows that pass the initial filter
      console.log(`Processing row ${i}: ${line.substring(0, 100)}...`);
      
      // Detect if this row is missing the channel column due to merged cells
      const firstValue = row[0]?.toLowerCase() || '';
      const isMissingChannelColumn = (
        firstValue.includes('skippable') || firstValue.includes('display banners') ||
        firstValue.includes('meta video') || firstValue.includes('meta traffic') ||
        firstValue.includes('tiktok in-feed') || firstValue.includes('static pins') ||
        firstValue.includes('standard video pins') || firstValue.includes('idea ads') ||
        firstValue.includes('display banners fr') || firstValue.includes('meta video fr') ||
        firstValue.includes('meta traffic fr') || firstValue.includes('static pins en') ||
        firstValue.includes('static pins fr') || firstValue.includes('standard video pins fr') ||
        firstValue.includes('idea ads fr')
      );
      
      let channel, tactic, platform;
      
      if (isMissingChannelColumn) {
        // Row is missing channel column - shift everything right
        console.log(`Row ${i}: Detected missing channel column, shifting data`);
        channel = currentChannel || ''; // Use last known channel
        tactic = cleanValue(row[0] || '');  // First column is actually tactic
        platform = cleanValue(row[1] || ''); // Second column is actually platform
      } else {
        // Normal row structure
        channel = cleanValue(row[columnMap.channel] || '');
        tactic = cleanValue(row[columnMap.tactic] || '');
        platform = cleanValue(row[columnMap.platform] || '');
        
        // Update current channel for merged cell handling
        if (channel && channel.trim()) {
          currentChannel = channel.trim();
        }
      }
      
      // If channel is still empty, use current known channel
      if (!channel || channel.trim() === '') {
        channel = currentChannel || '';
      }
      
      // Find the Working Media Budget column specifically (same logic as copy-paste)
      let workingMediaBudget = '';
      
      // First try: Use the Working Media Budget column if properly detected
      if (columnMap.totalWorkingMediaBudget >= 0 && row[columnMap.totalWorkingMediaBudget]) {
        const budgetVal = cleanValue(row[columnMap.totalWorkingMediaBudget]);
        const numVal = parseFloat(budgetVal);
        // Validate it's actually a budget amount
        if (!isNaN(numVal) && numVal > 0) {
          workingMediaBudget = budgetVal;
        }
      }
      
      // Fallback: If Working Media Budget column not found, look for rightmost budget-like column
      if (!workingMediaBudget) {
        // Look from right to left for budget amounts (Working Media Budget is usually on the right)
        for (let j = row.length - 1; j >= 0; j--) {
          const val = cleanValue(row[j] || '');
          const numVal = parseFloat(val);
          // Must be reasonable budget (not impressions which are usually > 1M)
          if (!isNaN(numVal) && numVal > 0 && numVal <= 500000 && 
              // Prefer values with decimals (typical of budgets)
              (val.includes('.') || numVal < 100000)) {
            workingMediaBudget = val;
            break;
          }
        }
      }
      
      // Get objective and placements based on whether channel column is missing
      let objective, placements;
      if (isMissingChannelColumn) {
        objective = cleanValue(row[2] || ''); // Third column is objective when channel missing
        placements = cleanValue(row[3] || ''); // Fourth column is placements when channel missing
      } else {
        objective = cleanValue(row[columnMap.objective] || '');
        placements = cleanValue(row[columnMap.placements] || '');
      }
      
      // Strict validation: Must have ALL core campaign fields filled in (same as copy-paste)
      const hasValidCampaignData = (
        // Must have meaningful content in all key fields
        channel && channel.trim() && channel !== 'Channel' &&
        tactic && tactic.trim() && tactic !== 'Tactic' &&
        platform && platform.trim() && platform !== 'Platform' &&
        
        // Must have objective and placements (core campaign details)
        objective && objective.trim() &&
        placements && placements.trim() &&
        
        // Must have a valid working media budget
        workingMediaBudget && !isNaN(parseFloat(workingMediaBudget)) && parseFloat(workingMediaBudget) > 0
      );

      // Debug: Log why rows are being excluded
      if (!hasValidCampaignData) {
        console.log(`Excluding row ${i}:`, {
          channel: channel || 'MISSING',
          tactic: tactic || 'MISSING', 
          platform: platform || 'MISSING',
          objective: objective || 'MISSING',
          placements: placements || 'MISSING',
          workingMediaBudget: workingMediaBudget || 'MISSING',
          rawLine: line.substring(0, 100) + '...',
          rawRow: row,
          isMissingChannelColumn: isMissingChannelColumn
        });
        continue;
      }

      // Get impressions based on whether channel column is missing
      let impressionsValue;
      if (isMissingChannelColumn) {
        // When channel column is missing, impressions are one column to the left
        impressionsValue = cleanValue(row[columnMap.impressionsGrps - 1] || '');
      } else {
        impressionsValue = cleanValue(row[columnMap.impressionsGrps] || '');
      }
      
      // Get audience data using the same logic as copy-paste
      let demoTargetingValue = '';
      if (columnMap.demoTargeting >= 0) {
        demoTargetingValue = cleanValue(row[columnMap.demoTargeting] || '');
        console.log(`Using audience column ${columnMap.demoTargeting}: "${demoTargetingValue}"`);
      } else {
        console.log(`❌ No audience column mapped`);
      }

      const convertedRow: BlockingChartRow = {
        id: `row_${i}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        channel: cleanValue(channel),
        tactic: cleanValue(tactic),
        platform: cleanValue(platform),
        objective: cleanValue(objective),
        placements: cleanValue(placements),
        optimization: cleanValue(row[columnMap.optimization] || ''),
        kpi: cleanValue(row[columnMap.kpi] || ''),
        demoTargeting: demoTargetingValue,
        cpmCpp: cleanValue(row[columnMap.cpmCpp] || ''),
        impressionsGrps: impressionsValue,
        mediaCost: cleanValue(row[columnMap.mediaCost] || ''),
        adServing: cleanValue(row[columnMap.adServing] || ''),
        dvCost: cleanValue(row[columnMap.dvCost] || ''),
        mediaFee: cleanValue(row[columnMap.mediaFee] || ''),
        totalWorkingMediaBudget: workingMediaBudget,
        category: autoCategorizeCampaign(channel, platform),
        selected: true,
        startDate: '',
        endDate: '',
      };
      
      console.log(`Row ${i}:`, { original: row, converted: convertedRow });
      convertedRows.push(convertedRow);
    }
    
    console.log(`Filtered ${rows.length} rows down to ${convertedRows.length} valid campaign rows`);
    
    return convertedRows;
  };



  const createColumnMapping = (headers: string[]): Record<string, number> => {
    const map: Record<string, number> = {};
    
    console.log('=== COLUMN MAPPING DEBUG ===');
    console.log('Available columns:', headers.map((col, idx) => `${idx}: "${col}"`));
    
    headers.forEach((header, index) => {
      const lowerHeader = header.toLowerCase().trim();
      
      if (lowerHeader.includes('channel')) {
        map.channel = index;
        console.log(`Found channel column: ${index} - "${header}"`);
      }
      else if (lowerHeader.includes('tactic')) {
        map.tactic = index;
        console.log(`Found tactic column: ${index} - "${header}"`);
      }
      else if (lowerHeader.includes('platform')) {
        map.platform = index;
        console.log(`Found platform column: ${index} - "${header}"`);
      }
      else if (lowerHeader.includes('objective')) {
        map.objective = index;
        console.log(`Found objective column: ${index} - "${header}"`);
      }
      else if (lowerHeader.includes('placement')) {
        map.placements = index;
        console.log(`Found placements column: ${index} - "${header}"`);
      }
      else if (lowerHeader.includes('optimization')) {
        map.optimization = index;
        console.log(`Found optimization column: ${index} - "${header}"`);
      }
      else if (lowerHeader.includes('kpi')) {
        map.kpi = index;
        console.log(`Found kpi column: ${index} - "${header}"`);
      }
      // Prioritize "Audience" column specifically, then fall back to other audience-related terms
      else if (lowerHeader === 'audience' || lowerHeader === 'audiences') {
        map.demoTargeting = index;
        console.log(`Found Audience column: ${index} - "${header}"`);
      }
      else if (lowerHeader.includes('audience') && !lowerHeader.includes('cpm') && !lowerHeader.includes('cpp')) {
        map.demoTargeting = index;
        console.log(`Found audience-related column: ${index} - "${header}"`);
      }
      else if (lowerHeader.includes('demo') || lowerHeader.includes('targeting') || 
               lowerHeader.includes('segment') || lowerHeader.includes('persona') || lowerHeader.includes('demographic') ||
               lowerHeader.includes('flavour') || lowerHeader.includes('seeker')) {
        map.demoTargeting = index;
        console.log(`Found demoTargeting column: ${index} - "${header}"`);
      }
      else if (lowerHeader.includes('cpm') || lowerHeader.includes('cpp') || lowerHeader.includes('cost per')) {
        map.cpmCpp = index;
        console.log(`Found cpmCpp column: ${index} - "${header}"`);
      }
      else if (lowerHeader.includes('impression') || lowerHeader.includes('grp') || 
               lowerHeader === 'impressions/grps' || lowerHeader === 'impressions' || 
               lowerHeader.includes('impressions/grps') || lowerHeader.includes('impressions')) {
        map.impressionsGrps = index;
        console.log(`Found impressions column: ${index} - "${header}"`);
      }
      else if (lowerHeader.includes('media cost') && !lowerHeader.includes('working')) {
        map.mediaCost = index;
        console.log(`Found mediaCost column: ${index} - "${header}"`);
      }
      else if (lowerHeader.includes('ad serving')) {
        map.adServing = index;
        console.log(`Found adServing column: ${index} - "${header}"`);
      }
      else if (lowerHeader.includes('dv cost')) {
        map.dvCost = index;
        console.log(`Found dvCost column: ${index} - "${header}"`);
      }
      else if (lowerHeader.includes('media fee')) {
        map.mediaFee = index;
        console.log(`Found mediaFee column: ${index} - "${header}"`);
      }
      // Be very specific about Working Media Budget column - try multiple variations
      else if (lowerHeader === 'total working media budget' || 
               lowerHeader === 'working media budget' ||
               lowerHeader === 'total working budget' ||
               lowerHeader === 'working budget' ||
               lowerHeader.includes('total working media budget') || 
               lowerHeader.includes('working media budget') ||
               lowerHeader.includes('total working budget') ||
               // Sometimes it might be abbreviated or formatted differently
               (lowerHeader.includes('working') && lowerHeader.includes('budget')) ||
               (lowerHeader.includes('total') && lowerHeader.includes('working') && lowerHeader.includes('media'))) {
        map.totalWorkingMediaBudget = index;
        console.log(`Found totalWorkingMediaBudget column: ${index} - "${header}"`);
      }
      // Also check for rightmost budget column as backup
      else if (lowerHeader.endsWith('budget') && !lowerHeader.includes('impression') && !lowerHeader.includes('grp')) {
        if (map.totalWorkingMediaBudget === undefined) {
          map.totalWorkingMediaBudget = index;
          console.log(`Found backup budget column: ${index} - "${header}"`);
        }
      }
    });
    
    console.log('Final column mapping:', map);
    console.log('=== END COLUMN MAPPING DEBUG ===');
    
    // Set defaults if not found - be more careful about demoTargeting
    return {
      channel: map.channel || 0,
      tactic: map.tactic || 1,
      platform: map.platform || 2,
      objective: map.objective || 3,
      placements: map.placements || 4,
      optimization: map.optimization || 5,
      kpi: map.kpi || 6,
      demoTargeting: map.demoTargeting || -1, // Don't default to column 7 - use -1 to indicate not found
      cpmCpp: map.cpmCpp || 8,
      impressionsGrps: map.impressionsGrps || 9,
      mediaCost: map.mediaCost || -1,
      adServing: map.adServing || -1,
      dvCost: map.dvCost || -1,
      mediaFee: map.mediaFee || -1,
      totalWorkingMediaBudget: map.totalWorkingMediaBudget || -1,
    };
  };

  const autoCategorizeCampaign = (channel: string, platform: string): BlockingChartRow['category'] => {
    const combined = `${channel} ${platform}`.toLowerCase();
    
    if (combined.includes('digital video') || combined.includes('digital display') || 
        combined.includes('display banners') || combined.includes('skippable') ||
        combined.includes('search') || combined.includes('programmatic') ||
        combined.includes('trade desk') || combined.includes('google ads') ||
        combined.includes('youtube') || combined.includes('display')) {
      return 'brand_say_digital';
    }
    
    if (combined.includes('paid social') || combined.includes('social') ||
        combined.includes('meta') || combined.includes('facebook') ||
        combined.includes('instagram') || combined.includes('tiktok') ||
        combined.includes('pinterest') || combined.includes('twitter') ||
        combined.includes('linkedin') || combined.includes('snapchat') ||
        combined.includes('in-feed') || combined.includes('video pins') ||
        combined.includes('static pins') || combined.includes('idea ads')) {
      return 'brand_say_social';
    }
    
    if (combined.includes('influencer') || combined.includes('ugc') ||
        combined.includes('user generated') || combined.includes('creator') ||
        combined.includes('partnership') || combined.includes('sponsored')) {
      return 'other_say_social';
    }
    
    return 'uncategorized';
  };

  const handleRowToggle = (rowId: string) => {
    setParsedRows(prev => 
      prev.map(row => 
        row.id === rowId ? { ...row, selected: !row.selected } : row
      )
    );
  };

  const handleSelectAll = () => {
    const allSelected = parsedRows.every(row => row.selected);
    setParsedRows(prev => 
      prev.map(row => ({ ...row, selected: !allSelected }))
    );
  };

  const handleCategoryChange = (rowId: string, category: BlockingChartRow['category']) => {
    setParsedRows(prev => 
      prev.map(row => 
        row.id === rowId ? { ...row, category } : row
      )
    );
  };

  const handleImport = () => {
    const selectedRows = parsedRows.filter(row => row.selected);
    if (selectedRows.length === 0) {
      setError('Please select at least one row to import');
      return;
    }
    
    // Update selected rows with manual flighting data
    const updatedRows = selectedRows.map(row => ({
      ...row,
      startDate: manualFlighting[`${row.id}_start`]?.start || row.startDate || '',
      endDate: manualFlighting[`${row.id}_end`]?.end || row.endDate || '',
    }));
    
    onImportComplete(updatedRows);
  };

  const copyFlighting = (rowId: string) => {
    const startDate = manualFlighting[`${rowId}_start`];
    const endDate = manualFlighting[`${rowId}_end`];
    
    if (startDate && endDate) {
      setCopiedFlighting({ start: startDate.start, end: endDate.end });
    }
  };

  const pasteFlighting = (rowId: string) => {
    if (copiedFlighting) {
      setManualFlighting(prev => ({
        ...prev,
        [`${rowId}_start`]: { start: copiedFlighting.start, end: copiedFlighting.start },
        [`${rowId}_end`]: { start: copiedFlighting.end, end: copiedFlighting.end }
      }));
    }
  };


  const selectedCount = parsedRows.filter(row => row.selected).length;

  if (showPreview) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Preview Imported Data</h2>
              <p className="text-gray-600 mt-1">
                File: {parsedData?.fileName} • {parsedData?.fileType.toUpperCase()}
              </p>
            </div>
            <button
              onClick={() => setShowPreview(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              ← Back to Upload
            </button>
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-800">Campaign Rows</h3>
              <p className="text-2xl font-bold text-blue-900">{parsedRows.length}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="text-sm font-medium text-purple-800">Total Impressions</h3>
              <p className="text-2xl font-bold text-purple-900">
                {parsedRows
                  .reduce((sum, row) => sum + (parseInt(row.impressionsGrps) || 0), 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-sm font-medium text-green-800">Total Working Media Budget</h3>
              <p className="text-2xl font-bold text-green-900">
                ${parsedRows
                  .reduce((sum, row) => sum + (parseFloat(row.totalWorkingMediaBudget) || 0), 0)
                  .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Selection Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSelectAll}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {parsedRows.every(row => row.selected) ? 'Deselect All' : 'Select All'}
              </button>
              <span className="text-sm text-gray-600">
                {selectedCount} of {parsedRows.length} selected
              </span>
              <span className="text-sm font-medium text-green-600">
                Total Budget: ${parsedRows
                  .filter(row => row.selected)
                  .reduce((sum, row) => sum + (parseFloat(row.totalWorkingMediaBudget) || 0), 0)
                  .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            
          
            {selectedCount > 0 && (
              <button
                onClick={handleImport}
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                <Download className="w-5 h-5 mr-2" />
                Import {selectedCount} Campaign{selectedCount !== 1 ? 's' : ''}
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}
        </div>


        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Select
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Channel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tactic
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Platform
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Objective
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Placements
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Audience
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Impressions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Working Media Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {parsedRows.map((row) => {
                  
                  return (
                    <tr key={row.id} className={`${row.selected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={row.selected}
                          onChange={() => handleRowToggle(row.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {row.channel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {row.tactic}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {row.platform}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {row.objective}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {row.placements}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {row.demoTargeting || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {row.impressionsGrps ? parseInt(row.impressionsGrps).toLocaleString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        ${parseFloat(row.totalWorkingMediaBudget).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={row.category}
                          onChange={(e) => handleCategoryChange(row.id, e.target.value as BlockingChartRow['category'])}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="brand_say_digital">Brand Say Digital</option>
                          <option value="brand_say_social">Brand Say Social</option>
                          <option value="other_say_social">Other Say Social</option>
                          <option value="uncategorized">Uncategorized</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="date"
                          value={manualFlighting[`${row.id}_start`]?.start || ''}
                          onChange={(e) => {
                            setManualFlighting(prev => ({
                              ...prev,
                              [`${row.id}_start`]: { start: e.target.value, end: e.target.value }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Start date"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <input
                            type="date"
                            value={manualFlighting[`${row.id}_end`]?.end || ''}
                            onChange={(e) => {
                              setManualFlighting(prev => ({
                                ...prev,
                                [`${row.id}_end`]: { start: e.target.value, end: e.target.value }
                              }));
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="End date"
                          />
                          <div className="flex space-x-1">
                            {copiedFlighting && (
                              <button
                                onClick={() => pasteFlighting(row.id)}
                                className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 font-medium"
                                title="Paste copied flighting dates"
                              >
                                Paste
                              </button>
                            )}
                            <button
                              onClick={() => copyFlighting(row.id)}
                              disabled={!manualFlighting[`${row.id}_start`] || !manualFlighting[`${row.id}_end`]}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed font-medium"
                              title="Copy these flighting dates"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center">
          <Upload className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Import Digital Blocking Chart</h2>
          <p className="text-gray-600">
            Upload your Excel (.xlsx, .xls) or CSV (.csv) file to get started
          </p>
        </div>
      </div>

      {/* File Upload Area */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="space-y-4">
            <div className="flex justify-center space-x-4">
              <FileSpreadsheet className="w-12 h-12 text-green-600" />
              <FileText className="w-12 h-12 text-blue-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Drop your file here or click to browse
              </h3>
              <p className="text-gray-600 mb-4">
                Supports Excel (.xlsx, .xls) and CSV (.csv) files
              </p>
              
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer font-medium"
              >
                <Upload className="w-5 h-5 mr-2" />
                Choose File
              </label>
            </div>
          </div>
        </div>

        {isProcessing && (
          <div className="mt-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-gray-600">Processing file...</span>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Sheet Selector */}
        {availableSheets.length > 1 && !showPreview && (
          <div className="mt-6 bg-blue-50 rounded-lg border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              Multiple sheets detected. Please select the correct one:
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {availableSheets.map((sheetName) => (
                <button
                  key={sheetName}
                  onClick={() => handleSheetSelect(sheetName)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    selectedSheet === sheetName
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'
                  }`}
                >
                  <div className="font-medium">{sheetName}</div>
                  <div className="text-sm opacity-75">
                    {sheetName.toLowerCase().includes('blocking') && '🎯 Recommended'}
                    {sheetName.toLowerCase().includes('chart') && '📊 Chart Data'}
                    {sheetName.toLowerCase().includes('data') && '📋 Data Sheet'}
                  </div>
                </button>
              ))}
            </div>
            {selectedSheet && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">
                  <strong>Selected:</strong> {selectedSheet}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  Click &quot;Choose File&quot; again to re-parse with this sheet
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Import Your Data:</h3>
        <ol className="text-blue-800 space-y-2">
          <li className="flex items-start">
            <span className="font-semibold mr-2">1.</span>
            Save your blocking chart as an Excel (.xlsx) or CSV (.csv) file
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">2.</span>
            Make sure your file has headers in the first row
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">3.</span>
            Upload the file using the area above
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">4.</span>
            Review and categorize your campaigns before importing
          </li>
        </ol>
      </div>


    </div>
  );
}
