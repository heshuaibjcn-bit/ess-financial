/**
 * AI Services - Export all AI-related services
 */

export { AIChatService, aiChatService, initializeAIChat } from './AIChatService';
export {
  buildSystemPrompt,
  buildUserPrompt,
  buildQuickPrompt,
  buildFollowUpPrompt,
  extractConversationSummary,
} from './PromptBuilder';
export {
  buildProjectContext,
  formatContextAsText,
} from './ContextBuilder';
export {
  parseSSEStream,
  StreamAccumulator,
  createMockStream,
  withStreamTimeout,
} from './StreamHandler';
