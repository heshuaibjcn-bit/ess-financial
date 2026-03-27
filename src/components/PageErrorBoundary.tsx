/**
 * PageErrorBoundary - Error boundary for page-level components
 *
 * Catches errors in major sections like CalculatorForm and ResultsOverview
 * Provides a section-level fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorBoundary as BaseErrorBoundary } from './ErrorBoundary';

interface PageErrorBoundaryProps {
  children: ReactNode;
  pageName: string;
  fallback?: ReactNode;
}

export class PageErrorBoundary extends Component<PageErrorBoundaryProps> {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log page-level errors
    console.error(`Page Error (${this.props.pageName}):`, error);
    console.error('Component Stack:', errorInfo.componentStack);

    this.logError(error, errorInfo);
  }

  logError(error: Error, errorInfo: ErrorInfo) {
    // Send to error tracking service
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        level: 'error',
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
        tags: {
          boundary: 'page',
          page: this.props.pageName,
        },
      });
    }
  }

  render() {
    return (
      <BaseErrorBoundary
        level="page"
        fallback={this.props.fallback}
        onError={(error, errorInfo) => this.componentDidCatch(error, errorInfo)}
      >
        {this.props.children}
      </BaseErrorBoundary>
    );
  }
}
