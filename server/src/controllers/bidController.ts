import { Request, Response } from "express"
import { prisma } from "../utils/prismaClient"
import { getIO } from "../socket"

export const placeBid = async (req: Request, res: Response) => {
  try {
    const { auctionId, amount } = req.body

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const userId = req.user.userId

    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
    })

    if (!auction) {
      return res.status(404).json({ message: "Auction not found" })
    }

    // Check if auction has ended
    if (new Date() > auction.endTime) {
      return res.status(400).json({ message: "Auction ended" })
    }

    // Check if auction is active
    if (auction.status !== "ACTIVE") {
      return res.status(400).json({ message: "Auction not active" })
    }

    // Prevent self-bidding
    if (auction.sellerId === userId) {
      return res.status(400).json({ message: "Cannot bid on your own auction" })
    }

    // Determine current highest price
    const currentPrice = auction.currentPrice || auction.startingPrice

    if (amount <= currentPrice) {
      return res.status(400).json({
        message: "Bid must be higher than current price",
      })
    }

    // Transaction (IMPORTANT)
    const result = await prisma.$transaction(async (tx) => {
      const bid = await tx.bid.create({
        data: {
          amount,
          auctionId,
          userId,
        },
      })

      await tx.auction.update({
        where: { id: auctionId },
        data: { currentPrice: amount },
      })

      // Extend auction if bid is in the last 30 seconds
      const timeLeft = auction.endTime.getTime() - Date.now()
      if (timeLeft < 30000) {
        const newEndTime = new Date(Date.now() + 30000)
        await tx.auction.update({
          where: { id: auctionId },
          data: { endTime: newEndTime },
        })

        // Notify clients about time extension
        const io = getIO()
        io.to(`auction_${auctionId}`).emit("timeExtended", {
          auctionId,
          newEndTime,
        })
      }

      return bid
    })

    // Emit real-time update to all users in auction room
    const io = getIO()
    io.to(`auction_${auctionId}`).emit("newBid", {
      auctionId,
      amount,
      userId,
    })

    res.status(201).json(result)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to place bid" })
  }
}
