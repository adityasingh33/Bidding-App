import cron from "node-cron"
import { prisma } from "../utils/prismaClient.ts"
import { getIO } from "../socket.ts"

export const startAuctionJob = () => {
  // Run every 10 seconds
  cron.schedule("*/10 * * * * *", async () => {
    const now = new Date()

    const expiredAuctions = await prisma.auction.findMany({
      where: {
        endTime: { lte: now },
        status: "ACTIVE",
      },
    })

    for (const auction of expiredAuctions) {
      // Find highest bidder
      const highestBid = await prisma.bid.findFirst({
        where: { auctionId: auction.id },
        orderBy: { amount: "desc" },
      })

      // Update auction: mark as ENDED + set winner
      await prisma.auction.update({
        where: { id: auction.id },
        data: {
          status: "ENDED",
          winnerId: highestBid?.userId || null,
        },
      })

      // Emit real-time auction end event
      const io = getIO()
      io.to(`auction_${auction.id}`).emit("auctionEnded", {
        auctionId: auction.id,
        winnerId: highestBid?.userId || null,
        winningAmount: highestBid?.amount || null,
      })

      console.log(`Auction ${auction.id} ended. Winner: ${highestBid?.userId || "none"}`)
    }
  })

  console.log("Auction cron job started (every 10s)")
}
