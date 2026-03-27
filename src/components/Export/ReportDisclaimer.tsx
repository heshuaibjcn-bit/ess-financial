/**
 * Report Disclaimer Component
 *
 * Generates disclaimers for PDF and other exported reports.
 * Ensures compliance with financial regulations.
 */

import React from 'react';

export interface ReportDisclaimerProps {
  reportType: 'investment-analysis' | 'sensitivity-analysis' | 'benchmark-comparison';
  projectName?: string;
  includeDate?: boolean;
  includeVersion?: boolean;
}

/**
 * Report disclaimer component
 */
export const ReportDisclaimer: React.FC<ReportDisclaimerProps> = ({
  reportType,
  projectName,
  includeDate = true,
  includeVersion = true,
}) => {
  const getReportTypeLabel = () => {
    switch (reportType) {
      case 'investment-analysis':
        return 'Investment Analysis Report';
      case 'sensitivity-analysis':
        return 'Sensitivity Analysis Report';
      case 'benchmark-comparison':
        return 'Benchmark Comparison Report';
      default:
        return 'Analysis Report';
    }
  };

  return (
    <div className="border-t border-gray-300 pt-6 mt-8 space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">
          {getReportTypeLabel()} Disclaimer
        </h3>
        {projectName && (
          <p className="text-xs text-gray-600">Project: {projectName}</p>
        )}
      </div>

      {/* Main Disclaimer Text */}
      <div className="text-xs text-gray-600 space-y-2">
        <p>
          <strong>IMPORTANT NOTICE:</strong> This report and its contents are provided
          for informational purposes only and do not constitute financial, investment,
          legal, tax, or accounting advice. The calculations, projections, and
          recommendations are based on assumptions and estimates that may not reflect
          actual market conditions or project outcomes.
        </p>

        <div className="bg-gray-50 p-3 rounded border border-gray-200">
          <p className="font-medium text-gray-900 mb-1">Key Limitations:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>
              All financial projections are estimates based on current market conditions
              and assumptions
            </li>
            <li>
              Actual investment returns may vary significantly from projected results
            </li>
            <li>
              This analysis does not consider all factors that may affect investment
              outcomes
            </li>
            <li>
              Past performance of similar projects is not indicative of future results
            </li>
            <li>
              Government policies and regulations may change, affecting project economics
            </li>
          </ul>
        </div>

        <div>
          <p className="font-medium text-gray-900 mb-1">Professional Advice Required:</p>
          <p>
            Users are strongly advised to consult with qualified financial advisors,
            legal counsel, tax professionals, and other experts before making any
            investment decisions. This report should not be the sole basis for any
            investment decision.
          </p>
        </div>

        <div>
          <p className="font-medium text-gray-900 mb-1">No Warranties:</p>
          <p>
            This report is provided "as is" without any warranties, express or implied,
            including but not limited to warranties of accuracy, completeness,
            merchantability, or fitness for a particular purpose. The platform operators
            and developers make no representations about the suitability of this
            information for any purpose.
          </p>
        </div>

        <div>
          <p className="font-medium text-gray-900 mb-1">Limitation of Liability:</p>
          <p>
            In no event shall the platform operators, developers, or affiliates be liable
            for any direct, indirect, incidental, special, consequential, or punitive
            damages arising out of the use of or inability to use this report or any
            information contained herein.
          </p>
        </div>

        <div>
          <p className="font-medium text-gray-900 mb-1">Data Sources:</p>
          <p className="text-gray-600">
            Analysis based on provincial policy data, industry benchmarks, and publicly
            available information. While efforts have been made to ensure accuracy,
            no guarantee is made regarding the completeness or accuracy of this data.
          </p>
        </div>

        <p className="italic text-gray-500">
          By using this report, you acknowledge that you have read, understood, and
          agree to these terms. You assume full responsibility for any investment
          decisions made based on this information.
        </p>
      </div>

      {/* Footer */}
      {includeDate && (
        <div className="text-xs text-gray-500 pt-3 border-t border-gray-200">
          <p><strong>Generated:</strong> {new Date().toLocaleDateString()}</p>
          {includeVersion && (
            <p><strong>Report Version:</strong> 1.0.0 | ESS Financial Calculator</p>
          )}
          <p className="mt-1 text-gray-400">
            This report is confidential and intended solely for the use of the
            individual or entity to whom it is addressed.
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Regulatory compliance notice
 */
export const RegulatoryNotice: React.FC = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded p-4 mt-6">
      <h4 className="text-sm font-semibold text-blue-900 mb-2">
        Regulatory Notice
      </h4>
      <div className="text-xs text-blue-800 space-y-1">
        <p>
          This calculator is provided as a tool for preliminary investment analysis
          and is not intended to replace professional financial advice or regulatory
          compliance assessments.
        </p>
        <p>
          Users are responsible for ensuring compliance with all applicable laws,
          regulations, and guidelines in their jurisdiction, including but not limited
          to:
        </p>
        <ul className="list-disc list-inside ml-4 space-y-1 text-blue-700">
          <li>Securities laws and regulations</li>
          <li>Financial services regulations</li>
          <li>Investment advisor registration requirements</li>
          <li>Tax compliance requirements</li>
          <li>Environmental and safety regulations</li>
        </ul>
      </div>
    </div>
  );
};

/**
 * Certification notice (for compliance)
 */
export const CertificationNotice: React.FC<{
  analystName?: string;
  certificationNumber?: string;
}> = ({ analystName, certificationNumber }) => {
  return (
    <div className="text-xs text-gray-600 mt-4 pt-4 border-t border-gray-200">
      <p className="font-medium text-gray-900 mb-1">Certification & Disclaimer:</p>
      <p>
        This analysis was prepared by {analystName || 'ESS Financial Calculator'}
        using automated calculation tools. While reasonable efforts have been made to
        ensure accuracy, no representation or guarantee is made regarding the
        completeness or accuracy of this analysis.
      </p>
      {certificationNumber && (
        <p className="mt-1">
          <strong>Certification Number:</strong> {certificationNumber}
        </p>
      )}
      <p className="mt-2 italic text-gray-500">
        This analysis is not a recommendation to buy, sell, or hold any investment.
        All investments involve risk, including the possible loss of principal.
      </p>
    </div>
  );
};

export default ReportDisclaimer;
