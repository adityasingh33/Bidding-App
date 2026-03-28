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
    <div className="max-w-md mx-auto mt-16 p-8 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
      <h2 className="text-2xl font-bold text-center mb-6 text-white">Create New Auction</h2>
      {error && <p className="mb-4 p-3 bg-red-900/30 text-red-400 border border-red-800 rounded text-sm">{error}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          placeholder="Auction Title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-indigo-500 transition-colors"
          required
        />
        <input
          placeholder="Starting Price ($)"
          type="number"
          min="1"
          step="0.01"
          value={startingPrice}
          onChange={(e) => setStartingPrice(e.target.value)}
          className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-indigo-500 transition-colors"
          required
        />
        <button 
          type="submit" 
          disabled={loading}
          className="w-full p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded transition-colors mt-2"
        >
          {loading ? "Creating..." : "Create Auction"}
        </button>
      </form>
    </div>
  )
}
