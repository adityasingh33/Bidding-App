import express from "express"
import { createAuction, getAuctions, getAuctionById } from "../controllers/auctionController.ts"
import { authMiddleware } from "../middleware/authMiddlware.ts"

const router = express.Router()

router.post("/create", authMiddleware, createAuction)
router.get("/", getAuctions)
router.get("/:id", getAuctionById)

export default router
