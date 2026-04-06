import { Queue } from "bullmq"
import { redis } from "../utils/redis.ts"

export const auctionQueue = new Queue("auctionQueue", {
  connection: redis
})

// Suppress queue errors when Redis is offline
auctionQueue.on("error", () => {})
