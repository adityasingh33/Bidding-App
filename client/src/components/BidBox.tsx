import { useState, useEffect } from "react"
import API from "../services/api"

interface BidBoxProps {
  auctionId: number
  currentPrice: number
  status: string
  bids: Array<{ id: number; amount: number; userId: number }>
}

const BidBox = ({ auctionId, currentPrice, status, bids }: BidBoxProps) => {
  const [amount, setAmount] = useState<number | "">("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isFlashing, setIsFlashing] = useState(false)

  const currentUser = JSON.parse(localStorage.getItem("user") || "null")
  
  // Flash animation whenever the current price changes (someone bids)
  useEffect(() => {
    if (bids.length > 0) {
      setIsFlashing(true)
      const timer = setTimeout(() => setIsFlashing(false), 800)
      return () => clearTimeout(timer)
    }
  }, [currentPrice, bids.length])

  // Computed states
  const userHasBid = currentUser && bids.some(b => b.userId === currentUser.id)
  const highestBidderId = bids.length > 0 ? bids[0].userId : null
  const isWinning = currentUser && highestBidderId === currentUser.id
  const isOutbid = currentUser && userHasBid && !isWinning

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    
    if (!amount || amount <= currentPrice) {
      setError(`Bid must be higher than $${currentPrice}`)
      return
    }

    try {
      await API.post("/bid/place", { auctionId, amount })
      setSuccess("Bid placed successfully!")
      setAmount("")
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || "Failed to place bid")
    }
  }

  if (status !== "ACTIVE") {
    return <div className="p-6 bg-rose-500/10 text-rose-400 text-center rounded-2xl border border-rose-500/20 font-semibold text-lg backdrop-blur-xl shadow-sm transition-all duration-300">This auction has ended.</div>
  }

  return (
    <div className={`bg-white dark:bg-white/5 backdrop-blur-xl p-6 sm:p-8 rounded-2xl border w-full mt-2 transition-all duration-500 ${
      isFlashing ? 'border-indigo-500/80 shadow-2xl shadow-indigo-500/40 bg-slate-200 dark:bg-slate-800/90 scale-[1.02] ring-2 ring-indigo-500/30' : 
      isWinning ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/20' :
      isOutbid ? 'border-rose-500/40 shadow-lg shadow-rose-500/10 ring-1 ring-rose-500/20' : 
      'border-slate-200 dark:border-white/10 shadow-sm hover:border-slate-200 dark:border-white/10'
    }`}>
      
      {/* Real-time status banners */}
      {isWinning && (
        <div className="mb-6 p-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold flex items-center justify-center gap-2.5 shadow-sm transform transition-all animate-[fadeIn_0.5s_ease-out]">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          You are the highest bidder!
        </div>
      )}
      
      {isOutbid && (
        <div className="mb-6 p-4 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-xl font-bold flex items-center justify-center gap-2.5 shadow-sm transform transition-all animate-[fadeIn_0.5s_ease-out]">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
          You've been outbid! Place a new bid.
        </div>
      )}

      {/* Title & Prominent Latest Bid */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Place a Bid</h3>
        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-950/40 border border-slate-800/80 rounded-xl shadow-inner">
          <span className="text-xs uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">Latest</span>
          <span className={`text-xl font-extrabold tabular-nums transition-colors duration-300 ${isFlashing ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'text-emerald-400'}`}>
            ${currentPrice}
          </span>
        </div>
      </div>

      {error && <p className="mb-5 p-3.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-sm font-bold shadow-inner">{error}</p>}
      {success && <p className="mb-5 p-3.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm font-bold shadow-inner">{success}</p>}
      
      <form onSubmit={handleBid}>
        <div className="relative flex items-center mb-5 group">
          <span className="absolute left-4 pl-1 text-slate-600 dark:text-slate-400 font-bold group-focus-within:text-indigo-400 transition-colors">$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || "")}
            placeholder={`Min bid: $${currentPrice + 1}`}
            min={currentPrice + 1}
            className="w-full pl-10 pr-4 py-4 bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white font-bold placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 text-xl transition-all shadow-inner"
            required
          />
        </div>
        <button 
          type="submit" 
          disabled={status !== "ACTIVE" || (!!amount && amount <= currentPrice)}
          className={`w-full flex justify-center py-4 px-4 text-sm font-bold shadow-lg transition-all outline-none focus:ring-4 active:scale-[0.99] rounded-none uppercase tracking-widest border ${
            isWinning 
              ? 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-700 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-white/10 shadow-none' 
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-indigo-400/20 shadow-indigo-500/25 focus:ring-indigo-500/50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isWinning ? 'Increase Your Bid' : 'Confirm Bid'}
        </button>
      </form>
    </div>
  )
}

export default BidBox
