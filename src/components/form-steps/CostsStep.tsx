/**
 * CostsStep - Step 2: Cost structure breakdown
 *
 * Collects 9 cost components:
 * - Battery, PCS, EMS, Installation, Grid Connection
 * - Land, Development, Permitting, Contingency
 */

import React, { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export const CostsStep: React.FC = () => {
  const { t } = useTranslation();
  const { register, formState: { errors }, watch } = useFormContext();
  const costs = watch('costs');

  // Calculate total investment
  const totalInvestment = useMemo(() => {
    if (!costs) return 0;

    const { batteryCostPerKwh, pcsCostPerKw, emsCost, installationCostPerKw, gridConnectionCost,
      landCost, developmentCost, permittingCost, contingencyPercent } = costs;

    const capacity = watch('systemSize.capacity');
    const duration = watch('systemSize.duration');
    const power = capacity * 1000; // kW
    const energy = capacity * duration * 1000; // kWh

    // Calculate base costs
    const batteryTotal = batteryCostPerKwh * energy;
    const pcsTotal = pcsCostPerKw * power;
    const installationTotal = installationCostPerKw * power;

    // Sum all base costs
    const baseTotal = batteryTotal + pcsTotal + emsCost + installationTotal + gridConnectionCost +
      landCost + developmentCost + permittingCost;

    // Add contingency
    const contingency = baseTotal * contingencyPercent;

    return baseTotal + contingency;
  }, [costs, watch('systemSize.capacity'), watch('systemSize.duration')]);

  // Cost breakdown for display
  const costBreakdown = useMemo(() => {
    if (!costs) return [];

    const capacity = watch('systemSize.capacity');
    const duration = watch('systemSize.duration');
    const power = capacity * 1000; // kW
    const energy = capacity * duration * 1000; // kWh

    return [
      {
        key: 'batteryCostPerKwh',
        label: t('calculator.costs.batteryCost'),
        unit: t('calculator.costs.batteryCostUnit'),
        value: costs.batteryCostPerKwh,
        total: costs.batteryCostPerKwh * energy,
        color: 'bg-blue-500',
      },
      {
        key: 'pcsCostPerKw',
        label: t('calculator.costs.pcsCost'),
        unit: t('calculator.costs.pcsCostUnit'),
        value: costs.pcsCostPerKw,
        total: costs.pcsCostPerKw * power,
        color: 'bg-green-500',
      },
      {
        key: 'emsCost',
        label: t('calculator.costs.emsCost'),
        unit: t('calculator.costs.emsCostUnit'),
        value: costs.emsCost,
        total: costs.emsCost,
        color: 'bg-purple-500',
      },
      {
        key: 'installationCostPerKw',
        label: t('calculator.costs.installationCost'),
        unit: t('calculator.costs.installationCostUnit'),
        value: costs.installationCostPerKw,
        total: costs.installationCostPerKw * power,
        color: 'bg-yellow-500',
      },
      {
        key: 'gridConnectionCost',
        label: t('calculator.costs.gridConnectionCost'),
        unit: t('calculator.costs.gridConnectionCostUnit'),
        value: costs.gridConnectionCost,
        total: costs.gridConnectionCost,
        color: 'bg-pink-500',
      },
      {
        key: 'landCost',
        label: t('calculator.costs.landCost'),
        unit: t('calculator.costs.landCostUnit'),
        value: costs.landCost,
        total: costs.landCost,
        color: 'bg-indigo-500',
      },
      {
        key: 'developmentCost',
        label: t('calculator.costs.developmentCost'),
        unit: t('calculator.costs.developmentCostUnit'),
        value: costs.developmentCost,
        total: costs.developmentCost,
        color: 'bg-red-500',
      },
      {
        key: 'permittingCost',
        label: t('calculator.costs.permittingCost'),
        unit: t('calculator.costs.permittingCostUnit'),
        value: costs.permittingCost,
        total: costs.permittingCost,
        color: 'bg-orange-500',
      },
    ];
  }, [costs, watch('systemSize.capacity'), watch('systemSize.duration'), t]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('calculator.title')} - {t('calculator.steps.costs')}
        </h3>
        <p className="text-sm text-gray-600">
          {t('calculator.costs.title')}
        </p>
      </div>

      {/* Cost Input Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {costBreakdown.map((cost) => (
          <div key={cost.key}>
            <label htmlFor={cost.key} className="block text-sm font-medium text-gray-700 mb-2">
              {cost.label}
            </label>
            <div className="relative">
              <input
                id={cost.key}
                type="number"
                step="0.01"
                min="0"
                {...register(`costs.${cost.key}` as const, {
                  valueAsNumber: true,
                })}
                className={`w-full px-4 py-2 pr-24 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.costs?.[cost.key as keyof typeof costs] ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <span className="absolute right-4 top-2 text-sm text-gray-500">{cost.unit}</span>
            </div>
            {errors.costs?.[cost.key as keyof typeof costs] && (
              <p className="mt-1 text-sm text-red-600">
                {errors.costs[cost.key as keyof typeof costs]?.message}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Contingency */}
      <div>
        <label htmlFor="contingencyPercent" className="block text-sm font-medium text-gray-700 mb-2">
          {t('calculator.costs.contingency')} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="contingencyPercent"
            type="number"
            step="0.01"
            min="0"
            max="0.3"
            {...register('costs.contingencyPercent', {
              valueAsNumber: true,
            })}
            className={`w-full px-4 py-2 pr-16 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.costs?.contingencyPercent ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          <span className="absolute right-4 top-2 text-gray-500">%</span>
        </div>
        {errors.costs?.contingencyPercent && (
          <p className="mt-1 text-sm text-red-600">{errors.costs.contingencyPercent.message}</p>
        )}
      </div>

      {/* Cost Breakdown Chart */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">
          {t('calculator.costs.totalInvestment')}
        </h4>

        {/* Visual Bar Chart */}
        <div className="mb-4">
          {costBreakdown.map((cost) => {
            const percentage = totalInvestment > 0 ? (cost.total / totalInvestment) * 100 : 0;
            return (
              <div key={cost.key} className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-700">{cost.label}</span>
                  <span className="font-medium text-gray-900">
                    ¥{(cost.total / 10000).toFixed(1)}万 ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${cost.color} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Investment Display */}
        <div className="bg-white border border-gray-300 rounded-md p-4 mt-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-900">
              {t('calculator.costs.totalInvestment')}
            </span>
            <span className="text-2xl font-bold text-blue-600">
              ¥{(totalInvestment / 10000).toFixed(1)}万
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
