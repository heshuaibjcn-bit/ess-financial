/**
 * AIChatSidebar - Main AI chat sidebar component
 *
 * Slides in from right, contains all chat UI elements
 */

import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/uiStore';
import { useCalculationStore } from '@/stores/calculationStore';
import { useProjectStore } from '@/stores/projectStore';
import { QUICK_PROMPTS_ZH, QUICK_PROMPTS_EN } from '@/types/ai';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { QuickPrompts } from './QuickPrompts';
import { useAIChat } from '@/hooks/useAIChat';

interface AIChatSidebarProps {
  className?: string;
}

export const AIChatSidebar: React.FC<AIChatSidebarProps> = ({ className = '' }) => {
  const { t, i18n } = useTranslation();
  const language = i18n.language as 'zh' | 'en';

  // UI state
  const aiChatOpen = useUIStore((state) => state.aiChatOpen);
  const setAIChatOpen = useUIStore((state) => state.setAIChatOpen);
  const quickPrompts = useUIStore((state) => state.quickPrompts);

  // Get AI chat hook
  const {
    messages,
    isThinking,
    error,
    sendMessage,
    clearChat,
  } = useAIChat();

  // Get project data for context
  const result = useCalculationStore((state) => state.result);
  const currentProject = useProjectStore((state) => state.currentProject);
  const benchmarkComparison = useCalculationStore((state) => state.benchmarkComparison);

  // Initialize quick prompts on mount
  useEffect(() => {
    if (quickPrompts.length === 0) {
      const prompts = language === 'zh' ? QUICK_PROMPTS_ZH : QUICK_PROMPTS_EN;
      // We'll need to add this to the store
      // For now, we'll pass them directly to QuickPrompts
    }
  }, [language, quickPrompts.length]);

  // Quick prompts based on language
  const quickPromptsList = language === 'zh' ? QUICK_PROMPTS_ZH : QUICK_PROMPTS_EN;

  const handleClose = () => {
    setAIChatOpen(false);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleSendMessage = async (message: string) => {
    await sendMessage(message);
  };

  const handleSelectPrompt = async (prompt: { id: string; template: string }) => {
    await sendMessage(prompt.template);
  };

  const handleClearChat = () => {
    clearChat();
  };

  if (!aiChatOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-30 transition-opacity" />

      {/* Sidebar */}
      <div className="relative ml-auto w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {t('aiChat.title', { defaultValue: 'AI投资顾问' })}
              </h2>
              {result && (
                <p className="text-xs text-gray-500">
                  {t('aiChat.subtitle', { defaultValue: '基于当前项目分析' })}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Clear chat button */}
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title={t('aiChat.clearChat', { defaultValue: '清空对话' })}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}

            {/* Close button */}
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Chat messages */}
        <ChatMessageList
          messages={messages}
          isAiThinking={isThinking}
          thinkingMessage={t('aiChat.thinking', { defaultValue: 'AI正在思考...' })}
        />

        {/* Quick prompts - only show if no messages yet */}
        {messages.length === 0 && !isThinking && (
          <div className="px-4 py-4 border-t border-gray-100">
            <QuickPrompts
              prompts={quickPromptsList}
              onSelectPrompt={handleSelectPrompt}
              disabled={isThinking}
            />
          </div>
        )}

        {/* Input area */}
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isThinking || !result}
        />

        {/* Footer notice */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <p className="text-[10px] text-gray-500 text-center">
            {t('aiChat.disclaimer', {
              defaultValue: 'AI建议仅供参考，投资决策请谨慎评估'
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIChatSidebar;
