'use client';

import React, { useState } from 'react';
import { Plus, Copy, Trash2, ChevronDown, ChevronRight, Link as LinkIcon, Youtube } from 'lucide-react';
import { CampaignShell, TargetingLayer, CreativeShell } from '@/types';
import { 
  createTargetingLayer, 
  createCreativeShell, 
  duplicateTargetingLayer, 
  duplicateCreativeShell,
  generateUTMUrl,
  saveCampaignShell
} from '@/utils/campaignStructure';

interface CampaignStructureBuilderProps {
  campaignShells: CampaignShell[];
  onUpdate: (shells: CampaignShell[]) => void;
}

export function CampaignStructureBuilder({ campaignShells, onUpdate }: CampaignStructureBuilderProps) {
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [expandedTargeting, setExpandedTargeting] = useState<Set<string>>(new Set());

  const toggleCampaignExpansion = (campaignId: string) => {
    const newExpanded = new Set(expandedCampaigns);
    if (newExpanded.has(campaignId)) {
      newExpanded.delete(campaignId);
    } else {
      newExpanded.add(campaignId);
    }
    setExpandedCampaigns(newExpanded);
  };

  const toggleTargetingExpansion = (targetingId: string) => {
    const newExpanded = new Set(expandedTargeting);
    if (newExpanded.has(targetingId)) {
      newExpanded.delete(targetingId);
    } else {
      newExpanded.add(targetingId);
    }
    setExpandedTargeting(newExpanded);
  };

  const updateCampaignShell = (campaignId: string, updates: Partial<CampaignShell>) => {
    const updatedShells = campaignShells.map(shell => 
      shell.id === campaignId ? { ...shell, ...updates } : shell
    );
    onUpdate(updatedShells);
    
    // Save individual shell
    const updatedShell = updatedShells.find(s => s.id === campaignId);
    if (updatedShell) {
      saveCampaignShell(updatedShell);
    }
  };

  const addTargetingLayer = (campaignId: string) => {
    const newLayer = createTargetingLayer('', '');
    updateCampaignShell(campaignId, {
      targetingLayers: [
        ...campaignShells.find(s => s.id === campaignId)?.targetingLayers || [],
        newLayer
      ]
    });
    setExpandedTargeting(new Set([...expandedTargeting, newLayer.id]));
  };

  const duplicateTargetingLayerHandler = (campaignId: string, layerId: string) => {
    const campaign = campaignShells.find(s => s.id === campaignId);
    const layer = campaign?.targetingLayers.find(l => l.id === layerId);
    if (layer && campaign) {
      const duplicatedLayer = duplicateTargetingLayer(layer);
      updateCampaignShell(campaignId, {
        targetingLayers: [...campaign.targetingLayers, duplicatedLayer]
      });
      setExpandedTargeting(new Set([...expandedTargeting, duplicatedLayer.id]));
    }
  };

  const deleteTargetingLayer = (campaignId: string, layerId: string) => {
    const campaign = campaignShells.find(s => s.id === campaignId);
    if (campaign) {
      updateCampaignShell(campaignId, {
        targetingLayers: campaign.targetingLayers.filter(l => l.id !== layerId)
      });
    }
  };

  const updateTargetingLayer = (campaignId: string, layerId: string, updates: Partial<TargetingLayer>) => {
    const campaign = campaignShells.find(s => s.id === campaignId);
    if (campaign) {
      updateCampaignShell(campaignId, {
        targetingLayers: campaign.targetingLayers.map(layer =>
          layer.id === layerId ? { ...layer, ...updates } : layer
        )
      });
    }
  };

  const addCreativeShell = (campaignId: string, layerId: string) => {
    const newCreative = createCreativeShell('', '');
    const campaign = campaignShells.find(s => s.id === campaignId);
    if (campaign) {
      updateTargetingLayer(campaignId, layerId, {
        creatives: [
          ...campaign.targetingLayers.find(l => l.id === layerId)?.creatives || [],
          newCreative
        ]
      });
    }
  };

  const duplicateCreativeShellHandler = (campaignId: string, layerId: string, creativeId: string) => {
    const campaign = campaignShells.find(s => s.id === campaignId);
    const layer = campaign?.targetingLayers.find(l => l.id === layerId);
    const creative = layer?.creatives.find(c => c.id === creativeId);
    if (creative && layer) {
      const duplicatedCreative = duplicateCreativeShell(creative);
      updateTargetingLayer(campaignId, layerId, {
        creatives: [...layer.creatives, duplicatedCreative]
      });
    }
  };

  const deleteCreativeShell = (campaignId: string, layerId: string, creativeId: string) => {
    const campaign = campaignShells.find(s => s.id === campaignId);
    const layer = campaign?.targetingLayers.find(l => l.id === layerId);
    if (layer) {
      updateTargetingLayer(campaignId, layerId, {
        creatives: layer.creatives.filter(c => c.id !== creativeId)
      });
    }
  };

  const updateCreativeShell = (campaignId: string, layerId: string, creativeId: string, updates: Partial<CreativeShell>) => {
    const campaign = campaignShells.find(s => s.id === campaignId);
    const layer = campaign?.targetingLayers.find(l => l.id === layerId);
    if (layer) {
      const updatedCreatives = layer.creatives.map(creative => {
        if (creative.id === creativeId) {
          const updated = { ...creative, ...updates };
          // Auto-update UTM URL when landing page changes (but not when landingPageWithUTM changes)
          if (updates.landingPage && !updates.landingPageWithUTM) {
            updated.landingPageWithUTM = generateUTMUrl(updated.landingPage, updated.utmParameters);
          }
          return updated;
        }
        return creative;
      });
      
      updateTargetingLayer(campaignId, layerId, {
        creatives: updatedCreatives
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Campaign Structure Builder</h2>
        <p className="text-gray-600 mb-6">
          Build out your targeting layers and creative shells for each imported campaign.
        </p>
        
        {campaignShells.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No campaigns imported yet. Import your blocking chart data first.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {campaignShells.map((campaign) => (
              <div key={campaign.id} className="border rounded-lg bg-gray-50">
                {/* Campaign Header */}
                <div className="p-4 border-b bg-white rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleCampaignExpansion(campaign.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        {expandedCampaigns.has(campaign.id) ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </button>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                        <div className="text-sm text-gray-600 mb-1">
                          {campaign.platform} • {campaign.objective} • ${campaign.workingMediaBudget}
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Accutics Campaign Name</label>
                            <input
                              type="text"
                              value={campaign.accuticsCampaignName}
                              onChange={(e) => updateCampaignShell(campaign.id, { accuticsCampaignName: e.target.value })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              placeholder="Accutics campaign name"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        campaign.category === 'brand_say_digital' ? 'bg-blue-100 text-blue-800' :
                        campaign.category === 'brand_say_social' ? 'bg-green-100 text-green-800' :
                        campaign.category === 'other_say_social' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {campaign.category === 'brand_say_digital' ? 'Brand Say Digital' :
                         campaign.category === 'brand_say_social' ? 'Brand Say Social' :
                         campaign.category === 'other_say_social' ? 'Other Say Social' :
                         'Uncategorized'}
                      </span>
                      <button
                        onClick={() => addTargetingLayer(campaign.id)}
                        className="flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Targeting
                      </button>
                    </div>
                  </div>
                </div>

                {/* Campaign Content */}
                {expandedCampaigns.has(campaign.id) && (
                  <div className="p-4 space-y-4">
                    {campaign.targetingLayers.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-gray-500 mb-3">No targeting layers yet</p>
                        <button
                          onClick={() => addTargetingLayer(campaign.id)}
                          className="flex items-center mx-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create First Targeting Layer
                        </button>
                      </div>
                    ) : (
                      campaign.targetingLayers.map((layer) => (
                        <TargetingLayerComponent
                          key={layer.id}
                          campaignId={campaign.id}
                          layer={layer}
                          isExpanded={expandedTargeting.has(layer.id)}
                          onToggleExpansion={() => toggleTargetingExpansion(layer.id)}
                          onUpdate={(updates) => updateTargetingLayer(campaign.id, layer.id, updates)}
                          onDuplicate={() => duplicateTargetingLayerHandler(campaign.id, layer.id)}
                          onDelete={() => deleteTargetingLayer(campaign.id, layer.id)}
                          onAddCreative={() => addCreativeShell(campaign.id, layer.id)}
                          onDuplicateCreative={(creativeId) => duplicateCreativeShellHandler(campaign.id, layer.id, creativeId)}
                          onDeleteCreative={(creativeId) => deleteCreativeShell(campaign.id, layer.id, creativeId)}
                          onUpdateCreative={(creativeId, updates) => updateCreativeShell(campaign.id, layer.id, creativeId, updates)}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Targeting Layer Component
interface TargetingLayerComponentProps {
  campaignId: string;
  layer: TargetingLayer;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  onUpdate: (updates: Partial<TargetingLayer>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAddCreative: () => void;
  onDuplicateCreative: (creativeId: string) => void;
  onDeleteCreative: (creativeId: string) => void;
  onUpdateCreative: (creativeId: string, updates: Partial<CreativeShell>) => void;
}

function TargetingLayerComponent({
  layer,
  isExpanded,
  onToggleExpansion,
  onUpdate,
  onDuplicate,
  onDelete,
  onAddCreative,
  onDuplicateCreative,
  onDeleteCreative,
  onUpdateCreative
}: TargetingLayerComponentProps) {
  return (
    <div className="border rounded-lg bg-white">
      {/* Targeting Layer Header */}
      <div className="p-3 border-b bg-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <button
              onClick={onToggleExpansion}
              className="p-1 hover:bg-blue-100 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Audience Name</label>
                <input
                  type="text"
                  value={layer.audienceName}
                  onChange={(e) => onUpdate({ audienceName: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Adults 25-45"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Accutics Line Item</label>
                <input
                  type="text"
                  value={layer.accuticsLineItem}
                  onChange={(e) => onUpdate({ accuticsLineItem: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., ACC_001"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={onAddCreative}
              className="flex items-center px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
            >
              <Plus className="w-3 h-3 mr-1" />
              Creative
            </button>
            <button
              onClick={onDuplicate}
              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
              title="Duplicate targeting layer"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-1 text-red-600 hover:bg-red-100 rounded"
              title="Delete targeting layer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Targeting Layer Content */}
      {isExpanded && (
        <div className="p-3 space-y-3">
          {layer.creatives.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm mb-2">No creatives yet</p>
              <button
                onClick={onAddCreative}
                className="flex items-center mx-auto px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Creative
              </button>
            </div>
          ) : (
            layer.creatives.map((creative) => (
              <CreativeShellComponent
                key={creative.id}
                creative={creative}
                onUpdate={(updates) => onUpdateCreative(creative.id, updates)}
                onDuplicate={() => onDuplicateCreative(creative.id)}
                onDelete={() => onDeleteCreative(creative.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Creative Shell Component
interface CreativeShellComponentProps {
  creative: CreativeShell;
  onUpdate: (updates: Partial<CreativeShell>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function CreativeShellComponent({ creative, onUpdate, onDuplicate, onDelete }: CreativeShellComponentProps) {

  return (
    <div className="border rounded bg-green-50 p-3">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Creative Name</label>
            <input
              type="text"
              value={creative.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
              placeholder="Creative name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Asset Link</label>
            <div className="flex">
              <input
                type="text"
                value={creative.assetLink || ''}
                onChange={(e) => onUpdate({ assetLink: e.target.value })}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-l focus:ring-2 focus:ring-green-500"
                placeholder="https://..."
              />
              {creative.assetLink && (
                <a
                  href={creative.assetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 bg-gray-200 border border-l-0 border-gray-300 rounded-r hover:bg-gray-300"
                >
                  <LinkIcon className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">YouTube URL</label>
            <div className="flex">
              <input
                type="text"
                value={creative.youtubeUrl || ''}
                onChange={(e) => onUpdate({ youtubeUrl: e.target.value })}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-l focus:ring-2 focus:ring-green-500"
                placeholder="https://youtube.com/..."
              />
              {creative.youtubeUrl && (
                <a
                  href={creative.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 bg-red-200 border border-l-0 border-gray-300 rounded-r hover:bg-red-300"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={onDuplicate}
            className="p-1 text-green-600 hover:bg-green-100 rounded"
            title="Duplicate creative"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-red-600 hover:bg-red-100 rounded"
            title="Delete creative"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Landing Page</label>
          <input
            type="text"
            value={creative.landingPage || ''}
            onChange={(e) => {
              console.log('Landing page changed:', e.target.value);
              onUpdate({ landingPage: e.target.value });
            }}
            onFocus={() => console.log('Landing page focused')}
            autoComplete="off"
            spellCheck="false"
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
            placeholder="https://example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Landing Page with UTM</label>
          <input
            type="text"
            value={creative.landingPageWithUTM || ''}
            onChange={(e) => {
              console.log('Landing page with UTM changed:', e.target.value);
              onUpdate({ landingPageWithUTM: e.target.value });
            }}
            onFocus={() => console.log('Landing page with UTM focused')}
            autoComplete="off"
            spellCheck="false"
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
            placeholder="https://example.com?utm_parameters..."
          />
        </div>
      </div>

    </div>
  );
}
