import { useState, useEffect } from "react"
import AuctionCard from "../components/AuctionCard"
import API from "../services/api"

interface Auction {
  id: number
  title: string
  startingPrice: number
  currentPrice: number
  status: string
  endTime: string
}

const Auctions = () => {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const res = await API.get("/auction")
        setAuctions(res.data)
      } catch (err) {
        console.error("Failed to fetch auctions", err)
      } finally {
        setLoading(false)
      }
    }

    fetchAuctions()
  }, [])

  const addToWatchlist = async (auctionId: number, e: React.MouseEvent) => {
    e.preventDefault()
    try {
      await API.post("/user/watchlist", { auctionId })
      alert("Added to Watchlist ❤️") // Basic feedback, will improve with toasts later
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to add to watchlist")
    }
  }

  if (loading) return <div className="text-center py-20 text-xl text-slate-400 animate-pulse">Loading auctions...</div>

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Live Auctions</h2>
          <p className="text-slate-400 mt-2">Discover and bid on exclusive items in real-time.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {auctions.map((auction) => (
          <AuctionCard 
            key={auction.id} 
            auction={auction}
            onWatchlistClick={(e: React.MouseEvent) => addToWatchlist(auction.id, e)}
          />
        ))}
        {auctions.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-900/40 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
            <p className="text-slate-400 text-lg">No active auctions found at the moment.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Auctions
