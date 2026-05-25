import { Router } from 'express'
import { listProducts, getProduct } from '../lib/bitrefill'

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
