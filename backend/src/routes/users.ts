import { Router } from 'express'
import { ID, databases, requiredEnv } from '../lib/appwrite'
import { isAddress } from 'viem'

export const usersRouter = Router()

const DB = requiredEnv('APPWRITE_DATABASE_ID')
const COL = requiredEnv('APPWRITE_USERS_COLLECTION_ID')

usersRouter.get('/:address', async (req, res) => {
  const addr = req.params.address
  if (!isAddress(addr)) return res.status(400).json({ error: 'invalid address' })

  try {
    const result = await databases.listDocuments(DB, COL)
    const docs = (result.documents ?? []) as any[]
    const user = docs.find(d => d.walletAddress?.toLowerCase() === addr.toLowerCase())
    if (!user) return res.status(404).json({ error: 'not found' })
    res.json({ walletAddress: user.walletAddress, email: user.email })
  } catch (err) {
    console.error('[users] get error:', err)
    res.status(500).json({ error: 'failed to fetch user' })
  }
})

usersRouter.post('/', async (req, res) => {
  const { walletAddress, email } = req.body
  if (!walletAddress || !email) return res.status(400).json({ error: 'walletAddress and email are required' })
  if (!isAddress(walletAddress)) return res.status(400).json({ error: 'invalid walletAddress' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'invalid email' })

  try {
    // Upsert: return existing if already registered
    const result = await databases.listDocuments(DB, COL)
    const docs = (result.documents ?? []) as any[]
    const existing = docs.find(d => d.walletAddress?.toLowerCase() === walletAddress.toLowerCase())
    if (existing) return res.json({ walletAddress: existing.walletAddress, email: existing.email })

    const doc = await databases.createDocument(DB, COL, ID.unique(), { walletAddress, email }) as any
    res.status(201).json({ walletAddress: doc.walletAddress, email: doc.email })
  } catch (err) {
    console.error('[users] create error:', err)
    res.status(500).json({ error: 'failed to create user' })
  }
})
