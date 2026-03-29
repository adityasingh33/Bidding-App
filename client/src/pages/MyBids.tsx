import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
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
        <div className="bg-slate-900/60 p-10 rounded-2xl text-center border border-slate-800/60 backdrop-blur-sm shadow-xl">
          <p className="text-slate-400 mb-6 text-lg">You haven't placed any bids yet.</p>
          <Link to="/auctions" className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]">
            Browse Auctions
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {bids.map((b) => {
            const isHighest = b.amount === b.auction.currentPrice
            const isWinner = b.auction.status === 'ENDED' && isHighest

            return (
              <Link 
                key={b.id} 
                to={`/auctions/${b.auction.id}`}
                className="group flex flex-col bg-slate-900/60 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-800/60 hover:border-indigo-500/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:bg-slate-900/80 transition-all duration-300 relative"
              >
                {isWinner && (
                  <div className="absolute top-0 right-0 bg-yellow-500 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-xl shadow-md z-10">
                    🏆 WON!
                  </div>
                )}
                
                <div className="p-6 flex flex-col h-full">
                  <h3 className="text-xl font-bold mb-4 text-white line-clamp-2 leading-snug group-hover:text-indigo-300 transition-colors pr-8">{b.auction.title}</h3>
                  
                  <div className="space-y-3 flex-grow text-sm">
                    <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
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

                    <div className="flex justify-between items-center px-1">
                      <span className="text-slate-400">Status</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${b.auction.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                        {b.auction.status}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
