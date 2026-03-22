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
      },
    })

    res.status(201).json(auction)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to create auction" })
  }
}

export const getAuctions = async (req: Request, res: Response): Promise<void> => {
    const auctions = await prisma.auction.findMany({
        include: {
            bids:true,
        },
    })
    res.status(200).json(auctions)
}