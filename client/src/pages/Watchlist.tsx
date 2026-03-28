import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
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

  if (loading) return <div className="text-center py-10 text-xl text-gray-400">Loading your watchlist...</div>

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-white flex items-center gap-3">
        <span>❤️</span> My Watchlist
      </h2>
      
      {watchlist.length === 0 ? (
        <div className="bg-gray-800 p-8 rounded-lg text-center border border-gray-700">
          <p className="text-gray-400 mb-4">Your watchlist is empty.</p>
          <Link to="/auctions" className="inline-block px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded transition-colors">
            Discover Auctions
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {watchlist.map((item) => (
            <Link 
              to={`/auctions/${item.auction.id}`} 
              key={item.id} 
              className="block bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-indigo-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-200 relative group"
            >
              <button 
                onClick={(e) => removeFromWatchlist(item.auction.id, e)}
                className="absolute top-3 right-3 z-10 p-2 bg-red-900/50 hover:bg-red-900 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                title="Remove from watchlist"
              >
                🗑️
              </button>
              
              <div className="p-6 flex flex-col h-full">
                <h3 className="text-xl font-bold mb-4 text-white line-clamp-2 pr-8">{item.auction.title}</h3>
                <div className="space-y-2 mb-6 text-gray-400 flex-grow">
                  <p>Current Price: <span className="font-semibold text-green-400">${item.auction.currentPrice || item.auction.startingPrice}</span></p>
                  <p>Status: <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${item.auction.status === 'ACTIVE' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>{item.auction.status}</span></p>
                </div>
                <div className="w-full text-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded transition-colors mt-auto">
                  View Auction
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
