export interface Product {
  id: string          // family_name from Cryptorefills
  name: string        // brand display name
  type: string
  categories?: string[]
  denominations: number[]
  range: { min: number; max: number; step: number } | null
  country: string
  countryCode: string
  currency: string
  image: string
  imageKey?: string
}

export function titleize(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function normalizeProduct(raw: any): Product {
  const denominations = Array.isArray(raw?.denominations)
    ? raw.denominations.map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n))
    : []

  const range = raw?.range && typeof raw.range === 'object'
    ? {
        min: Number(raw.range.min ?? 0),
        max: Number(raw.range.max ?? 0),
        step: Number(raw.range.step ?? 1),
      }
    : null

  const image = String(raw?.image ?? raw?.logo_url ?? '')

  return {
    id: String(raw?.id ?? ''),
    name: String(raw?.name ?? 'Unknown'),
    type: String(raw?.type ?? 'gift_card'),
    categories: Array.isArray(raw?.categories) ? raw.categories.map((c: any) => String(c)) : [],
    denominations,
    range: range && range.min > 0 && range.max > 0 ? range : null,
    country: String(raw?.country ?? ''),
    countryCode: String(raw?.countryCode ?? raw?.country_code ?? 'US'),
    currency: String(raw?.currency ?? 'USD'),
    image,
    imageKey: raw?.imageKey ?? undefined,
  }
}

export type PaymentChain = 'robinhood' | 'base' | 'ethereum' | 'solana'
export type PaymentCurrency = 'USDG' | 'ETH' | 'USDC' | 'USDT' | 'SOL'

// Balances on connected wallets
export interface WalletBalances {
  usdg: string
  eth: string
  chainId?: number
  simulated?: boolean
}

export interface RelayOrderStepItem {
  status: 'incomplete' | 'complete'
  data: {
    from?: string
    to: string
    data: string
    value: string
    chainId: number
    maxFeePerGas?: string
    maxPriorityFeePerGas?: string
  }
}

export interface RelayOrderStep {
  id: string
  action: string
  description: string
  kind: 'transaction' | 'signature'
  items: RelayOrderStepItem[]
}

export interface OrderCreated {
  orderId: string
  paymentAddress: string
  paymentAmount: number
  currency: string
  paymentCurrency?: PaymentCurrency
  paymentChain?: PaymentChain
  chainId?: number
  solanaDepositAddress?: string | null
  solanaPayUri?: string | null
  steps: RelayOrderStep[]
  timeEstimate: number
  expiresAt: string
  quantity?: number
  discounts?: {
    volumeDiscountPct: number
    volumeDiscountAmount: number
    referralDiscountAmount: number
    loyaltyDiscountAmount: number
    totalSaved: number
  }
  isNft?: boolean
  nftTokenId?: string | null
  isEscrow?: boolean
  escrowStatus?: string | null
}

export interface OrderStatus {
  orderId: string
  status:
    | 'pending_payment'
    | 'user_debited'
    | 'hot_wallet_funded'
    | 'bitrefill_processing'
    | 'delivered'
    | 'failed'
    | 'refunded'
  brandName: string
  faceValue: number
  paymentAmount: number
  currency: string
  paymentChain?: PaymentChain
  paymentAddress?: string
  solanaDepositAddress?: string | null
  txHash: string | null
  expiresAt: string
  estimatedReadyAt?: string | null
  deliveredAt?: string | null
  failureReason?: string | null
  quantity?: number
  isNft?: boolean
  nftTokenId?: string | null
  isEscrow?: boolean
  escrowStatus?: string | null
  progress?: {
    step: number
    totalSteps: number
    label: string
    terminal: boolean
  }
}

export interface OrderProgress {
  orderId: string
  status: OrderStatus['status']
  progress: {
    step: number
    totalSteps: number
    label: string
    terminal: boolean
  }
  estimatedReadyAt?: string | null
  failureReason?: string | null
}

export function priceLabel(p: Product): string {
  if (p.denominations.length > 0) return `From $${Math.min(...p.denominations)}`
  if (p.range) return `$${p.range.min}–$${p.range.max}`
  return 'Variable'
}

export async function fetchProducts(_page = 0): Promise<Product[]> {
  const res = await fetch('/api/products')
  if (!res.ok) throw new Error('failed to load products')
  const data = await res.json()
  const list = data.products ?? data.items ?? data.data ?? (Array.isArray(data) ? data : [])
  return Array.isArray(list) ? list.map(normalizeProduct).filter((p) => !!p.id) : []
}

export async function fetchProductDetail(familyName: string): Promise<{
  denominations: number[]
  range: Product['range']
  coinAmounts: Record<number, number>
}> {
  const res = await fetch(`/api/products/${encodeURIComponent(familyName)}`)
  if (!res.ok) throw new Error('failed to load product details')
  const data = await res.json()
  const denominations = Array.isArray(data.denominations)
    ? data.denominations.map(Number).filter(Number.isFinite)
    : []
  const range = data.range && data.range.max > 0
    ? { min: Number(data.range.min), max: Number(data.range.max), step: Number(data.range.step ?? 1) }
    : null
  const coinAmounts: Record<number, number> = data.coinAmounts ?? {}
  return { denominations, range, coinAmounts }
}

export async function createOrder(body: {
  brandName: string
  familyName: string
  countryCode: string
  denomination: string | number
  productValue?: number
  faceValue: number
  email: string
  walletAddress: string
  paymentCurrency?: PaymentCurrency
  paymentChain?: PaymentChain
  quantity?: number
  loyaltyPointsUsed?: number
  referralCode?: string
  isNft?: boolean
  isEscrow?: boolean
}): Promise<OrderCreated> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'failed to create order')
  return data
}

export async function getOrderStatus(orderId: string): Promise<OrderStatus> {
  const res = await fetch(`/api/orders/${orderId}`)
  if (!res.ok) throw new Error('order not found')
  return res.json()
}

export async function getOrderProgress(orderId: string): Promise<OrderProgress> {
  const res = await fetch(`/api/orders/${orderId}/progress`)
  if (!res.ok) throw new Error('order not found')
  return res.json()
}

export async function getWalletBalances(address: string): Promise<WalletBalances> {
  const res = await fetch(`/api/balances/${address}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'failed to load balances')
  return data
}

export interface OrderStats {
  totalOrders: number
  recentOrders: Array<{
    id: string
    brandName: string
    faceValue: number
    coinAmount: number
    status: OrderStatus['status']
    createdAt: string
  }>
  ordersByDay: Array<{ label: string; count: number }>
  statusMix: { completed: number; pending: number; failed: number }
  totalSpentUsdc: number
  topBrands: Array<{ label: string; value: number }>
}

export async function getOrderStats(address: string, authHeader: Record<string, string>): Promise<OrderStats> {
  const res = await fetch(`/api/users/${address}/stats`, { headers: authHeader })
  if (!res.ok) throw new Error('failed to load stats')
  return res.json()
}

// ----------------- Escrow -----------------
export async function releaseEscrow(orderId: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/orders/${orderId}/escrow/release`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to release escrow')
  return res.json()
}

export async function disputeEscrow(orderId: string, reason: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/orders/${orderId}/escrow/dispute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  })
  if (!res.ok) throw new Error('Failed to submit dispute')
  return res.json()
}

// ----------------- Loyalty Points -----------------
export interface LoyaltyStats {
  walletAddress: string
  pointsBalance: number
  lifetimePoints: number
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  multiplier: number
  perkDiscountPct: number
  nextTierThreshold: number
  pointsToNextTier: number
  transactions: Array<{
    id: string
    order_id?: string
    points_delta: number
    action: string
    created_at: string
  }>
}

export async function getLoyaltyStats(address: string): Promise<LoyaltyStats> {
  const res = await fetch(`/api/loyalty/${address}`)
  if (!res.ok) throw new Error('Failed to fetch loyalty stats')
  return res.json()
}

export async function calculateLoyaltyDiscount(walletAddress: string, faceValue: number, points: number): Promise<{
  availablePoints: number
  pointsUsed: number
  discountAmount: number
  remainingPrice: number
}> {
  const res = await fetch(`/api/loyalty/calculate-discount`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress, faceValue, points }),
  })
  if (!res.ok) throw new Error('Failed to calculate discount')
  return res.json()
}

// ----------------- Referrals -----------------
export interface ReferralStats {
  walletAddress: string
  referralCode: string
  referralLink: string
  totalReferred: number
  totalRewardsUsd: number
  claimableUsd: number
  rewardRatePct: number
  friendDiscountPct: number
  recentReferrals: Array<{
    id: string
    referredWallet: string
    rewardAmount: number
    status: string
    createdAt: string
  }>
}

export async function getReferralStats(address: string): Promise<ReferralStats> {
  const res = await fetch(`/api/referrals/${address}`)
  if (!res.ok) throw new Error('Failed to fetch referral stats')
  return res.json()
}

export async function claimReferralRewards(walletAddress: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/referrals/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress }),
  })
  if (!res.ok) throw new Error('Failed to claim rewards')
  return res.json()
}

export async function verifyReferralCode(code: string): Promise<{ valid: boolean; discountPct: number }> {
  const res = await fetch(`/api/referrals/verify/${encodeURIComponent(code)}`)
  if (!res.ok) return { valid: false, discountPct: 0 }
  return res.json()
}

// ----------------- Price Alerts -----------------
export interface PriceAlert {
  id: string
  wallet_address: string
  email: string
  brand_id: string
  brand_name: string
  target_discount_pct: number
  is_active: boolean
  created_at: string
}

export async function getPriceAlerts(address: string): Promise<{ alerts: PriceAlert[] }> {
  const res = await fetch(`/api/alerts/${address}`)
  if (!res.ok) throw new Error('Failed to fetch price alerts')
  return res.json()
}

export async function createPriceAlert(body: {
  walletAddress: string
  email: string
  brandId: string
  brandName: string
  targetDiscountPct: number
}): Promise<{ message: string; alert: PriceAlert }> {
  const res = await fetch(`/api/alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Failed to create alert')
  return res.json()
}

export async function deletePriceAlert(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/alerts/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete alert')
  return res.json()
}

export async function togglePriceAlert(id: string): Promise<{ success: boolean; alert: PriceAlert }> {
  const res = await fetch(`/api/alerts/${id}/toggle`, { method: 'PATCH' })
  if (!res.ok) throw new Error('Failed to toggle alert')
  return res.json()
}

// ----------------- NFT Gift Cards -----------------
export interface NftGiftCard {
  id: string
  tokenId: string
  ownerWallet: string
  brandName: string
  faceValue: number
  status: 'active' | 'redeemed'
  chain: string
  claimCode?: string | null
  createdAt: string
}

export async function getNftCards(address: string): Promise<{ count: number; cards: NftGiftCard[] }> {
  const res = await fetch(`/api/nft/${address}`)
  if (!res.ok) throw new Error('Failed to fetch NFT gift cards')
  return res.json()
}

export async function redeemNftCard(tokenId: string, walletAddress: string): Promise<{
  message: string
  claimCode: string
  brandName: string
  faceValue: number
  status: string
}> {
  const res = await fetch(`/api/nft/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokenId, walletAddress }),
  })
  if (!res.ok) throw new Error('Failed to unwrap NFT card')
  return res.json()
}

export async function transferNftCard(tokenId: string, fromAddress: string, toAddress: string): Promise<{
  success: boolean
  message: string
}> {
  const res = await fetch(`/api/nft/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokenId, fromAddress, toAddress }),
  })
  if (!res.ok) throw new Error('Failed to transfer NFT card')
  return res.json()
}

// ----------------- Compliance & AML -----------------
export interface ComplianceLimits {
  walletAddress: string
  tier: string
  dailyLimitUsd: number
  spentLast24hUsd: number
  remainingQuotaUsd: number
  sanctionsCheck: string
  riskScore: string
  kycRequired: boolean
  policy: string
}

export async function getComplianceLimits(address: string): Promise<ComplianceLimits> {
  const res = await fetch(`/api/compliance/limits/${address}`)
  if (!res.ok) throw new Error('Failed to load compliance info')
  return res.json()
}

export async function screenWalletCompliance(walletAddress: string): Promise<{
  status: string
  walletAddress: string
  riskScore: number
  ofacMatch: boolean
}> {
  const res = await fetch(`/api/compliance/screen`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress }),
  })
  if (!res.ok) throw new Error('Wallet AML screening flagged an issue')
  return res.json()
}

// ----------------- Merchant API -----------------
export interface MerchantProfile {
  id: string
  name: string
  walletAddress: string
  apiKey: string
  webhookUrl?: string | null
  totalVolume: number
}

export interface MerchantOrder {
  id: string
  external_ref?: string
  product_id: string
  brand_name: string
  face_value: number
  recipient_email: string
  status: string
  card_code?: string
  created_at: string
}

export async function registerMerchant(walletAddress: string, merchantName: string, webhookUrl?: string): Promise<{
  message: string
  merchant: MerchantProfile
}> {
  const res = await fetch(`/api/merchant/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress, merchantName, webhookUrl }),
  })
  if (!res.ok) throw new Error('Failed to register merchant')
  return res.json()
}

export async function getMerchantProfile(apiKey: string): Promise<{
  merchant: MerchantProfile
  orders: MerchantOrder[]
}> {
  const res = await fetch(`/api/merchant/me`, {
    headers: { 'x-api-key': apiKey },
  })
  if (!res.ok) throw new Error('Failed to fetch merchant profile')
  return res.json()
}

export async function getMerchantProducts(apiKey: string): Promise<{
  count: number
  products: Array<{
    productId: string
    name: string
    country: string
    wholesaleDiscount: string
    denominations: number[]
  }>
}> {
  const res = await fetch(`/api/merchant/products`, {
    headers: { 'x-api-key': apiKey },
  })
  if (!res.ok) throw new Error('Failed to fetch merchant products')
  return res.json()
}

export async function createMerchantOrder(apiKey: string, body: {
  productId: string
  brandName: string
  faceValue: number
  recipientEmail: string
  externalRef?: string
}): Promise<MerchantOrder> {
  const res = await fetch(`/api/merchant/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Failed to execute merchant order')
  return res.json()
}
