import express from "express"
import authRoutes from "./routes/authRoutes.ts"
import { authMiddleware } from "./middleware/authMiddlware.ts"

const app = express()

app.use(express.json())
app.use("/auth", authRoutes)

// Temporary protected route to test authorization
app.get("/protected", authMiddleware, (req, res) => {
  res.json({ message: "You are authorized", user: req.user })
})

app.listen(3000, () => {
  console.log("Server running")
})