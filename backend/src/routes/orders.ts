import { Router, type Request, type Response } from 'express'
import { sql } from '../lib/db'
import { validateOrder, createCROrder } from '../lib/cryptorefills'
import { ORDER_STATUS } from '../lib/order-status'
import { isAddress } from 'viem'
import { isSimulatedAddress, simulateConfig, simulatedCoinAmount } from '../lib/simulate'
import { sendDeliveryEmail } from '../lib/email'
import { getRelayOrderQuote, ROBINHOOD_CHAIN_ID, BASE_CHAIN_ID, type RelayPaymentCurrency } from '../lib/relay'
import {
  type SupportedChain,
  type SupportedCurrency,
  convertUsdToCrypto,
  generateSolanaDepositAddress,
  formatSolanaPayUri,
} from '../lib/multichain'
import { randomBytes } from 'crypto'
import {
  MAX_LOYALTY_DISCOUNT_SHARE, POINTS_PER_USD, REFERRAL_DISCOUNT_SHARE, PointsUnavailableError,
  getPointsBalance, insertOrderRedeemingPoints, isFirstOrder, resolveReferrer,
} from '../lib/rewards'

export const ordersRouter = Router()

const ORDER_TTL_MINUTES = 30
const POINTS_CHANGED = 'Your reward points balance changed. Review your order and try again.'

export async function createOrder(req: Request, res: Response) {
  const {
    brandName, familyName, countryCode = 'US',
    denomination, productValue,
    faceValue, email, walletAddress,
    paymentCurrency = 'USDG',
    paymentChain = 'robinhood',
    quantity = 1,
    loyaltyPointsUsed = 0,
    referralCode,
    isNft = false,
    isEscrow = false,
  } = req.body

  if (!brandName || !familyName || !denomination || !faceValue || !email || !walletAddress) {
    return res.status(400).json({ error: 'brandName, familyName, denomination, faceValue, email, and walletAddress are required' })
  }
  if (!isAddress(walletAddress)) {
    return res.status(400).json({ error: 'invalid walletAddress' })
  }
  // Only Robinhood Chain is wired end to end (Relay quotes originate there and the wallet
  // flow only signs on 4663). Base/Ethereum/Solana stay disabled until they settle for real.
  if (paymentChain !== 'robinhood') {
    return res.status(400).json({ error: 'Only Robinhood Chain payments are supported right now' })
  }
  if (paymentCurrency !== 'USDG' && paymentCurrency !== 'ETH') {
    return res.status(400).json({ error: 'paymentCurrency must be USDG or ETH' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'invalid email' })
  }

  const selectedChain: SupportedChain = (paymentChain as SupportedChain) || 'robinhood'
  const selectedQty = Math.max(1, Math.min(100, Number(quantity) || 1))
  const singleFaceValue = Number(faceValue)
  const subtotal = singleFaceValue * selectedQty

  // 1. Bulk volume discount tier calculation
  let volumeDiscountPct = 0
  if (selectedQty >= 25) volumeDiscountPct = 6
  else if (selectedQty >= 10) volumeDiscountPct = 4
  else if (selectedQty >= 5) volumeDiscountPct = 2

  const volumeDiscountAmount = parseFloat(((subtotal * volumeDiscountPct) / 100).toFixed(2))

  // 2. Referral discount: 2% off a buyer's first order, only for a code owned by a registered user
  let referralDiscountAmount = 0
  let validReferralCode: string | null = null
  const referrerWallet = referralCode ? await resolveReferrer(referralCode, walletAddress) : null
  if (referrerWallet && await isFirstOrder(walletAddress)) {
    validReferralCode = String(referralCode).trim().toUpperCase()
    referralDiscountAmount = parseFloat((subtotal * REFERRAL_DISCOUNT_SHARE).toFixed(2))
  }

  // 3. Loyalty points redemption (100 points = $1, max 20% of subtotal), capped at the real balance.
  // The points are deducted in the same transaction that inserts the order.
  let pointsToUse = 0
  const requestedPoints = Math.floor(Math.max(0, Number(loyaltyPointsUsed) || 0))
  if (requestedPoints > 0) {
    const maxPoints = Math.floor(subtotal * MAX_LOYALTY_DISCOUNT_SHARE * POINTS_PER_USD)
    pointsToUse = Math.min(requestedPoints, maxPoints, await getPointsBalance(walletAddress))
  }
  const loyaltyDiscountAmount = parseFloat((pointsToUse / POINTS_PER_USD).toFixed(2))

  const totalDiscount = volumeDiscountAmount + referralDiscountAmount + loyaltyDiscountAmount
  const effectiveUsdTotal = Math.max(1, parseFloat((subtotal - totalDiscount).toFixed(2)))

  const userIp = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? '127.0.0.1'
  const userAgent = req.headers['user-agent'] ?? 'usdbt-backend/1.0'

  // Determine target chain ID for EVM
  let chainId = ROBINHOOD_CHAIN_ID
  if (selectedChain === 'base') chainId = BASE_CHAIN_ID
  else if (selectedChain === 'ethereum') chainId = 1
  else if (selectedChain === 'solana') chainId = 0

  const currency = paymentCurrency as SupportedCurrency

  // Simulated test wallets only; every real order goes through Relay + Cryptorefills below
  if (isSimulatedAddress(walletAddress)) {
    const coinAmount = selectedChain === 'solana'
      ? convertUsdToCrypto(effectiveUsdTotal, currency)
      : simulatedCoinAmount(effectiveUsdTotal)

    const expiresAt = new Date(Date.now() + ORDER_TTL_MINUTES * 60 * 1000)
    const solanaDeposit = selectedChain === 'solana' ? generateSolanaDepositAddress(randomBytes(8).toString('hex')) : null

    const nftTokenId = isNft ? `NFT-${Date.now().toString(36).toUpperCase()}` : null
    const escrowStatus = isEscrow || effectiveUsdTotal >= 250 ? 'escrow_locked' : null
    const escrowReleaseAt = escrowStatus ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null

    const inserted = await insertOrderRedeemingPoints(walletAddress, pointsToUse, (tx) => tx`
        INSERT INTO orders
          (wallet_address, email, card_type, brand_id, brand_name, face_value,
           payment_chain_id, payment_currency, payment_amount, fee_rate, status, expires_at,
           payment_address, coin_amount, quantity, volume_discount_pct, loyalty_points_used,
           loyalty_discount_amount, referral_code, referral_discount_amount, is_nft, nft_token_id,
           is_escrow, escrow_status, escrow_release_at, payment_chain, solana_deposit_address)
        VALUES
          (${walletAddress}, ${email}, 'gift_card', ${familyName}, ${brandName}, ${effectiveUsdTotal},
           ${chainId}, ${currency}, ${coinAmount}, 100, ${ORDER_STATUS.PENDING_PAYMENT}, ${expiresAt},
           ${solanaDeposit ?? simulateConfig.paymentAddress}, ${coinAmount}, ${selectedQty},
           ${volumeDiscountPct}, ${pointsToUse}, ${loyaltyDiscountAmount}, ${validReferralCode},
           ${referralDiscountAmount}, ${isNft}, ${nftTokenId}, ${isEscrow || effectiveUsdTotal >= 250},
           ${escrowStatus}, ${escrowReleaseAt}, ${selectedChain}, ${solanaDeposit})
        RETURNING id, expires_at, payment_address, coin_amount
      `)
      .catch((err) => err instanceof PointsUnavailableError ? null : Promise.reject(err))
    if (!inserted) return res.status(409).json({ error: POINTS_CHANGED })
    const [order] = inserted

    // If NFT requested, record into nft_gift_cards
    if (isNft && nftTokenId) {
      const generatedCode = `USDBT-${brandName.toUpperCase().replace(/\s+/g, '')}-${randomBytes(4).toString('hex').toUpperCase()}`
      await sql`
        INSERT INTO nft_gift_cards
          (token_id, owner_wallet, brand_name, face_value, claim_code, status, chain)
        VALUES
          (${nftTokenId}, ${walletAddress}, ${brandName}, ${effectiveUsdTotal}, ${generatedCode}, 'active', ${selectedChain === 'solana' ? 'solana' : 'base'})
        ON CONFLICT DO NOTHING
      `
    }

    const orderId = order.id
    setTimeout(async () => {
      try {
        await sql`UPDATE orders SET status = ${ORDER_STATUS.DELIVERED} WHERE id = ${orderId}`
        sendDeliveryEmail(email, { brandName, faceValue: effectiveUsdTotal }).catch(() => {})

        // Award loyalty points: 10 points per dollar spent
        const pointsEarned = Math.floor(effectiveUsdTotal * 10)
        await sql`
          INSERT INTO user_loyalty (wallet_address, points_balance, lifetime_points, tier)
          VALUES (${walletAddress.toLowerCase()}, ${pointsEarned}, ${pointsEarned}, 'bronze')
          ON CONFLICT (wallet_address) DO UPDATE
          SET points_balance = user_loyalty.points_balance + ${pointsEarned},
              lifetime_points = user_loyalty.lifetime_points + ${pointsEarned},
              updated_at = now()
        `
        await sql`
          INSERT INTO loyalty_transactions (wallet_address, order_id, points_delta, action)
          VALUES (${walletAddress.toLowerCase()}, ${orderId}, ${pointsEarned}, 'earn_order')
        `

        // If referral code used, credit referrer with 1.5% cashback
        if (validReferralCode && referrerWallet) {
          const rewardAmount = parseFloat((effectiveUsdTotal * 0.015).toFixed(2))
          await sql`
            INSERT INTO referrals (referrer_wallet, referred_wallet, order_id, reward_amount, status)
            VALUES (${referrerWallet}, ${walletAddress.toLowerCase()}, ${orderId}, ${rewardAmount}, 'completed')
          `
        }
      } catch {}
    }, simulateConfig.fulfillmentDelayMs)

    const solanaUri = solanaDeposit
      ? formatSolanaPayUri({ address: solanaDeposit, amount: Number(order.coin_amount), orderId: order.id, brandName })
      : undefined

    return res.status(201).json({
      orderId: order.id,
      chainId,
      paymentChain: selectedChain,
      paymentCurrency: currency,
      paymentAmount: Number(order.coin_amount),
      solanaDepositAddress: solanaDeposit,
      solanaPayUri: solanaUri,
      steps: [],
      timeEstimate: selectedChain === 'solana' ? 1 : 0,
      expiresAt: order.expires_at,
      quantity: selectedQty,
      discounts: {
        volumeDiscountPct,
        volumeDiscountAmount,
        referralDiscountAmount,
        loyaltyDiscountAmount,
        totalSaved: totalDiscount,
      },
      isNft,
      nftTokenId,
      isEscrow: isEscrow || effectiveUsdTotal >= 250,
      escrowStatus,
      crOrder: { depositAddress: order.payment_address, coinAmount: Number(order.coin_amount), currency: 'USDC' },
    })
  }

  // Real Order fulfillment flow with Cryptorefills
  const crInput = { brandName, countryCode, denomination, productValue, email, userIp, userAgent }

  let validation: { ok: boolean; problems: any[] }
  try {
    validation = await validateOrder(crInput)
  } catch (err) {
    console.error('[orders] validation request failed:', err)
    return res.status(502).json({ error: 'could not validate order' })
  }
  if (!validation.ok) {
    const first = validation.problems[0]
    return res.status(422).json({ error: first.problem ?? 'order validation failed', problems: validation.problems })
  }

  let crOrder
  try {
    crOrder = await createCROrder(crInput)
  } catch (err) {
    console.error('[orders] CR order creation failed:', err)
    return res.status(502).json({ error: 'failed to create order with provider' })
  }

  const crCoinAmount = Number(crOrder.coin_amount)
  const crDepositAddress = crOrder.wallet_address

  let relayQuote
  const relayCurrency: RelayPaymentCurrency = currency === 'ETH' ? 'ETH' : 'USDG'
  try {
    relayQuote = await getRelayOrderQuote({
      userWallet: walletAddress,
      cryptorefillsDepositAddress: crDepositAddress,
      cryptorefillsUsdcAmount: crCoinAmount,
      currency: relayCurrency,
    })
  } catch (err) {
    console.error('[orders] Relay quote failed:', err)
    return res.status(502).json({ error: 'Failed to generate cross-chain payment route' })
  }

  const exactPaymentAmount = relayQuote.details.currencyIn.amountFormatted
  const expiresAt = crOrder.payment_requested_at
    ? new Date(crOrder.payment_requested_at * 1000 + ORDER_TTL_MINUTES * 60 * 1000)
    : new Date(Date.now() + ORDER_TTL_MINUTES * 60 * 1000)

  const nftTokenId = isNft ? `NFT-${Date.now().toString(36).toUpperCase()}` : null
  const escrowStatus = isEscrow || effectiveUsdTotal >= 250 ? 'escrow_locked' : null
  const escrowReleaseAt = escrowStatus ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null

  const inserted = await insertOrderRedeemingPoints(walletAddress, pointsToUse, (tx) => tx`
      INSERT INTO orders
        (wallet_address, email, card_type, brand_id, brand_name, face_value,
         payment_chain_id, payment_currency, payment_amount, payment_amount_exact,
         fee_rate, status, expires_at, cr_order_id, payment_address, coin_amount,
         relay_request_id, relay_steps, quantity, volume_discount_pct, loyalty_points_used,
         loyalty_discount_amount, referral_code, referral_discount_amount, is_nft, nft_token_id,
         is_escrow, escrow_status, escrow_release_at, payment_chain)
      VALUES
        (${walletAddress}, ${email}, 'gift_card', ${familyName}, ${brandName}, ${effectiveUsdTotal},
         ${ROBINHOOD_CHAIN_ID}, ${relayCurrency}, ${Number(exactPaymentAmount)}, ${exactPaymentAmount},
         100, ${ORDER_STATUS.PENDING_PAYMENT}, ${expiresAt}, ${crOrder.order_id},
         ${crDepositAddress}, ${crCoinAmount}, ${relayQuote.requestId}, ${sql.json(relayQuote.steps as any)},
         ${selectedQty}, ${volumeDiscountPct}, ${pointsToUse}, ${loyaltyDiscountAmount},
         ${validReferralCode}, ${referralDiscountAmount}, ${isNft}, ${nftTokenId},
         ${isEscrow || effectiveUsdTotal >= 250}, ${escrowStatus}, ${escrowReleaseAt}, ${selectedChain})
      RETURNING id, expires_at
    `)
    .catch((err) => err instanceof PointsUnavailableError ? null : Promise.reject(err))
  if (!inserted) return res.status(409).json({ error: POINTS_CHANGED })
  const [order] = inserted

  if (isNft && nftTokenId) {
    const generatedCode = `USDBT-${brandName.toUpperCase().replace(/\s+/g, '')}-${randomBytes(4).toString('hex').toUpperCase()}`
    await sql`
      INSERT INTO nft_gift_cards
        (token_id, owner_wallet, brand_name, face_value, claim_code, status, chain)
      VALUES
        (${nftTokenId}, ${walletAddress}, ${brandName}, ${effectiveUsdTotal}, ${generatedCode}, 'active', 'base')
      ON CONFLICT DO NOTHING
    `
  }

  res.status(201).json({
    orderId: order.id,
    chainId: ROBINHOOD_CHAIN_ID,
    paymentChain: selectedChain,
    paymentCurrency: relayCurrency,
    paymentAmount: exactPaymentAmount,
    steps: relayQuote.steps,
    timeEstimate: relayQuote.details.timeEstimate,
    expiresAt: order.expires_at,
    quantity: selectedQty,
    discounts: {
      volumeDiscountPct,
      volumeDiscountAmount,
      referralDiscountAmount,
      loyaltyDiscountAmount,
      totalSaved: totalDiscount,
    },
    isNft,
    nftTokenId,
    isEscrow: isEscrow || effectiveUsdTotal >= 250,
    escrowStatus,
    crOrder: { depositAddress: crDepositAddress, coinAmount: crCoinAmount, currency: 'USDC' },
  })
}

ordersRouter.post('/', createOrder)

// Escrow Early Release: buyer confirms gift card works and releases escrowed funds to supplier
ordersRouter.post('/:id/escrow/release', async (req, res) => {
  const [order] = await sql`
    SELECT id, is_escrow, escrow_status FROM orders WHERE id = ${req.params.id}
  `
  if (!order) return res.status(404).json({ error: 'order not found' })
  if (!order.is_escrow) return res.status(400).json({ error: 'not an escrow order' })

  await sql`
    UPDATE orders
    SET escrow_status = 'escrow_released'
    WHERE id = ${order.id}
  `

  res.json({
    success: true,
    message: 'Escrow released! Supplier funds unlocked.',
    escrowStatus: 'escrow_released',
  })
})

// Escrow Dispute: buyer flags issue with code, freezing supplier payout
ordersRouter.post('/:id/escrow/dispute', async (req, res) => {
  const { reason } = req.body
  const [order] = await sql`
    SELECT id, is_escrow, escrow_status FROM orders WHERE id = ${req.params.id}
  `
  if (!order) return res.status(404).json({ error: 'order not found' })
  if (!order.is_escrow) return res.status(400).json({ error: 'not an escrow order' })

  await sql`
    UPDATE orders
    SET escrow_status = 'escrow_disputed',
        failure_reason = ${reason || 'Buyer opened an escrow dispute on card validity'}
    WHERE id = ${order.id}
  `

  res.json({
    success: true,
    message: 'Escrow frozen. Dispute case created. Support team will review within 2 hours.',
    escrowStatus: 'escrow_disputed',
  })
})

ordersRouter.get('/:id', async (req, res) => {
  const [order] = await sql`
    SELECT id, status, brand_name, face_value, coin_amount, payment_address,
           expires_at, failure_reason, cr_order_id, payment_chain, payment_currency,
           quantity, is_nft, nft_token_id, is_escrow, escrow_status, solana_deposit_address
    FROM orders WHERE id = ${req.params.id}
  `
  if (!order) return res.status(404).json({ error: 'order not found' })

  res.json({
    orderId: order.id,
    status: order.status,
    brandName: order.brand_name,
    faceValue: order.face_value,
    paymentAmount: Number(order.coin_amount ?? 0),
    currency: order.payment_currency ?? 'USDC',
    paymentChain: order.payment_chain ?? 'robinhood',
    paymentAddress: order.payment_address,
    solanaDepositAddress: order.solana_deposit_address,
    quantity: order.quantity ?? 1,
    isNft: order.is_nft ?? false,
    nftTokenId: order.nft_token_id,
    isEscrow: order.is_escrow ?? false,
    escrowStatus: order.escrow_status,
    txHash: null,
    expiresAt: order.expires_at,
    estimatedReadyAt: null,
    deliveredAt: null,
    failureReason: order.failure_reason ?? null,
    progress: getOrderProgress(order.status),
  })
})

ordersRouter.get('/:id/progress', async (req, res) => {
  const [order] = await sql`
    SELECT id, status, failure_reason FROM orders WHERE id = ${req.params.id}
  `
  if (!order) return res.status(404).json({ error: 'order not found' })

  res.json({
    orderId: order.id,
    status: order.status,
    progress: getOrderProgress(order.status),
    estimatedReadyAt: null,
    failureReason: order.failure_reason ?? null,
  })
})

function getOrderProgress(status: string) {
  const MAP: Record<string, { step: number; totalSteps: number; label: string; terminal: boolean }> = {
    [ORDER_STATUS.PENDING_PAYMENT]:      { step: 1, totalSteps: 4, label: 'Waiting for payment',         terminal: false },
    [ORDER_STATUS.USER_DEBITED]:         { step: 2, totalSteps: 4, label: 'Payment received',             terminal: false },
    [ORDER_STATUS.HOT_WALLET_FUNDED]:    { step: 3, totalSteps: 4, label: 'Processing with provider',    terminal: false },
    [ORDER_STATUS.BITREFILL_PROCESSING]: { step: 3, totalSteps: 4, label: 'Issuing your card',           terminal: false },
    [ORDER_STATUS.DELIVERED]:            { step: 4, totalSteps: 4, label: 'Card delivered to your email', terminal: true  },
    [ORDER_STATUS.FAILED]:               { step: 4, totalSteps: 4, label: 'Order failed',                terminal: true  },
    [ORDER_STATUS.REFUNDED]:             { step: 4, totalSteps: 4, label: 'Order refunded',              terminal: true  },
  }
  return MAP[status] ?? { step: 1, totalSteps: 4, label: status, terminal: false }
}
