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
  } else if (job.name === "enterJoinPhase") {
    const { auctionId } = job.data
    console.log(`[Worker] Auction ${auctionId} entering JOINING phase...`)
    try {
      const updatedAuction = await prisma.auction.update({
        where: { id: auctionId },
        data: { status: "JOINING" },
      })
      const io = getIO()
      io.to(`auction_${auctionId}`).emit("auctionStatusChange", {
        auctionId,
        status: "JOINING"
      })
      
      // Notify users who favorited this category
      const users = await prisma.user.findMany({
        where: { favoriteCategories: { has: updatedAuction.category } },
        select: { id: true }
      })
      
      const notifiedSet = new Set<number>()

      for (const u of users) {
        if (u.id === updatedAuction.sellerId) continue; // skip owner here
        io.to(`user_${u.id}`).emit("categoryNotification", {
          type: "info",
          title: `New Auction in ${updatedAuction.category}`,
          message: `${updatedAuction.title} is starting soon!`
        })
        notifiedSet.add(u.id)
      }

      // Notify the owner
      io.to(`user_${updatedAuction.sellerId}`).emit("categoryNotification", {
        type: "success",
        title: `Your Auction is Starting!`,
        message: `Your auction "${updatedAuction.title}" is now open for users to join. Bidding starts in 2 minutes.`
      })

      await redis.del("auctions_list").catch(() => {})
    } catch (err) {
      console.error(`[Worker] failed to enter join phase for ${auctionId}`, err)
    }
  } else if (job.name === "startBiddingPhase") {
    const { auctionId } = job.data
    console.log(`[Worker] Auction ${auctionId} entering ACTIVE phase...`)
    try {
      await prisma.auction.update({
        where: { id: auctionId },
        data: { status: "ACTIVE" },
      })
      const io = getIO()
      io.to(`auction_${auctionId}`).emit("auctionStatusChange", {
        auctionId,
        status: "ACTIVE"
      })
      await redis.del("auctions_list").catch(() => {})
    } catch (err) {
      console.error(`[Worker] failed to start bidding for ${auctionId}`, err)
    }
  }
}, { connection: redis })

auctionWorker.on("error", (err: any) => {
  // Completely suppress offline spam from worker
})
