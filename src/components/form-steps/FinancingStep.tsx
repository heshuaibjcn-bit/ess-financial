/**
 * FinancingStep - Step 4: Financing plan
 *
 * Collects:
 * - Loan option (yes/no)
 * - Loan ratio, term, interest rate
 */

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Controller } from 'react-hook-form';

export const FinancingStep: React.FC = () => {
  const { t } = useTranslation();
  const { control, register, formState: { errors }, watch } = useFormContext();
  const hasLoan = watch('financing.hasLoan');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('calculator.title')} - {t('calculator.steps.financing')}
        </h3>
        <p className="text-sm text-gray-600">
          {t('calculator.financing.title')}
        </p>
      </div>

      {/* Loan Toggle */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-6">
        <Controller
          name="financing.hasLoan"
          control={control}
          render={({ field }) => (
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  {t('calculator.financing.hasLoan')}
                </h4>
                <p className="mt-1 text-xs text-gray-600">
                  Select if you want to include loan financing in the analysis
                </p>
              </div>
              <button
                type="button"
                onClick={() => field.onChange(!field.value)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  field.value ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    field.value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}
        />
      </div>

      {/* Financing Parameters (shown only when hasLoan is true) */}
      {hasLoan && (
        <div className="space-y-6 animate-fadeIn">
          {/* Equity Ratio */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <label htmlFor="equityRatio" className="block text-sm font-medium text-gray-700 mb-2">
              自有资金比例 (Equity Ratio) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="equityRatio"
                type="number"
                step="0.1"
                min="0"
                max="1"
                {...register('financing.equityRatio', {
                  valueAsNumber: true,
                })}
                className={`w-full px-4 py-2 pr-12 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.financing?.equityRatio ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <span className="absolute right-4 top-2 text-gray-500">%</span>
            </div>
            <p className="mt-1 text-xs text-gray-600">
              自有资金占比（30%推荐，70%贷款）
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Loan Ratio */}
            <div>
              <label htmlFor="loanRatio" className="block text-sm font-medium text-gray-700 mb-2">
                {t('calculator.financing.loanRatio')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="loanRatio"
                  type="number"
                  step="0.05"
                  min="0"
                  max="0.8"
                  {...register('financing.loanRatio', {
                    valueAsNumber: true,
                  })}
                  className={`w-full px-4 py-2 pr-12 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.financing?.loanRatio ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <span className="absolute right-4 top-2 text-gray-500">%</span>
              </div>
              {errors.financing?.loanRatio && (
                <p className="mt-1 text-sm text-red-600">{errors.financing.loanRatio.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {t('common.range')}: 0 - 80%
              </p>
            </div>

            {/* Loan Term */}
            <div>
              <label htmlFor="loanTerm" className="block text-sm font-medium text-gray-700 mb-2">
                {t('calculator.financing.loanTerm')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="loanTerm"
                  type="number"
                  min="1"
                  max="20"
                  {...register('financing.loanTerm', {
                    valueAsNumber: true,
                  })}
                  className={`w-full px-4 py-2 pr-20 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.financing?.loanTerm ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <span className="absolute right-4 top-2 text-gray-500">{t('calculator.financing.loanTermYears')}</span>
              </div>
              {errors.financing?.loanTerm && (
                <p className="mt-1 text-sm text-red-600">{errors.financing.loanTerm.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {t('common.range')}: 1 - 20 {t('calculator.financing.loanTermYears')}
              </p>
            </div>

            {/* Interest Rate */}
            <div>
              <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 mb-2">
                {t('calculator.financing.interestRate')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="interestRate"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="15"
                  {...register('financing.interestRate', {
                    valueAsNumber: true,
                  })}
                  className={`w-full px-4 py-2 pr-12 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.financing?.interestRate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <span className="absolute right-4 top-2 text-gray-500">%</span>
              </div>
              {errors.financing?.interestRate && (
                <p className="mt-1 text-sm text-red-600">{errors.financing.interestRate.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {t('common.range')}: 0.1 - 15%
              </p>
            </div>
          </div>

          {/* Tax Holiday */}
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <label htmlFor="taxHolidayYears" className="block text-sm font-medium text-gray-700 mb-2">
              增值税免税期 (Tax Holiday Years)
            </label>
            <input
              id="taxHolidayYears"
              type="number"
              min="0"
              max="10"
              {...register('financing.taxHolidayYears', {
                valueAsNumber: true,
              })}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.financing?.taxHolidayYears ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <p className="mt-1 text-xs text-gray-600">
              增值税及附加从第7年开始征收（默认6年免税期）
            </p>
          </div>
        </div>

        {/* Financing Summary */}
        <FinancingSummary />
      )}

      {/* No Financing Message */}
      {!hasLoan && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <svg
              className="w-5 h-5 text-yellow-400 mr-2 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-yellow-800">
                {t('calculator.financing.hasLoan')} - {t('common.no')}
              </h4>
              <p className="mt-1 text-xs text-yellow-700">
                Analysis will be performed with 100% equity financing (no loan).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Financing Summary Component
const FinancingSummary: React.FC = () => {
  const { t } = useTranslation();
  const { watch } = useFormContext();

  const totalInvestment = React.useMemo(() => {
    // This would calculate the total investment from the form values
    // For now, we'll use a placeholder
    return 5000000; // ¥5M
  }, []);

  const equityRatio = watch('financing.equityRatio') || 1.0;
  const loanRatio = watch('financing.loanRatio') || 0;
  const loanTerm = watch('financing.loanTerm') || 10;
  const interestRate = watch('financing.interestRate') || 4.5;
  const taxHolidayYears = watch('financing.taxHolidayYears') || 6;

  const equityAmount = totalInvestment * equityRatio;
  const loanAmount = totalInvestment * (1 - equityRatio);

  // Calculate annual loan payment (principal + interest)
  // Using standard amortization formula
  const monthlyRate = interestRate / 100 / 12;
  const numPayments = loanTerm * 12;
  const annualPayment = loanAmount > 0 ? loanAmount *
    (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1) : 0;

  const totalInterest = annualPayment * loanTerm - loanAmount;

  return (
    <div className="bg-white border border-gray-300 rounded-md p-6">
      <h4 className="text-sm font-semibold text-gray-900 mb-4">
        {t('calculator.financing.title')} {t('common.summary')}
      </h4>

      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-sm text-gray-600">{t('calculator.costs.totalInvestment')}</span>
          <span className="text-sm font-medium text-gray-900">
            ¥{(totalInvestment / 10000).toFixed(1)}万
          </span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-sm text-gray-600">
            {t('common.loan')} ({(loanRatio * 100).toFixed(0)}%)
          </span>
          <span className="text-sm font-medium text-blue-600">
            ¥{(loanAmount / 10000).toFixed(1)}万
          </span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-sm text-gray-600">
            {t('common.equity')} ({((1 - loanRatio) * 100).toFixed(0)}%)
          </span>
          <span className="text-sm font-medium text-green-600">
            ¥{(equityAmount / 10000).toFixed(1)}万
          </span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-sm text-gray-600">
            {t('calculator.financing.interestRate')}
          </span>
          <span className="text-sm font-medium text-gray-900">
            {interestRate.toFixed(2)}%
          </span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-sm text-gray-600">
            {t('calculator.financing.loanTerm')}
          </span>
          <span className="text-sm font-medium text-gray-900">
            {loanTerm} {t('calculator.financing.loanTermYears')}
          </span>
        </div>

        <div className="flex justify-between items-center py-2">
          <span className="text-sm font-medium text-gray-700">
            {t('common.annual')} {t('common.payment')}
          </span>
          <span className="text-base font-bold text-gray-900">
            ¥{(annualPayment / 10000).toFixed(2)}万
          </span>
        </div>

        <div className="flex justify-between items-center py-2 text-xs text-gray-500">
          <span>{t('common.total')} {t('common.interest')}</span>
          <span>¥{(totalInterest / 10000).toFixed(1)}万</span>
        </div>
      </div>
    </div>
  );
};
