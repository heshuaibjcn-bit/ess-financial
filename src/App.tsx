/**
 * Main App Component
 *
 * C&I Energy Storage Investment Calculator
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './i18n/config'; // Initialize i18n
import './index.css';

// Import components
import { CalculatorForm } from './components/CalculatorForm';
import { ResultsOverview } from './components/ResultsOverview';
import { PageErrorBoundary } from './components';
import { useCalculator } from './hooks/useCalculator';
import { useAllProvinces } from './hooks/useProvince';
import { ProjectInput } from './domain/schemas/ProjectSchema';
import { BenchmarkEngine } from './domain/services/BenchmarkEngine';
import {
  Disclaimer,
  RiskWarning,
  InlineDisclaimer,
  TermsLink,
} from './components/Disclaimer';

function App() {
  const { t, i18n } = useTranslation();
  const { result, loading, error, calculate } = useCalculator({ debounce: 300 });
  const { provinces, loading: loadingProvinces } = useAllProvinces();
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');

  // Benchmark engine
  const [benchmarkEngine] = useState(() => new BenchmarkEngine());
  const [benchmarkComparison, setBenchmarkComparison] = useState<any>(null);

  // Handle calculation
  const handleCalculate = async (input: ProjectInput) => {
    try {
      const calcResult = await calculate(input);

      // Get benchmark comparison if available
      if (calcResult && provinces.length > 0) {
        try {
          const comparison = await benchmarkEngine.compare(input, calcResult);
          setBenchmarkComparison(comparison);
        } catch (err) {
          console.warn('Benchmark comparison failed:', err);
        }
      }
    } catch (err) {
      console.error('Calculation failed:', err);
    }
  };

  // Handle form submission
  const handleSubmit = async (input: ProjectInput) => {
    console.log('Project saved:', input);
    // TODO: Implement project save logic
  };

  // Language toggle
  const toggleLanguage = () => {
    const newLang = language === 'zh' ? 'en' : 'zh';
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('app.title')}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {t('app.subtitle')}
              </p>
            </div>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {language === 'zh' ? '中文' : 'English'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Calculator Form */}
          <div className="lg:col-span-2">
            <PageErrorBoundary pageName="CalculatorForm">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <CalculatorForm
                  onSubmit={handleSubmit}
                  onCalculate={handleCalculate}
                />
              </div>
            </PageErrorBoundary>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <PageErrorBoundary pageName="ResultsOverview">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    {t('results.title')}
                  </h2>

                  {loading && (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      <span className="ml-4 text-gray-600">{t('common.loading')}</span>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                      <div className="flex">
                        <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-red-800">{t('errors.calculation')}</h3>
                          <p className="mt-1 text-sm text-red-700">{error.message}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {result && !loading && (
                    <>
                      <ResultsOverview
                        result={result}
                        benchmarkComparison={benchmarkComparison}
                      />
                      {/* Add disclaimer for investment results */}
                      <div className="mt-4">
                        <Disclaimer type="minimal" variant="banner" />
                      </div>
                    </>
                  )}

                  {!result && !loading && !error && (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M15 11h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-500">
                        {t('calculator.title')} - {t('calculator.steps.basic')}
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
                        Fill in the form to see results
                      </p>
                    </div>
                  )}
                </div>
              </PageErrorBoundary>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              {t('calculator.title')}
            </h3>
            <p className="text-sm text-blue-800">
              Calculate IRR, NPV, payback period, and LCOE for your energy storage project
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              {t('sensitivity.title')}
            </h3>
            <p className="text-sm text-green-800">
              Analyze how parameter changes affect your investment returns
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">
              {t('benchmark.title')}
            </h3>
            <p className="text-sm text-purple-800">
              Compare your project with 110+ industry benchmarks
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        {/* Disclaimer */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Disclaimer type="short" variant="footer" />
          <TermsLink className="mb-4" />
        </div>

        {/* Footer content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-gray-100">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              © 2026 ESS Financial. {t('common.all')} {t('common.rights')}.
            </p>
            <p className="text-sm text-gray-500">
              Version 1.0.0 | {t('common.data')}: {t('common.source')} - {t('common.provinces')} 31
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
