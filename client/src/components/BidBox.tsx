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
    return <div className="p-6 bg-red-900/20 text-red-500 text-center rounded-lg border border-red-500/30 font-bold text-lg">This auction has ended.</div>
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 w-full mt-6">
      <h3 className="text-xl font-bold mb-4 text-white">Place a Bid</h3>
      {error && <p className="mb-4 p-3 bg-red-900/30 text-red-400 border border-red-800 rounded text-sm">{error}</p>}
      {success && <p className="mb-4 p-3 bg-green-900/30 text-green-400 border border-green-800 rounded text-sm">{success}</p>}
      <form onSubmit={handleBid}>
        <div className="relative flex items-center mb-4">
          <span className="absolute left-4 text-gray-400 font-semibold">$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || "")}
            placeholder={`Min bid: $${currentPrice + 1}`}
            min={currentPrice + 1}
            className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-indigo-500 text-lg transition-colors"
            required
          />
        </div>
        <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-lg transition-colors">
          Place Bid
        </button>
      </form>
    </div>
  )
}

export default BidBox
