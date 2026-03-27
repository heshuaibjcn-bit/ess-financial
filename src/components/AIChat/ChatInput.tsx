/**
 * ChatInput - Message input component
 *
 * Handles user input for sending messages
 */

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  minRows?: number;
  maxRows?: number;
  className?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder,
  minRows = 1,
  maxRows = 4,
  className = '',
}) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const defaultPlaceholder = placeholder || t('aiChat.input.placeholder', {
    defaultValue: '输入您的问题...',
  });

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.min(
      Math.max(scrollHeight, minRows * 24),
      maxRows * 24
    );
    textarea.style.height = `${newHeight}px`;
  }, [message, minRows, maxRows]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || disabled) return;

    onSendMessage(trimmed);
    setMessage('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`chat-input border-t border-gray-200 bg-white p-4 ${className}`}>
      <div className="flex items-end space-x-2">
        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={defaultPlaceholder}
            disabled={disabled}
            rows={minRows}
            className={`
              w-full px-4 py-3 pr-12
              border border-gray-300 rounded-2xl
              resize-none
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
              text-sm
            `}
            style={{ minHeight: `${minRows * 24}px`, maxHeight: `${maxRows * 24}px` }}
          />

          {/* Character count */}
          {message.length > 0 && (
            <div className="absolute bottom-2 right-3 text-xs text-gray-400">
              {message.length}
            </div>
          )}
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className={`
            flex items-center justify-center
            w-12 h-12 rounded-full
            transition-colors duration-200
            ${disabled || !message.trim()
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
          aria-label={t('aiChat.input.send', { defaultValue: '发送' })}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>

      {/* Helper text */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        {t('aiChat.input.hint', { defaultValue: '按 Enter 发送，Shift + Enter 换行' })}
      </div>
    </div>
  );
};

export default ChatInput;
