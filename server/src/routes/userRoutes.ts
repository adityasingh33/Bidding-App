import express from "express"
import { authMiddleware } from "../middleware/authMiddlware.ts"
import {
  getUserAuctions,
  getUserBids,
  addToWatchlist,
  getWatchlist,
  removeFromWatchlist,
  getFavoriteCategories,
  updateFavoriteCategories,
} from "../controllers/userController.ts"

import { getChatHistory } from "../controllers/chatController.ts"

const router = express.Router()

// All user routes require authentication
router.use(authMiddleware)

router.get("/auctions", getUserAuctions)
router.get("/bids", getUserBids)
router.post("/watchlist", addToWatchlist)
router.get("/watchlist", getWatchlist)
router.delete("/watchlist/:auctionId", removeFromWatchlist)

router.get("/categories", getFavoriteCategories)
router.put("/categories", updateFavoriteCategories)

// 1-on-1 Chat Route
router.get("/chat/:partnerId", getChatHistory)

export default router
