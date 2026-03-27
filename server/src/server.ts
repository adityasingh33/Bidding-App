import express from "express"
import http from "http"
import authRoutes from "./routes/authRoutes.ts"
import auctionRoutes from "./routes/auctionRoutes.ts"
import bidRoutes from "./routes/bidRoutes.ts"
import { authMiddleware } from "./middleware/authMiddlware.ts"
import { initSocket } from "./socket.ts"
import { startAuctionJob } from "./jobs/auctionJob.ts"

const app = express()
const server = http.createServer(app)

initSocket(server)
startAuctionJob()

app.use(express.json())
app.use("/auth", authRoutes)
app.use("/auction", auctionRoutes)
app.use("/bid", bidRoutes)

// Temporary protected route to test authorization
app.get("/protected", authMiddleware, (req, res) => {
  res.json({ message: "You are authorized", user: req.user })
})

server.listen(3000, () => {
  console.log("Server running with Socket.IO on port 3000")
})