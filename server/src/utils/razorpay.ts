// ─── Razorpay SDK Initialization ──────────────────────────────
// Creates a single Razorpay instance using environment variables.
// Only the server uses this — the secret key is NEVER exposed to the client.

import "dotenv/config"
import Razorpay from "razorpay"

// Trim to remove any hidden trailing whitespace from .env
const razorpayKeyId = process.env.RAZORPAY_KEY_ID?.trim()
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET?.trim()

if (!razorpayKeyId || !razorpayKeySecret) {
  throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in .env")
}

// Debug: verify the key being used (only shows first 15 chars for safety)
console.log(`Razorpay initialized with key: ${razorpayKeyId.substring(0, 15)}...`)

export const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
})

// Export for use in signature verification
export { razorpayKeySecret }

