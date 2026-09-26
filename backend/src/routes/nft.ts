import { Router } from 'express'
import { sql } from '../lib/db'
import { isAddress } from 'viem'

export const nftRouter = Router()

// List NFT gift cards for a wallet
nftRouter.get('/:address', async (req, res) => {
  const addr = req.params.address?.toLowerCase()
  if (!addr) return res.status(400).json({ error: 'wallet address required' })

  const cards = await sql`
    SELECT id, token_id, owner_wallet, brand_name, face_value, status, chain, created_at,
           CASE WHEN status = 'redeemed' THEN claim_code ELSE NULL END as claim_code
    FROM nft_gift_cards
    WHERE lower(owner_wallet) = ${addr}
    ORDER BY created_at DESC
  `

  res.json({
    count: cards.length,
    cards: cards.map((c) => ({
      id: c.id,
      tokenId: c.token_id,
      ownerWallet: c.owner_wallet,
      brandName: c.brand_name,
      faceValue: Number(c.face_value),
      status: c.status,
      chain: c.chain,
      claimCode: c.claim_code,
      createdAt: c.created_at,
    })),
  })
})

// Unwrap & Redeem NFT card: reveals the secret claim code
nftRouter.post('/redeem', async (req, res) => {
  const { tokenId, walletAddress } = req.body
  if (!tokenId || !walletAddress) {
    return res.status(400).json({ error: 'tokenId and walletAddress are required' })
  }

  const [card] = await sql`
    SELECT id, token_id, owner_wallet, brand_name, face_value, claim_code, status
    FROM nft_gift_cards
    WHERE token_id = ${tokenId} AND lower(owner_wallet) = ${walletAddress.toLowerCase()}
  `

  if (!card) {
    return res.status(404).json({ error: 'NFT card not found or not owned by this wallet' })
  }

  if (card.status === 'redeemed') {
    return res.json({
      message: 'NFT card was already redeemed',
      claimCode: card.claim_code,
      brandName: card.brand_name,
      faceValue: Number(card.face_value),
      status: 'redeemed',
    })
  }

  await sql`
    UPDATE nft_gift_cards
    SET status = 'redeemed'
    WHERE id = ${card.id}
  `

  res.json({
    message: 'NFT voucher unwrapped successfully! Card is now ready to use.',
    claimCode: card.claim_code,
    brandName: card.brand_name,
    faceValue: Number(card.face_value),
    status: 'redeemed',
  })
})

// Transfer NFT card to another wallet
nftRouter.post('/transfer', async (req, res) => {
  const { tokenId, fromAddress, toAddress } = req.body
  if (!tokenId || !fromAddress || !toAddress) {
    return res.status(400).json({ error: 'tokenId, fromAddress, and toAddress are required' })
  }

  if (!isAddress(toAddress)) {
    return res.status(400).json({ error: 'invalid recipient address' })
  }

  const [card] = await sql`
    SELECT id, token_id, owner_wallet, status
    FROM nft_gift_cards
    WHERE token_id = ${tokenId} AND lower(owner_wallet) = ${fromAddress.toLowerCase()}
  `

  if (!card) {
    return res.status(404).json({ error: 'NFT card not found or you do not own it' })
  }

  if (card.status === 'redeemed') {
    return res.status(400).json({ error: 'Cannot transfer an already redeemed NFT card' })
  }

  await sql`
    UPDATE nft_gift_cards
    SET owner_wallet = ${toAddress}
    WHERE id = ${card.id}
  `

  res.json({
    success: true,
    message: `NFT card #${tokenId} successfully transferred to ${toAddress}`,
    recipient: toAddress,
  })
})
