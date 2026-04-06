import cron from "node-cron"
import { prisma } from "../utils/prismaClient.ts"
import { auctionQueue } from "./queue.ts"

export const startAuctionJob = () => {
  // Run every 10 seconds
  cron.schedule("*/10 * * * * *", async () => {
    const now = new Date()

    const expiredAuctions = await prisma.auction.findMany({
      where: {
        endTime: { lte: now },
        status: "ACTIVE",
      },
      select: { id: true }
    })

    for (const auction of expiredAuctions) {
      // Instead of doing heavy querying and connections in the primary Node thread,
      // push it onto BullMQ for background processors!
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

  console.log("Auction cron job started (every 10s)")
}
