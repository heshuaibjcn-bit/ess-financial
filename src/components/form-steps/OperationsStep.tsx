/**
 * OperationsStep - Step 3: Operating parameters
 *
 * Collects:
 * - System efficiency
 * - Depth of discharge (DOD)
 * - Daily cycles
 * - Annual degradation rate
 * - Availability percentage
 */

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export const OperationsStep: React.FC = () => {
  const { t } = useTranslation();
  const { register, formState: { errors } } = useFormContext();

  const operatingParams = [
    {
      key: 'systemEfficiency',
      label: t('calculator.operations.systemEfficiency'),
      unit: '%',
      min: 0.7,
      max: 0.95,
      step: 0.01,
      default: 0.88,
      description: 'Round-trip efficiency including PCS, battery, and auxiliary systems',
    },
    {
      key: 'depthOfDischarge',
      label: t('calculator.operations.depthOfDischarge'),
      unit: '%',
      min: 0.5,
      max: 0.95,
      step: 0.05,
      default: 0.90,
      description: 'Maximum depth of discharge per cycle',
    },
    {
      key: 'cyclesPerDay',
      label: t('calculator.operations.cyclesPerDay'),
      unit: t('common.times'),
      min: 0.5,
      max: 3,
      step: 0.1,
      default: 1.5,
      description: 'Number of complete charge/discharge cycles per day',
    },
    {
      key: 'degradationRate',
      label: t('calculator.operations.degradationRate'),
      unit: '%',
      min: 0.01,
      max: 0.05,
      step: 0.005,
      default: 0.02,
      description: 'Annual capacity degradation rate',
    },
    {
      key: 'availabilityPercent',
      label: t('calculator.operations.availability'),
      unit: '%',
      min: 0.85,
      max: 0.99,
      step: 0.01,
      default: 0.97,
      description: 'System availability for operation',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('calculator.title')} - {t('calculator.steps.operations')}
        </h3>
        <p className="text-sm text-gray-600">
          {t('calculator.operations.title')}
        </p>
      </div>

      {/* Operating Parameters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {operatingParams.map((param) => (
          <div key={param.key}>
            <label htmlFor={param.key} className="block text-sm font-medium text-gray-700 mb-2">
              {param.label} <span className="text-red-500">*</span>
            </label>

            {/* Slider + Input */}
            <div className="space-y-2">
              {/* Range Slider */}
              <div className="relative pt-1">
                <input
                  type="range"
                  id={`${param.key}-slider`}
                  min={param.min}
                  max={param.max}
                  step={param.step}
                  {...register(`operatingParams.${param.key}` as const, {
                    valueAsNumber: true,
                  })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{(param.min * 100).toFixed(0)}%</span>
                  <span>{(param.max * 100).toFixed(0)}%</span>
                </div>
              </div>

              {/* Number Input */}
              <div className="relative">
                <input
                  id={param.key}
                  type="number"
                  step={param.step}
                  min={param.min}
                  max={param.max}
                  {...register(`operatingParams.${param.key}` as const, {
                    valueAsNumber: true,
                  })}
                  className={`w-full px-4 py-2 pr-12 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.operatingParams?.[param.key as keyof typeof operatingParams] ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <span className="absolute right-4 top-2 text-gray-500">{param.unit}</span>
              </div>
            </div>

            {errors.operatingParams?.[param.key as keyof typeof operatingParams] && (
              <p className="mt-1 text-sm text-red-600">
                {errors.operatingParams[param.key as keyof typeof operatingParams]?.message}
              </p>
            )}

            {/* Parameter Description */}
            <p className="mt-2 text-xs text-gray-500">{param.description}</p>
          </div>
        ))}
      </div>

      {/* Parameter Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-blue-400 mr-2 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-blue-900">系统效率</h4>
              <p className="mt-1 text-xs text-blue-800">
                包括PCS、电池和辅助系统的往返效率。典型值：85-92%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-green-400 mr-2 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-green-900">放电深度 (DOD)</h4>
              <p className="mt-1 text-xs text-green-800">
                每次循环的最大放电深度。典型值：80-90%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-purple-400 mr-2 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-purple-900">日循环次数</h4>
              <p className="mt-1 text-xs text-purple-800">
                每日完整充放电循环次数。典型值：1-2次
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
