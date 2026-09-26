import { requiredEnv } from './db'

export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

// Groq reserves max_completion_tokens against the per-minute output limit (1000 on the
// on_demand tier). Without a cap it reserves the model's default, which exceeds that limit.
const DEFAULT_MAX_COMPLETION_TOKENS = 400

export function getGroqConfig(): { apiKey: string; model: string; maxCompletionTokens: number } {
  const configured = Number(process.env.GROQ_MAX_COMPLETION_TOKENS)
  return {
    apiKey: requiredEnv('GROQ_API_KEY'),
    model: process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
    maxCompletionTokens: Number.isInteger(configured) && configured > 0 ? configured : DEFAULT_MAX_COMPLETION_TOKENS,
  }
}

// Token-optimized tool schemas (dense, minimal description tokens)
export const AI_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'searchBrands',
      description: 'Search gift card brands by keyword or category',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search term or category' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getBrandDetails',
      description: 'Get available denominations for a brand',
      parameters: {
        type: 'object',
        properties: {
          familyName: { type: 'string', description: 'Brand family ID (e.g. netflix-us)' },
        },
        required: ['familyName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'quotePayment',
      description: 'Get USDG or ETH payment quote on Robinhood Chain',
      parameters: {
        type: 'object',
        properties: {
          familyName: { type: 'string' },
          faceValue: { type: 'number', description: 'USD amount' },
          currency: { type: 'string', enum: ['USDG', 'ETH'] },
        },
        required: ['familyName', 'faceValue'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'buildPendingIntent',
      description: 'Build pending payment checkout intent for user wallet confirmation',
      parameters: {
        type: 'object',
        properties: {
          familyName: { type: 'string', description: 'e.g. netflix-us' },
          brandName: { type: 'string', description: 'e.g. Netflix' },
          faceValue: { type: 'number' },
          email: { type: 'string' },
          paymentCurrency: { type: 'string', enum: ['USDG', 'ETH'] },
        },
        required: ['familyName', 'faceValue', 'email'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getWalletBalance',
      description: 'Check USDG and ETH balance on Robinhood Chain',
      parameters: {
        type: 'object',
        properties: {
          walletAddress: { type: 'string' },
        },
        required: ['walletAddress'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'checkOrderStatus',
      description: 'Check status of an order',
      parameters: {
        type: 'object',
        properties: {
          orderId: { type: 'string' },
        },
        required: ['orderId'],
      },
    },
  },
] as const
