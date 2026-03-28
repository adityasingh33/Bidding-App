import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import API from "../services/api"
import socket from "../socket"
import BidBox from "../components/BidBox"

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
}

const AuctionDetail = () => {
  const { id } = useParams()
  const auctionId = Number(id)
  
  const [auction, setAuction] = useState<AuctionData | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  // Fetch initial data
  useEffect(() => {
    const fetchAuction = async () => {
      try {
        const res = await API.get(`/auction/${auctionId}`)
        setAuction(res.data)
        setTimeLeft(res.data.remainingTime || 0)
      } catch (err) {
        console.error("Failed to fetch auction", err)
      } finally {
        setLoading(false)
      }
    }
    fetchAuction()
  }, [auctionId])

  // Countdown timer
  useEffect(() => {
    if (!auction || auction.status !== "ACTIVE" || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1000) {
          clearInterval(timer)
          return 0
        }
        return prev - 1000
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [auction, timeLeft])

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
        setTimeLeft(new Date(data.newEndTime).getTime() - Date.now())
      }
    })

    socket.on("auctionEnded", (data) => {
      setAuction((prev) => {
        if (!prev) return prev
        return { ...prev, status: "ENDED", winnerId: data.winnerId }
      })
      setTimeLeft(0)
    })

    return () => {
      socket.off("newBid")
      socket.off("timeExtended")
      socket.off("auctionEnded")
    }
  }, [auctionId])

  if (loading) return <div className="text-center py-10 text-xl text-gray-400">Loading auction...</div>
  if (!auction) return <div className="text-center py-10 text-xl text-red-500">Auction not found</div>

  const formatTime = (ms: number) => {
    if (ms <= 0) return "00:00:00"
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((ms % (1000 * 60)) / 1000)
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const isTimeCritical = timeLeft > 0 && timeLeft < 60000 // Less than 1 minute red color
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null')
  const isSeller = currentUser && auction && currentUser.id === auction.sellerId

  const handleAddToWatchlist = async () => {
    try {
      await API.post("/user/watchlist", { auctionId })
      alert("Added to Watchlist ❤️")
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
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-700 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">{auction.title}</h2>
          <div className="flex gap-3 mt-2">
            <button 
              onClick={handleAddToWatchlist}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-sm text-gray-300 rounded flex items-center gap-2 transition-colors"
            >
              <span>❤️</span> Add to Watchlist
            </button>
            {isSeller && auction.status === "ACTIVE" && (
              <button 
                onClick={handleEndAuction}
                className="px-3 py-1 bg-red-900/40 hover:bg-red-900/80 border border-red-700 text-sm text-red-300 rounded transition-colors"
              >
                End Auction Early
              </button>
            )}
          </div>
        </div>
        <div className={`px-4 py-1.5 rounded-full font-bold text-sm ${auction.status === 'ACTIVE' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
          {auction.status}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-gray-800 p-8 rounded-lg text-center border border-gray-700 shadow-sm flex flex-col justify-center min-h-[160px]">
              <span className="block text-gray-400 font-medium mb-2 uppercase tracking-wide text-sm">Current Bid</span>
              <span className="text-5xl font-extrabold text-green-400 mt-2">${auction.currentPrice || auction.startingPrice}</span>
            </div>
            
            <div className="bg-gray-800 p-8 rounded-lg text-center border border-gray-700 shadow-sm flex flex-col justify-center min-h-[160px]">
              <span className="block text-gray-400 font-medium mb-2 uppercase tracking-wide text-sm">Time Remaining</span>
              <span className={`text-5xl font-extrabold tabular-nums transition-colors duration-300 ${isTimeCritical ? "text-red-500 animate-pulse" : "text-white"}`}>
                {auction.status === "ACTIVE" ? formatTime(timeLeft) : "Ended"}
              </span>
            </div>
          </div>

          <BidBox 
            auctionId={auctionId} 
            currentPrice={auction.currentPrice || auction.startingPrice}
            status={auction.status}
          />
        </div>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 h-fit max-h-[600px] overflow-y-auto w-full">
          <h3 className="text-xl font-bold mb-4 pb-3 border-b border-gray-700 text-white sticky top-0 bg-gray-800 z-10">Bid History</h3>
          <div className="flex flex-col gap-3">
            {auction.bids.length > 0 ? (
              auction.bids.map((bid, index) => (
                <div key={bid.id || index} className="flex justify-between items-center p-3 bg-gray-900/80 rounded border border-gray-700/50">
                  <span className="font-bold text-green-400">${bid.amount}</span>
                  <span className="text-sm text-gray-400">User #{bid.userId}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8 italic text-sm">No bids yet. Be the first!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuctionDetail
