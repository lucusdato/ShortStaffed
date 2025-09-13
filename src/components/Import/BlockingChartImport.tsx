'use client';

import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, Eye, Download } from 'lucide-react';
import { BlockingChartRow, parseBlockingChartData } from '@/utils/blockingChartParser';

interface BlockingChartImportProps {
  onImportComplete: (selectedRows: BlockingChartRow[]) => void;
}

export function BlockingChartImport({ onImportComplete }: BlockingChartImportProps) {
  const [pastedData, setPastedData] = useState('');
  const [parsedRows, setParsedRows] = useState<BlockingChartRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleParse = async () => {
    if (!pastedData.trim()) {
      setError('Please paste your blocking chart data');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const rows = parseBlockingChartData(pastedData);
      if (rows.length === 0) {
        setError('No valid campaign rows found in the data. Please check your format.');
        return;
      }
      
      setParsedRows(rows);
      setShowPreview(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse data');
    } finally {
      setIsProcessing(false);
    }
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
    onImportComplete(selectedRows);
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
                Review your campaign data and assign categories before importing.
              </p>
            </div>
            <button
              onClick={() => setShowPreview(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              ← Back to Input
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
                    Impressions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Working Media Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {parsedRows.map((row) => (
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
                  </tr>
                ))}
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
            Copy and paste your digital blocking chart data from Excel to get started
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Import Your Data:</h3>
        <ol className="text-blue-800 space-y-2">
          <li className="flex items-start">
            <span className="font-semibold mr-2">1.</span>
            Open your Excel blocking chart
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">2.</span>
            Select all your campaign data (including headers)
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">3.</span>
            Copy the data (Ctrl+C or Cmd+C)
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">4.</span>
            Paste it in the text area below
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">5.</span>
            Click &quot;Parse Data&quot; to preview and categorize your campaigns
          </li>
        </ol>
      </div>

      {/* Input Area */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <label htmlFor="blocking-data" className="block text-lg font-semibold text-gray-900 mb-4">
          Paste Your Blocking Chart Data:
        </label>
        <textarea
          id="blocking-data"
          value={pastedData}
          onChange={(e) => setPastedData(e.target.value)}
          placeholder="Paste your Excel data here... It should include columns like Channel, Platform, Media Cost, etc."
          className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
        />
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <button
            onClick={handleParse}
            disabled={!pastedData.trim() || isProcessing}
            className="inline-flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Processing...
              </>
            ) : (
              <>
                <Eye className="w-5 h-5 mr-3" />
                Parse Data
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sample Data */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Expected Data Format:</h3>
        <p className="text-gray-600 mb-3">Your data should include columns like:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <span className="bg-white px-2 py-1 rounded border">Channel</span>
          <span className="bg-white px-2 py-1 rounded border">Platform</span>
          <span className="bg-white px-2 py-1 rounded border">Tactic</span>
          <span className="bg-white px-2 py-1 rounded border">Media Cost</span>
          <span className="bg-white px-2 py-1 rounded border">Objective</span>
          <span className="bg-white px-2 py-1 rounded border">Targeting</span>
          <span className="bg-white px-2 py-1 rounded border">CPM/CPP</span>
          <span className="bg-white px-2 py-1 rounded border">Impressions</span>
        </div>
      </div>
    </div>
  );
}
