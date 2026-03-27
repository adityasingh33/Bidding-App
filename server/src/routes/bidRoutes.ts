import express from "express"
import { placeBid } from "../controllers/bidController"
import { authMiddleware } from "../middleware/authMiddlware"

const router = express.Router()

router.post("/place", authMiddleware, placeBid)

export default router
