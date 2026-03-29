import { useState } from "react"
import { useNavigate } from "react-router-dom"
import API from "../services/api"

export default function CreateAuction() {
  const [title, setTitle] = useState("")
  const [startingPrice, setStartingPrice] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await API.post("/auction/create", {
        title,
        startingPrice: Number(startingPrice),
      })
      navigate(`/auctions/${res.data.id}`)
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create auction")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-[500px] w-full mx-auto mt-20 p-8 sm:p-10 bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-800/60">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Create New Auction</h2>
        <p className="text-slate-400 mt-2 text-sm">List your exclusive item for bidding</p>
      </div>
      
      {error && <p className="mb-6 p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-sm text-center">{error}</p>}
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-300 ml-1">Auction Title</label>
          <input
            placeholder="e.g. Vintage Rolex"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3.5 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-300 ml-1">Starting Price ($)</label>
          <input
            placeholder="100.00"
            type="number"
            min="1"
            step="0.01"
            value={startingPrice}
            onChange={(e) => setStartingPrice(e.target.value)}
            className="w-full p-3.5 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
            required
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="w-full p-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all mt-4 shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
        >
          {loading ? "Creating..." : "Create Auction"}
        </button>
      </form>
    </div>
  )
}
