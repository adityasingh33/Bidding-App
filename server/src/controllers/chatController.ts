import { Request as ExpressRequest, Response as ExpressResponse } from "express"
import { prisma } from "../utils/prismaClient.ts"

// Extend Request type if needed, but assuming req.user exists from authenticateToken
interface AuthRequest extends ExpressRequest {
  user?: { userId: number; email: string }
}

export const getChatHistory = async (req: AuthRequest, res: ExpressResponse): Promise<void> => {
  try {
    const userId = req.user!.userId
    const partnerId = parseInt(String(req.params.partnerId))

    if (!partnerId || isNaN(partnerId)) {
      res.status(400).json({ error: "Invalid partner ID" })
      return
    }

    // Only get the last 100 messages for simplicity
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: userId }
        ]
      },
      orderBy: {
        createdAt: "asc"
      },
      take: 100,
      include: {
        sender: {
          select: { email: true }
        }
      }
    })

    // Map to a friendlier format for frontend
    const formattedMessages = messages.map(m => ({
      id: m.id,
      senderId: m.senderId,
      receiverId: m.receiverId,
      email: m.sender.email,
      message: m.content,
      timestamp: m.createdAt.toISOString()
    }))

    res.status(200).json(formattedMessages)
  } catch (error) {
    console.error("Failed to fetch chat history", error)
    res.status(500).json({ error: "Failed to fetch chat history" })
  }
}
