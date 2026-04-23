// ─── Razorpay SDK Initialization ──────────────────────────────
// Creates a single Razorpay instance using environment variables.
// Only the server uses this — the secret key is NEVER exposed to the client.

import "dotenv/config"
import Razorpay from "razorpay"

const razorpayKeyId = process.env.RAZORPAY_KEY_ID
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET

if (!razorpayKeyId || !razorpayKeySecret) {
  throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in .env")
}

export const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
})

// Export for use in signature verification
export { razorpayKeySecret }
