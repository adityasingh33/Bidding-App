import express from "express"
import { createAuction, getAuctions, getAuctionById, endAuctionEarly } from "../controllers/auctionController.ts"
import { authMiddleware } from "../middleware/authMiddlware.ts"

const router = express.Router()

router.post("/create", authMiddleware, createAuction)
router.get("/", getAuctions)
router.get("/:id", getAuctionById)
router.post("/:id/end", authMiddleware, endAuctionEarly)

export default router
