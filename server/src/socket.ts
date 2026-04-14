import { Server } from "socket.io"
import http from "http"
import { createAdapter } from "@socket.io/redis-adapter"
import { redis } from "./utils/redis.ts"
import { prisma } from "./utils/prismaClient.ts"

let io: Server

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: { origin: "*" },
  })

  // Create Socket.IO Redis adapter for cluster scaling
  const subClient = redis.duplicate()
  
  // Suppress "missing error handler" warnings when Redis is offline
  subClient.on("error", () => {})
  
  io.adapter(createAdapter(redis, subClient))

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id)

    socket.on("joinAuction", (auctionId: number) => {
      socket.join(`auction_${auctionId}`)
      console.log(`User ${socket.id} joined auction_${auctionId}`)
    })

    socket.on("joinUserRoom", (userId: number) => {
      socket.join(`user_${userId}`)
      console.log(`User ${socket.id} joined user_${userId}`)
    })

    // Private Chat Events
    socket.on("sendPrivateMessage", async (data: { senderId: number, receiverId: number, email: string, message: string }) => {
      try {
        console.log(`Sending private message from ${data.senderId} to ${data.receiverId}`)
        // Save to DB
        const savedMessage = await prisma.message.create({
          data: {
            senderId: data.senderId,
            receiverId: data.receiverId,
            content: data.message
          }
        })

        const chatMessage = {
          id: savedMessage.id,
          senderId: data.senderId,
          receiverId: data.receiverId,
          email: data.email,
          message: data.message,
          timestamp: savedMessage.createdAt.toISOString()
        }

        // Emit to both users
        io.to(`user_${data.receiverId}`).emit("privateMessage", chatMessage)
        io.to(`user_${data.senderId}`).emit("privateMessage", chatMessage)
      } catch (err) {
        console.error("Failed to save and send private message", err)
      }
    })

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id)
    })
  })
}

export const getIO = () => {
  if (!io) throw new Error("Socket not initialized")
  return io
}
