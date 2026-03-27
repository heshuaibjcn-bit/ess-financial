/**
 * AI Chat Type Definitions
 *
 * Type definitions for the AI chat feature
 */

import type { EngineResult } from '@/domain/services/CalculationEngine';
import type { ProjectInput } from '@/domain/schemas/ProjectSchema';

/**
 * Chat message role
 */
export type ChatRole = 'user' | 'assistant' | 'system';

/**
 * Chat message structure
 */
export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

/**
 * Project analysis context for AI
 */
export interface ProjectAnalysisContext {
  project: {
    id?: string;
    province: string;
    systemSize: {
      capacity: number;
      power: number;
      duration: number;
    };
  };
  financials: {
    irr: number | null;
    npv: number;
    paybackPeriod: number;
    lcoe: number;
    roi: number;
    profitMargin: number;
  };
  revenue: {
    peakValleyArbitrage: number;
    capacityCompensation: number;
    demandResponse: number;
    auxiliaryServices: number;
    totalRevenue: number;
  };
  costs: {
    initialInvestment: number;
    annualOpex: number;
    annualFinancing: number;
  };
  validation: {
    valid: boolean;
    issues: string[];
  };
  benchmarkComparison?: {
    percentileIRR?: number;
    percentileNPV?: number;
    rating?: string;
  };
}

/**
 * Quick prompt preset
 */
export interface QuickPrompt {
  id: string;
  label: string;
  template: string;
  category?: string;
}

/**
 * AI service configuration
 */
export interface AIServiceConfig {
  provider: 'anthropic' | 'openai' | 'mock';
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  streamEnabled?: boolean;
}

/**
 * AI service response
 */
export interface AIServiceResponse {
  content: string;
  finishReason?: 'stop' | 'length' | 'content_filter';
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Stream event types
 */
export type StreamEventType = 'text' | 'error' | 'done';

/**
 * Stream event
 */
export interface StreamEvent {
  type: StreamEventType;
  data?: string;
  error?: string;
}

/**
 * AI chat error types
 */
export type AIChatError =
  | 'no_api_key'
  | 'rate_limit_exceeded'
  | 'invalid_request'
  | 'network_error'
  | 'context_too_large'
  | 'unknown';

/**
 * AI chat state interface
 */
export interface AIChatState {
  isOpen: boolean;
  messages: ChatMessage[];
  isThinking: boolean;
  inputMessage: string;
  error: string | null;
  errorType: AIChatError | null;
  quickPrompts: QuickPrompt[];
}

/**
 * Quick prompt presets (Chinese)
 */
export const QUICK_PROMPTS_ZH: QuickPrompt[] = [
  {
    id: 'risk',
    label: '这个项目的投资风险是什么？',
    template: '请分析这个储能项目的投资风险，包括技术风险、市场风险、政策风险等方面。',
    category: 'risk'
  },
  {
    id: 'optimize',
    label: '如何优化项目参数以提高IRR？',
    template: '基于当前项目参数，请给出3个具体的优化建议来提高内部收益率(IRR)，并说明预期效果。',
    category: 'optimization'
  },
  {
    id: 'benchmark',
    label: '与行业平均水平相比如何？',
    template: '请对比分析这个项目与行业同类项目的差异，指出优势和不足之处。',
    category: 'comparison'
  },
  {
    id: 'sensitivity',
    label: '最敏感的参数是哪个？',
    template: '请分析哪个参数对项目收益率影响最大，并解释原因。',
    category: 'analysis'
  },
  {
    id: 'recommendations',
    label: '给出3个改进建议',
    template: '请给出3个具体的改进建议来提升这个项目的投资价值，按优先级排序。',
    category: 'improvement'
  }
];

/**
 * Quick prompt presets (English)
 */
export const QUICK_PROMPTS_EN: QuickPrompt[] = [
  {
    id: 'risk',
    label: 'What are the investment risks?',
    template: 'Please analyze the investment risks of this energy storage project, including technical, market, and policy risks.',
    category: 'risk'
  },
  {
    id: 'optimize',
    label: 'How to optimize parameters for better IRR?',
    template: 'Based on the current project parameters, please provide 3 specific optimization suggestions to improve the internal rate of return (IRR), and explain the expected results.',
    category: 'optimization'
  },
  {
    id: 'benchmark',
    label: 'How does it compare to industry average?',
    template: 'Please compare and analyze the differences between this project and similar industry projects, highlighting strengths and weaknesses.',
    category: 'comparison'
  },
  {
    id: 'sensitivity',
    label: 'Which parameter is most sensitive?',
    template: 'Please analyze which parameter has the greatest impact on project returns and explain why.',
    category: 'analysis'
  },
  {
    id: 'recommendations',
    label: 'Give 3 improvement suggestions',
    template: 'Please provide 3 specific improvement suggestions to enhance the investment value of this project, ranked by priority.',
    category: 'improvement'
  }
];
