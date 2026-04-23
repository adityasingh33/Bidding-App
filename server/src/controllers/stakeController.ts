import { Request, Response } from "express"
import { prisma } from "../utils/prismaClient.ts"

// ─────────────────────────────────────────────────────────────
// POST /auction/:id/stake
// ─────────────────────────────────────────────────────────────
export const stakeForAuction = async (req: Request, res: Response): Promise<void> => {
  try {
    const auctionId = parseInt(req.params.id as string)
    const userId = req.user!.userId

    const auction = await prisma.auction.findUnique({
      where: { id: auctionId }
    })

    if (!auction) {
      res.status(404).json({ error: "Auction not found" })
      return
    }

    if (auction.status !== "JOINING" && auction.status !== "ACTIVE") {
      res.status(400).json({ error: "Can only stake during JOINING or ACTIVE phases" })
      return
    }

    if (auction.sellerId === userId) {
      res.status(400).json({ error: "You cannot stake on your own auction" })
      return
    }

    // Check if user already staked
    const existingStake = await prisma.auctionStake.findUnique({
      where: { auctionId_userId: { auctionId, userId } }
    })

    if (existingStake) {
      res.status(400).json({ error: "You have already staked for this auction" })
      return
    }

    const stakeAmount = auction.startingPrice * 0.05 // 5% of starting price

    // Run atomically with transaction
    await prisma.$transaction(async (tx) => {
      let wallet = await tx.wallet.findUnique({ where: { userId } })
      
      // Auto-create wallet if absent for some reason (users should have it via the auth flow though)
      if (!wallet) {
        wallet = await tx.wallet.create({ data: { userId, balance: 0, lockedBalance: 0 } })
      }

      if (wallet.balance < stakeAmount) {
        throw new Error(`INSUFFICIENT_FUNDS: Need ₹${stakeAmount} but have ₹${wallet.balance}`)
      }

      // 1. Deduct balance, add to locked
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: stakeAmount },
          lockedBalance: { increment: stakeAmount }
        }
      })

      // 2. Create the Stake record
      await tx.auctionStake.create({
        data: {
          auctionId,
          userId,
          amount: stakeAmount,
          status: "LOCKED"
        }
      })

      // 3. Create WalletTransaction log
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "LOCK",
          amount: stakeAmount,
          description: `Locked 5% stake for auction #${auctionId}`,
        }
      })
    })

    res.status(200).json({ message: "Successfully staked for the auction", stakeAmount })
  } catch (error: any) {
    if (error.message?.startsWith('INSUFFICIENT_FUNDS')) {
      res.status(400).json({ error: error.message.split(":")[1].trim() })
    } else {
      console.error(error)
      res.status(500).json({ error: "Failed to process stake" })
    }
  }
}

// ─────────────────────────────────────────────────────────────
// GET /auction/:id/stake
// ─────────────────────────────────────────────────────────────
export const getStakeStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const auctionId = parseInt(req.params.id as string)
    const userId = req.user!.userId

    const stake = await prisma.auctionStake.findUnique({
      where: { auctionId_userId: { auctionId, userId } }
    })

    res.status(200).json({ hasStaked: !!stake, stake })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to get stake status" })
  }
}
