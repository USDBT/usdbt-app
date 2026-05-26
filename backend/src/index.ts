import express from 'express'
import cors from 'cors'
import { healthRouter } from './routes/health'
import { productsRouter } from './routes/products'
import { ordersRouter } from './routes/orders'
import { usersRouter } from './routes/users'
import { balancesRouter } from './routes/balances'
import { authRouter } from './routes/auth'
import { startPoller } from './services/poller'

const app = express()
const PORT = parseInt(process.env.PORT ?? '3001', 10)

function logConfigPresence(): void {
  const requiredNonSecretVars = [
    'APPWRITE_ENDPOINT',
    'APPWRITE_PROJECT_ID',
    'APPWRITE_DATABASE_ID',
    'APPWRITE_ORDERS_COLLECTION_ID',
    'APPWRITE_USERS_COLLECTION_ID',
    'PAYMENT_WALLET_ADDRESS',
  ] as const

  const missing = requiredNonSecretVars.filter((name) => !process.env[name]?.trim())
  const set = requiredNonSecretVars.filter((name) => !!process.env[name]?.trim())

  console.log('[config] required env presence:')
  for (const name of set) console.log(`[config] ${name}=set`)
  for (const name of missing) console.warn(`[config] ${name}=missing`)
}

app.use(express.json())
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  })
)

app.use('/health', healthRouter)
app.use('/auth', authRouter)
app.use('/products', productsRouter)
app.use('/orders', ordersRouter)
app.use('/users', usersRouter)
app.use('/balances', balancesRouter)

app.listen(PORT, async () => {
  console.log(`[usdtb-backend] listening on port ${PORT}`)
  logConfigPresence()

  try {
    const res = await fetch(`${process.env.APPWRITE_ENDPOINT}/health`)
    if (res.ok) console.log('[usdtb-backend] appwrite connection ok')
    else console.warn('[usdtb-backend] appwrite health check returned', res.status)
  } catch (err) {
    console.error('[usdtb-backend] appwrite health check failed:', err)
  }

  startPoller()
})
