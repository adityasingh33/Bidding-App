// ─── Wallet Routes ────────────────────────────────────────────
// Maps HTTP endpoints to wallet controller functions.
// Note: The webhook route MUST NOT have auth middleware because
// Razorpay's servers call it directly (server-to-server).

import express from "express"
import { authMiddleware } from "../middleware/authMiddlware.ts"
import {
  getWallet,
  createOrder,
  verifyPayment,
  webhookHandler,
} from "../controllers/walletController.ts"

const router = express.Router()

// Webhook endpoint — NO auth (Razorpay calls this directly)
// Must be registered BEFORE the auth middleware
router.post("/webhook", webhookHandler)

// All other wallet routes require authentication
router.use(authMiddleware)

router.get("/", getWallet)
router.post("/create-order", createOrder)
router.post("/verify-payment", verifyPayment)

export default router
