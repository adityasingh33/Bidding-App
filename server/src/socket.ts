import { Server } from "socket.io"
import http from "http"
import { createAdapter } from "@socket.io/redis-adapter"
import { redis } from "./utils/redis.ts"

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

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id)
    })
  })
}

export const getIO = () => {
  if (!io) throw new Error("Socket not initialized")
  return io
}
