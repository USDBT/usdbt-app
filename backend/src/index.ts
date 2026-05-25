import express from 'express'
import cors from 'cors'
import { healthRouter } from './routes/health'
import { productsRouter } from './routes/products'
import { ordersRouter } from './routes/orders'
import { startPoller } from './services/poller'

const app = express()
const PORT = parseInt(process.env.PORT ?? '3001', 10)

app.use(express.json())
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  })
)

app.use('/health', healthRouter)
app.use('/products', productsRouter)
app.use('/orders', ordersRouter)

app.listen(PORT, async () => {
  console.log(`[usdtb-backend] listening on port ${PORT}`)

  try {
    const res = await fetch(`${process.env.APPWRITE_ENDPOINT}/health`)
    if (res.ok) console.log('[usdtb-backend] appwrite connection ok')
    else console.warn('[usdtb-backend] appwrite health check returned', res.status)
  } catch (err) {
    console.error('[usdtb-backend] appwrite health check failed:', err)
  }

  startPoller()
})
