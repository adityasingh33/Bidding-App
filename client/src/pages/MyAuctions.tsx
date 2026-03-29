import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import AuctionCard from "../components/AuctionCard"
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

  if (loading) return <div className="text-center py-20 text-xl text-slate-400 animate-pulse">Loading your auctions...</div>

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">My Auctions</h2>
          <p className="text-slate-400 mt-2">Manage the exclusive items you've listed.</p>
        </div>
      </div>
      
      {auctions.length === 0 ? (
        <div className="bg-slate-900/60 p-10 rounded-2xl text-center border border-slate-800/60 backdrop-blur-sm shadow-xl">
          <p className="text-slate-400 mb-6 text-lg">You haven't created any auctions yet.</p>
          <Link to="/create" className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]">
            Create an Auction
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {auctions.map((a) => (
            <AuctionCard 
              key={a.id} 
              auction={a} 
            />
          ))}
        </div>
      )}
    </div>
  )
}
