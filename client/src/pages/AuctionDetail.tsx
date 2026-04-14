import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import API from "../services/api"
import socket from "../socket"
import BidBox from "../components/BidBox"
import CountdownTimer from "../components/CountdownTimer"
import { Heart, MessageCircle } from "lucide-react"
import { useChat } from "../context/ChatContext"

interface AuctionData {
  id: number
  title: string
  currentPrice: number
  startingPrice: number
  status: string
  remainingTime: number
  endTime: string
  winnerId?: number
  sellerId: number
  bids: Array<{ id: number; amount: number; userId: number }>
  imageUrl?: string
}

const AuctionDetail = () => {
  const { id } = useParams()
  const auctionId = Number(id)
  
  const { openPrivateChat } = useChat()
  
  const [auction, setAuction] = useState<AuctionData | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch initial data
  useEffect(() => {
    const fetchAuction = async () => {
      try {
        const res = await API.get(`/auction/${auctionId}`)
        setAuction(res.data)
      } catch (err) {
        console.error("Failed to fetch auction", err)
      } finally {
        setLoading(false)
      }
    }
    fetchAuction()
  }, [auctionId])

  // Socket setup
  useEffect(() => {
    if (!auctionId) return

    socket.emit("joinAuction", auctionId)

    socket.on("newBid", (data) => {
      setAuction((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          currentPrice: data.amount,
          bids: [{ id: Date.now(), amount: data.amount, userId: data.userId }, ...prev.bids],
        }
      })
    })

    socket.on("timeExtended", (data) => {
      if (data.newEndTime) {
        setAuction((prev) => prev ? { ...prev, endTime: data.newEndTime } : prev)
      }
    })

    socket.on("auctionEnded", (data) => {
      setAuction((prev) => {
        if (!prev) return prev
        return { ...prev, status: "ENDED", winnerId: data.winnerId }
      })
    })

    return () => {
      socket.off("newBid")
      socket.off("timeExtended")
      socket.off("auctionEnded")
    }
  }, [auctionId])

  if (loading) return <div className="text-center py-20 text-xl text-slate-600 dark:text-slate-400 animate-pulse">Loading auction details...</div>
  if (!auction) return <div className="text-center py-20 text-xl text-rose-500">Auction not found</div>

  const currentUser = JSON.parse(localStorage.getItem('user') || 'null')
  const isSeller = currentUser && auction && currentUser.id === auction.sellerId

  const handleAddToWatchlist = async () => {
    try {
      await API.post("/user/watchlist", { auctionId })
      alert("Added to Watchlist")
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to add to watchlist")
    }
  }

  const handleEndAuction = async () => {
    if (!window.confirm("Are you sure you want to end this auction early?")) return
    try {
      await API.post(`/auction/${auctionId}/end`)
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to end auction")
    }
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-800/80 gap-5">
        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">{auction.title}</h2>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={handleAddToWatchlist}
              className="px-4 py-1.5 bg-white dark:bg-white/5 hover:bg-slate-200 dark:bg-slate-800 backdrop-blur-xl border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-800 dark:text-slate-300 hover:text-slate-900 dark:text-white rounded-xl flex items-center gap-2 transition-colors shadow-sm"
            >
              <Heart className="w-4 h-4" /> Add to Watchlist
            </button>
            {!isSeller && currentUser && (
              <button 
                onClick={() => openPrivateChat(auction.sellerId, auction.title + " Seller")}
                className="px-4 py-1.5 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white text-indigo-500 border border-indigo-500/20 text-sm font-medium rounded-xl flex items-center gap-2 transition-colors shadow-sm"
              >
                <MessageCircle className="w-4 h-4" /> Message Seller
              </button>
            )}
            {isSeller && auction.status === "ACTIVE" && (
              <button 
                onClick={handleEndAuction}
                className="px-4 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-sm font-medium text-rose-400 rounded-xl transition-colors"
              >
                End Auction Early
              </button>
            )}
          </div>
        </div>
        <div className={`px-5 py-2 rounded-full font-bold text-sm tracking-wide shadow-sm border ${auction.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
          {auction.status === 'ACTIVE' ? (
            <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2.5 animate-pulse"></span> {auction.status}</span>
          ) : (
            auction.status
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Hero Image */}
          <div className="w-full h-72 sm:h-96 bg-white dark:bg-white/5 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-lg relative group">
            <img 
               src={auction.imageUrl || `https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?auto=format&fit=crop&q=80&w=1200`} 
               alt={auction.title}
               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent pointer-events-none"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-8 rounded-2xl text-center border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-center min-h-[160px]">
              <span className="block text-slate-600 dark:text-slate-400 font-semibold mb-2 uppercase tracking-wider text-xs">Current Bid</span>
              <span className="text-5xl font-extrabold text-emerald-400 mt-2">${auction.currentPrice || auction.startingPrice}</span>
            </div>
            
            <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-8 rounded-2xl text-center border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-center min-h-[160px]">
              <span className="block text-slate-600 dark:text-slate-400 font-semibold mb-2 uppercase tracking-wider text-xs">Time Remaining</span>
              <CountdownTimer endTime={auction.endTime} status={auction.status} className="text-5xl font-extrabold mt-2" />
            </div>
          </div>

          <BidBox 
            auctionId={auctionId} 
            currentPrice={auction.currentPrice || auction.startingPrice}
            status={auction.status}
            bids={auction.bids}
          />
        </div>

        <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-white/10 h-fit max-h-[600px] overflow-y-auto w-full shadow-sm custom-scrollbar">
          <h3 className="text-xl font-extrabold mb-5 pb-4 border-b border-slate-800/80 text-slate-900 dark:text-white sticky top-0 bg-slate-100 dark:bg-slate-900/90 z-10 backdrop-blur tracking-tight">Bid History</h3>
          <div className="flex flex-col gap-3">
            {auction.bids.length > 0 ? (
              auction.bids.map((bid, index) => (
                <div key={bid.id || index} className="flex justify-between items-center p-3.5 bg-white dark:bg-slate-950/40 rounded-xl border border-slate-300 dark:border-slate-800/50 hover:bg-slate-200 dark:bg-slate-800/50 transition-colors">
                  <span className="font-bold text-emerald-400">${bid.amount}</span>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">User #{bid.userId}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-center py-10 italic text-sm font-medium">No bids yet. Be the first to bid!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuctionDetail
