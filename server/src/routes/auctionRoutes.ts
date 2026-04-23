import express from "express"
import { createAuction, getAuctions, getAuctionById, endAuctionEarly, getAuctionLeaderboard } from "../controllers/auctionController.ts"
import { stakeForAuction, getStakeStatus } from "../controllers/stakeController.ts"
import { authMiddleware } from "../middleware/authMiddlware.ts"

const router = express.Router()

router.post("/create", authMiddleware, createAuction)
router.get("/", getAuctions)
router.get("/:id", getAuctionById)
router.post("/:id/end", authMiddleware, endAuctionEarly)
router.post("/:id/stake", authMiddleware, stakeForAuction)
router.get("/:id/stake", authMiddleware, getStakeStatus)
router.get("/:id/leaderboard", getAuctionLeaderboard)

export default router
