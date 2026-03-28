import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import API from "../services/api"

interface Auction {
  id: number
  title: string
  currentPrice: number
  startingPrice: number
  status: string
  endTime: string
}

export default function MyAuctions() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get("/user/auctions")
        setAuctions(res.data)
      } catch (err) {
        console.error("Failed to fetch my auctions", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <div className="text-center py-10 text-xl text-gray-400">Loading your auctions...</div>

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-white">My Auctions (Seller Dashboard)</h2>
      
      {auctions.length === 0 ? (
        <div className="bg-gray-800 p-8 rounded-lg text-center border border-gray-700">
          <p className="text-gray-400 mb-4">You haven't created any auctions yet.</p>
          <Link to="/create" className="inline-block px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded transition-colors">
            Create an Auction
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map((a) => (
            <Link 
              key={a.id} 
              to={`/auctions/${a.id}`}
              className="block bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-indigo-500 transition-colors"
            >
              <h3 className="text-xl font-bold mb-3 text-white truncate">{a.title}</h3>
              <div className="space-y-2 text-gray-400">
                <p>Status: <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${a.status === 'ACTIVE' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>{a.status}</span></p>
                <p>Current Price: <span className="font-semibold text-green-400">${a.currentPrice || a.startingPrice}</span></p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
