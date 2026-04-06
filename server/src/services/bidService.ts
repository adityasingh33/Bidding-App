import { prisma } from "../utils/prismaClient.ts"
import { redis } from "../utils/redis.ts"
import { isRedisReady } from "../utils/redis.ts"
import { getIO } from "../socket.ts"
import { atomicPlaceBid, seedBidPrice, clearBidPrice } from "../utils/bidLuaScripts.ts"

// ─────────────────────────────────────────────────────────────
// Structured Bid Logger
// ─────────────────────────────────────────────────────────────

type BidEvent =
  | "BID_ATTEMPT"
  | "BID_ACCEPTED"
  | "BID_REJECTED"
  | "BID_CONFLICT"
  | "BID_ERROR"
  | "BID_CACHE_SEED"
  | "BID_DB_FALLBACK"

interface BidLogEntry {
  event: BidEvent
  auctionId: number
  userId: number
  amount: number
  currentBid?: number
  latencyMs?: number
  path?: "redis_lua" | "db_fallback"
  message?: string
}

function bidLog(entry: BidLogEntry): void {
  const timestamp = new Date().toISOString()
  console.log(
    JSON.stringify({ timestamp, ...entry })
  )
}

// ─────────────────────────────────────────────────────────────
// Bid Service Response Types
// ─────────────────────────────────────────────────────────────

export type BidResult =
  | { status: "accepted"; bid: any; currentHighestBid: number }
  | { status: "rejected"; message: string; currentHighestBid: number }
  | { status: "retry"; message: string }
  | { status: "auction_not_found"; message: string }
  | { status: "auction_ended"; message: string }
  | { status: "self_bid"; message: string }
  | { status: "error"; message: string }

// ─────────────────────────────────────────────────────────────
// Main Bid Processing Entry Point
// ─────────────────────────────────────────────────────────────

export async function processBid(
  auctionId: number,
  amount: number,
  userId: number
): Promise<BidResult> {
  const startTime = Date.now()

  bidLog({
    event: "BID_ATTEMPT",
    auctionId,
    userId,
    amount,
  })

  // ── Step 1: Validate auction exists and is active ────────
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
  })

  if (!auction) {
    return { status: "auction_not_found", message: "Auction not found" }
  }

  if (new Date() > auction.endTime || auction.status !== "ACTIVE") {
    return { status: "auction_ended", message: "Auction has ended" }
  }

  if (auction.sellerId === userId) {
    return { status: "self_bid", message: "Cannot bid on your own auction" }
  }

  // Basic price floor check (fast reject before hitting Redis)
  const priceFloor = auction.currentPrice || auction.startingPrice
  if (amount <= priceFloor * 0.99) {
    // Allow a tiny margin for floating point, but reject obviously low bids
    bidLog({
      event: "BID_REJECTED",
      auctionId,
      userId,
      amount,
      currentBid: priceFloor,
      latencyMs: Date.now() - startTime,
      path: "redis_lua",
      message: "Below price floor (fast reject)",
    })
    return {
      status: "rejected",
      message: "Bid must be higher than current price",
      currentHighestBid: priceFloor,
    }
  }

  // ── Step 2: Attempt atomic bid via Redis Lua ──────────────
  if (isRedisReady()) {
    const result = await attemptRedisBid(auctionId, amount, userId, auction, startTime)
    if (result) return result
  }

  // ── Step 3: Fallback to DB-only optimistic locking ────────
  bidLog({
    event: "BID_DB_FALLBACK",
    auctionId,
    userId,
    amount,
    path: "db_fallback",
  })

  return attemptDatabaseBid(auctionId, amount, userId, auction, startTime)
}

// ─────────────────────────────────────────────────────────────
// Redis Lua Path
// ─────────────────────────────────────────────────────────────

async function attemptRedisBid(
  auctionId: number,
  amount: number,
  userId: number,
  auction: any,
  startTime: number
): Promise<BidResult | null> {
  let luaResult = await atomicPlaceBid(auctionId, amount)

  // Handle cache miss: seed from DB and retry once
  if (luaResult.status === "cache_miss") {
    const freshAuction = await prisma.auction.findUnique({
      where: { id: auctionId },
      select: { currentPrice: true, startingPrice: true },
    })
    if (!freshAuction) {
      return { status: "auction_not_found", message: "Auction not found" }
    }

    const currentPrice = freshAuction.currentPrice || freshAuction.startingPrice
    await seedBidPrice(auctionId, currentPrice)

    bidLog({
      event: "BID_CACHE_SEED",
      auctionId,
      userId,
      amount,
      currentBid: currentPrice,
    })

    // Retry the Lua script now that Redis is seeded
    luaResult = await atomicPlaceBid(auctionId, amount)
  }

  if (luaResult.status === "redis_unavailable") {
    // Fall through to DB fallback
    return null
  }

  if (luaResult.status === "rejected") {
    bidLog({
      event: "BID_REJECTED",
      auctionId,
      userId,
      amount,
      currentBid: luaResult.currentBid,
      latencyMs: Date.now() - startTime,
      path: "redis_lua",
    })
    return {
      status: "rejected",
      message: "Bid must be higher than current price",
      currentHighestBid: luaResult.currentBid,
    }
  }

  if (luaResult.status === "accepted") {
    // ── Persist to database ───────────────────────────────
    const bid = await syncBidToDatabase(auctionId, amount, userId, auction)

    bidLog({
      event: "BID_ACCEPTED",
      auctionId,
      userId,
      amount,
      latencyMs: Date.now() - startTime,
      path: "redis_lua",
    })

    // ── Real-time notifications ───────────────────────────
    emitBidEvents(auctionId, amount, userId, auction)

    return {
      status: "accepted",
      bid,
      currentHighestBid: amount,
    }
  }

  return null
}

// ─────────────────────────────────────────────────────────────
// Database Fallback Path (Optimistic Locking)
// ─────────────────────────────────────────────────────────────

async function attemptDatabaseBid(
  auctionId: number,
  amount: number,
  userId: number,
  auction: any,
  startTime: number,
  retryCount = 0
): Promise<BidResult> {
  const MAX_RETRIES = 3

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Read current state with version
      const current = await tx.auction.findUnique({
        where: { id: auctionId },
        select: { currentPrice: true, startingPrice: true, version: true, status: true, endTime: true },
      })

      if (!current) throw new Error("AUCTION_NOT_FOUND")
      if (current.status !== "ACTIVE" || new Date() > current.endTime) {
        throw new Error("AUCTION_ENDED")
      }

      const currentPrice = current.currentPrice || current.startingPrice

      if (amount <= currentPrice) {
        throw new Error(`BID_TOO_LOW:${currentPrice}`)
      }

      // Optimistic lock: update only if version matches
      const updated = await tx.auction.updateMany({
        where: {
          id: auctionId,
          version: current.version,      // ← optimistic lock check
        },
        data: {
          currentPrice: amount,
          version: { increment: 1 },     // ← bump version
        },
      })

      if (updated.count === 0) {
        // Another transaction beat us — version mismatch
        throw new Error("VERSION_CONFLICT")
      }

      // Create bid record
      const bid = await tx.bid.create({
        data: {
          amount,
          auctionId,
          userId,
        },
      })

      // Handle anti-snipe extension
      const timeLeft = current.endTime.getTime() - Date.now()
      if (timeLeft < 30000) {
        const newEndTime = new Date(Date.now() + 30000)
        await tx.auction.update({
          where: { id: auctionId },
          data: { endTime: newEndTime },
        })

        try {
          const io = getIO()
          io.to(`auction_${auctionId}`).emit("timeExtended", {
            auctionId,
            newEndTime,
          })
        } catch {}
      }

      return bid
    })

    bidLog({
      event: "BID_ACCEPTED",
      auctionId,
      userId,
      amount,
      latencyMs: Date.now() - startTime,
      path: "db_fallback",
    })

    emitBidEvents(auctionId, amount, userId, auction)

    return {
      status: "accepted",
      bid: result,
      currentHighestBid: amount,
    }
  } catch (err: any) {
    if (err.message === "AUCTION_NOT_FOUND") {
      return { status: "auction_not_found", message: "Auction not found" }
    }
    if (err.message === "AUCTION_ENDED") {
      return { status: "auction_ended", message: "Auction has ended" }
    }
    if (err.message?.startsWith("BID_TOO_LOW:")) {
      const currentBid = parseFloat(err.message.split(":")[1])
      bidLog({
        event: "BID_REJECTED",
        auctionId,
        userId,
        amount,
        currentBid,
        latencyMs: Date.now() - startTime,
        path: "db_fallback",
      })
      return {
        status: "rejected",
        message: "Bid must be higher than current price",
        currentHighestBid: currentBid,
      }
    }
    if (err.message === "VERSION_CONFLICT") {
      bidLog({
        event: "BID_CONFLICT",
        auctionId,
        userId,
        amount,
        latencyMs: Date.now() - startTime,
        path: "db_fallback",
        message: `Retry ${retryCount + 1}/${MAX_RETRIES}`,
      })

      if (retryCount < MAX_RETRIES) {
        // Re-fetch and retry
        const freshAuction = await prisma.auction.findUnique({
          where: { id: auctionId },
        })
        if (!freshAuction) {
          return { status: "auction_not_found", message: "Auction not found" }
        }
        return attemptDatabaseBid(auctionId, amount, userId, freshAuction, startTime, retryCount + 1)
      }

      return { status: "retry", message: "Concurrency conflict — please retry your bid" }
    }

    bidLog({
      event: "BID_ERROR",
      auctionId,
      userId,
      amount,
      latencyMs: Date.now() - startTime,
      message: err.message,
    })

    return { status: "error", message: "Failed to place bid" }
  }
}

// ─────────────────────────────────────────────────────────────
// Database Sync (after Redis Lua success)
// ─────────────────────────────────────────────────────────────

async function syncBidToDatabase(
  auctionId: number,
  amount: number,
  userId: number,
  auction: any
): Promise<any> {
  return prisma.$transaction(async (tx) => {
    // Find previous highest bidder for outbid notification
    const prevHighest = await tx.bid.findFirst({
      where: { auctionId },
      orderBy: { amount: "desc" },
    })

    // Create the bid record
    const bid = await tx.bid.create({
      data: {
        amount,
        auctionId,
        userId,
      },
    })

    // Update the auction's current price and bump version
    await tx.auction.update({
      where: { id: auctionId },
      data: {
        currentPrice: amount,
        version: { increment: 1 },
      },
    })

    // Handle anti-snipe: extend auction if bid is in last 30 seconds
    const timeLeft = auction.endTime.getTime() - Date.now()
    if (timeLeft < 30000) {
      const newEndTime = new Date(Date.now() + 30000)
      await tx.auction.update({
        where: { id: auctionId },
        data: { endTime: newEndTime },
      })

      try {
        const io = getIO()
        io.to(`auction_${auctionId}`).emit("timeExtended", {
          auctionId,
          newEndTime,
        })
      } catch {}
    }

    // Notify previous highest bidder if they got outbid
    if (prevHighest && prevHighest.userId !== userId) {
      try {
        const io = getIO()
        io.to(`user_${prevHighest.userId}`).emit("outbid", {
          auctionId,
          title: auction.title,
        })
      } catch {}
    }

    return bid
  })
}

// ─────────────────────────────────────────────────────────────
// WebSocket Event Emitter
// ─────────────────────────────────────────────────────────────

function emitBidEvents(
  auctionId: number,
  amount: number,
  userId: number,
  _auction: any
): void {
  try {
    const io = getIO()
    io.to(`auction_${auctionId}`).emit("newBid", {
      auctionId,
      amount,
      userId,
    })
  } catch {
    // Socket not initialized — non-critical
  }

  // Bust the Redis cache so feed data stays fresh
  if (isRedisReady()) {
    redis.del("auctions_list").catch(() => {})
  }
}

// Re-export clearBidPrice for use by auction ending logic
export { clearBidPrice } from "../utils/bidLuaScripts.ts"
