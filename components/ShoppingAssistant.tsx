'use client'

import { FormEvent, ReactNode, useEffect, useRef, useState } from 'react'
import { AlertCircle, ArrowRight, Bot, Check, Clock3, LoaderCircle, LockKeyhole, MessageCircle, RotateCcw, Send, ShieldCheck, Sparkles, Wallet } from 'lucide-react'
import { useAccount } from 'wagmi'
import { createOrder, getOrderStatus } from '@/lib/api'
import { ROBINHOOD_CHAIN_ID, paymentErrorMessage, useRelayPayment } from '@/lib/relay'
import { ConnectButton } from '@rainbow-me/rainbowkit'


type PaymentCurrency = 'USDG' | 'ETH'
type CheckoutPhase = 'idle' | 'wallet_prompting' | 'relay_bridging' | 'completed' | 'failed'
type CheckoutState = { phase: CheckoutPhase; detail?: string; orderId?: string }
type AssistantWidget = { widget: string; data: Record<string, unknown> }
type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string; widgets: AssistantWidget[]; retryText?: string }
type Intent = {
  familyName: string; brandName: string; faceValue: number; email: string
  paymentCurrency: PaymentCurrency; paymentAmount: number; timeEstimate: number
  chainId: number; requiresOrderCreation: true
}

function shortCurrency(value: number, currency: PaymentCurrency) {
  const formatted = new Intl.NumberFormat('en-US', { maximumFractionDigits: currency === 'ETH' ? 6 : 2 }).format(value)
  return formatted + ' ' + currency
}

function parseInlineMarkdown(text: string): ReactNode[] {
  const tokenRegex = /(`[^`]+`|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_)/g
  const parts = text.split(tokenRegex)

  return parts.map((part, i) => {
    if (!part) return null

    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={i}
          className="assistant-inline-code"
          style={{
            padding: '2px 5px',
            borderRadius: '4px',
            background: 'rgba(0, 0, 0, 0.06)',
            fontFamily: 'monospace',
            fontSize: '0.9em',
          }}
        >
          {part.slice(1, -1)}
        </code>
      )
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (linkMatch) {
      const label = linkMatch[1]
      let href = linkMatch[2].trim()
      if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('/')) {
        href = 'https://' + href
      }
      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="assistant-link"
          style={{ color: '#2b2bf5', textDecoration: 'underline' }}
        >
          {parseInlineMarkdown(label)}
        </a>
      )
    }

    if (
      (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
    ) {
      return (
        <strong key={i} style={{ fontWeight: 650, color: 'inherit' }}>
          {parseInlineMarkdown(part.slice(2, -2))}
        </strong>
      )
    }

    if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
    ) {
      return <em key={i}>{parseInlineMarkdown(part.slice(1, -1))}</em>
    }

    return part
  }).filter(Boolean)
}

function MarkdownText({ text }: { text: string }) {
  if (!text) return null

  const lines = text.split(/\r?\n/)
  const elements: ReactNode[] = []

  let inCodeBlock = false
  let codeBlockLines: string[] = []
  let listBuffer: { ordered: boolean; text: string }[] = []

  const flushList = () => {
    if (listBuffer.length === 0) return
    const isOrdered = listBuffer[0].ordered
    const items = listBuffer.map((item, idx) => (
      <li key={idx} style={{ marginBottom: '3px', lineHeight: 1.5 }}>
        {parseInlineMarkdown(item.text)}
      </li>
    ))
    const key = `list-${elements.length}`
    if (isOrdered) {
      elements.push(
        <ol key={key} className="assistant-md-ol" style={{ margin: '4px 0 8px 0', paddingLeft: '18px', listStyleType: 'decimal' }}>
          {items}
        </ol>
      )
    } else {
      elements.push(
        <ul key={key} className="assistant-md-ul" style={{ margin: '4px 0 8px 0', paddingLeft: '18px', listStyleType: 'disc' }}>
          {items}
        </ul>
      )
    }
    listBuffer = []
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const trimmed = rawLine.trim()

    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${elements.length}`}
            className="assistant-md-pre"
            style={{
              margin: '6px 0',
              padding: '10px 12px',
              borderRadius: '8px',
              background: '#1e2433',
              color: '#f1f5f9',
              overflowX: 'auto',
              fontFamily: 'monospace',
              fontSize: '11.5px',
              whiteSpace: 'pre',
            }}
          >
            <code>{codeBlockLines.join('\n')}</code>
          </pre>
        )
        codeBlockLines = []
        inCodeBlock = false
      } else {
        flushList()
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine)
      continue
    }

    if (!trimmed) {
      flushList()
      continue
    }

    const ulMatch = rawLine.match(/^\s*[-*]\s+(.*)$/)
    if (ulMatch) {
      listBuffer.push({ ordered: false, text: ulMatch[1] })
      continue
    }

    const olMatch = rawLine.match(/^\s*\d+\.\s+(.*)$/)
    if (olMatch) {
      listBuffer.push({ ordered: true, text: olMatch[1] })
      continue
    }

    flushList()

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={`h4-${elements.length}`} style={{ margin: '8px 0 3px 0', fontSize: '13px', fontWeight: 650, lineHeight: 1.3 }}>
          {parseInlineMarkdown(trimmed.slice(4))}
        </h4>
      )
      continue
    }
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={`h3-${elements.length}`} style={{ margin: '10px 0 4px 0', fontSize: '14px', fontWeight: 650, lineHeight: 1.3 }}>
          {parseInlineMarkdown(trimmed.slice(3))}
        </h3>
      )
      continue
    }
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h2 key={`h2-${elements.length}`} style={{ margin: '12px 0 4px 0', fontSize: '15px', fontWeight: 700, lineHeight: 1.3 }}>
          {parseInlineMarkdown(trimmed.slice(2))}
        </h2>
      )
      continue
    }

    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote
          key={`quote-${elements.length}`}
          style={{
            margin: '6px 0',
            paddingLeft: '10px',
            borderLeft: '3px solid #8993d6',
            color: '#5a667f',
            fontStyle: 'italic',
          }}
        >
          {parseInlineMarkdown(trimmed.slice(2))}
        </blockquote>
      )
      continue
    }

    elements.push(
      <p key={`p-${elements.length}`} style={{ margin: '0 0 5px 0', lineHeight: 1.55 }}>
        {parseInlineMarkdown(rawLine)}
      </p>
    )
  }

  flushList()
  if (inCodeBlock && codeBlockLines.length > 0) {
    elements.push(
      <pre
        key={`code-${elements.length}`}
        className="assistant-md-pre"
        style={{
          margin: '6px 0',
          padding: '10px 12px',
          borderRadius: '8px',
          background: '#1e2433',
          color: '#f1f5f9',
          overflowX: 'auto',
          fontFamily: 'monospace',
          fontSize: '11.5px',
          whiteSpace: 'pre',
        }}
      >
        <code>{codeBlockLines.join('\n')}</code>
      </pre>
    )
  }

  return (
    <div className="assistant-markdown-body" style={{ whiteSpace: 'normal' }}>
      {elements}
    </div>
  )
}

function ChatBubble({ message, busyLabel, checkoutStates, onBrand, onDenomination, onConfirm, onRetry }: {
  message: ChatMessage; busyLabel: string; checkoutStates: Record<string, CheckoutState>
  onBrand: (name: string) => void; onDenomination: (value: number) => void
  onConfirm: (intent: Intent, key: string) => void
  onRetry?: (messageId: string, retryText: string) => void
}) {
  return (
    <div className={'assistant-message-row ' + (message.role === 'user' ? 'is-user' : '')}>
      {message.role === 'assistant' && <div className="assistant-avatar"><Bot size={16} /></div>}
      <div className={'assistant-message-stack ' + (message.role === 'user' ? 'user-stack' : '')}>
        {message.text && (
          <div className={'assistant-bubble ' + (message.role === 'user' ? 'assistant-user-bubble user-bubble' : 'assistant-bot-bubble bot-bubble')}>
            {message.role === 'assistant' ? <MarkdownText text={message.text} /> : message.text}
            {message.role === 'assistant' && message.retryText && (
              <div>
                <button
                  type="button"
                  className="assistant-retry-button"
                  onClick={() => onRetry?.(message.id, message.retryText!)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  <RotateCcw size={12} />
                  <span>Retry</span>
                </button>
              </div>
            )}
          </div>
        )}
        {message.role === 'assistant' && !message.text && busyLabel && (
          <div className="assistant-thinking"><LoaderCircle size={14} className="animate-spin" />{busyLabel}</div>
        )}
        {message.widgets.map((widget, index) => {
          const data = widget.data
          const key = message.id + '-' + index
          if (widget.widget === 'brand_carousel') {
            const matches = Array.isArray(data.matches) ? data.matches as Array<Record<string, unknown>> : []
            if (!matches.length) return null
            return (
              <section className="assistant-widget" key={key} aria-label="Gift card matches">
                <p className="assistant-widget-label">A few good matches</p>
                <div className="assistant-brand-list">
                  {matches.map((brand, brandIndex) => {
                    const name = String(brand.name ?? 'Gift card')
                    const image = typeof brand.image === 'string' ? brand.image : ''
                    return (
                      <button className="assistant-brand-card" key={String(brand.id ?? brandIndex)} onClick={() => onBrand(name)}>
                        <span className="assistant-brand-mark">
                          {image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={image} alt="" loading="lazy" />
                          ) : <Sparkles size={17} />}
                        </span>
                        <span className="assistant-brand-name">{name}</span><ArrowRight size={14} />
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          }
          if (widget.widget === 'denomination_picker') {
            const values = Array.isArray(data.denominations) ? data.denominations.map(Number).filter(Number.isFinite) : []
            return (
              <section className="assistant-widget" key={key}>
                <p className="assistant-widget-label">Choose a value</p>
                <div className="assistant-denominations">
                  {values.map((value) => <button key={value} onClick={() => onDenomination(value)}>{'$'}{value}</button>)}
                </div>
              </section>
            )
          }
          if (widget.widget === 'wallet_balance') {
            return (
              <section className="assistant-inline-widget" key={key}>
                <span className="assistant-inline-icon"><Wallet size={16} /></span>
                <div><strong>Robinhood Chain balance</strong><p>{shortCurrency(Number(data.usdg ?? 0), 'USDG')} <span>·</span> {shortCurrency(Number(data.eth ?? 0), 'ETH')}</p></div>
                <span className="assistant-network">Chain {String(data.chainId ?? ROBINHOOD_CHAIN_ID)}</span>
              </section>
            )
          }
          if (widget.widget === 'order_status') {
            const order = (data.order ?? {}) as Record<string, unknown>
            return (
              <section className="assistant-inline-widget" key={key}>
                <span className="assistant-inline-icon"><Clock3 size={16} /></span>
                <div><strong>{String(order.brand_name ?? 'Order')}</strong><p>{String(order.status ?? 'Status unavailable')}</p></div>
              </section>
            )
          }
          if (widget.widget === 'order_intent') {
            const intent = data.intent as Intent | undefined
            if (!intent || !intent.requiresOrderCreation) return null
            const checkout = checkoutStates[key] ?? { phase: 'idle' as CheckoutPhase }
            const isBusy = checkout.phase === 'wallet_prompting' || checkout.phase === 'relay_bridging'
            return (
              <section className="assistant-intent-card" key={key}>
                <div className="assistant-intent-top">
                  <div className="assistant-intent-mark"><Sparkles size={18} /></div>
                  <div><span className="assistant-widget-label">Ready for your review</span><h3>{intent.brandName}</h3></div>
                  <span className="assistant-intent-value">{'$'}{intent.faceValue}</span>
                </div>
                <div className="assistant-intent-details">
                  <div><span>Delivery email</span><strong>{intent.email}</strong></div>
                  <div><span>Estimated payment</span><strong>{shortCurrency(intent.paymentAmount, intent.paymentCurrency)}</strong></div>
                  <div><span>Estimated time</span><strong>About {Math.max(1, Math.ceil(intent.timeEstimate / 60))} min</strong></div>
                </div>
                <p className="assistant-estimate-note">Payment is an estimate. The exact route and amount are created after you confirm.</p>
                {checkout.phase === 'completed' ? (
                  <div className="assistant-checkout-result success"><Check size={17} />Card issued! Sent to {intent.email}</div>
                ) : checkout.phase === 'failed' ? (
                  <>
                    <div className="assistant-checkout-result failed"><AlertCircle size={16} />{checkout.detail ?? 'Checkout could not be completed.'}</div>
                    <button className="assistant-retry-button" onClick={() => onConfirm(intent, key)}>Try again</button>
                  </>
                ) : (
                  <>
                    {checkout.detail && <p className="assistant-checkout-detail">{checkout.detail}</p>}
                    <button className="assistant-confirm-button" disabled={isBusy} onClick={() => onConfirm(intent, key)}>
                      {isBusy ? <><LoaderCircle size={16} className="animate-spin" />{checkout.phase === 'relay_bridging' ? 'Payment submitted · tracking order' : 'Preparing your payment'}</> : <>Confirm &amp; Pay on Robinhood <ArrowRight size={16} /></>}
                    </button>
                    <p className="assistant-signing-note"><LockKeyhole size={12} /> You approve every wallet transaction.</p>
                  </>
                )}
              </section>
            )
          }
          return null
        })}
      </div>
    </div>
  )
}

function readSseBlock(block: string): string | null {
  const data = block.split(/\r?\n/).filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trimStart()).join('\n')
  return data || null
}

function mapErrorToFriendly(raw: unknown, isNetworkFetch = false): string {
  const text = (
    raw instanceof Error ? raw.message : typeof raw === 'string' ? raw : JSON.stringify(raw ?? '')
  ).toLowerCase()

  if (
    /429|rate_limit|rate_limit_exceeded|request too large|too many requests|lot of requests|busy/.test(
      text,
    )
  ) {
    return 'The assistant is busy right now. Wait a few seconds and tap Retry.'
  }

  if (
    isNetworkFetch ||
    /failed to fetch|networkerror|econnrefused|could not reach|reach the assistant|connection|network error|offline|502|503|504/.test(
      text,
    )
  ) {
    return 'Could not reach the assistant. Check your connection and tap Retry.'
  }

  return "The assistant couldn't answer that. Tap Retry to try again."
}

export function ShoppingAssistant({ walletAddress, savedEmail }: { walletAddress?: string; savedEmail?: string }) {
  const { address, isConnected } = useAccount()
  const payWithRelay = useRelayPayment()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [currency, setCurrency] = useState<PaymentCurrency>('USDG')
  const [loading, setLoading] = useState(false)
  const [busyLabel, setBusyLabel] = useState('')
  const [networkError, setNetworkError] = useState('')
  const [checkoutStates, setCheckoutStates] = useState<Record<string, CheckoutState>>({})
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeAddress = address ?? walletAddress

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busyLabel])

  function setCheckout(key: string, state: CheckoutState) {
    setCheckoutStates((current) => ({ ...current, [key]: state }))
  }

  async function sendMessage(raw: string, baseMessages?: ChatMessage[]) {
    const content = raw.trim()
    if (!content || loading) return
    setInput('')
    setNetworkError('')
    setLoading(true)
    setBusyLabel('Thinking')

    const base = baseMessages ?? messages
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', text: content, widgets: [] }
    const assistantId = crypto.randomUUID()
    const assistantMessage: ChatMessage = { id: assistantId, role: 'assistant', text: '', widgets: [] }
    const nextMessages = [...base, userMessage, assistantMessage]
    setMessages(nextMessages)

    // Limit chat history payload to avoid bloating input tokens
    const history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = nextMessages
      .filter((message) => message.text.trim().length > 0 && !message.retryText)
      .slice(-6)
      .map((message) => ({ role: message.role, content: message.text }))
    if (savedEmail) {
      history.unshift({ role: 'system', content: 'Saved email: ' + savedEmail })
    }

    try {
      // This same-origin Next.js route proxies the request to the backend.
      let response: Response
      try {
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
          body: JSON.stringify({ messages: history, walletAddress: activeAddress, paymentCurrency: currency, stream: true }),
        })
      } catch (err) {
        const friendly = mapErrorToFriendly(err, true)
        setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, text: friendly, retryText: content } : message))
        return
      }

      if (!response.ok || !response.body) {
        let errBody = ''
        try {
          const payload = await response.json()
          errBody = payload.error ? String(payload.error) : JSON.stringify(payload)
        } catch {
          errBody = await response.text().catch(() => '')
        }
        const isNetwork = response.status === 502 || response.status === 503 || response.status === 504
        const friendly = mapErrorToFriendly(`${response.status} ${errBody}`, isNetwork)
        setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, text: friendly, retryText: content } : message))
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let streamDone = false

      const handleBlock = (block: string) => {
        const rawEvent = readSseBlock(block)
        if (!rawEvent) return
        if (rawEvent === '[DONE]') { streamDone = true; return }
        let event: Record<string, unknown>
        try { event = JSON.parse(rawEvent) as Record<string, unknown> } catch { return }
        if (event.type === 'text' && typeof event.content === 'string') {
          const text = event.content
          setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, text: message.text + text } : message))
          setBusyLabel('')
        } else if (event.type === 'tool_call') {
          const name = String(event.name ?? '')
          setBusyLabel(name === 'searchBrands' ? 'Finding gift cards' : name === 'getBrandDetails' ? 'Checking values' : 'Preparing details')
        } else if (event.type === 'widget' && typeof event.widget === 'string') {
          const widgetData = event.data && typeof event.data === 'object' ? event.data as Record<string, unknown> : {}
          setMessages((current) => current.map((message) => message.id === assistantId
            ? { ...message, widgets: [...message.widgets, { widget: event.widget as string, data: widgetData }] }
            : message))
          setBusyLabel('')
        } else if (event.type === 'error') {
          const raw = [event.error, event.details].filter(Boolean).map(String).join(' ')
          const friendly = mapErrorToFriendly(raw)
          setMessages((current) => current.map((message) => message.id === assistantId
            ? { ...message, text: friendly, retryText: content }
            : message))
          setBusyLabel('')
        }
      }

      while (!streamDone) {
        const result = await reader.read()
        if (result.done) break
        buffer += decoder.decode(result.value, { stream: true })
        const blocks = buffer.split(/\r?\n\r?\n/)
        buffer = blocks.pop() ?? ''
        blocks.forEach(handleBlock)
      }
      buffer += decoder.decode()
      if (buffer.trim()) handleBlock(buffer)
    } catch (error) {
      const friendly = mapErrorToFriendly(error, true)
      setMessages((current) => current.map((message) => message.id === assistantId
        ? { ...message, text: message.retryText ? message.text : friendly, retryText: content }
        : message))
    } finally {
      setLoading(false)
      setBusyLabel('')
    }
  }

  function handleRetry(failedMessageId: string, textToRetry: string) {
    if (loading) return
    const assistantIdx = messages.findIndex((m) => m.id === failedMessageId)
    if (assistantIdx === -1) {
      void sendMessage(textToRetry)
      return
    }

    let userIdx = -1
    for (let i = assistantIdx - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userIdx = i
        break
      }
    }

    const trimmed = messages.filter((_, idx) => idx !== assistantIdx && idx !== userIdx)
    void sendMessage(textToRetry, trimmed)
  }

  async function confirmAndPay(intent: Intent, key: string) {
    if (!isConnected || !activeAddress) {
      setCheckout(key, { phase: 'failed', detail: 'Connect your wallet before confirming this order.' })
      return
    }
    if (!intent.familyName || !intent.brandName || !intent.faceValue || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(intent.email)) {
      setCheckout(key, { phase: 'failed', detail: 'This order needs a valid brand, amount, and delivery email.' })
      return
    }
    if (intent.chainId !== ROBINHOOD_CHAIN_ID) {
      setCheckout(key, { phase: 'failed', detail: 'This payment intent is for an unsupported network.' })
      return
    }

    setCheckout(key, { phase: 'wallet_prompting', detail: 'Creating a fresh payment route for your review.' })
    try {
      // Chat quotes are display-only. This creates the real order and executable Relay steps.
      const order = await createOrder({
        brandName: intent.brandName,
        familyName: intent.familyName,
        countryCode: 'US',
        denomination: intent.faceValue,
        faceValue: intent.faceValue,
        email: intent.email,
        walletAddress: activeAddress,
        paymentCurrency: intent.paymentCurrency,
      })
      await payWithRelay(order, (description) => {
        setCheckout(key, { phase: 'wallet_prompting', detail: 'Exact payment: ' + order.paymentAmount + ' ' + intent.paymentCurrency + '. ' + description, orderId: order.orderId })
      })

      setCheckout(key, { phase: 'relay_bridging', detail: 'Payment submitted. Waiting for card delivery.', orderId: order.orderId })
      for (let attempt = 0; attempt < 60; attempt += 1) {
        const status = await getOrderStatus(order.orderId)
        if (status.status === 'delivered') {
          setCheckout(key, { phase: 'completed', orderId: order.orderId })
          return
        }
        if (status.status === 'failed' || status.status === 'refunded') {
          throw new Error(status.failureReason || (status.status === 'refunded' ? 'The payment was refunded.' : 'The order could not be completed.'))
        }
        await new Promise((resolve) => setTimeout(resolve, 5000))
      }
      throw new Error('Payment was submitted, but delivery is taking longer than expected. Check Orders for updates.')
    } catch (error) {
      setCheckout(key, { phase: 'failed', detail: paymentErrorMessage(error, 'Checkout could not be completed. Try again.') })
    }
  }

  const suggestions = ['Show me Netflix gift cards', 'I need a card for gaming', 'What can I buy for $25?']

  return (
    <div className="assistant-screen">
      <header className="assistant-page-header">
        <div className="assistant-heading-mark"><Sparkles size={19} /></div>
        <div className="assistant-heading-copy">
          <span>USDBT SHOPPING ASSISTANT</span>
          <h1>What are you shopping for?</h1>
          <p>Tell me what you need. I’ll find a card and help you check out.</p>
        </div>
        <div className="assistant-header-trust"><ShieldCheck size={15} /> You stay in control</div>
      </header>

      <section className="assistant-panel" aria-label="AI shopping assistant">
        <div className="assistant-conversation" ref={scrollRef} aria-live="polite">
          {messages.length === 0 ? (
            <div className="assistant-welcome">
              <div className="assistant-welcome-icon"><MessageCircle size={22} /></div>
              <h2>Start with what you have in mind.</h2>
              <p>Ask for a brand, a category, or a budget. Your assistant can help with gift cards, balances, and order status.</p>
              <div className="assistant-suggestions">
                {suggestions.map((suggestion) => <button key={suggestion} onClick={() => void sendMessage(suggestion)}>{suggestion}<ArrowRight size={13} /></button>)}
              </div>
            </div>
          ) : messages.map((message) => (
            <ChatBubble
              key={message.id}
              message={message}
              busyLabel={message.role === 'assistant' && loading && message.id === messages[messages.length - 1]?.id ? busyLabel : ''}
              checkoutStates={checkoutStates}
              onBrand={(name) => void sendMessage('I would like the ' + name + ' gift card.')}
              onDenomination={(value) => void sendMessage('I would like the $' + value + ' denomination.')}
              onConfirm={(intent, key) => void confirmAndPay(intent, key)}
              onRetry={(id, text) => handleRetry(id, text)}
            />
          ))}
        </div>
        {networkError && <div className="assistant-inline-error"><AlertCircle size={14} />{networkError}</div>}
        <form className="assistant-composer" onSubmit={(event: FormEvent) => { event.preventDefault(); void sendMessage(input) }}>
          <div className="assistant-composer-topline">
            <div className='assistant-wallet-status'>{activeAddress ? 'Wallet connected' : <ConnectButton accountStatus='address' showBalance={false} chainStatus='none' />}</div>
            <div className="assistant-currency-picker" aria-label="Payment currency">
              <span>Pay with</span>
              {(['USDG', 'ETH'] as PaymentCurrency[]).map((option) => (
                <button type="button" key={option} aria-pressed={currency === option} className={currency === option ? 'selected' : ''} onClick={() => setCurrency(option)}>{option}</button>
              ))}
            </div>
          </div>
          <div className="assistant-input-row">
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask for a gift card, category, or order status…" aria-label="Message the shopping assistant" disabled={loading} />
            <button className="assistant-send-button" type="submit" disabled={loading || !input.trim()} aria-label="Send message">
              {loading ? <LoaderCircle size={17} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <p className="assistant-privacy-note"><LockKeyhole size={11} /> No KYC. Your wallet only signs transactions you approve.</p>
        </form>
      </section>
    </div>
  )
}