import Redis from "ioredis"

// By default connects to localhost:6379
export const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    // Retry quietly every 10 seconds to reduce CPU and console spam
    return 10000 
  }
})

let warningLogged = false

redis.on("error", (err: any) => {
  if (err.code === "ECONNREFUSED") {
    if (!warningLogged) {
      console.warn(" Warning: Redis is not running locally. Real-time background features are currently paused but the main API will continue to work.")
      warningLogged = true
    }
  } else {
    // suppress other redis errors from spamming
  }
})

// Completely suppress unhandled promise rejections related to ioredis offline states
process.on('unhandledRejection', (reason: any) => {
  if (reason && reason.code === 'ECONNREFUSED' && reason.port === 6379) {
    // Ignore Redis offline errors surfacing from BullMQ internal clients
    return
  }
  console.error('Unhandled Rejection:', reason)
})

/**
 * Check if the Redis connection is ready for commands.
 */
export function isRedisReady(): boolean {
  return redis.status === "ready"
}
