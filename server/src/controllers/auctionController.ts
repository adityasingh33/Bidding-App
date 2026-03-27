import { Request, Response } from "express"
import { prisma } from "../utils/prismaClient.ts"

export const createAuction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, startingPrice } = req.body

    const userId = req.user!.userId

    const auction = await prisma.auction.create({
      data: {
        title,
        startingPrice,
        sellerId: userId,
        endTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      },
    })

    res.status(201).json(auction)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to create auction" })
  }
}

export const getAuctions = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(String(req.query.page || "1"))
    const limit = parseInt(String(req.query.limit || "10"))
    const skip = (page - 1) * limit

    const auctions = await prisma.auction.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        bids: true,
      },
    })

    res.status(200).json(auctions)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to fetch auctions" })
  }
}

export const getAuctionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(String(req.params.id))

    const auction = await prisma.auction.findUnique({
      where: { id },
      include: {
        bids: {
          orderBy: { amount: "desc" },
        },
      },
    })

    if (!auction) {
      res.status(404).json({ message: "Auction not found" })
      return
    }

    const remainingTime = Math.max(0, auction.endTime.getTime() - Date.now())

    res.status(200).json({ ...auction, remainingTime })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to fetch auction" })
  }
}