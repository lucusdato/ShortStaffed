'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CampaignForm } from '@/components/Campaign/CampaignForm';
import { Campaign } from '@/types';
import { useCampaigns } from '@/hooks/useCampaigns';

export default function NewCampaignPage() {
  const router = useRouter();
  const { addCampaign } = useCampaigns();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (campaign: Campaign) => {
    setIsSubmitting(true);
    try {
      addCampaign(campaign);
      router.push(`/campaigns/${campaign.id}`);
    } catch (error) {
      console.error('Error creating campaign:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <Link
              href="/"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Campaign</h1>
              <p className="text-gray-600 mt-1">Set up your campaign basics to get started</p>
            </div>
          </div>
        </div>
      </header>

      {/* Form Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <CampaignForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          </div>
        </div>
      </main>
    </div>
  );
}
