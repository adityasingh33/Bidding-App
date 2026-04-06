import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Trophy, Heart, Ghost, ChevronRight, Package } from "lucide-react"
import API from "../services/api"
import { useUserActivity } from "../context/UserActivityContext"

interface Bid {
  id: number
  amount: number
  createdAt: string
  auction: {
    id: number
    title: string
    status: string
    currentPrice: number
  }
}

interface Auction {
  id: number
  status: string
}

export default function Dashboard() {
  const [bids, setBids] = useState<Bid[]>([])
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loading, setLoading] = useState(true)
  const { watchlistIds } = useUserActivity()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [bidsRes, auctionsRes] = await Promise.all([
          API.get("/user/bids"),
          API.get("/user/auctions")
        ])
        setBids(bidsRes.data)
        setAuctions(auctionsRes.data)
      } catch (err) {
        console.error("Failed to fetch dashboard data", err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  if (loading) return (
    <div className="max-w-7xl mx-auto space-y-8 animate-[pulse_1.5s_ease-in-out_infinite] opacity-60">
      <div className="flex justify-between items-end mb-8 pt-2">
        <div>
          <div className="h-10 w-48 bg-slate-800 rounded-lg mb-3"></div>
          <div className="h-4 w-72 bg-white/5 rounded"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="bg-white/5 h-32 rounded-2xl border border-white/10 shadow-lg"></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-96 bg-white/5 rounded-2xl border border-white/10 shadow-lg p-8">
           <div className="h-8 w-1/3 bg-slate-800 rounded-md mb-8"></div>
           <div className="space-y-6 pl-2">
              {[1,2,3].map(i => (
                 <div key={i} className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-slate-800 flex-shrink-0"></div>
                    <div className="w-full h-24 bg-slate-800/50 rounded-xl"></div>
                 </div>
              ))}
           </div>
        </div>
        <div className="flex flex-col gap-6">
          <div className="h-56 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 rounded-2xl border border-indigo-500/10"></div>
          <div className="h-48 bg-white/5 rounded-2xl border border-white/10"></div>
        </div>
      </div>
    </div>
  )

  // Calculate statistics
  const totalBids = bids.length
  
  // Calculate won auctions based on finished statuses where amount === currentPrice
  // Note: For a strictly accurate 'win', the backend should confirm, but we use heuristic here since no strict stats endpoint exists
  const wonAuctions = bids.filter(b => b.auction.status === 'ENDED' && b.amount === b.auction.currentPrice)
  const totalWins = wonAuctions.length

  const activeAuctions = auctions.filter(a => a.status === 'ACTIVE').length

  // Get recent bids (top 6)
  const recentBids = [...bids].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6)

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Overview</h2>
          <p className="text-slate-400 mt-2">Welcome back. Here's what's happening with your account.</p>
        </div>
        <Link to="/auctions" className="hidden sm:inline-flex px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors border border-white/10 shadow-sm items-center gap-2">
          Find Auctions <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Total Bids</p>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-black text-white">{totalBids}</span>
            <span className="text-indigo-400 text-sm font-medium mb-1">Placed</span>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Auctions Won</p>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-black text-white">{totalWins}</span>
            <span className="text-emerald-400 text-sm font-medium mb-1 flex items-center gap-1"><Trophy className="w-4 h-4" /> Trophies</span>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden group hover:border-purple-500/50 transition-colors">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Active Listings</p>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-black text-white">{activeAuctions}</span>
            <span className="text-purple-400 text-sm font-medium mb-1">Selling</span>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden group hover:border-pink-500/50 transition-colors">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl group-hover:bg-pink-500/20 transition-all"></div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Watchlist</p>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-black text-white">{watchlistIds.length}</span>
            <span className="text-pink-400 text-sm font-medium mb-1 flex items-center gap-1"><Heart className="w-4 h-4" /> Saved</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        {/* Activity Timeline */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg p-6 sm:p-8">
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
            <h3 className="text-xl font-bold text-white tracking-tight">Recent Activity</h3>
            <Link to="/my-bids" className="text-sm font-semibold text-indigo-400 hover:text-indigo-300">View All Bids</Link>
          </div>

          <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-7 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-slate-800 before:to-transparent">
            {recentBids.length > 0 ? recentBids.map((bid) => {
              const date = new Date(bid.createdAt)
              const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              const dateString = date.toLocaleDateString([], { month: 'short', day: 'numeric' })
              const isHighest = bid.amount === bid.auction.currentPrice

              return (
                <div key={bid.id} className="relative group">
                  <div className="absolute -left-9 mt-1.5 w-6 h-6 rounded-full bg-slate-900 border-2 border-indigo-500 flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.4)] z-10">
                    <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                  </div>
                  
                  <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/50 hover:border-indigo-500/30 transition-colors shadow-sm ml-2 group-hover:-translate-y-1 duration-300">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 bg-slate-900 px-2 py-1 rounded-md">{dateString} | {timeString}</span>
                        {isHighest && bid.auction.status === 'ACTIVE' && (
                          <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-sm ring-1 ring-emerald-500/30">Winning</span>
                        )}
                        {bid.auction.status === 'ENDED' && isHighest && (
                          <span className="text-[10px] font-black uppercase text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-sm ring-1 ring-yellow-500/30">Won</span>
                        )}
                      </div>
                      <span className="text-lg font-black text-indigo-400">${bid.amount}</span>
                    </div>
                    <Link to={`/auctions/${bid.auction.id}`} className="block text-lg font-bold text-white hover:text-indigo-300 transition-colors truncate">
                      {bid.auction.title}
                    </Link>
                  </div>
                </div>
              )
            }) : (
              <div className="text-slate-500 font-medium py-10 pl-4 items-center flex gap-3">
                <Ghost className="w-8 h-8 opacity-50" /> It's quiet here... Place some bids!
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="flex flex-col gap-6">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-2xl border border-indigo-500/30 shadow-xl shadow-indigo-500/10 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-bl-full blur-2xl transform group-hover:scale-110 transition-transform duration-500"></div>
            <h3 className="text-2xl font-black text-white mb-2">Sell an Item</h3>
            <p className="text-indigo-100 mb-6 font-medium text-sm">Create a new auction listing and start receiving bids today.</p>
            <Link to="/create" className="inline-block w-full text-center px-5 py-3.5 bg-white text-indigo-600 hover:bg-slate-50 font-bold rounded-xl transition-colors shadow-lg active:scale-95">
              Create Auction
            </Link>
          </div>

          <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
            <div className="space-y-3">
              <Link to="/my-auctions" className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 hover:bg-slate-800/50 border border-slate-800/50 hover:border-white/10 transition-all font-semibold text-slate-300 hover:text-white group">
                 <div className="flex items-center gap-2"><Package className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" /> <span>Manage Listings</span></div>
                 <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
              </Link>
              <Link to="/watchlist" className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 hover:bg-slate-800/50 border border-slate-800/50 hover:border-white/10 transition-all font-semibold text-slate-300 hover:text-white group">
                 <div className="flex items-center gap-2"><Heart className="w-5 h-5 text-pink-400 group-hover:text-pink-300 transition-colors" /> <span>View Watchlist</span></div>
                 <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
