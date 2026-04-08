import { Request, Response } from "express"
import { prisma } from "../utils/prismaClient.ts"
import { redis } from "../utils/redis.ts"
import { getIO } from "../socket.ts"

const formatSellerName = (email: string) => {
  const localPart = email.split("@")[0] || "seller"
  return localPart
    .replace(/[._-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ") || "Unknown Seller"
}

export const createAuction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, startingPrice, imageUrl, durationHours } = req.body

    const userId = req.user!.userId
    const sellerName = formatSellerName(req.user?.email || "")
    
    // Default to 24 hours if duration is not provided or invalid
    const duration = (durationHours && !isNaN(Number(durationHours))) ? Number(durationHours) : 24;

    const auction = await prisma.auction.create({
      data: {
        title,
        sellerName,
        startingPrice: Number(startingPrice),
        sellerId: userId,
        endTime: new Date(Date.now() + duration * 60 * 60 * 1000), 
        imageUrl: imageUrl || null
      },
    })

    // Invalidate main feed cache
    if (redis.status === "ready") {
      await redis.del("auctions_list").catch(() => {})
    }

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
    
    // Redis Caching Logic
    // Only cache the first page for this demo to show the pattern simply
    const cacheKey = page === 1 ? "auctions_list" : `auctions_list_p${page}`
    
    try {
      if (redis.status === "ready") {
        const cached = await redis.get(cacheKey)
        if (cached) {
          res.status(200).json(JSON.parse(cached))
          return
        }
      }
    } catch (e) {
      // Ignore redis cache fetch errors safely
    }

    const auctions = await prisma.auction.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        bids: true,
      },
    })

    try {
      if (redis.status === "ready") {
        await redis.set(cacheKey, JSON.stringify(auctions), "EX", 10) // Cache for 10 seconds
      }
    } catch(e) {}

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

export const endAuctionEarly = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(String(req.params.id))
    const userId = req.user!.userId

    const auction = await prisma.auction.findUnique({
      where: { id },
    })

    if (!auction) {
      res.status(404).json({ error: "Auction not found" })
      return
    }

    if (auction.sellerId !== userId) {
      res.status(403).json({ error: "Only the seller can end this auction" })
      return
    }

    if (auction.status !== "ACTIVE") {
      res.status(400).json({ error: "Auction is already ended" })
      return
    }

    // Update auction status and endTime precisely
    const updatedAuction = await prisma.auction.update({
      where: { id },
      data: { 
        status: "ENDED",
        endTime: new Date()
      },
      include: {
        bids: {
          orderBy: { amount: "desc" },
          take: 1
        }
      }
    })

    const winnerId = updatedAuction.bids.length > 0 ? updatedAuction.bids[0].userId : null

    try {
      getIO().to(`auction_${id}`).emit("auctionEnded", {
        auctionId: id,
        winnerId
      })
    } 
    catch {}

    res.status(200).json(updatedAuction)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to end auction" })
  }
}
