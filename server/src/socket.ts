import { Server } from "socket.io"
import http from "http"

let io: Server

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: { origin: "*" },
  })

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id)

    socket.on("joinAuction", (auctionId: number) => {
      socket.join(`auction_${auctionId}`)
      console.log(`User ${socket.id} joined auction_${auctionId}`)
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
