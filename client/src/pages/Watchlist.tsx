import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import AuctionCard from "../components/AuctionCard"
import { SkeletonGrid } from "../components/SkeletonLoader"
import { useUserActivity } from "../context/UserActivityContext"
import API from "../services/api"

interface WatchlistItem {
  id: number
  auction: {
    id: number
    title: string
    sellerName: string
    createdAt: string
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

  const { toggleWatchlist } = useUserActivity()

  const removeFromWatchlist = async (auctionId: number, e: React.MouseEvent) => {
    e.preventDefault() 
    await toggleWatchlist(auctionId)
    // Local optimistic update to remove card from grid immediately
    setWatchlist(prev => prev.filter(item => item.auction.id !== auctionId))
  }

  if (loading) return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="h-10 w-48 bg-slate-800 rounded animate-pulse mb-3"></div>
        <div className="h-4 w-64 bg-white/5 rounded animate-pulse"></div>
      </div>
      <SkeletonGrid />
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            My Watchlist
          </h2>
          <p className="text-slate-400 mt-2">Auctions you're keeping an eye on.</p>
        </div>
      </div>
      
      {watchlist.length === 0 ? (
        <div className="bg-white/5 p-10 rounded-2xl text-center border border-white/10 backdrop-blur-xl shadow-xl">
          <p className="text-slate-400 mb-6 text-lg">Your watchlist is empty.</p>
          <Link to="/auctions" className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500 hover:shadow-purple-500/30 transition-all duration-300 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]">
            Discover Auctions
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {watchlist.map((item) => (
            <AuctionCard 
              key={item.id} 
              auction={item.auction}
              actionIcon="trash"
              onWatchlistClick={(e: React.MouseEvent) => removeFromWatchlist(item.auction.id, e)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
