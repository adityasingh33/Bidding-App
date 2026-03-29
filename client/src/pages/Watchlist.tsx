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
            <Link 
              to={`/auctions/${item.auction.id}`} 
              key={item.id} 
              className="group flex flex-col bg-slate-900/60 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-800/60 hover:border-indigo-500/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:bg-slate-900/80 transition-all duration-300 relative"
            >
              <button 
                onClick={(e) => removeFromWatchlist(item.auction.id, e)}
                className="absolute top-4 right-4 z-10 p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-full transition-colors opacity-0 group-hover:opacity-100 shadow-sm border border-rose-500/20"
                title="Remove from watchlist"
              >
                🗑️
              </button>
              
              <div className="p-6 flex flex-col h-full">
                <h3 className="text-xl font-bold mb-4 text-white line-clamp-2 leading-snug group-hover:text-indigo-300 transition-colors pr-8">{item.auction.title}</h3>
                
                <div className="space-y-3 mb-8 flex-grow text-sm">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-slate-400">Current Price</span>
                    <span className="font-bold text-lg text-emerald-400">${item.auction.currentPrice || item.auction.startingPrice}</span>
                  </div>
                  
                  <div className="flex justify-between items-center px-1">
                    <span className="text-slate-400">Status</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.auction.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                      {item.auction.status === 'ACTIVE' ? (
                        <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse"></span> {item.auction.status}</>
                      ) : (
                        item.auction.status
                      )}
                    </span>
                  </div>
                </div>
                
                <div className="w-full text-center px-4 py-3 bg-slate-800 group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 text-slate-300 group-hover:text-white font-medium rounded-xl transition-all duration-300 mt-auto border border-slate-700 group-hover:border-transparent">
                  View Details
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
