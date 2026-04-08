import { useState, useEffect } from "react"
import AuctionCard from "../components/AuctionCard"
import { SkeletonGrid } from "../components/SkeletonLoader"
import { Clock, SearchX } from "lucide-react"
import API from "../services/api"

interface Auction {
  id: number
  title: string
  sellerName: string
  createdAt: string
  startingPrice: number
  currentPrice: number
  status: string
  endTime: string
}

const CATEGORIES = ["ALL", "Electronics", "Art", "Collectibles"]

const Auctions = () => {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loading, setLoading] = useState(true)

  // Filter States
  const [searchQuery, setSearchQuery] = useState("")
  const [maxPrice, setMaxPrice] = useState<number>(5000) 
  const [endingSoon, setEndingSoon] = useState(false)
  const [category, setCategory] = useState("ALL")

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

  // Client-side filtering logic
  const filteredAuctions = auctions.filter(auction => {
    // Text search
    if (searchQuery && !auction.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    
    // Price filtering
    const price = auction.currentPrice || auction.startingPrice
    if (maxPrice < 5000 && price > maxPrice) return false

    // Ending Soon (< 24 hrs)
    if (endingSoon) {
      if (!auction.endTime || auction.status !== 'ACTIVE') return false
      const msLeft = new Date(auction.endTime).getTime() - Date.now()
      if (msLeft > 24 * 60 * 60 * 1000 || msLeft <= 0) return false
    }

    // Category mocked assigned by modulo mapping due to missing schema field
    if (category !== "ALL") {
      const mockCategories = ["Electronics", "Art", "Collectibles", "Electronics"]
      const mockAssignedCategory = mockCategories[auction.id % 4]
      if (mockAssignedCategory !== category) return false
    }

    return true
  })

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Live Auctions</h2>
          <p className="text-slate-400 mt-2">Discover and bid on exclusive items in real-time.</p>
        </div>
      </div>

      {/* Advanced Search & Filter Bar */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search auctions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium transition-all shadow-inner"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-col sm:flex-row gap-4 md:w-auto w-full">
          {/* Category Dropdown */}
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            className="w-full sm:w-auto px-4 py-3 bg-slate-950/50 border border-white/10 rounded-xl text-sm font-semibold text-slate-300 focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer transition-all shadow-sm"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em' }}
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat} className="bg-slate-900 text-white">{cat === "ALL" ? "All Categories" : cat}</option>
            ))}
          </select>

          {/* Price Range Slider */}
          <div className="flex flex-col justify-center sm:w-auto w-full px-4 py-2 bg-slate-950/50 border border-white/10 rounded-xl shadow-sm min-w-[200px]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-slate-400">Max Price</span>
              <span className="text-sm font-bold text-indigo-400">
                {maxPrice >= 5000 ? "Any" : `$${maxPrice}`}
              </span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="5000" 
              step="50"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
            />
          </div>

          {/* Ending Soon Toggle */}
          <button 
            onClick={() => setEndingSoon(!endingSoon)}
            className={`w-full sm:w-auto px-5 py-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 duration-300 ${
              endingSoon 
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.1)]' 
                : 'bg-slate-950/50 text-slate-400 border-white/10 hover:text-white hover:border-white/10'
            }`}
          >
            <Clock className={`w-4 h-4 ${endingSoon ? 'animate-pulse text-rose-500' : 'text-slate-500'}`} />
            Ending Soon
          </button>
        </div>
      </div>
      
      {/* Grid Content */}
      {loading ? (
        <SkeletonGrid count={8} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-[fadeIn_0.4s_ease-out]">
          {filteredAuctions.map((auction) => (
            <AuctionCard 
              key={auction.id} 
              auction={auction}
              // Removed explicit onWatchlistClick to allow AuctionCard to handle global Watchlist context itself
            />
          ))}
          {filteredAuctions.length === 0 && (
            <div className="col-span-full py-24 text-center bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl shadow-xl">
              <SearchX className="w-12 h-12 mx-auto mb-4 text-slate-500 opacity-50" />
              <p className="text-white text-xl font-bold mb-2">No auctions found</p>
              <p className="text-slate-400">Try adjusting your filters or search terms.</p>
              <button 
                onClick={() => { setSearchQuery(""); setCategory("ALL"); setMaxPrice(5000); setEndingSoon(false); }}
                className="mt-6 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all duration-300 active:scale-95 shadow-sm border border-slate-700/50"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Auctions
