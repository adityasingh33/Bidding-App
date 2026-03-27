import { prisma } from "../utils/prismaClient"

export const placeBid = async (req, res) => {
  try {
    const { auctionId, amount } = req.body
    const userId = req.user.userId

    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
    })

    if (!auction) {
      return res.status(404).json({ message: "Auction not found" })
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

      return bid
    })

    res.status(201).json(result)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to place bid" })
  }
}
