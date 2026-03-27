/**
 * KeyboardShortcutsHelp - Display available keyboard shortcuts
 *
 * Shows modal with all keyboard shortcuts
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

interface Shortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  description: string;
}

interface KeyboardShortcutsHelpProps {
  shortcuts: Shortcut[];
  onClose?: () => void;
  className?: string;
}

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  shortcuts,
  onClose,
  className = '',
}) => {
  const renderKeyCombo = (shortcut: Shortcut) => {
    const parts: string[] = [];

    if (shortcut.ctrlKey) parts.push('⌘');
    if (shortcut.shiftKey) parts.push('⇧');
    parts.push(shortcut.key.toUpperCase());

    return parts.join(' + ');
  };

  return (
    <div className={`keyboard-shortcuts-help ${className}`}>
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">键盘快捷键</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="space-y-2">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm text-gray-700">{shortcut.description}</span>
              <kbd className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-md text-sm font-mono text-gray-900 shadow-sm">
                {renderKeyCombo(shortcut)}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Windows系统请使用 Ctrl 键代替 ⌘
          </p>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsHelp;
