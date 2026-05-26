const TOKEN_KEY = 'usdbt_jwt'
const EMAIL_KEY = 'usdbt_email'

function backendUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function storeToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function getStoredEmail(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(EMAIL_KEY)
}

export function storeEmail(email: string) {
  localStorage.setItem(EMAIL_KEY, email)
}

function isExpired(token: string): boolean {
  try {
    const [, payload] = token.split('.')
    const { exp } = JSON.parse(atob(payload))
    return Date.now() / 1000 > exp - 60  // 60s buffer
  } catch {
    return true
  }
}

export function getValidToken(): string | null {
  const t = getStoredToken()
  if (!t || isExpired(t)) {
    if (t) clearToken()
    return null
  }
  return t
}

export function authHeaders(): Record<string, string> {
  const t = getValidToken()
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
