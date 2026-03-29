import { useState } from "react"
import API from "../services/api"

interface BidBoxProps {
  auctionId: number
  currentPrice: number
  status: string
}

const BidBox = ({ auctionId, currentPrice, status }: BidBoxProps) => {
  const [amount, setAmount] = useState<number | "">("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

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
    return <div className="p-6 bg-rose-500/10 text-rose-400 text-center rounded-2xl border border-rose-500/20 font-semibold text-lg backdrop-blur-sm">This auction has ended.</div>
  }

  return (
    <div className="bg-slate-900/60 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-slate-800/60 w-full mt-2 shadow-sm">
      <h3 className="text-2xl font-bold mb-6 text-white tracking-tight">Place a Bid</h3>
      {error && <p className="mb-5 p-3.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-sm font-medium">{error}</p>}
      {success && <p className="mb-5 p-3.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm font-medium">{success}</p>}
      <form onSubmit={handleBid}>
        <div className="relative flex items-center mb-5">
          <span className="absolute left-4 pl-1 text-slate-400 font-bold">$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || "")}
            placeholder={`Min bid: $${currentPrice + 1}`}
            min={currentPrice + 1}
            className="w-full pl-10 pr-4 py-4 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-lg transition-all"
            required
          />
        </div>
        <button type="submit" className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-lg transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]">
          Place Bid
        </button>
      </form>
    </div>
  )
}

export default BidBox
