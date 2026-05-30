import express from 'express'
import cors from 'cors'
import { healthRouter } from './routes/health'
import { productsRouter } from './routes/products'
import { ordersRouter } from './routes/orders'
import { usersRouter } from './routes/users'
import { balancesRouter } from './routes/balances'
import { authRouter } from './routes/auth'
import { startPoller } from './services/poller'
import { sql, runMigrations } from './lib/db'

const app = express()
const PORT = parseInt(process.env.PORT ?? '3001', 10)

function logConfigPresence(): void {
  const required = ['DATABASE_URL', 'CRYPTOREFILLS_PARTNER_ID', 'PAYMENT_WALLET_ADDRESS'] as const
  console.log('[config] required env presence:')
  for (const name of required) {
    if (process.env[name]?.trim()) console.log(`[config] ${name}=set`)
    else console.warn(`[config] ${name}=missing`)
  }
}

app.use((req, res, next) => {
  const startedAt = Date.now()
  const ts = new Date().toISOString()
  const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown'
  res.on('finish', () => {
    console.log(`[request] ${ts} ip=${ip} method=${req.method} path=${req.originalUrl} status=${res.statusCode} durationMs=${Date.now() - startedAt}`)
  })
  next()
})

app.use(express.json())
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  credentials: true,
}))

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
    await runMigrations()
    console.log('[usdtb-backend] database ready')
  } catch (err) {
    console.error('[usdtb-backend] migration failed:', err)
    process.exit(1)
  }

  startPoller()
})
