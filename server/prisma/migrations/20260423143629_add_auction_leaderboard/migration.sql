-- CreateTable
CREATE TABLE "AuctionLeaderboard" (
    "auctionId" INTEGER NOT NULL,
    "topBidders" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuctionLeaderboard_pkey" PRIMARY KEY ("auctionId")
);

-- AddForeignKey
ALTER TABLE "AuctionLeaderboard" ADD CONSTRAINT "AuctionLeaderboard_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
