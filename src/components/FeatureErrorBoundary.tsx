/**
 * FeatureErrorBoundary - Error boundary for individual feature components
 *
 * Catches errors in specific features like charts, calculators, etc.
 * Provides a component-level fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorBoundary as BaseErrorBoundary } from './ErrorBoundary';

interface FeatureErrorBoundaryProps {
  children: ReactNode;
  featureName: string;
  fallback?: ReactNode;
}

export class FeatureErrorBoundary extends Component<FeatureErrorBoundaryProps> {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log feature-level errors
    console.error(`Feature Error (${this.props.featureName}):`, error);
    console.error('Component Stack:', errorInfo.componentStack);

    this.logError(error, errorInfo);
  }

  logError(error: Error, errorInfo: ErrorInfo) {
    // Send to error tracking service with lower severity
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        level: 'warning',
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
        tags: {
          boundary: 'feature',
          feature: this.props.featureName,
        },
      });
    }
  }

  render() {
    return (
      <BaseErrorBoundary
        level="feature"
        fallback={this.props.fallback || (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>{this.props.featureName}</strong> encountered an error and has been hidden.
            </p>
          </div>
        )}
        onError={(error, errorInfo) => this.componentDidCatch(error, errorInfo)}
      >
        {this.props.children}
      </BaseErrorBoundary>
    );
  }
}
