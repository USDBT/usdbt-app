import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'

const JWT_SECRET = process.env.JWT_SECRET!

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'missing authorization header' })
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as { address: string }
    ;(req as any).walletAddress = payload.address
    next()
  } catch {
    res.status(401).json({ error: 'invalid or expired token' })
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice(7), JWT_SECRET) as { address: string }
      ;(req as any).walletAddress = payload.address
    } catch {}
  }
  next()
}
