import { Request, Response } from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { prisma } from "../utils/prismaClient.ts"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"
const SALT_ROUNDS = 10

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" })
      return
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      res.status(409).json({ error: "User with this email already exists" })
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    })

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "24h" }
    )

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}
