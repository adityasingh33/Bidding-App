import { useState, useEffect } from "react"
import { Link } from "react-router-dom"

interface AuctionCardProps {
  auction: {
    id: number
    title: string
    currentPrice?: number
    startingPrice?: number
    status: string
    endTime?: string
  }
  onWatchlistClick?: (e: React.MouseEvent) => void
  actionIcon?: React.ReactNode
  customBadge?: React.ReactNode
  customDetails?: React.ReactNode
}

const AuctionCard = ({ auction, onWatchlistClick, actionIcon = "❤️", customBadge, customDetails }: AuctionCardProps) => {
  const [timeLeft, setTimeLeft] = useState("")

  useEffect(() => {
    if (!auction.endTime || auction.status !== "ACTIVE") {
      setTimeLeft(auction.status === "ACTIVE" ? "Active" : "Ended")
      return
    }

    // Initialize display immediately
    const calculateTimeLeft = () => {
      const difference = new Date(auction.endTime!).getTime() - Date.now()
      if (difference <= 0) return "Ended"
      
      const hours = Math.floor(difference / (1000 * 60 * 60))
      const minutes = Math.floor((difference / 1000 / 60) % 60)
      if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`
      return `${hours}h ${minutes}m`
    }

    setTimeLeft(calculateTimeLeft())
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 60000) // Update every minute
    return () => clearInterval(timer)
  }, [auction.endTime, auction.status])

  // Abstract placeholder images to make the card look premium
  const getPlaceholderImg = (id: number) => {
    const images = [
      "https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1604871000636-074fa5117945?auto=format&fit=crop&q=80&w=800"
    ]
    return images[id % images.length]
  }

  const isEndingSoon = timeLeft.includes("m") && !timeLeft.includes("d") && !timeLeft.includes("h") && timeLeft !== "Ended"

  return (
    <Link 
      to={`/auctions/${auction.id}`} 
      className="group flex flex-col bg-slate-900/60 backdrop-blur-xl rounded-2xl overflow-hidden border border-slate-800/60 hover:border-indigo-500/50 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 relative"
    >
      {/* Image Container */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-800">
        <img 
          src={getPlaceholderImg(auction.id)} 
          alt={auction.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
        />
        
        {/* Top left overlay (Status/Time) */}
        <div className="absolute top-3 left-3 z-10 flex gap-2">
          {customBadge || (
             <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-md border shadow-sm transition-colors ${
               auction.status === 'ACTIVE' 
                 ? (isEndingSoon ? 'bg-rose-500/90 text-white border-rose-400/50 animate-pulse' : 'bg-slate-900/80 text-emerald-400 border-slate-700/80') 
                 : 'bg-slate-900/80 text-slate-400 border-slate-700/80'
             }`}>
                {auction.status === 'ACTIVE' && <span className={`w-1.5 h-1.5 rounded-full ${isEndingSoon ? 'bg-white' : 'bg-emerald-400'}`}></span>}
                {auction.status === 'ACTIVE' ? `Ends in ${timeLeft}` : auction.status}
              </div>
          )}
        </div>

        {/* Top right overlay (Watchlist Action) */}
        {onWatchlistClick && (
          <button 
            onClick={onWatchlistClick}
            className="absolute top-3 right-3 z-20 p-2.5 bg-slate-900/50 hover:bg-slate-900/90 backdrop-blur-md rounded-full text-slate-300 hover:text-pink-500 transition-all border border-slate-700/50 hover:border-slate-500/50 opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-lg hover:scale-110 active:scale-95"
            title="Action"
          >
            {actionIcon}
          </button>
        )}
        
        {/* Gradient overlay at bottom of image to blend with card body */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-90" />
      </div>

      {/* Content Container */}
      <div className="p-5 flex flex-col h-full bg-slate-900/40 relative z-10 -mt-2">
        <h3 className="text-lg font-bold mb-4 text-white line-clamp-2 leading-snug group-hover:text-indigo-300 transition-colors pr-2">
          {auction.title}
        </h3>
        
        {customDetails ? customDetails : (
          <div className="space-y-4 mb-6 flex-grow">
            <div className="flex justify-between items-center bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/50 group-hover:border-indigo-500/30 transition-colors shadow-inner">
              <span className="text-sm text-slate-400 font-medium tracking-wide">Current Bid</span>
              <span className="font-extrabold text-xl text-emerald-400 group-hover:scale-105 transition-transform origin-right object-right">${auction.currentPrice || auction.startingPrice}</span>
            </div>
          </div>
        )}
        
        {/* Call to action button */}
        <div className="w-full text-center px-4 py-3 bg-slate-800 border border-slate-700 group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 text-slate-300 group-hover:text-white font-bold rounded-xl transition-all duration-300 mt-auto group-hover:shadow-lg group-hover:shadow-indigo-500/30 group-hover:border-transparent active:scale-[0.98]">
          {auction.status === 'ACTIVE' ? 'Place Bid' : 'View Details'}
        </div>
      </div>
    </Link>
  )
}

export default AuctionCard
