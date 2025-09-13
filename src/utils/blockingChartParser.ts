export interface BlockingChartRow {
  id: string;
  channel: string;
  tactic: string;
  platform: string;
  objective: string;
  placements: string;
  optimization: string;
  kpi: string;
  demoTargeting: string;
  cpmCpp: string;
  impressionsGrps: string;
  mediaCost: string;
  adServing: string;
  dvCost: string;
  mediaFee: string;
  totalWorkingMediaBudget: string;
  category?: 'brand_say_digital' | 'brand_say_social' | 'other_say_social' | 'uncategorized';
  selected?: boolean;
}

export const parseBlockingChartData = (pastedData: string): BlockingChartRow[] => {
  try {
    // Split by lines and filter out empty lines
    const lines = pastedData.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return [];
    }

    // More flexible header detection - look for any line that has multiple columns
    let headerIndex = -1;
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i].toLowerCase();
      // Look for common column headers in blocking charts
      if ((line.includes('channel') || line.includes('tactic') || line.includes('platform')) ||
          (line.includes('media') && line.includes('cost')) ||
          (line.includes('objective') || line.includes('placement'))) {
        headerIndex = i;
        break;
      }
    }

    // If no clear header found, assume first line is header
    if (headerIndex === -1) {
      headerIndex = 0;
    }

    // Parse header to get column positions
    const headerLine = lines[headerIndex];
    const columns = splitTabSeparatedLine(headerLine);
    
    // Debug: log the columns to help identify the Working Media Budget column
    console.log('Detected columns:', columns.map((col, i) => `${i}: "${col}"`));
    
    const columnMap = getColumnMapping(columns);
    console.log('Full column mapping:', columnMap);
    
    const rows: BlockingChartRow[] = [];
    let currentChannel = ''; // Track current channel for merged cell handling
    
    // Process data rows (skip header and any rows before it)
    for (let i = headerIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines
      
      // Skip total/summary rows, channel separator rows, and flighting/calendar rows
      const lineLower = line.toLowerCase();
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
          line.replace(/[\d\s]/g, '').length < 10) {
        continue;
      }
      
      const values = splitTabSeparatedLine(line);
      
      // More flexible row detection - look for rows with potential campaign data
      const hasData = values.some(val => val && val.trim());
      // Check for budget data in the row
      // const hasBudgetData = values.some(val => {
      //   const clean = val.replace(/[$,]/g, '');
      //   return !isNaN(parseFloat(clean)) && parseFloat(clean) > 0;
      // });
      
      if (hasData && values.length >= 3) {
        // Detect if this row is missing the channel column due to merged cells
        // Check if the first value looks like a tactic rather than a channel/platform name
        const firstValue = values[0]?.toLowerCase() || '';
        const isMissingChannelColumn = (
          firstValue.includes('skippable') || firstValue.includes('display banners') ||
          firstValue.includes('meta video') || firstValue.includes('meta traffic') ||
          firstValue.includes('tiktok in-feed') || firstValue.includes('static pins') ||
          firstValue.includes('standard video pins') || firstValue.includes('idea ads')
        );
        
        let channel, tactic, platform;
        
        if (isMissingChannelColumn) {
          // Row is missing channel column - shift everything right
          console.log(`Row ${i}: Detected missing channel column, shifting data`);
          channel = currentChannel || ''; // Use last known channel
          tactic = values[0] || '';  // First column is actually tactic
          platform = values[1] || ''; // Second column is actually platform
        } else {
          // Normal row structure
          channel = values[columnMap.channel] || '';
          tactic = values[columnMap.tactic] || '';
          platform = values[columnMap.platform] || '';
          
          // Update current channel for merged cell handling
          if (channel && channel.trim()) {
            currentChannel = channel.trim();
          }
        }
        
        // If channel is still empty, use current known channel
        if (!channel || channel.trim() === '') {
          channel = currentChannel || '';
        }
        
        // Find the Working Media Budget column specifically
        let workingMediaBudget = '';
        
        // First try: Use the Working Media Budget column if properly detected
        if (columnMap.totalWorkingMediaBudget >= 0 && values[columnMap.totalWorkingMediaBudget]) {
          const budgetVal = cleanValue(values[columnMap.totalWorkingMediaBudget]);
          const numVal = parseFloat(budgetVal);
          // Validate it's actually a budget amount
          if (!isNaN(numVal) && numVal > 0) {
            workingMediaBudget = budgetVal;
          }
        }
        
        // Fallback: If Working Media Budget column not found, look for rightmost budget-like column
        // This handles cases where column detection failed but we still want all 13 rows
        if (!workingMediaBudget) {
          // Look from right to left for budget amounts (Working Media Budget is usually on the right)
          for (let j = values.length - 1; j >= 0; j--) {
            const val = cleanValue(values[j] || '');
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
          objective = values[2] || ''; // Third column is objective when channel missing
          placements = values[3] || ''; // Fourth column is placements when channel missing
        } else {
          objective = values[columnMap.objective] || '';
          placements = values[columnMap.placements] || '';
        }
        
        // Strict validation: Must have ALL core campaign fields filled in
        // This excludes header rows, separator rows, and total rows
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
            objective: values[columnMap.objective] || 'MISSING',
            placements: values[columnMap.placements] || 'MISSING',
            workingMediaBudget: workingMediaBudget || 'MISSING',
            rawLine: line.substring(0, 100) + '...'
          });
        }

        if (hasValidCampaignData) {
          // Get impressions based on whether channel column is missing
          let impressionsValue;
          if (isMissingChannelColumn) {
            // When channel column is missing, impressions are one column to the left
            impressionsValue = cleanValue(values[columnMap.impressionsGrps - 1] || '');
          } else {
            impressionsValue = cleanValue(values[columnMap.impressionsGrps] || '');
          }
          
          // Debug: Log detailed parsing for this row
          console.log(`\n=== ROW ${i} DETAILED PARSING ===`);
          console.log('Raw line:', line);
          console.log('Split values:', values.map((val, idx) => `${idx}: "${val}"`));
          console.log('Extracted data:', {
            channel: `${channel} (${isMissingChannelColumn ? 'from current channel' : 'from column ' + columnMap.channel})`,
            tactic: `${tactic} (from column ${isMissingChannelColumn ? '0' : columnMap.tactic})`,
            platform: `${platform} (from column ${isMissingChannelColumn ? '1' : columnMap.platform})`,
            objective: `${objective} (from column ${isMissingChannelColumn ? '2' : columnMap.objective})`,
            placements: `${placements} (from column ${isMissingChannelColumn ? '3' : columnMap.placements})`,
            impressions: `${impressionsValue} (from column ${isMissingChannelColumn ? columnMap.impressionsGrps - 1 : columnMap.impressionsGrps})`,
            workingBudget: `${workingMediaBudget} (from budget detection)`,
            missingChannelColumn: isMissingChannelColumn
          });
          console.log('=================================\n');
          
          const row: BlockingChartRow = {
            id: `row_${i}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            channel: cleanValue(channel),
            tactic: cleanValue(tactic),
            platform: cleanValue(platform),
            objective: cleanValue(objective),
            placements: cleanValue(placements),
            optimization: cleanValue(values[columnMap.optimization] || ''),
            kpi: cleanValue(values[columnMap.kpi] || ''),
            demoTargeting: cleanValue(values[columnMap.demoTargeting] || ''),
            cpmCpp: cleanValue(values[columnMap.cpmCpp] || ''),
            impressionsGrps: impressionsValue,
            mediaCost: cleanValue(values[columnMap.mediaCost] || ''),
            adServing: cleanValue(values[columnMap.adServing] || ''),
            dvCost: cleanValue(values[columnMap.dvCost] || ''),
            mediaFee: cleanValue(values[columnMap.mediaFee] || ''),
            totalWorkingMediaBudget: workingMediaBudget, // This is our primary budget field
            category: autoCategorizeCampaign(channel, platform),
            selected: true, // Auto-select all rows by default
          };
          
          rows.push(row);
        }
      }
    }
    
    return rows;
  } catch (error) {
    console.error('Error parsing blocking chart data:', error);
    throw new Error(`Failed to parse data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const splitTabSeparatedLine = (line: string): string[] => {
  // Handle different data formats from Excel copy/paste
  if (line.includes('\t')) {
    // Tab-separated (most common from Excel)
    return line.split('\t').map(val => val.trim());
  } else if (line.includes('  ')) {
    // Multiple spaces (some Excel formats)
    return line.split(/\s{2,}/).map(val => val.trim());
  } else {
    // Try to split on single spaces but be smart about it
    // Look for patterns like numbers, money, etc.
    const parts = line.split(/\s+/);
    const merged = [];
    let currentPart = '';
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      // If this looks like a standalone value (number, money, short text), add it
      if (part.match(/^\$?[\d,]+\.?\d*$/) || part.length <= 3 || 
          part.includes('$') || part.includes('%')) {
        if (currentPart) {
          merged.push(currentPart.trim());
          currentPart = '';
        }
        merged.push(part);
      } else {
        // Accumulate words that belong together
        currentPart += (currentPart ? ' ' : '') + part;
      }
    }
    
    if (currentPart) {
      merged.push(currentPart.trim());
    }
    
    return merged.filter(p => p);
  }
};

const getColumnMapping = (columns: string[]) => {
  const map: Record<string, number> = {};
  
  columns.forEach((col, index) => {
    const lowerCol = col.toLowerCase().trim();
    
    if (lowerCol.includes('channel')) map.channel = index;
    else if (lowerCol.includes('tactic')) map.tactic = index;
    else if (lowerCol.includes('platform')) map.platform = index;
    else if (lowerCol.includes('objective')) map.objective = index;
    else if (lowerCol.includes('placement')) map.placements = index;
    else if (lowerCol.includes('optimization')) map.optimization = index;
    else if (lowerCol.includes('kpi')) map.kpi = index;
    else if (lowerCol.includes('demo') || lowerCol.includes('targeting')) map.demoTargeting = index;
    else if (lowerCol.includes('cpm') || lowerCol.includes('cpp')) map.cpmCpp = index;
    else if (lowerCol.includes('impression') || lowerCol.includes('grp') || 
             lowerCol === 'impressions/grps' || lowerCol === 'impressions' || 
             lowerCol.includes('impressions/grps') || lowerCol.includes('impressions')) map.impressionsGrps = index;
    else if (lowerCol.includes('media cost') && !lowerCol.includes('working')) map.mediaCost = index;
    else if (lowerCol.includes('ad serving')) map.adServing = index;
    else if (lowerCol.includes('dv cost')) map.dvCost = index;
    else if (lowerCol.includes('media fee')) map.mediaFee = index;
    // Be very specific about Working Media Budget column - try multiple variations
    else if (lowerCol === 'total working media budget' || 
             lowerCol === 'working media budget' ||
             lowerCol === 'total working budget' ||
             lowerCol === 'working budget' ||
             lowerCol.includes('total working media budget') || 
             lowerCol.includes('working media budget') ||
             lowerCol.includes('total working budget') ||
             // Sometimes it might be abbreviated or formatted differently
             (lowerCol.includes('working') && lowerCol.includes('budget')) ||
             (lowerCol.includes('total') && lowerCol.includes('working') && lowerCol.includes('media'))) {
      map.totalWorkingMediaBudget = index;
    }
    // Also check for rightmost budget column as backup
    else if (lowerCol.endsWith('budget') && !lowerCol.includes('impression') && !lowerCol.includes('grp')) {
      if (map.totalWorkingMediaBudget === undefined) {
        map.totalWorkingMediaBudget = index;
      }
    }
  });
  
  // Set defaults if not found
  return {
    channel: map.channel || 0,
    tactic: map.tactic || 1,
    platform: map.platform || 2,
    objective: map.objective || 3,
    placements: map.placements || 4,
    optimization: map.optimization || 5,
    kpi: map.kpi || 6,
    demoTargeting: map.demoTargeting || 7,
    cpmCpp: map.cpmCpp || 8,
    impressionsGrps: map.impressionsGrps || 9,
    mediaCost: map.mediaCost || -1,
    adServing: map.adServing || -1,
    dvCost: map.dvCost || -1,
    mediaFee: map.mediaFee || -1,
    totalWorkingMediaBudget: map.totalWorkingMediaBudget || -1,
  };
};

const cleanValue = (value: string): string => {
  return value.trim().replace(/^\$/, '').replace(/,/g, '');
};

const autoCategorizeCampaign = (channel: string, platform: string): BlockingChartRow['category'] => {
  const channelLower = (channel || '').toLowerCase();
  const platformLower = (platform || '').toLowerCase();
  const combined = `${channelLower} ${platformLower}`.toLowerCase();
  
  // Brand Say Digital: Display campaigns, programmatic, search campaigns, video
  if (combined.includes('digital video') || 
      combined.includes('digital display') || 
      combined.includes('display banners') ||
      combined.includes('skippable') ||
      combined.includes('online video') ||
      combined.includes('search') ||
      combined.includes('programmatic') ||
      combined.includes('trade desk') ||
      combined.includes('the trade desk') ||
      combined.includes('dv360') ||
      combined.includes('google ads') ||
      combined.includes('youtube') ||
      combined.includes('display')) {
    return 'brand_say_digital';
  }
  
  // Brand Say Social: Organic social, paid social on brand channels
  if (combined.includes('paid social') || 
      combined.includes('social') ||
      combined.includes('meta') ||
      combined.includes('facebook') ||
      combined.includes('instagram') ||
      combined.includes('tiktok') ||
      combined.includes('pinterest') ||
      combined.includes('twitter') ||
      combined.includes('linkedin') ||
      combined.includes('snapchat') ||
      combined.includes('in-feed') ||
      combined.includes('video pins') ||
      combined.includes('static pins') ||
      combined.includes('idea ads')) {
    return 'brand_say_social';
  }
  
  // Other Say Social: Influencer campaigns, UGC campaigns, third-party social
  if (combined.includes('influencer') ||
      combined.includes('ugc') ||
      combined.includes('user generated') ||
      combined.includes('creator') ||
      combined.includes('partnership') ||
      combined.includes('sponsored')) {
    return 'other_say_social';
  }
  
  return 'uncategorized';
};

export const getCategoryLabel = (category: BlockingChartRow['category']): string => {
  switch (category) {
    case 'brand_say_digital':
      return 'Brand Say Digital';
    case 'brand_say_social':
      return 'Brand Say Social';
    case 'other_say_social':
      return 'Other Say Social';
    default:
      return 'Uncategorized';
  }
};

export const getCategoryColor = (category: BlockingChartRow['category']): string => {
  switch (category) {
    case 'brand_say_digital':
      return 'bg-blue-100 text-blue-800';
    case 'brand_say_social':
      return 'bg-green-100 text-green-800';
    case 'other_say_social':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
