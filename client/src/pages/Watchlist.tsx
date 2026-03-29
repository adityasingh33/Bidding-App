import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import AuctionCard from "../components/AuctionCard"
import API from "../services/api"

interface WatchlistItem {
  id: number
  auction: {
    id: number
    title: string
    status: string
    currentPrice: number
    startingPrice: number
    endTime: string
  }
}

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchWatchlist = async () => {
    try {
      const res = await API.get("/user/watchlist")
      setWatchlist(res.data)
    } catch (err) {
      console.error("Failed to fetch watchlist", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWatchlist()
  }, [])

  const removeFromWatchlist = async (auctionId: number, e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigating to the link
    try {
      await API.delete(`/user/watchlist/${auctionId}`)
      // Optimistic update
      setWatchlist(prev => prev.filter(item => item.auction.id !== auctionId))
    } catch (err) {
      console.error("Failed to remove from watchlist", err)
    }
  }

  if (loading) return <div className="text-center py-20 text-xl text-slate-400 animate-pulse">Loading your watchlist...</div>

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white flex items-center gap-3 tracking-tight">
            <span>❤️</span> My Watchlist
          </h2>
          <p className="text-slate-400 mt-2">Auctions you're keeping an eye on.</p>
        </div>
      </div>
      
      {watchlist.length === 0 ? (
        <div className="bg-slate-900/60 p-10 rounded-2xl text-center border border-slate-800/60 backdrop-blur-sm shadow-xl">
          <p className="text-slate-400 mb-6 text-lg">Your watchlist is empty.</p>
          <Link to="/auctions" className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]">
            Discover Auctions
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {watchlist.map((item) => (
            <AuctionCard 
              key={item.id} 
              auction={item.auction}
              actionIcon="🗑️"
              onWatchlistClick={(e: React.MouseEvent) => removeFromWatchlist(item.auction.id, e)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
