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
    const { title, category, startingPrice, imageUrl, durationHours } = req.body

    const userId = req.user!.userId
    const sellerName = formatSellerName(req.user?.email || "")
    
    // Check for maximum uncompleted auctions limit
    const activeAuctionsCount = await prisma.auction.count({
      where: {
        sellerId: userId,
        status: { in: ["PENDING", "JOINING", "ACTIVE"] }
      }
    });

    if (activeAuctionsCount >= 5) {
       res.status(400).json({ error: "You can only have up to 5 uncompleted auctions at a time." });
       return;
    }

    const duration = (durationHours && !isNaN(Number(durationHours))) ? Number(durationHours) : 24;

    // Time calculations
    const nowStamp = Date.now();
    let biddingStartStamp = nowStamp + 7 * 60 * 1000; // default 7 mins from now
    
    if (req.body.biddingStartTime) {
      const parsedTime = new Date(req.body.biddingStartTime).getTime();
      if (!isNaN(parsedTime) && parsedTime > nowStamp) {
        biddingStartStamp = parsedTime;
      }
    }

    const biddingStartTime = new Date(biddingStartStamp);
    const startTimeStamp = biddingStartStamp - 2 * 60 * 1000; // Joining phase begins 2 mins prior
    const startTime = new Date(Math.max(startTimeStamp, nowStamp + 1000)); // Ensure it's at least 1s in the future
    const endTime = new Date(biddingStartStamp + duration * 60 * 60 * 1000);

    const auction = await prisma.auction.create({
      data: {
        title,
        sellerName,
        category: category || "Other",
        startingPrice: Number(startingPrice),
        sellerId: userId,
        status: "PENDING",
        startTime,
        biddingStartTime,
        endTime,
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
