// ─── Wallet Controller ────────────────────────────────────────
// Handles all wallet operations: fetching balance, creating Razorpay
// orders, verifying payments, and processing webhooks.
//
// Payment Flow:
// 1. Frontend calls POST /wallet/create-order with amount
// 2. Backend creates a Razorpay order and returns order_id
// 3. Frontend opens Razorpay Checkout popup with that order_id
// 4. User completes payment on Razorpay's secure page
// 5. Frontend receives success callback, sends payment details
//    to POST /wallet/verify-payment
// 6. Backend verifies the HMAC signature using crypto
// 7. On success, wallet balance is credited in a DB transaction
// 8. Additionally, Razorpay sends a webhook to POST /wallet/webhook
//    as a backup — this is idempotent (won't double-credit)

import { Request, Response } from "express"
import crypto from "crypto"
import { prisma } from "../utils/prismaClient.ts"
import { razorpay, razorpayKeySecret } from "../utils/razorpay.ts"

// ─── GET /wallet ──────────────────────────────────────────────
// Returns the user's wallet. Auto-creates one if it doesn't exist.
export const getWallet = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId

    // Upsert: find existing wallet or create a new one
    let wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 50, // Limit to recent 50 transactions
        },
      },
    })

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId },
        include: {
          transactions: {
            orderBy: { createdAt: "desc" },
            take: 50,
          },
        },
      })
    }

    res.status(200).json(wallet)
  } catch (error) {
    console.error("getWallet error:", error)
    res.status(500).json({ error: "Failed to fetch wallet" })
  }
}

// ─── POST /wallet/create-order ────────────────────────────────
// Accepts { amount } in rupees from the frontend.
// Creates a Razorpay order (amount is in paise = amount * 100).
// Returns the order details needed to open Razorpay Checkout.
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount } = req.body

    // Validate amount
    if (!amount || typeof amount !== "number" || amount <= 0) {
      res.status(400).json({ error: "Invalid amount. Must be a positive number." })
      return
    }

    // Minimum ₹1, maximum ₹50,000 for safety
    if (amount < 1 || amount > 50000) {
      res.status(400).json({ error: "Amount must be between ₹1 and ₹50,000." })
      return
    }

    // Create Razorpay order — amount is in paise (smallest currency unit)
    const options = {
      amount: Math.round(amount * 100), // Convert rupees to paise
      currency: "INR",
      receipt: `wallet_${req.user!.userId}_${Date.now()}`,
      notes: {
        userId: String(req.user!.userId),
        purpose: "wallet_recharge",
      },
    }

    const order = await razorpay.orders.create(options)

    res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID, // Safe to send — this is the public key
    })
  } catch (error) {
    console.error("createOrder error:", error)
    res.status(500).json({ error: "Failed to create Razorpay order" })
  }
}

// ─── POST /wallet/verify-payment ──────────────────────────────
// Called by the frontend after Razorpay Checkout success callback.
// Verifies the payment signature using HMAC SHA256, then credits
// the wallet balance in a database transaction.
export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount, // Amount in rupees (for recording purpose)
    } = req.body

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({ error: "Missing payment verification fields" })
      return
    }

    // ─── Step 1: Verify Razorpay Signature ───────────────
    // Razorpay signs the order_id|payment_id with your secret key.
    // We recreate this signature and compare to ensure authenticity.
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac("sha256", razorpayKeySecret!)
      .update(body)
      .digest("hex")

    if (expectedSignature !== razorpay_signature) {
      console.warn("Payment signature mismatch for:", razorpay_payment_id)
      res.status(400).json({ error: "Payment verification failed — invalid signature" })
      return
    }

    // ─── Step 2: Idempotency Check ───────────────────────
    // Prevent duplicate credits if frontend retries or webhook already processed
    const existingTxn = await prisma.walletTransaction.findUnique({
      where: { razorpayPaymentId: razorpay_payment_id },
    })

    if (existingTxn) {
      console.log("Duplicate payment detected, skipping:", razorpay_payment_id)
      // Return success anyway — the wallet was already credited
      const wallet = await prisma.wallet.findUnique({
        where: { userId: req.user!.userId },
        include: { transactions: { orderBy: { createdAt: "desc" }, take: 50 } },
      })
      res.status(200).json({ message: "Payment already processed", wallet })
      return
    }

    // ─── Step 3: Credit Wallet in a Transaction ──────────
    // Use Prisma's interactive transaction to ensure atomicity.
    const creditAmount = typeof amount === "number" && amount > 0 ? amount : 0

    const wallet = await prisma.$transaction(async (tx) => {
      // Ensure wallet exists (auto-create if first payment)
      let userWallet = await tx.wallet.findUnique({
        where: { userId: req.user!.userId },
      })

      if (!userWallet) {
        userWallet = await tx.wallet.create({
          data: { userId: req.user!.userId },
        })
      }

      // Credit the wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { id: userWallet.id },
        data: {
          balance: { increment: creditAmount },
        },
      })

      // Record the transaction for audit trail
      await tx.walletTransaction.create({
        data: {
          walletId: userWallet.id,
          type: "CREDIT",
          amount: creditAmount,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          description: `Wallet recharge via Razorpay`,
        },
      })

      return updatedWallet
    })

    // Fetch updated wallet with transactions for frontend
    const fullWallet = await prisma.wallet.findUnique({
      where: { id: wallet.id },
      include: { transactions: { orderBy: { createdAt: "desc" }, take: 50 } },
    })

    res.status(200).json({
      message: "Payment verified and wallet credited successfully",
      wallet: fullWallet,
    })
  } catch (error) {
    console.error("verifyPayment error:", error)
    res.status(500).json({ error: "Payment verification failed" })
  }
}

// ─── POST /wallet/webhook ─────────────────────────────────────
// Razorpay sends webhook events to this endpoint.
// We handle `payment.captured` to credit the wallet as a backup.
// This route must NOT have auth middleware — Razorpay calls it directly.
// Idempotency is ensured via unique razorpayPaymentId.
export const webhookHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    // ─── Step 1: Verify Webhook Signature ────────────────
    const webhookSignature = req.headers["x-razorpay-signature"] as string
    const webhookBody = JSON.stringify(req.body)

    const expectedSignature = crypto
      .createHmac("sha256", razorpayKeySecret!)
      .update(webhookBody)
      .digest("hex")

    if (expectedSignature !== webhookSignature) {
      console.warn("Webhook signature verification failed")
      res.status(400).json({ error: "Invalid webhook signature" })
      return
    }

    // ─── Step 2: Handle payment.captured Event ───────────
    const event = req.body.event

    if (event === "payment.captured") {
      const payment = req.body.payload.payment.entity
      const paymentId = payment.id
      const orderId = payment.order_id
      const amountInPaise = payment.amount
      const amountInRupees = amountInPaise / 100

      // Extract userId from the order notes
      const userId = parseInt(payment.notes?.userId)

      if (!userId) {
        console.warn("Webhook: No userId in payment notes for:", paymentId)
        res.status(200).json({ status: "ok" }) // Acknowledge but skip
        return
      }

      // ─── Idempotency Check ─────────────────────────────
      const existingTxn = await prisma.walletTransaction.findUnique({
        where: { razorpayPaymentId: paymentId },
      })

      if (existingTxn) {
        console.log("Webhook: Payment already processed, skipping:", paymentId)
        res.status(200).json({ status: "ok" })
        return
      }

      // ─── Credit Wallet ─────────────────────────────────
      await prisma.$transaction(async (tx) => {
        let userWallet = await tx.wallet.findUnique({
          where: { userId },
        })

        if (!userWallet) {
          userWallet = await tx.wallet.create({
            data: { userId },
          })
        }

        await tx.wallet.update({
          where: { id: userWallet.id },
          data: {
            balance: { increment: amountInRupees },
          },
        })

        await tx.walletTransaction.create({
          data: {
            walletId: userWallet.id,
            type: "CREDIT",
            amount: amountInRupees,
            razorpayOrderId: orderId,
            razorpayPaymentId: paymentId,
            description: `Wallet recharge via Razorpay webhook`,
          },
        })
      })

      console.log(`Webhook: Credited ₹${amountInRupees} to user ${userId}`)
    }

    // Always respond 200 to acknowledge the webhook
    res.status(200).json({ status: "ok" })
  } catch (error) {
    console.error("Webhook error:", error)
    // Still respond 200 to prevent Razorpay from retrying indefinitely
    res.status(200).json({ status: "error" })
  }
}

// ─── Utility: Deduct Stake ────────────────────────────────────
// Deducts 5% of a bid amount from balance and moves it to lockedBalance.
// This is called when a user places a bid to lock their stake.
// Returns the updated wallet or throws if insufficient balance.
export const deductStake = async (userId: number, bidAmount: number) => {
  const stakeAmount = bidAmount * 0.05 // 5% of bid

  return await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({
      where: { userId },
    })

    if (!wallet) {
      throw new Error("Wallet not found. Please add money first.")
    }

    if (wallet.balance < stakeAmount) {
      throw new Error(
        `Insufficient balance. You need ₹${stakeAmount.toFixed(2)} (5% stake) but have ₹${wallet.balance.toFixed(2)}`
      )
    }

    // Move 5% from balance to lockedBalance
    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: { decrement: stakeAmount },
        lockedBalance: { increment: stakeAmount },
      },
    })

    // Record the lock transaction
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "LOCK",
        amount: stakeAmount,
        description: `5% stake locked for bid of ₹${bidAmount}`,
      },
    })

    return updatedWallet
  })
}
