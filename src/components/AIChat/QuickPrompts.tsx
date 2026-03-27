/**
 * QuickPrompts - Quick prompt suggestions
 *
 * Shows predefined quick prompts for users to click
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import type { QuickPrompt } from '@/types/ai';

interface QuickPromptsProps {
  prompts: QuickPrompt[];
  onSelectPrompt: (prompt: QuickPrompt) => void;
  className?: string;
  disabled?: boolean;
}

export const QuickPrompts: React.FC<QuickPromptsProps> = ({
  prompts,
  onSelectPrompt,
  className = '',
  disabled = false,
}) => {
  const { t } = useTranslation();

  if (prompts.length === 0) {
    return null;
  }

  // Group prompts by category
  const groupedPrompts = prompts.reduce((acc, prompt) => {
    const category = prompt.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(prompt);
    return acc;
  }, {} as Record<string, QuickPrompt[]>);

  return (
    <div className={`quick-prompts ${className}`}>
      <div className="mb-3">
        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          {t('aiChat.quickPrompts.title', { defaultValue: 'Quick Questions' })}
        </h4>
      </div>

      <div className="flex flex-wrap gap-2">
        {prompts.map((prompt) => (
          <button
            key={prompt.id}
            onClick={() => !disabled && onSelectPrompt(prompt)}
            disabled={disabled}
            className={`
              px-3 py-1.5 text-sm rounded-lg border
              transition-all duration-200
              ${disabled
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 cursor-pointer'
              }
            `}
          >
            {prompt.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickPrompts;
