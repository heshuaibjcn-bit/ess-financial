/**
 * Error Boundary Components
 *
 * Provides error boundary components at different levels:
 * - App-level: Catches all application errors
 * - Page-level: Catches errors in major sections
 * - Feature-level: Catches errors in individual components
 */

export { ErrorBoundary, withErrorBoundary, useErrorHandler } from './ErrorBoundary';
export { AppErrorBoundary } from './AppErrorBoundary';
export { PageErrorBoundary } from './PageErrorBoundary';
export { FeatureErrorBoundary } from './FeatureErrorBoundary';
