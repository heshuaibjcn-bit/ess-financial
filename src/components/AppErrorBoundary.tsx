/**
 * AppErrorBoundary - Top-level error boundary for the entire application
 *
 * Catches all unhandled errors and provides a full-page fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorBoundary as BaseErrorBoundary } from './ErrorBoundary';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps> {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log application-level errors
    console.error('Application Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);

    // Send to error tracking service
    this.logError(error, errorInfo);
  }

  logError(error: Error, errorInfo: ErrorInfo) {
    // Send to error tracking service (Sentry, LogRocket, etc.)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        level: 'fatal',
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
        tags: {
          boundary: 'app',
        },
      });
    }

    // Log to console with structured data
    console.error(JSON.stringify({
      type: 'application_error',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    }));
  }

  render() {
    return (
      <BaseErrorBoundary
        level="app"
        onError={(error, errorInfo) => this.componentDidCatch(error, errorInfo)}
      >
        {this.props.children}
      </BaseErrorBoundary>
    );
  }
}
