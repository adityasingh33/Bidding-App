import express from "express"
import http from "http"
import cors from "cors"
import authRoutes from "./routes/authRoutes.ts"
import auctionRoutes from "./routes/auctionRoutes.ts"
import bidRoutes from "./routes/bidRoutes.ts"
import userRoutes from "./routes/userRoutes.ts"
import { authMiddleware } from "./middleware/authMiddlware.ts"
import { initSocket } from "./socket.ts"
import { startAuctionJob } from "./jobs/auctionJob.ts"

// Initialize background BullMQ workers
import "./workers/auctionWorker.ts"

const app = express()
const server = http.createServer(app)

initSocket(server)
startAuctionJob()

app.use(cors())
app.use(express.json())
app.use("/auth", authRoutes)
app.use("/auction", auctionRoutes)
app.use("/bid", bidRoutes)
app.use("/user", userRoutes)

// Temporary protected route to test authorization
app.get("/protected", authMiddleware, (req, res) => {
  res.json({ message: "You are authorized", user: req.user })
})

process.on('uncaughtException', (err: any) => {
  if (err && err.code === 'ECONNREFUSED' && err.port === 6379) {
    // Ignore unhandled Socket errors from nested bullmq redis clients
    return
  }
  console.error('Uncaught Exception:', err)
})

server.listen(3000, () => {
  console.log("Server running with Socket.IO on port 3000")
})