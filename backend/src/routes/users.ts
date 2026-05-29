import { Router } from 'express'
import { sql } from '../lib/db'
import { isAddress } from 'viem'

export const usersRouter = Router()

usersRouter.get('/:address', async (req, res) => {
  const addr = req.params.address
  if (!isAddress(addr)) return res.status(400).json({ error: 'invalid address' })

  const [user] = await sql`
    SELECT wallet_address, email FROM users WHERE lower(wallet_address) = lower(${addr})
  `
  if (!user) return res.status(404).json({ error: 'not found' })
  res.json({ walletAddress: user.wallet_address, email: user.email })
})

usersRouter.post('/', async (req, res) => {
  const { walletAddress, email } = req.body
  if (!walletAddress || !email) return res.status(400).json({ error: 'walletAddress and email are required' })
  if (!isAddress(walletAddress)) return res.status(400).json({ error: 'invalid walletAddress' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'invalid email' })

  const [user] = await sql`
    INSERT INTO users (wallet_address, email)
    VALUES (${walletAddress}, ${email})
    ON CONFLICT (wallet_address) DO UPDATE SET email = EXCLUDED.email
    RETURNING wallet_address, email
  `
  res.status(201).json({ walletAddress: user.wallet_address, email: user.email })
})
