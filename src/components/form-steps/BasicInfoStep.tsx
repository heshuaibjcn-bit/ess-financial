/**
 * BasicInfoStep - Step 1: Basic project information
 *
 * Collects:
 * - Province selection
 * - System size (capacity and duration)
 */

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAllProvinces } from '../../hooks/useProvince';

export const BasicInfoStep: React.FC = () => {
  const { t } = useTranslation();
  const { register, watch, formState: { errors } } = useFormContext();
  const { provinces, loading: loadingProvinces } = useAllProvinces();

  // Watch system size values for real-time calculation
  const systemSize = watch('systemSize');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('calculator.title')} - {t('calculator.steps.basic')}
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          {t('calculator.basic.provincePlaceholder')}
        </p>
      </div>

      {/* Province Selection */}
      <div>
        <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-2">
          {t('calculator.basic.province')} <span className="text-red-500">*</span>
        </label>
        <select
          id="province"
          {...register('province')}
          disabled={loadingProvinces}
          className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.province ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          {loadingProvinces ? (
            <option value="">{t('common.loading')}...</option>
          ) : (
            <>
              {provinces.map((province) => (
                <option key={province.code} value={province.code}>
                  {province.name} ({province.nameEn})
                </option>
              ))}
            </>
          )}
        </select>
        {errors.province && (
          <p className="mt-1 text-sm text-red-600">{errors.province.message}</p>
        )}
      </div>

      {/* System Size */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Capacity */}
        <div>
          <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-2">
            {t('calculator.basic.capacity')} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="capacity"
              type="number"
              step="0.1"
              min="0.1"
              max="100"
              {...register('systemSize.capacity', {
                valueAsNumber: true,
              })}
              className={`w-full px-4 py-2 pr-16 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.systemSize?.capacity ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <span className="absolute right-4 top-2 text-gray-500">MW</span>
          </div>
          {errors.systemSize?.capacity && (
            <p className="mt-1 text-sm text-red-600">{errors.systemSize.capacity.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {t('common.range')}: 0.1 - 100 MW
          </p>
        </div>

        {/* Duration */}
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
            {t('calculator.basic.duration')} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="duration"
              type="number"
              step="0.5"
              min="1"
              max="8"
              {...register('systemSize.duration', {
                valueAsNumber: true,
              })}
              className={`w-full px-4 py-2 pr-16 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.systemSize?.duration ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <span className="absolute right-4 top-2 text-gray-500">{t('common.hour')}</span>
          </div>
          {errors.systemSize?.duration && (
            <p className="mt-1 text-sm text-red-600">{errors.systemSize.duration.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {t('common.range')}: 1 - 8 {t('common.hour')}
          </p>
        </div>
      </div>

      {/* Storage Capacity Display */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-center">
          <svg
            className="w-5 h-5 text-blue-400 mr-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-800">
              {t('calculator.basic.systemSize')}: <span className="font-bold">
                {(parseFloat(systemSize?.capacity?.toString() || '0') * parseFloat(systemSize?.duration?.toString() || '0')).toFixed(1)}
              </span> MWh
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
