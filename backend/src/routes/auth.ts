import { Router } from 'express'
import { recoverMessageAddress } from 'viem'
import jwt from 'jsonwebtoken'
import { randomBytes } from 'crypto'

export const authRouter = Router()

const JWT_SECRET = process.env.JWT_SECRET!
// In-memory nonce store — nonces expire in 5 min
const nonces = new Map<string, { value: string; exp: number }>()

authRouter.get('/nonce', (req, res) => {
  const address = (req.query.address as string)?.toLowerCase()
  if (!address) return res.status(400).json({ error: 'address required' })
  const nonce = randomBytes(16).toString('hex')
  nonces.set(address, { value: nonce, exp: Date.now() + 5 * 60_000 })
  res.json({ nonce })
})

authRouter.post('/verify', async (req, res) => {
  const { address, signature, message } = req.body
  if (!address || !signature || !message) {
    return res.status(400).json({ error: 'address, signature, and message are required' })
  }

  const key = address.toLowerCase()
  const stored = nonces.get(key)
  if (!stored || Date.now() > stored.exp) {
    return res.status(401).json({ error: 'nonce expired or not found — request a new one' })
  }
  if (!message.includes(stored.value)) {
    return res.status(401).json({ error: 'message does not contain expected nonce' })
  }

  try {
    const signer = await recoverMessageAddress({ message, signature })
    if (signer.toLowerCase() !== key) {
      return res.status(401).json({ error: 'signature does not match address' })
    }
  } catch {
    return res.status(401).json({ error: 'could not recover signer from signature' })
  }

  nonces.delete(key)

  const token = jwt.sign({ address: key }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token })
})
