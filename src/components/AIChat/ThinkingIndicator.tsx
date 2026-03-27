/**
 * ThinkingIndicator - AI thinking animation
 *
 * Shows a loading animation while AI is processing
 */

import React from 'react';

interface ThinkingIndicatorProps {
  message?: string;
  className?: string;
}

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({
  message,
  className = '',
}) => {
  return (
    <div className={`flex items-center space-x-3 py-4 ${className}`}>
      {/* Animated dots */}
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>

      {/* Message */}
      {message && (
        <span className="text-sm text-gray-500">{message}</span>
      )}
    </div>
  );
};

export default ThinkingIndicator;
