import express from "express"
import { createAuction } from "../controllers/auctionController.ts"
import { authMiddleware } from "../middleware/authMiddlware.ts"
import { getAuctions } from "../controllers/auctionController.ts"

const router = express.Router()

router.post("/create", authMiddleware, createAuction)
router.get("/", getAuctions)

export default router
