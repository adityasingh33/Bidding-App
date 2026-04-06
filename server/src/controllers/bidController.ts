import { Request, Response } from "express"
import { processBid } from "../services/bidService.ts"

// ─────────────────────────────────────────────────────────────
// POST /bid/place
// ─────────────────────────────────────────────────────────────
// Thin controller layer — all business logic lives in bidService.
// Maps service result statuses to HTTP status codes.
// ─────────────────────────────────────────────────────────────

export const placeBid = async (req: Request, res: Response): Promise<void> => {
  try {
    const { auctionId, amount } = req.body

    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" })
      return
    }

    if (!auctionId || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      res.status(400).json({ message: "Invalid bid: auctionId and a positive amount are required" })
      return
    }

    const userId = req.user.userId
    const result = await processBid(Number(auctionId), Number(amount), userId)

    switch (result.status) {
      case "accepted":
        res.status(201).json({
          status: "accepted",
          bid: result.bid,
          currentHighestBid: result.currentHighestBid,
        })
        return

      case "rejected":
        res.status(409).json({
          status: "rejected",
          message: result.message,
          currentHighestBid: result.currentHighestBid,
        })
        return

      case "retry":
        res.status(409).json({
          status: "retry",
          message: result.message,
        })
        return

      case "auction_not_found":
        res.status(404).json({
          status: "error",
          message: result.message,
        })
        return

      case "auction_ended":
        res.status(400).json({
          status: "error",
          message: result.message,
        })
        return

      case "self_bid":
        res.status(400).json({
          status: "error",
          message: result.message,
        })
        return

      case "error":
      default:
        res.status(500).json({
          status: "error",
          message: result.message,
        })
        return
    }
  } catch (error) {
    console.error("[BidController] Unhandled error:", error)
    res.status(500).json({ status: "error", message: "Failed to place bid" })
  }
}
