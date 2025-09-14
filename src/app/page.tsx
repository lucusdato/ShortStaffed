'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Calendar, DollarSign, Target, Upload, Menu, X, ArrowLeft } from 'lucide-react';
import { useCampaigns } from '@/hooks/useCampaigns';
import { formatCurrency, formatDate } from '@/utils/taxonomy';
import { FileBasedBlockingChartImport } from '@/components/Import/FileBasedBlockingChartImport';
import { BlockingChartRow } from '@/utils/blockingChartParser';
import { CampaignStructureBuilder } from '@/components/Campaign/CampaignStructureBuilder';
import { convertBlockingChartToCampaignShells, loadCampaignShells, saveCampaignShells } from '@/utils/campaignStructure';
import { loadCampaignStructure } from '@/utils/exportHelpers';
import { CampaignShell } from '@/types';

export default function Home() {
  const { campaigns, loading: campaignsLoading } = useCampaigns();
  const [campaignShells, setCampaignShells] = useState<CampaignShell[]>([]);
  const [showStructureBuilder, setShowStructureBuilder] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showTaxonomyGenerator, setShowTaxonomyGenerator] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Load campaign shells on mount
  useEffect(() => {
    try {
      const savedShells = loadCampaignShells();
      setCampaignShells(savedShells);
      if (savedShells.length > 0) {
        setShowStructureBuilder(true);
        setShowImport(false);
        setShowTaxonomyGenerator(false); // Ensure we start with Traffic Sheet Creator
      } else {
        setShowImport(true);
      }
    } catch (error) {
      console.error('Error loading campaign shells:', error);
      setShowImport(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuOpen) {
        const target = event.target as Element;
        if (!target.closest('[data-menu]')) {
          setIsMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleImportComplete = (selectedRows: BlockingChartRow[]) => {
    // Convert to campaign shells and show structure builder directly
    const shells = convertBlockingChartToCampaignShells(selectedRows);
    setCampaignShells(shells);
    saveCampaignShells(shells);
    setShowImport(false);
    setShowStructureBuilder(true);
    setShowTaxonomyGenerator(false); // Ensure we go to Traffic Sheet Creator first
  };

  const handleStartOver = () => {
    setCampaignShells([]);
    setShowImport(true);
    setShowStructureBuilder(false);
  };

  const handleCampaignShellsUpdate = (updatedShells: CampaignShell[]) => {
    setCampaignShells(updatedShells);
    saveCampaignShells(updatedShells);
  };

  const handleLoadPreviousWork = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoadingFile(true);
    loadCampaignStructure(file)
      .then((loadedShells) => {
        setCampaignShells(loadedShells);
        saveCampaignShells(loadedShells);
        setShowImport(false);
        setShowStructureBuilder(true);
        alert(`Successfully loaded ${loadedShells.length} campaigns from file.`);
      })
      .catch((error) => {
        console.error('Error loading campaign structure:', error);
        alert(`Error loading campaign structure: ${error.message}`);
      })
      .finally(() => {
        setIsLoadingFile(false);
        // Reset the file input
        event.target.value = '';
      });
  };

  const handleGenerateTaxonomy = () => {
    setShowTaxonomyGenerator(true);
    setShowStructureBuilder(false);
  };

  const handleSaveWork = () => {
    try {
      const data = {
        campaignShells,
        timestamp: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campaign-structure-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error saving work:', error);
      alert('Error saving work. Please try again.');
    }
  };

  const handleLoadWork = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoadingFile(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.campaignShells) {
        setCampaignShells(data.campaignShells);
        saveCampaignShells(data.campaignShells);
        setShowStructureBuilder(true);
        setShowImport(false);
        setShowTaxonomyGenerator(false);
        alert(`Successfully loaded ${data.campaignShells.length} campaigns from file.`);
      } else {
        throw new Error('Invalid file format');
      }
    } catch (error) {
      console.error('Error loading work:', error);
      alert('Error loading work. Please make sure it\'s a valid JSON file.');
    } finally {
      setIsLoadingFile(false);
      event.target.value = '';
    }
  };

  const handleExportExcel = () => {
    try {
      // Import the export function dynamically to avoid circular dependencies
      import('@/utils/exportHelpers').then(({ exportCampaignShellsToExcel, downloadFile }) => {
        const excelData = exportCampaignShellsToExcel(campaignShells);
        const timestamp = new Date().toISOString().split('T')[0];
        downloadFile(excelData, `shortstaffed-campaigns-${timestamp}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Error exporting to Excel. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
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
              <div className="flex space-x-3">
                <label className={`inline-flex items-center px-4 py-2 ${isLoadingFile ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'} text-white rounded-lg transition-colors font-medium cursor-pointer`}>
                  {isLoadingFile ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Upload className="w-5 h-5 mr-2" />
                  )}
                  {isLoadingFile ? 'Loading...' : 'Load Previous Work'}
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleLoadPreviousWork}
                    className="hidden"
                    disabled={isLoadingFile}
                  />
                </label>
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
          </div>
        </header>

        {/* Import Interface */}
        <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <FileBasedBlockingChartImport onImportComplete={handleImportComplete} />
        </main>
      </div>
    );
  }


  // Show taxonomy generator if that's the current step
  if (showTaxonomyGenerator && campaignShells.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {
                    setShowTaxonomyGenerator(false);
                    setShowStructureBuilder(true);
                  }}
                  className="inline-flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Back to Traffic Sheet"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Traffic Sheet
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Taxonomy Generator</h1>
                  <p className="text-gray-600 mt-1">Review and customize the auto-generated Accutics taxonomy names</p>
                </div>
              </div>
              
              {/* Hamburger Menu */}
              <div className="relative" data-menu>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  {isMenuOpen ? <X className="w-5 h-5 mr-2" /> : <Menu className="w-5 h-5 mr-2" />}
                  Menu
                </button>
                
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50" data-menu>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          handleStartOver();
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Import New Data
                      </button>
                      <button
                        onClick={() => {
                          handleSaveWork();
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Save Work
                      </button>
                      <label className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer block">
                        {isLoadingFile ? 'Loading...' : 'Load Work'}
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleLoadWork}
                          className="hidden"
                          disabled={isLoadingFile}
                        />
                      </label>
                      <button
                        onClick={() => {
                          handleExportExcel();
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Export Excel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Taxonomy Generator */}
        <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="space-y-4">
              {campaignShells.map((campaign) => (
                <div key={campaign.id} className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{campaign.name}</h3>
                  
                  {/* Campaign Level */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                      <input
                        type="text"
                        value={campaign.accuticsCampaignName}
                        onChange={(e) => {
                          const updated = campaignShells.map(c => 
                            c.id === campaign.id ? { ...c, accuticsCampaignName: e.target.value } : c
                          );
                          setCampaignShells(updated);
                          saveCampaignShells(updated);
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                  </div>

                  {/* Targeting Layers */}
                  {campaign.targetingLayers.map((layer) => (
                    <div key={layer.id} className="mb-3 ml-3 border-l-2 border-blue-200 pl-3">
                      <h4 className="text-md font-medium text-gray-800 mb-2">Targeting: {layer.audienceName}</h4>
                      <div className="mb-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Line Item Name</label>
                        <input
                          type="text"
                          value={layer.accuticsLineItem}
                          onChange={(e) => {
                            const updated = campaignShells.map(c => 
                              c.id === campaign.id 
                                ? {
                                    ...c,
                                    targetingLayers: c.targetingLayers.map(tl => 
                                      tl.id === layer.id ? { ...tl, accuticsLineItem: e.target.value } : tl
                                    )
                                  }
                                : c
                            );
                            setCampaignShells(updated);
                            saveCampaignShells(updated);
                          }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Creatives */}
                      {layer.creatives.map((creative) => (
                        <div key={creative.id} className="mb-3 ml-3 border-l-2 border-green-200 pl-3">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Creative: {creative.name}</h5>
                          
                          {/* Taxonomy Name */}
                          <div className="mb-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Taxonomy Name</label>
                            <input
                              type="text"
                              value={creative.accuticsTaxonomyName || ''}
                              onChange={(e) => {
                                const updated = campaignShells.map(c => 
                                  c.id === campaign.id 
                                    ? {
                                        ...c,
                                        targetingLayers: c.targetingLayers.map(tl => 
                                          tl.id === layer.id 
                                            ? {
                                                ...tl,
                                                creatives: tl.creatives.map(cr => 
                                                  cr.id === creative.id ? { ...cr, accuticsTaxonomyName: e.target.value } : cr
                                                )
                                              }
                                            : tl
                                        )
                                      }
                                    : c
                                );
                                setCampaignShells(updated);
                                saveCampaignShells(updated);
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                            />
                          </div>

                          {/* Landing Page Fields */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Landing Page</label>
                              <input
                                type="text"
                                value={creative.landingPage || ''}
                                onChange={(e) => {
                                  const updated = campaignShells.map(c => 
                                    c.id === campaign.id 
                                      ? {
                                          ...c,
                                          targetingLayers: c.targetingLayers.map(tl => 
                                            tl.id === layer.id 
                                              ? {
                                                  ...tl,
                                                  creatives: tl.creatives.map(cr => 
                                                    cr.id === creative.id ? { ...cr, landingPage: e.target.value } : cr
                                                  )
                                                }
                                              : tl
                                          )
                                        }
                                      : c
                                  );
                                  setCampaignShells(updated);
                                  saveCampaignShells(updated);
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                                placeholder="https://example.com"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Landing Page with UTM</label>
                              <input
                                type="text"
                                value={creative.landingPageWithUTM || ''}
                                onChange={(e) => {
                                  const updated = campaignShells.map(c => 
                                    c.id === campaign.id 
                                      ? {
                                          ...c,
                                          targetingLayers: c.targetingLayers.map(tl => 
                                            tl.id === layer.id 
                                              ? {
                                                  ...tl,
                                                  creatives: tl.creatives.map(cr => 
                                                    cr.id === creative.id ? { ...cr, landingPageWithUTM: e.target.value } : cr
                                                  )
                                                }
                                              : tl
                                          )
                                        }
                                      : c
                                  );
                                  setCampaignShells(updated);
                                  saveCampaignShells(updated);
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                                placeholder="https://example.com?utm_parameters..."
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowTaxonomyGenerator(false);
                  setShowStructureBuilder(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Back to Traffic Sheet
              </button>
              <button
                onClick={() => {
                  // TODO: Implement final export/next step
                  alert('Taxonomy generation complete! Ready for final export.');
                }}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Complete & Export
              </button>
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
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowImport(true)}
                  className="inline-flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Back to Import"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Import
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Traffic Sheet Creator</h1>
                  <p className="text-gray-600 mt-1">Build targeting layers and creative shells for your campaigns</p>
                </div>
              </div>
              
              {/* Hamburger Menu */}
              <div className="relative" data-menu>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  {isMenuOpen ? <X className="w-5 h-5 mr-2" /> : <Menu className="w-5 h-5 mr-2" />}
                  Menu
                </button>
                
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50" data-menu>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          handleStartOver();
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Import New Data
                      </button>
                      <button
                        onClick={() => {
                          handleSaveWork();
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Save Work
                      </button>
                      <label className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer block">
                        {isLoadingFile ? 'Loading...' : 'Load Work'}
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleLoadWork}
                          className="hidden"
                          disabled={isLoadingFile}
                        />
                      </label>
                      <button
                        onClick={() => {
                          handleExportExcel();
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Export Excel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Traffic Sheet Creator */}
        <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <CampaignStructureBuilder 
            campaignShells={campaignShells}
            onUpdate={handleCampaignShellsUpdate}
            onGenerateTaxonomy={handleGenerateTaxonomy}
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
                  Traffic Sheet Creator
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
