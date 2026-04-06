import { redis } from "./redis.ts"
import { isRedisReady } from "./redis.ts"

// ─────────────────────────────────────────────────────────────
// Redis Lua Script for Atomic Bid Compare-and-Set
// ─────────────────────────────────────────────────────────────
// Redis executes Lua scripts atomically on a single thread.
// No other command can interleave, giving us lockless CAS semantics.
// Key format: auction:{auctionId}:bid
// ─────────────────────────────────────────────────────────────

const PLACE_BID_LUA = `
local currentBid = redis.call('GET', KEYS[1])
if currentBid == false then
  return {-1, "0"}
end
currentBid = tonumber(currentBid)
local newBid = tonumber(ARGV[1])
if newBid > currentBid then
  redis.call('SET', KEYS[1], ARGV[1])
  redis.call('EXPIRE', KEYS[1], 86400)
  return {1, ARGV[1]}
else
  return {0, tostring(currentBid)}
end
`

let luaScriptSHA: string | null = null

/**
 * Load the Lua script into Redis and cache the SHA hash.
 * Called once on startup or lazily on first bid.
 */
async function ensureScriptLoaded(): Promise<string> {
  if (luaScriptSHA) return luaScriptSHA
  luaScriptSHA = await redis.script("LOAD", PLACE_BID_LUA) as string
  return luaScriptSHA
}

/** Build the Redis key for an auction's current bid */
function bidKey(auctionId: number): string {
  return `auction:${auctionId}:bid`
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

export type LuaBidResult =
  | { status: "accepted"; newBid: number }
  | { status: "rejected"; currentBid: number }
  | { status: "cache_miss" }
  | { status: "redis_unavailable" }

/**
 * Atomically attempt to place a bid via Redis Lua script.
 * 
 * Returns:
 *  - accepted:  bid was higher and Redis was updated
 *  - rejected:  bid was lower than or equal to current highest
 *  - cache_miss: auction not in Redis yet, caller must seed and retry
 *  - redis_unavailable: Redis is offline, caller should use DB fallback
 */
export async function atomicPlaceBid(
  auctionId: number,
  amount: number
): Promise<LuaBidResult> {
  if (!isRedisReady()) {
    return { status: "redis_unavailable" }
  }

  try {
    const sha = await ensureScriptLoaded()
    const result = await redis.evalsha(
      sha,
      1,                          // number of keys
      bidKey(auctionId),          // KEYS[1]
      amount.toString()           // ARGV[1]
    ) as [number, string]

    const [code, value] = result

    if (code === 1) {
      return { status: "accepted", newBid: parseFloat(value) }
    } else if (code === 0) {
      return { status: "rejected", currentBid: parseFloat(value) }
    } else {
      // code === -1 → cache miss
      return { status: "cache_miss" }
    }
  } catch (err: any) {
    // If the script was flushed (e.g., Redis restart), reload and retry once
    if (err.message?.includes("NOSCRIPT")) {
      luaScriptSHA = null
      try {
        const sha = await ensureScriptLoaded()
        const result = await redis.evalsha(
          sha,
          1,
          bidKey(auctionId),
          amount.toString()
        ) as [number, string]

        const [code, value] = result
        if (code === 1) return { status: "accepted", newBid: parseFloat(value) }
        if (code === 0) return { status: "rejected", currentBid: parseFloat(value) }
        return { status: "cache_miss" }
      } catch {
        return { status: "redis_unavailable" }
      }
    }
    return { status: "redis_unavailable" }
  }
}

/**
 * Seed Redis with the current highest bid for an auction.
 * Called on cache miss to bootstrap the Lua script's state.
 * Uses SET NX (set-if-not-exists) to avoid overwriting a concurrent seed.
 */
export async function seedBidPrice(
  auctionId: number,
  currentPrice: number
): Promise<void> {
  if (!isRedisReady()) return

  try {
    // NX = only set if key doesn't exist (another request may have seeded it)
    // EX = expire in 24 hours (auction cleanup)
    await redis.set(bidKey(auctionId), currentPrice.toString(), "EX", 86400, "NX")
  } catch {
    // Non-critical — the next bid attempt will try again
  }
}

/**
 * Remove the cached bid price for an auction (e.g., when auction ends).
 */
export async function clearBidPrice(auctionId: number): Promise<void> {
  if (!isRedisReady()) return
  try {
    await redis.del(bidKey(auctionId))
  } catch {
    // Non-critical
  }
}
