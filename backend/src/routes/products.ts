import { Router } from 'express'
import { listProducts, getProduct, getProductImage } from '../lib/bitrefill'

export const productsRouter = Router()

productsRouter.get('/', async (req, res) => {
  try {
    const page = parseInt(String(req.query.page ?? '0'), 10)
    const data = await listProducts(page)
    res.json(data)
  } catch (err) {
    console.error('[products] list failed:', err)
    res.status(502).json({ error: 'failed to fetch products' })
  }
})

productsRouter.get('/:id', async (req, res) => {
  try {
    const data = await getProduct(req.params.id)
    res.json(data)
  } catch (err) {
    console.error('[products] get failed:', err)
    res.status(502).json({ error: 'failed to fetch product' })
  }
})

productsRouter.get('/:id/image', async (req, res) => {
  try {
    const ref = typeof req.query.ref === 'string' && req.query.ref.trim().length > 0 ? req.query.ref.trim() : null
    const candidates = [ref, req.params.id].filter(Boolean) as string[]
    let imageRes: Response | null = null
    for (const candidate of candidates) {
      try {
        imageRes = await getProductImage(candidate)
        break
      } catch {
        // try next candidate
      }
    }
    if (!imageRes) throw new Error('Image not found for product')
    const contentType = imageRes.headers.get('content-type') ?? 'image/png'
    const cacheControl = imageRes.headers.get('cache-control') ?? 'public, max-age=3600'
    const ab = await imageRes.arrayBuffer()
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', cacheControl)
    res.status(200).send(Buffer.from(ab))
  } catch (err) {
    console.error('[products] image failed:', err)
    res.status(404).json({ error: 'image not found' })
  }
})
