import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import API from "../services/api"

interface Auction {
  id: number
  title: string
  startingPrice: number
  currentPrice: number
  status: string
  endTime: string
}

const Auctions = () => {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loading, setLoading] = useState(true)

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

  const addToWatchlist = async (auctionId: number, e: React.MouseEvent) => {
    e.preventDefault()
    try {
      await API.post("/user/watchlist", { auctionId })
      alert("Added to Watchlist ❤️") // Basic feedback, will improve with toasts later
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to add to watchlist")
    }
  }

  if (loading) return <div className="text-center py-10 text-xl text-gray-400">Loading auctions...</div>

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-white">Live Auctions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {auctions.map((auction) => (
          <Link 
            to={`/auctions/${auction.id}`} 
            key={auction.id} 
            className="block bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-indigo-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-200 relative group"
          >
            <button 
              onClick={(e) => addToWatchlist(auction.id, e)}
              className="absolute top-3 right-3 z-10 p-2 bg-gray-900/60 hover:bg-gray-900 hover:text-pink-400 text-gray-400 rounded-full transition-colors opacity-0 group-hover:opacity-100"
              title="Add to Watchlist"
            >
              ❤️
            </button>
            <div className="p-6 flex flex-col h-full">
              <h3 className="text-xl font-bold mb-4 text-white line-clamp-2">{auction.title}</h3>
              <div className="space-y-2 mb-6 text-gray-400 flex-grow">
                <p>Current Price: <span className="font-semibold text-green-400">${auction.currentPrice || auction.startingPrice}</span></p>
                <p>Status: <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${auction.status === 'ACTIVE' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>{auction.status}</span></p>
              </div>
              <div className="w-full text-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded transition-colors mt-auto">
                View Auction
              </div>
            </div>
          </Link>
        ))}
        {auctions.length === 0 && <p className="text-gray-400 col-span-full text-center py-10 text-lg">No auctions found.</p>}
      </div>
    </div>
  )
}

export default Auctions
