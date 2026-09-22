import { requiredEnv } from './db'

export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export function getGroqConfig(): { apiKey: string; model: string } {
  return {
    apiKey: requiredEnv('GROQ_API_KEY'),
    model: process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
  }
}

export const AI_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'searchBrands',
      description: 'Search available gift card brands by keyword or category',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search term or category' },
          category: { type: 'string', description: 'Category name' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getBrandDetails',
      description: 'Get available denominations and card details for a brand',
      parameters: {
        type: 'object',
        properties: {
          familyName: { type: 'string', description: 'Brand family name, e.g. netflix-us' },
        },
        required: ['familyName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'quotePayment',
      description: 'Get exact Robinhood Chain USDG or ETH payment quote for a card face value',
      parameters: {
        type: 'object',
        properties: {
          familyName: { type: 'string', description: 'Brand family ID' },
          faceValue: { type: 'number', description: 'Face value in USD' },
          currency: { type: 'string', enum: ['USDG', 'ETH'], description: 'Payment token' },
        },
        required: ['familyName', 'faceValue'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'buildPendingIntent',
      description: 'Construct a pending payment intent widget payload for user review and wallet checkout',
      parameters: {
        type: 'object',
        properties: {
          familyName: { type: 'string', description: 'Brand family ID (e.g. netflix-us)' },
          brandName: { type: 'string', description: 'Brand display name (e.g. Netflix)' },
          faceValue: { type: 'number', description: 'Card face value in USD' },
          email: { type: 'string', description: 'Recipient delivery email' },
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
      description: 'Check USDG and ETH balance of a wallet on Robinhood Chain',
      parameters: {
        type: 'object',
        properties: {
          walletAddress: { type: 'string', description: '0x wallet address' },
        },
        required: ['walletAddress'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'checkOrderStatus',
      description: 'Check status of an existing order by order ID',
      parameters: {
        type: 'object',
        properties: {
          orderId: { type: 'string', description: 'UUID of the order' },
        },
        required: ['orderId'],
      },
    },
  },
] as const
