/**
 * Financial Data Disclaimer Component
 *
 * Displays legal disclaimers for financial calculations and investment advice.
 * Required for liability protection.
 */

import React from 'react';

export interface DisclaimerProps {
  type?: 'full' | 'short' | 'minimal';
  variant?: 'banner' | 'footer' | 'modal';
  className?: string;
}

/**
 * Main disclaimer component
 */
export const Disclaimer: React.FC<DisclaimerProps> = ({
  type = 'full',
  variant = 'footer',
  className = '',
}) => {
  const getDisclaimerText = () => {
    switch (type) {
      case 'full':
        return {
          title: 'Financial Data Disclaimer',
          text: 'The calculations, projections, and results provided by this platform are for informational purposes only and do not constitute financial, investment, legal, tax, or accounting advice. The information presented is based on assumptions and estimates that may not reflect actual market conditions or project outcomes. Past performance is not indicative of future results. Users should consult with qualified professionals before making any investment decisions. The platform operators and developers shall not be liable for any losses or damages arising from the use of this information.',
        points: [
          'Calculations are based on estimated inputs and assumptions',
          'Actual results may vary significantly from projected outcomes',
          'This tool does not consider all relevant factors for investment decisions',
          'Consult qualified financial, legal, and tax advisors before investing',
          'Platform operators are not liable for investment decisions based on this information',
        ],
        agreement: 'By using this platform, you acknowledge that you have read, understood, and agree to these terms.',
      };

      case 'short':
        return {
          title: 'Disclaimer',
          text: 'This calculator provides estimates for informational purposes only. Actual results may vary. Consult professional advisors before making investment decisions.',
          points: [],
          agreement: undefined,
        };

      case 'minimal':
        return {
          title: undefined,
          text: 'For informational purposes only. Not investment advice.',
          points: [],
          agreement: undefined,
        };

      default:
        return {
          title: 'Disclaimer',
          text: 'For informational purposes only.',
          points: [],
          agreement: undefined,
        };
    }
  };

  const content = getDisclaimerText();

  const baseClasses = {
    banner: 'bg-blue-50 border-l-4 border-blue-400 p-4 my-4',
    footer: 'bg-gray-50 border-t border-gray-200 p-6 mt-8',
    modal: 'bg-white p-6 rounded-lg shadow-lg',
  };

  const titleClasses = {
    banner: 'text-sm font-semibold text-blue-900 mb-1',
    footer: 'text-sm font-semibold text-gray-900 mb-2',
    modal: 'text-lg font-semibold text-gray-900 mb-3',
  };

  const textClasses = {
    banner: 'text-sm text-blue-800',
    footer: 'text-xs text-gray-600 mb-3',
    modal: 'text-sm text-gray-700 mb-4',
  };

  if (variant === 'banner' && type === 'minimal') {
    return (
      <div className={`${baseClasses[variant]} ${className}`}>
        <p className={`${textClasses[variant]} inline`}>
          <strong>Disclaimer:</strong> {content.text}
        </p>
      </div>
    );
  }

  return (
    <div className={`${baseClasses[variant]} ${className}`}>
      {content.title && (
        <h3 className={titleClasses[variant]}>{content.title}</h3>
      )}

      <p className={textClasses[variant]}>{content.text}</p>

      {content.points && content.points.length > 0 && (
        <ul className={`list-disc list-inside ${textClasses[variant]} space-y-1 mb-3`}>
          {content.points.map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>
      )}

      {content.agreement && (
        <p className="text-xs text-gray-500 italic mt-2">{content.agreement}</p>
      )}
    </div>
  );
};

/**
 * Short disclaimer for inline use
 */
export const InlineDisclaimer: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <span className={`text-xs text-gray-500 italic ${className}`}>
      {' '}
      * For informational purposes only. Not investment advice.
    </span>
  );
};

/**
 * Comprehensive disclaimer for PDF exports
 */
export const PDFDisclaimer: React.FC = () => {
  return (
    <div className="space-y-4 text-xs text-gray-600 border-t border-gray-300 pt-4 mt-8">
      <h4 className="font-semibold text-gray-900 mb-2">Disclaimer</h4>

      <p>
        This report contains financial calculations and projections for energy storage
        investment analysis. The information provided is for informational purposes only
        and does not constitute financial, investment, legal, tax, or accounting advice.
      </p>

      <div className="space-y-2">
        <p className="font-medium">Important Notices:</p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>
            Calculations are based on assumptions and estimates that may not reflect
            actual market conditions or project outcomes.
          </li>
          <li>
            Actual investment returns may vary significantly from projected results due
            to changes in market conditions, government policies, technology costs,
            and other factors.
          </li>
          <li>
            This analysis does not consider all relevant factors for making investment
            decisions, including but not limited to regulatory changes, grid constraints,
            site-specific conditions, and competitive dynamics.
          </li>
          <li>
            Users should consult with qualified financial, legal, and tax advisors
            before making any investment decisions.
          </li>
          <li>
            The platform operators, developers, and affiliates shall not be liable for
            any losses or damages arising from the use of this information or from any
            investment decisions based on this information.
          </li>
        </ul>
      </div>

      <p className="text-gray-500 italic">
        By using this report, you acknowledge that you have read, understood, and agree
        to these terms. This report is provided "as is" without any warranties, express
        or implied.
      </p>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-gray-500">
          <strong>Generated:</strong> {new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        <p className="text-gray-500">
          <strong>Platform Version:</strong> ESS Financial Calculator v1.0.0
        </p>
      </div>
    </div>
  );
};

/**
 * Risk warning banner
 */
export const RiskWarning: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-amber-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-amber-800">Investment Risk Warning</h3>
          <p className="mt-1 text-sm text-amber-700">
            Energy storage investments involve significant risks including but not limited
            to: market volatility, policy changes, technology obsolescence, regulatory
            risks, and project execution risks. Past performance is not indicative of
            future results. Only invest funds you can afford to lose.
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Data source attribution
 */
export const DataSourceAttribution: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`text-xs text-gray-500 ${className}`}>
      <p>
        <strong>Data Sources:</strong> Provincial policy data from government
        publications and industry reports. Benchmark data from publicly available
        sources including CNESA, news reports, and company announcements. Data is
        provided "as is" without warranty of accuracy or completeness.
      </p>
    </div>
  );
};

/**
 * Terms of service link
 */
export const TermsLink: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`text-xs text-gray-500 ${className}`}>
      <p>
        By using this platform, you agree to our{' '}
        <a href="/terms" className="text-blue-600 hover:underline">
          Terms of Service
        </a>
        {' '}and{' '}
        <a href="/privacy" className="text-blue-600 hover:underline">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
};

export default Disclaimer;
