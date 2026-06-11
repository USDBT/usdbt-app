function backendUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
}

function tokenKey(address: string) { return `usdbt_jwt_${address.toLowerCase()}` }
function emailKey(address: string) { return `usdbt_email_${address.toLowerCase()}` }
function simSpentKey(address: string) { return `usdbt_sim_spent_${address.toLowerCase()}` }

// Simulated balance helpers — only used when backend is in SIMULATE mode.
// Tracks cumulative USDC spent per wallet so the displayed balance decrements on each purchase.
export function getSimSpent(address: string): number {
  if (typeof window === 'undefined') return 0
  return parseFloat(localStorage.getItem(simSpentKey(address)) ?? '0')
}

export function deductSimBalance(address: string, amount: number) {
  if (typeof window === 'undefined') return
  const current = getSimSpent(address)
  localStorage.setItem(simSpentKey(address), (current + amount).toFixed(6))
}

export function resetSimBalance(address: string) {
  if (typeof window === 'undefined') return
  localStorage.removeItem(simSpentKey(address))
}

export function getStoredToken(address: string): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(tokenKey(address))
}

export function storeToken(token: string, address: string) {
  localStorage.setItem(tokenKey(address), token)
}

export function clearToken(address: string) {
  localStorage.removeItem(tokenKey(address))
}

export function getStoredEmail(address: string): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(emailKey(address))
}

export function storeEmail(email: string, address: string) {
  localStorage.setItem(emailKey(address), email)
}

function isExpired(token: string): boolean {
  try {
    const [, payload] = token.split('.')
    const { exp } = JSON.parse(atob(payload))
    return Date.now() / 1000 > exp - 60
  } catch {
    return true
  }
}

export function getValidToken(address: string): string | null {
  const t = getStoredToken(address)
  if (!t || isExpired(t)) {
    if (t) clearToken(address)
    return null
  }
  return t
}

export function authHeaders(address: string): Record<string, string> {
  const t = getValidToken(address)
  return t ? { Authorization: `Bearer ${t}` } : {}
}

export async function fetchNonce(address: string): Promise<string> {
  const r = await fetch(`${backendUrl()}/auth/nonce?address=${address}`)
  if (!r.ok) throw new Error('Failed to get nonce')
  const { nonce } = await r.json()
  return nonce as string
}

export async function verifySignature(
  address: string,
  signature: string,
  message: string,
): Promise<string> {
  const r = await fetch(`${backendUrl()}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, signature, message }),
  })
  if (!r.ok) throw new Error('Auth failed')
  const { token } = await r.json()
  return token as string
}
