import express from 'express'
import cors from 'cors'
import { healthRouter } from './routes/health'

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

app.listen(PORT, () => {
  console.log(`[usdtb-backend] listening on port ${PORT}`)
})
