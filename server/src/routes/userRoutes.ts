import express from "express"
import { authMiddleware } from "../middleware/authMiddlware.ts"
import {
  getUserAuctions,
  getUserBids,
  addToWatchlist,
  getWatchlist,
  removeFromWatchlist,
} from "../controllers/userController.ts"

const router = express.Router()

// All user routes require authentication
router.use(authMiddleware)

router.get("/auctions", getUserAuctions)
router.get("/bids", getUserBids)
router.post("/watchlist", addToWatchlist)
router.get("/watchlist", getWatchlist)
router.delete("/watchlist/:auctionId", removeFromWatchlist)

export default router
