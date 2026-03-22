import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: { userId: number; email: string }
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "No token provided" })
      return
    }

    const token = authHeader.split(" ")[1]

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string }
    req.user = decoded

    next()
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" })
  }
}
