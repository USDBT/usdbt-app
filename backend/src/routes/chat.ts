import { Router, type Request, type Response } from 'express'
import { isAddress, type Address } from 'viem'
import { getGroqConfig, AI_TOOLS, GROQ_API_URL } from '../lib/groq'
import { SYSTEM_PROMPT } from '../lib/prompts'
import { listBrands, getProductOptions } from '../lib/cryptorefills'
import { getRelayOrderQuote, ROBINHOOD_CHAIN_ID, type RelayPaymentCurrency } from '../lib/relay'
import { fetchRobinhoodBalances } from './balances'
import { sql } from '../lib/db'
import { parseUserIntent } from '../lib/nlp'

export const chatRouter = Router()

const TREASURY_ADDRESS = '0x6bcB5Bac495be85C079d780b66352Cd9B1aAAc47'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface ChatUserContext {
  walletAddress?: string
  paymentCurrency?: string
}

function toCurrency(value: unknown, fallback: string): RelayPaymentCurrency {
  const currency = (value ?? fallback) as string
  return currency === 'ETH' ? 'ETH' : 'USDG'
}

/**
 * Summarizes tool results to the bare minimum JSON for Groq's conversational context.
 * The client still receives the full rich widget with logos, but Groq only gets
 * ~20 tokens instead of 500+ tokens of bloated JSON (image URLs, category tags, etc.).
 */
export function summarizeToolResultForLLM(name: string, result: any): string {
  if (!result || result.error) return JSON.stringify({ error: result?.error || 'failed' })
  switch (name) {
    case 'searchBrands': {
      const matches = Array.isArray(result.matches) ? result.matches : []
      if (!matches.length) return JSON.stringify({ found: 0 })
      return JSON.stringify({
        found: matches.length,
        brands: matches.map((m: any) => `${m.name} (id:${m.id})`),
      })
    }
    case 'getBrandDetails': {
      return JSON.stringify({
        brand: result.familyName,
        denominations: result.denominations,
      })
    }
    case 'quotePayment': {
      return JSON.stringify({
        faceValue: result.faceValue,
        payAmount: result.paymentAmount,
        currency: result.paymentCurrency,
      })
    }
    case 'buildPendingIntent': {
      const i = result.intent || {}
      return JSON.stringify({
        ready: true,
        brand: i.brandName,
        value: i.faceValue,
        email: i.email,
        pay: `${i.paymentAmount} ${i.paymentCurrency}`,
      })
    }
    case 'getWalletBalance': {
      return JSON.stringify({
        usdg: result.usdg,
        eth: result.eth,
      })
    }
    case 'checkOrderStatus': {
      const o = result.order || {}
      return JSON.stringify({
        id: o.id,
        brand: o.brand_name,
        status: o.status,
      })
    }
    default:
      return JSON.stringify(result)
  }
}

export async function executeTool(name: string, args: any, userContext: ChatUserContext): Promise<any> {
  switch (name) {
    case 'searchBrands': {
      const allBrands = await listBrands('US')
      const q = String(args.query ?? '').toLowerCase()
      const matches = allBrands
        .filter(
          (b) =>
            b.brand_name.toLowerCase().includes(q) ||
            (b.categories ?? []).some((c) => c.toLowerCase().includes(q)),
        )
        .slice(0, 6)
        .map((b) => ({
          id: b.family_name,
          name: b.brand_name,
          categories: b.categories,
          image: b.logo_base_url ? `${b.logo_base_url}.webp` : b.logo_url,
        }))
      return { matches, widget: matches.length > 0 ? 'brand_carousel' : undefined }
    }

    case 'getBrandDetails': {
      const options = await getProductOptions(args.familyName, 'US')
      const denominations = options
        .filter((o) => !o.is_dynamic)
        .map((o) => Number(o.face_value?.amount?.price ?? o.denomination.replace(/[^0-9.]/g, '')))
        .filter((n) => Number.isFinite(n) && n > 0)

      return {
        familyName: args.familyName,
        denominations: Array.from(new Set(denominations)).sort((a, b) => a - b),
        widget: 'denomination_picker',
      }
    }

    case 'quotePayment': {
      const currency = toCurrency(args.currency, userContext.paymentCurrency ?? 'USDG')
      const faceValue = Number(args.faceValue)
      const approxUsdc = faceValue * 1.0064
      const quote = await getRelayOrderQuote({
        userWallet: userContext.walletAddress || TREASURY_ADDRESS,
        cryptorefillsDepositAddress: TREASURY_ADDRESS,
        cryptorefillsUsdcAmount: approxUsdc,
        currency,
      })

      return {
        faceValue,
        paymentCurrency: currency,
        paymentAmount: Number(quote.details.currencyIn.amountFormatted),
        timeEstimate: quote.details.timeEstimate,
      }
    }

    case 'buildPendingIntent': {
      if (!EMAIL_RE.test(String(args.email ?? ''))) {
        return { error: 'A valid recipient email is required.' }
      }

      const currency = toCurrency(args.paymentCurrency, userContext.paymentCurrency ?? 'USDG')
      const faceValue = Number(args.faceValue)
      const approxUsdc = faceValue * 1.0064
      let paymentAmount = faceValue
      let timeEstimate = 3

      try {
        const quote = await getRelayOrderQuote({
          userWallet: userContext.walletAddress || TREASURY_ADDRESS,
          cryptorefillsDepositAddress: TREASURY_ADDRESS,
          cryptorefillsUsdcAmount: approxUsdc,
          currency,
        })
        paymentAmount = Number(quote.details.currencyIn.amountFormatted)
        timeEstimate = quote.details.timeEstimate
      } catch (err) {
        console.warn('[chat] quote fallback in buildPendingIntent:', err)
      }

      return {
        intent: {
          familyName: args.familyName,
          brandName: args.brandName || args.familyName,
          faceValue,
          email: args.email,
          paymentCurrency: currency,
          paymentAmount,
          timeEstimate,
          chainId: ROBINHOOD_CHAIN_ID,
          requiresOrderCreation: true,
        },
        widget: 'order_intent',
      }
    }

    case 'getWalletBalance': {
      const address = args.walletAddress
      if (!isAddress(address)) return { error: 'invalid walletAddress' }
      const balances = await fetchRobinhoodBalances(address as Address)
      return { ...balances, chainId: ROBINHOOD_CHAIN_ID, widget: 'wallet_balance' }
    }

    case 'checkOrderStatus': {
      const [order] = await sql`
        SELECT id, brand_name, face_value, payment_currency, status, created_at
        FROM orders WHERE id = ${args.orderId} LIMIT 1
      `
      if (!order) return { error: 'Order not found' }
      return { order, widget: 'order_status' }
    }

    default:
      return { error: `Unknown tool: ${name}` }
  }
}

export async function handleChat(req: Request, res: Response) {
  const { messages, walletAddress, paymentCurrency = 'USDG', stream = true } = req.body

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' })
  }
  if (!stream) {
    return res.status(400).json({ error: 'Streaming mode is required (stream: true)' })
  }

  const { apiKey, model, maxCompletionTokens } = getGroqConfig()

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const userContext: ChatUserContext = { walletAddress, paymentCurrency }

  // 1. NLP Pre-Processing on the latest user message
  const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')?.content || ''
  const parsedIntent = parseUserIntent(lastUserMsg)

  // 2. Token-saving fast paths:
  // If the user is searching for a brand or category (e.g. "what about for shopping" or "netflix"),
  // run searchBrands directly, emit the widget immediately, and ask Groq for a single-turn concise reply
  // without sending function calling schemas. This saves ~85% of input tokens and cuts out an entire roundtrip!
  if (parsedIntent.intent === 'CATEGORY_SEARCH' || parsedIntent.intent === 'BRAND_SEARCH') {
    try {
      const searchRes = await executeTool('searchBrands', { query: parsedIntent.cleanQuery }, userContext)
      if (searchRes.matches && searchRes.matches.length > 0) {
        // Emit brand carousel widget immediately
        res.write(`data: ${JSON.stringify({ type: 'widget', widget: 'brand_carousel', data: searchRes })}\n\n`)

        // Call Groq ONCE with minimal tokens and NO tools schema
        const brandNames = searchRes.matches.map((m: any) => m.name).join(', ')
        const singleTurnPrompt = [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `${lastUserMsg}\n[System: Matching gift cards displayed in widget: ${brandNames}. Give a warm 1-2 sentence recommendation inviting the user to pick one.]`,
          },
        ]

        const response = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: singleTurnPrompt,
            temperature: 0.2,
            max_completion_tokens: 150,
          }),
        })

        if (response.ok) {
          const data: any = await response.json()
          const text = data.choices?.[0]?.message?.content
          if (text) {
            res.write(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`)
          }
          res.write('data: [DONE]\n\n')
          return res.end()
        }
      }
    } catch (nlpErr) {
      console.warn('[chat] NLP fast-path fallback:', nlpErr)
    }
  }

  // Fast path for balance checks
  if (parsedIntent.intent === 'BALANCE_CHECK' && userContext.walletAddress && isAddress(userContext.walletAddress)) {
    try {
      const balances = await fetchRobinhoodBalances(userContext.walletAddress as Address)
      res.write(`data: ${JSON.stringify({ type: 'widget', widget: 'wallet_balance', data: { ...balances, chainId: ROBINHOOD_CHAIN_ID } })}\n\n`)
      res.write(`data: ${JSON.stringify({ type: 'text', content: `Your Robinhood Chain balance is ${balances.usdg} USDG and ${balances.eth} ETH.` })}\n\n`)
      res.write('data: [DONE]\n\n')
      return res.end()
    } catch (balErr) {
      console.warn('[chat] balance fast-path fallback:', balErr)
    }
  }

  // 3. Fallback / Multi-turn Tool-calling loop with strict token budgeting:
  // Cap message history to the last 4 messages to avoid unbounded token growth.
  const trimmedHistory = messages.slice(-4)
  let currentMessages: any[] = [{ role: 'system', content: SYSTEM_PROMPT }, ...trimmedHistory]
  const maxIterations = 3

  try {
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: currentMessages,
          tools: AI_TOOLS,
          tool_choice: 'auto',
          temperature: 0.2,
          max_completion_tokens: maxCompletionTokens,
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        console.error('[chat] Groq error', response.status, errText)
        const error = response.status === 429
          ? 'The assistant is experiencing high volume right now. Please select an option above or try again in a moment.'
          : 'The assistant is temporarily unavailable. Please try again in a moment.'
        res.write(`data: ${JSON.stringify({ type: 'error', error })}\n\n`)
        res.write('data: [DONE]\n\n')
        return res.end()
      }

      const data: any = await response.json()
      const message = data.choices?.[0]?.message

      if (message?.content) {
        res.write(`data: ${JSON.stringify({ type: 'text', content: message.content })}\n\n`)
      }

      if (!message?.tool_calls?.length) {
        break
      }

      currentMessages.push(message)
      for (const toolCall of message.tool_calls) {
        const toolName = toolCall.function.name
        let toolArgs: any = {}
        try {
          toolArgs = JSON.parse(toolCall.function.arguments)
        } catch {
          // leave toolArgs as {} if model produced malformed JSON
        }

        res.write(`data: ${JSON.stringify({ type: 'tool_call', name: toolName, args: toolArgs })}\n\n`)

        const toolResult = await executeTool(toolName, toolArgs, userContext)

        // Send full rich payload to frontend widget
        if (toolResult?.widget) {
          res.write(`data: ${JSON.stringify({ type: 'widget', widget: toolResult.widget, data: toolResult })}\n\n`)
        }

        // Send compact, token-minimized summary back to Groq
        currentMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolName,
          content: summarizeToolResultForLLM(toolName, toolResult),
        })
      }
    }

    res.write('data: [DONE]\n\n')
    return res.end()
  } catch (err: any) {
    console.error('[chat] streaming error:', err)
    res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`)
    res.write('data: [DONE]\n\n')
    return res.end()
  }
}

chatRouter.post('/', handleChat)
