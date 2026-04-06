import { Worker } from "bullmq"
import { redis } from "../utils/redis.ts"
import { prisma } from "../utils/prismaClient.ts"
import { getIO } from "../socket.ts"
import { clearBidPrice } from "../utils/bidLuaScripts.ts"

export const auctionWorker = new Worker("auctionQueue", async (job) => {
  if (job.name === "endAuction") {
    const { auctionId } = job.data
    console.log(`[Worker] Ending auction ${auctionId}...`)
    
    // Update auction status
    try {
      const updatedAuction = await prisma.auction.update({
        where: { id: auctionId },
        data: { status: "ENDED" },
        include: {
          bids: {
            orderBy: { amount: "desc" },
            take: 1
          }
        }
      })

      const winnerId = updatedAuction.bids.length > 0 ? updatedAuction.bids[0].userId : null

      try {
        const io = getIO()
        io.to(`auction_${auctionId}`).emit("auctionEnded", {
          auctionId,
          winnerId
        })
        if (winnerId) {
          // Notify the winner globally
          io.to(`user_${winnerId}`).emit("auctionEnded", { auctionId, winnerId })
        }
      } catch(e) {}
      
      await redis.del("auctions_list").catch(() => {})
      await clearBidPrice(auctionId)
      console.log(`[Worker] Auction ${auctionId} successfully ended.`)
    } catch(err) {
      console.error(`[Worker] Failed to end auction ${auctionId}`, err)
      throw err // Let BullMQ retry
    }
  }
}, { connection: redis })

auctionWorker.on("error", (err: any) => {
  // Completely suppress offline spam from worker
})
