'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Calendar, DollarSign, Target, ArrowRight } from 'lucide-react';
import { useCampaigns } from '@/hooks/useCampaigns';
import { formatCurrency, formatDate } from '@/utils/taxonomy';
import { BlockingChartImport } from '@/components/Import/BlockingChartImport';
import { BlockingChartRow } from '@/utils/blockingChartParser';
import { CampaignStructureBuilder } from '@/components/Campaign/CampaignStructureBuilder';
import { convertBlockingChartToCampaignShells, loadCampaignShells, saveCampaignShells } from '@/utils/campaignStructure';
import { CampaignShell } from '@/types';

export default function Home() {
  const { campaigns, loading } = useCampaigns();
  const [showImport, setShowImport] = useState(campaigns.length === 0);
  const [importedData, setImportedData] = useState<BlockingChartRow[]>([]);
  const [campaignShells, setCampaignShells] = useState<CampaignShell[]>([]);
  const [showStructureBuilder, setShowStructureBuilder] = useState(false);

  // Load campaign shells on mount
  useEffect(() => {
    const savedShells = loadCampaignShells();
    setCampaignShells(savedShells);
    if (savedShells.length > 0) {
      setShowStructureBuilder(true);
    }
  }, []);

  const handleImportComplete = (selectedRows: BlockingChartRow[]) => {
    setImportedData(selectedRows);
    setShowImport(false);
    
    // Convert to campaign shells and show structure builder
    const shells = convertBlockingChartToCampaignShells(selectedRows);
    setCampaignShells(shells);
    saveCampaignShells(shells);
    setShowStructureBuilder(true);
  };

  const handleStartOver = () => {
    setImportedData([]);
    setCampaignShells([]);
    setShowImport(true);
    setShowStructureBuilder(false);
  };

  const handleCampaignShellsUpdate = (updatedShells: CampaignShell[]) => {
    setCampaignShells(updatedShells);
    saveCampaignShells(updatedShells);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  // Show import interface if no campaigns or user wants to import
  if (showImport) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">ShortStaffed</h1>
                <p className="text-gray-600 mt-1">Import your digital blocking chart to get started</p>
              </div>
              {campaigns.length > 0 && (
                <button
                  onClick={() => setShowImport(false)}
                  className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  View Campaigns
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Import Interface */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BlockingChartImport onImportComplete={handleImportComplete} />
        </main>
      </div>
    );
  }

  // Show imported data processing interface
  if (importedData.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Process Imported Campaigns</h1>
                <p className="text-gray-600 mt-1">Create campaigns from your imported blocking chart data</p>
              </div>
              <button
                onClick={handleStartOver}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Import New Data
              </button>
            </div>
          </div>
        </header>

        {/* Imported Data Summary */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Imported Campaign Data</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Total Campaigns</p>
                <p className="text-2xl font-bold text-blue-600">{importedData.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Brand Say Digital</p>
                <p className="text-2xl font-bold text-blue-600">
                  {importedData.filter(row => row.category === 'brand_say_digital').length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Brand Say Social</p>
                <p className="text-2xl font-bold text-green-600">
                  {importedData.filter(row => row.category === 'brand_say_social').length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Other Say Social</p>
                <p className="text-2xl font-bold text-purple-600">
                  {importedData.filter(row => row.category === 'other_say_social').length}
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-gray-700">
                <strong>Next steps:</strong> Your blocking chart data has been imported and categorized. 
                You can now create detailed campaigns with ad sets and creatives for each row.
              </p>
              <div className="flex space-x-3">
                <Link
                  href="/campaigns/new"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create First Campaign
                </Link>
                <button
                  onClick={() => setImportedData([])}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Continue to Dashboard
                </button>
              </div>
            </div>
          </div>

          {/* Imported Data Table */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Imported Campaign Rows</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Channel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Platform
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tactic
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Budget
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {importedData.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {row.channel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {row.platform}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {row.tactic}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        ${row.totalWorkingMediaBudget}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          row.category === 'brand_say_digital' ? 'bg-blue-100 text-blue-800' :
                          row.category === 'brand_say_social' ? 'bg-green-100 text-green-800' :
                          row.category === 'other_say_social' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {row.category === 'brand_say_digital' ? 'Brand Say Digital' :
                           row.category === 'brand_say_social' ? 'Brand Say Social' :
                           row.category === 'other_say_social' ? 'Other Say Social' :
                           'Uncategorized'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show campaign structure builder if we have campaign shells
  if (showStructureBuilder && campaignShells.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Campaign Structure Builder</h1>
                <p className="text-gray-600 mt-1">Build targeting layers and creative shells for your campaigns</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleStartOver}
                  className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Import New Data
                </button>
                <button
                  onClick={() => setShowStructureBuilder(false)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Structure Builder */}
        <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <CampaignStructureBuilder 
            campaignShells={campaignShells}
            onUpdate={handleCampaignShellsUpdate}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ShortStaffed</h1>
              <p className="text-gray-600 mt-1">Automate your media planning workflow</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowImport(true)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5 mr-2" />
                Import Data
              </button>
              {campaignShells.length > 0 && (
                <button
                  onClick={() => setShowStructureBuilder(true)}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  <Target className="w-5 h-5 mr-2" />
                  Structure Builder
                </button>
              )}
              <Link
                href="/campaigns/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Campaign
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Total Campaigns</h3>
                <p className="text-3xl font-bold text-blue-600">{campaigns.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Total Budget</h3>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(campaigns.reduce((sum, campaign) => sum + campaign.totalBudget, 0))}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Active Campaigns</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {campaigns.filter(campaign => {
                    const now = new Date();
                    const start = new Date(campaign.startDate);
                    const end = new Date(campaign.endDate);
                    return start <= now && now <= end;
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Campaigns */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Recent Campaigns</h2>
          </div>
          
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first campaign</p>
              <Link
                href="/campaigns/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Campaign
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campaign
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Budget
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ad Sets
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {campaigns.slice(0, 10).map((campaign) => {
                    const now = new Date();
                    const start = new Date(campaign.startDate);
                    const end = new Date(campaign.endDate);
                    let status = 'Upcoming';
                    let statusColor = 'bg-yellow-100 text-yellow-800';
                    
                    if (start <= now && now <= end) {
                      status = 'Active';
                      statusColor = 'bg-green-100 text-green-800';
                    } else if (end < now) {
                      status = 'Completed';
                      statusColor = 'bg-gray-100 text-gray-800';
                    }
                    
                    return (
                      <tr key={campaign.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/campaigns/${campaign.id}`}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {campaign.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {campaign.client}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {formatCurrency(campaign.totalBudget)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {campaign.adSets.length}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
