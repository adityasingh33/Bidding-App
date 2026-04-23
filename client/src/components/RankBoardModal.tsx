import { useState, useEffect } from "react"
import { Trophy, X, AlertCircle } from "lucide-react"
import API from "../services/api"

interface LeaderboardEntry {
  rank: number
  userId: number
  amount: number
}

interface RankBoardModalProps {
  auctionId: number
  isOpen: boolean
  onClose: () => void
}

const RankBoardModal = ({ auctionId, isOpen, onClose }: RankBoardModalProps) => {
  const [bidders, setBidders] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen) {
      const fetchLeaderboard = async () => {
        setLoading(true)
        setError("")
        try {
          const res = await API.get(`/auction/${auctionId}/leaderboard`)
          setBidders(res.data)
        } catch (err: any) {
          setError(err.response?.data?.error || "Failed to load leaderboard")
        } finally {
          setLoading(false)
        }
      }
      fetchLeaderboard()
    }
  }, [auctionId, isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-[slideUp_0.3s_ease-out]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Trophy className="w-6 h-6 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Rank Board</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
              <p className="font-medium animate-pulse">Calculating final ranks...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center text-center py-12 bg-rose-500/5 border border-rose-500/10 rounded-xl">
              <AlertCircle className="w-10 h-10 text-rose-500/50 mb-3" />
              <p className="text-rose-400 font-medium px-4">{error}</p>
            </div>
          ) : bidders.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="font-medium">No valid bids were placed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bidders.map((bidder) => (
                <div 
                  key={bidder.rank}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    bidder.rank === 1 
                      ? "bg-gradient-to-r from-amber-500/10 to-amber-700/5 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]" 
                      : bidder.rank <= 3
                      ? "bg-slate-800/60 border-slate-700"
                      : "bg-slate-800/30 border-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 flex items-center justify-center font-black rounded-lg ${
                      bidder.rank === 1 ? "bg-amber-500 text-slate-900 shadow-md shadow-amber-500/30" : 
                      bidder.rank === 2 ? "bg-slate-300 text-slate-800" :
                      bidder.rank === 3 ? "bg-amber-700 text-amber-100" :
                      "bg-slate-800 text-slate-400"
                    }`}>
                      #{bidder.rank}
                    </div>
                    <span className="font-semibold text-slate-300">
                      User #{bidder.userId}
                    </span>
                  </div>
                  <span className={`font-black tracking-tight ${
                    bidder.rank === 1 ? "text-amber-500 text-lg" : "text-emerald-400"
                  }`}>
                    ₹{bidder.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-950/40 text-center border-t border-slate-800">
          <p className="text-xs text-slate-500 font-medium tracking-wide">
            Leaderboard expires 1 month post-auction.
          </p>
        </div>
      </div>
    </div>
  )
}

export default RankBoardModal
