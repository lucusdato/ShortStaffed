'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Download, Edit, Trash2 } from 'lucide-react';
import { useCampaigns } from '@/hooks/useCampaigns';
import { Campaign } from '@/types';
import { formatCurrency, formatDate } from '@/utils/taxonomy';
import { exportToCSV, downloadFile } from '@/utils/exportHelpers';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getCampaignById, removeCampaign } = useCampaigns();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (params.id) {
      const foundCampaign = getCampaignById(params.id as string);
      setCampaign(foundCampaign || null);
      setLoading(false);
    }
  }, [params.id, getCampaignById]);

  const handleExportCSV = () => {
    if (campaign) {
      const csvContent = exportToCSV([campaign]);
      downloadFile(csvContent, `${campaign.name}_export.csv`, 'text/csv');
    }
  };

  const handleDeleteCampaign = () => {
    if (campaign) {
      removeCampaign(campaign.id);
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Campaign Not Found</h2>
          <p className="text-gray-600 mb-6">The campaign you're looking for doesn't exist.</p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const totalCreatives = campaign.adSets.reduce((sum, adSet) => sum + adSet.creatives.length, 0);
  const totalAdSetBudget = campaign.adSets.reduce((sum, adSet) => sum + adSet.budget, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                href="/"
                className="inline-flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
                <p className="text-gray-600 mt-1">{campaign.client}</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-5 h-5 mr-2" />
                Export CSV
              </button>
              <Link
                href={`/campaigns/${campaign.id}/edit`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-5 h-5 mr-2" />
                Edit
              </Link>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Campaign Overview */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Campaign Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Campaign Stats */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Campaign Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Budget</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(campaign.totalBudget)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ad Sets</p>
                  <p className="text-2xl font-bold text-blue-600">{campaign.adSets.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Creatives</p>
                  <p className="text-2xl font-bold text-purple-600">{totalCreatives}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Budget Allocated</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalAdSetBudget)}</p>
                </div>
              </div>
            </div>

            {/* Ad Sets */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Ad Sets</h2>
                <Link
                  href={`/campaigns/${campaign.id}/adsets/new`}
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Ad Set
                </Link>
              </div>
              
              {campaign.adSets.length === 0 ? (
                <div className="text-center py-12">
                  <Plus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No ad sets yet</h3>
                  <p className="text-gray-600 mb-4">Create your first ad set to get started</p>
                  <Link
                    href={`/campaigns/${campaign.id}/adsets/new`}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Ad Set
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {campaign.adSets.map((adSet) => (
                    <div key={adSet.id} className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{adSet.name}</h3>
                          <p className="text-gray-600">{adSet.targeting}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-green-600">{formatCurrency(adSet.budget)}</p>
                          <p className="text-sm text-gray-600">{adSet.creatives.length} creatives</p>
                        </div>
                      </div>
                      
                      {adSet.creatives.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Creatives:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {adSet.creatives.map((creative) => (
                              <div key={creative.id} className="text-sm p-2 bg-gray-50 rounded">
                                <p className="font-medium">{creative.name}</p>
                                <p className="text-gray-600">{creative.assetType}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Campaign Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Client</p>
                  <p className="font-medium">{campaign.client}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Start Date</p>
                  <p className="font-medium">{formatDate(campaign.startDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">End Date</p>
                  <p className="font-medium">{formatDate(campaign.endDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-medium">
                    {Math.ceil((new Date(campaign.endDate).getTime() - new Date(campaign.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href={`/campaigns/${campaign.id}/adsets/new`}
                  className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Ad Set
                </Link>
                <button
                  onClick={handleExportCSV}
                  className="block w-full text-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Export Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Campaign</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{campaign.name}"? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCampaign}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
