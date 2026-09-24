import { Router, type Request, type Response } from 'express'
import { isAddress, type Address } from 'viem'
import { getGroqConfig, AI_TOOLS, GROQ_API_URL } from '../lib/groq'
import { SYSTEM_PROMPT } from '../lib/prompts'
import { listBrands, getProductOptions } from '../lib/cryptorefills'
import { getRelayOrderQuote, ROBINHOOD_CHAIN_ID, type RelayPaymentCurrency } from '../lib/relay'
import { fetchRobinhoodBalances } from './balances'
import { sql } from '../lib/db'

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

      // NOTE: this quote prices against a placeholder recipient (the treasury
      // wallet) purely to estimate the amount — it is NOT a real Cryptorefills
      // order, so its `steps` would deposit to the wrong address if executed.
      // We deliberately do not return steps here. The frontend must call the
      // real POST /orders (with paymentCurrency) once the user confirms, and
      // execute THOSE steps — never anything from this preview.
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
  let currentMessages: any[] = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages]
  const maxIterations = 5

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
        // Provider errors carry account details (org ID, tier); log them, don't send them to the browser
        console.error('[chat] Groq error', response.status, await response.text())
        const error = response.status === 429
          ? 'The assistant is getting a lot of requests. Try again in a minute.'
          : 'The assistant is unavailable right now. Try again shortly.'
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
          // leave toolArgs as {} if the model produced malformed JSON
        }

        res.write(`data: ${JSON.stringify({ type: 'tool_call', name: toolName, args: toolArgs })}\n\n`)

        const toolResult = await executeTool(toolName, toolArgs, userContext)

        if (toolResult?.widget) {
          res.write(`data: ${JSON.stringify({ type: 'widget', widget: toolResult.widget, data: toolResult })}\n\n`)
        }

        currentMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolName,
          content: JSON.stringify(toolResult),
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
