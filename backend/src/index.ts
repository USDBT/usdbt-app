import express from 'express'
import cors from 'cors'
import { client } from './lib/appwrite'
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
    await client.ping()
    console.log('[usdtb-backend] appwrite connection ok')
  } catch (err) {
    console.error('[usdtb-backend] appwrite ping failed:', err)
  }

  startPoller()
})
