'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
import { Campaign } from '@/types';
import { generateCampaignName } from '@/utils/taxonomy';

interface CampaignFormData {
  name: string;
  client: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
}

interface CampaignFormProps {
  onSubmit: (campaign: Campaign) => void;
  isSubmitting?: boolean;
  initialData?: Campaign;
}

export function CampaignForm({ onSubmit, isSubmitting = false, initialData }: CampaignFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CampaignFormData>({
    defaultValues: initialData ? {
      name: initialData.name,
      client: initialData.client,
      startDate: initialData.startDate,
      endDate: initialData.endDate,
      totalBudget: initialData.totalBudget,
    } : {
      name: '',
      client: '',
      startDate: '',
      endDate: '',
      totalBudget: 0,
    },
  });

  const watchedClient = watch('client');
  const watchedStartDate = watch('startDate');

  // Auto-generate campaign name when client and start date change
  React.useEffect(() => {
    if (watchedClient && watchedStartDate && !initialData) {
      const generatedName = generateCampaignName(watchedClient, 'Campaign', watchedStartDate);
      setValue('name', generatedName);
    }
  }, [watchedClient, watchedStartDate, setValue, initialData]);

  const handleFormSubmit = (data: CampaignFormData) => {
    const campaign: Campaign = {
      id: initialData?.id || uuidv4(),
      name: data.name,
      client: data.client,
      startDate: data.startDate,
      endDate: data.endDate,
      totalBudget: data.totalBudget,
      adSets: initialData?.adSets || [],
    };

    onSubmit(campaign);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Campaign Name */}
        <div className="md:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Name
          </label>
          <input
            type="text"
            id="name"
            {...register('name', { required: 'Campaign name is required' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., ACME_Holiday_122024"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Client */}
        <div>
          <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-2">
            Client Name
          </label>
          <input
            type="text"
            id="client"
            {...register('client', { required: 'Client name is required' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., ACME Corp"
          />
          {errors.client && (
            <p className="mt-1 text-sm text-red-600">{errors.client.message}</p>
          )}
        </div>

        {/* Total Budget */}
        <div>
          <label htmlFor="totalBudget" className="block text-sm font-medium text-gray-700 mb-2">
            Total Budget ($)
          </label>
          <input
            type="number"
            id="totalBudget"
            min="0"
            step="0.01"
            {...register('totalBudget', { 
              required: 'Budget is required',
              min: { value: 0, message: 'Budget must be positive' }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="50000"
          />
          {errors.totalBudget && (
            <p className="mt-1 text-sm text-red-600">{errors.totalBudget.message}</p>
          )}
        </div>

        {/* Start Date */}
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            {...register('startDate', { required: 'Start date is required' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.startDate && (
            <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
          )}
        </div>

        {/* End Date */}
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            {...register('endDate', { 
              required: 'End date is required',
              validate: (value) => {
                const startDate = watch('startDate');
                if (startDate && value <= startDate) {
                  return 'End date must be after start date';
                }
                return true;
              }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.endDate && (
            <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isSubmitting ? 'Creating...' : initialData ? 'Update Campaign' : 'Create Campaign'}
        </button>
      </div>
    </form>
  );
}
