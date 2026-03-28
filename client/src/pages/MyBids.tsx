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

  if (loading) return <div className="text-center py-10 text-xl text-gray-400">Loading your bids...</div>

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-white">My Bids (Activity)</h2>
      
      {bids.length === 0 ? (
        <div className="bg-gray-800 p-8 rounded-lg text-center border border-gray-700">
          <p className="text-gray-400 mb-4">You haven't placed any bids yet.</p>
          <Link to="/auctions" className="inline-block px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded transition-colors">
            Browse Auctions
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bids.map((b) => {
            const isHighest = b.amount === b.auction.currentPrice
            const isWinner = b.auction.status === 'ENDED' && isHighest

            return (
              <Link 
                key={b.id} 
                to={`/auctions/${b.auction.id}`}
                className="block bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-indigo-500 transition-colors relative overflow-hidden"
              >
                {isWinner && (
                  <div className="absolute top-0 right-0 bg-yellow-500 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg">
                    WON!
                  </div>
                )}
                <h3 className="text-xl font-bold mb-3 text-white truncate pr-12">{b.auction.title}</h3>
                
                <div className="space-y-3 text-gray-400">
                  <div className="flex justify-between items-center bg-gray-900/50 p-3 rounded">
                    <span className="text-sm">Your Bid:</span>
                    <span className="font-bold text-lg text-indigo-400">${b.amount}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Auction Status:</span>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${b.auction.status === 'ACTIVE' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                      {b.auction.status}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Position:</span>
                    {isHighest ? (
                      <span className="text-green-400 font-semibold text-sm flex items-center gap-1">
                        ● Top Bidder
                      </span>
                    ) : (
                      <span className="text-red-400 font-semibold text-sm flex items-center gap-1">
                        ○ Outbid (${b.auction.currentPrice})
                      </span>
                    )}
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
