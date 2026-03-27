/**
 * ErrorBoundary - React Error Boundary Component
 *
 * Catches JavaScript errors in component trees and displays fallback UI
 * Implements different boundary levels: App, Page, and Feature
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

/**
 * Error boundary level determines the fallback UI detail
 */
export type ErrorBoundaryLevel = 'app' | 'page' | 'feature';

interface ErrorBoundaryProps {
  children: ReactNode;
  level?: ErrorBoundaryLevel;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error state for different boundary levels
 */
interface ErrorState {
  level: ErrorBoundaryLevel;
  error: Error;
  errorInfo: ErrorInfo;
  onReset: () => void;
}

/**
 * Error fallback UI component
 */
function ErrorFallback({ level, error, onReset }: ErrorState) {
  const handleReset = () => {
    // Clear any cached state
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
    onReset();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8">
        {/* Icon based on level */}
        <div className="flex justify-center mb-6">
          {level === 'app' && (
            <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 2.667 1.732 3.464l6.064 2c.771 1.333 2.693 1.333 3.464 0l4.352-2.667M12 9V9m0 0a9 9 0 019 9m0 0a9 9 0 01-9 9" />
            </svg>
          )}
          {level === 'page' && (
            <svg className="w-12 h-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h8m-8 0h8m-8-4v8m0 0l8 0m0-8v8" />
            </svg>
          )}
          {level === 'feature' && (
            <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        {/* Title based on level */}
        <h2 className={`text-2xl font-bold text-center mb-2 ${
          level === 'app' ? 'text-red-900' :
          level === 'page' ? 'text-orange-900' :
          'text-yellow-900'
        }`}>
          {level === 'app' && 'Application Error'}
          {level === 'page' && 'Page Error'}
          {level === 'feature' && 'Component Error'}
        </h2>

        {/* Message */}
        <p className="text-center text-gray-600 mb-6">
          {level === 'app' && 'The application encountered an unexpected error. Please try refreshing the page.'}
          {level === 'page' && 'This page encountered an error. Please try navigating to another section.'}
          {level === 'feature' && 'A component in this section encountered an error. It has been hidden to prevent further issues.'}
        </p>

        {/* Error details (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mb-6">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 mb-2">
              Error Details
            </summary>
            <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm font-mono text-red-800 break-all">
                {error.message}
              </p>
              {error.stack && (
                <pre className="mt-2 text-xs text-red-700 overflow-auto max-h-32">
                  {error.stack}
                </pre>
              )}
            </div>
          </details>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            {level === 'app' ? 'Reload Application' : 'Reload Page'}
          </button>

          {level !== 'app' && (
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Go to Homepage
            </button>
          )}

          <button
            onClick={() => {
              console.error('Error boundary caught:', error);
              console.error('Error info:', error);
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Report Issue
          </button>
        </div>

        {/* Support info */}
        {level === 'app' && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Need help?</strong> Contact support at{' '}
              <a href="mailto:support@ess-financial.com" className="text-blue-600 hover:underline">
                support@ess-financial.com
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Main Error Boundary Component
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error
    console.error('Error Boundary caught an error:', error);
    console.error('Error Info:', errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to error tracking service (if available)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
        level: this.props.level || 'feature',
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Use default fallback based on level
      const level = this.props.level || 'feature';
      return (
        <ErrorFallback
          level={level}
          error={this.state.error!}
          errorInfo={{ componentStack: '' }}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * HOC for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  level: ErrorBoundaryLevel = 'feature',
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary level={level} fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Hook for triggering errors from functional components
 * (useful for testing error boundaries)
 */
export function useErrorHandler() {
  return (error: Error) => {
    throw error;
  };
}
