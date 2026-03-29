import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
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
          <Link 
            to={`/auctions/${auction.id}`} 
            key={auction.id} 
            className="group flex flex-col bg-slate-900/60 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-800/60 hover:border-indigo-500/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:bg-slate-900/80 transition-all duration-300 relative"
          >
            <button 
              onClick={(e) => addToWatchlist(auction.id, e)}
              className="absolute top-4 right-4 z-10 p-2.5 bg-slate-950/80 backdrop-blur-md hover:bg-slate-900 text-slate-400 hover:text-pink-500 rounded-full transition-colors opacity-0 group-hover:opacity-100 shadow-sm border border-slate-800/60"
              title="Add to Watchlist"
            >
              ❤️
            </button>
            <div className="p-6 flex flex-col h-full">
              <h3 className="text-xl font-bold mb-4 text-white line-clamp-2 leading-snug group-hover:text-indigo-300 transition-colors">{auction.title}</h3>
              <div className="space-y-3 mb-8 flex-grow">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Current Bid</span>
                  <span className="font-bold text-lg text-emerald-400">${auction.currentPrice || auction.startingPrice}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Status</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${auction.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                    {auction.status === 'ACTIVE' ? (
                      <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse"></span> {auction.status}</>
                    ) : (
                      auction.status
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
