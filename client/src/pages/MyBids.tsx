import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import AuctionCard from "../components/AuctionCard"
import API from "../services/api"

interface Bid {
  id: number
  amount: number
  createdAt: string
  auction: {
    id: number
    title: string
    status: string
    currentPrice: number
    startingPrice: number
  }
}

export default function MyBids() {
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get("/user/bids")
        setBids(res.data)
      } catch (err) {
        console.error("Failed to fetch my bids", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <div className="text-center py-20 text-xl text-slate-400 animate-pulse">Loading your bids...</div>

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">My Bids</h2>
          <p className="text-slate-400 mt-2">Track your activity and active bids.</p>
        </div>
      </div>
      
      {bids.length === 0 ? (
        <div className="bg-white/5 p-10 rounded-2xl text-center border border-white/10 backdrop-blur-xl shadow-xl">
          <p className="text-slate-400 mb-6 text-lg">You haven't placed any bids yet.</p>
          <Link to="/auctions" className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500 hover:shadow-purple-500/30 transition-all duration-300 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]">
            Browse Auctions
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {bids.map((b) => {
            const isHighest = b.amount === b.auction.currentPrice
            const isWinner = b.auction.status === 'ENDED' && isHighest

            return (
              <AuctionCard 
                key={b.id} 
                auction={b.auction}
                customBadge={isWinner ? <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 shadow-sm backdrop-blur-md">🏆 WON!</div> : undefined}
                customDetails={
                  <div className="space-y-3 flex-grow text-sm mb-6 mt-2">
                    <div className="flex justify-between items-center bg-slate-950/50 p-3 rounded-xl border border-slate-800/50 shadow-inner group-hover:border-indigo-500/30 transition-colors">
                      <span className="text-slate-400 font-medium">Your Bid</span>
                      <span className="font-bold text-lg text-indigo-400">${b.amount}</span>
                    </div>
                    
                    <div className="flex justify-between items-center px-1">
                      <span className="text-slate-400">Position</span>
                      {isHighest ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Top Bidder
                        </span>
                      ) : (
                        <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Outbid
                        </span>
                      )}
                    </div>
                  </div>
                }
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
