import { Request, Response } from "express"
import { prisma } from "../utils/prismaClient.ts"

// GET /user/auctions — auctions created by the logged-in user
export const getUserAuctions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId

    const auctions = await prisma.auction.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: "desc" },
      include: { bids: true },
    })

    res.status(200).json(auctions)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to fetch user auctions" })
  }
}

// GET /user/bids — bids placed by the logged-in user
export const getUserBids = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId

    const bids = await prisma.bid.findMany({
      where: { userId },
      orderBy: { amount: "desc" },
      include: {
        auction: true,
      },
    })

    res.status(200).json(bids)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to fetch user bids" })
  }
}

// POST /user/watchlist — add auction to watchlist
export const addToWatchlist = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId
    const { auctionId } = req.body

    const entry = await prisma.watchlist.create({
      data: { userId, auctionId },
    })

    res.status(201).json(entry)
  } catch (error: any) {
    if (error.code === "P2002") {
      res.status(400).json({ message: "Already in watchlist" })
      return
    }
    console.error(error)
    res.status(500).json({ error: "Failed to add to watchlist" })
  }
}

// GET /user/watchlist — get user's watchlist
export const getWatchlist = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId

    const watchlist = await prisma.watchlist.findMany({
      where: { userId },
      include: {
        auction: true,
      },
    })

    res.status(200).json(watchlist)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to fetch watchlist" })
  }
}

// DELETE /user/watchlist/:auctionId — remove from watchlist
export const removeFromWatchlist = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId
    const auctionId = parseInt(String(req.params.auctionId))

    await prisma.watchlist.delete({
      where: {
        userId_auctionId: { userId, auctionId },
      },
    })

    res.status(200).json({ message: "Removed from watchlist" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to remove from watchlist" })
  }
}
