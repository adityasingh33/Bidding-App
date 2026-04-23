import cron from "node-cron"
import { prisma } from "../utils/prismaClient.ts"
import { auctionQueue } from "./queue.ts"

export const startAuctionJob = () => {
  // Run every 10 seconds
  cron.schedule("*/10 * * * * *", async () => {
    const now = new Date()

    // 1. PENDING -> JOINING
    const joiningAuctions = await prisma.auction.findMany({
      where: {
        startTime: { lte: now },
        status: "PENDING",
      },
      select: { id: true }
    })

    for (const auction of joiningAuctions) {
      try {
        await auctionQueue.add("enterJoinPhase", { auctionId: auction.id })
      } catch (err) {}
    }

    // 2. JOINING -> ACTIVE
    const activeAuctions = await prisma.auction.findMany({
      where: {
        biddingStartTime: { lte: now },
        status: "JOINING",
      },
      select: { id: true }
    })

    for (const auction of activeAuctions) {
      try {
        await auctionQueue.add("startBiddingPhase", { auctionId: auction.id })
      } catch (err) {}
    }

    // 3. ACTIVE -> ENDED
    const expiredAuctions = await prisma.auction.findMany({
      where: {
        endTime: { lte: now },
        status: "ACTIVE",
      },
      select: { id: true }
    })

    for (const auction of expiredAuctions) {
      try {
        await auctionQueue.add("endAuction", {
          auctionId: auction.id,
        })
      } catch (err: any) {
        if (err.code === "ECONNREFUSED") {
          console.warn(`⚠️ Warning: Redis is not running. Could not queue auction ${auction.id}.`)
        } else {
          console.error("Queue failed:", err)
        }
      }
    }
  })

  // Run once daily at midnight to clean up expired leaderboards (30-day lifecycle)
  cron.schedule("0 0 * * *", async () => {
    try {
      const deleted = await prisma.auctionLeaderboard.deleteMany({
        where: { expiresAt: { lte: new Date() } }
      })
      if (deleted.count > 0) {
        console.log(`[Cron] Cleaned up ${deleted.count} expired auction leaderboards.`)
      }
    } catch (err) {
      console.error("[Cron] Failed to clean up leaderboards:", err)
    }
  })

  console.log("Auction cron jobs started")
}
