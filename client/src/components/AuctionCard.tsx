import { Link } from "react-router-dom"
import CountdownTimer from "./CountdownTimer"
import { useUserActivity } from "../context/UserActivityContext"
import { Heart, Trash2, MessageCircle } from "lucide-react"
import { useChat } from "../context/ChatContext"

interface AuctionCardProps {
  auction: {
    id: number
    title: string
    sellerName?: string
    createdAt?: string
    currentPrice?: number
    startingPrice?: number
    status: string
    category?: string
    sellerId?: number
    startTime?: string
    biddingStartTime?: string
    endTime?: string
    imageUrl?: string
  }
  onWatchlistClick?: (e: React.MouseEvent) => void
  actionIcon?: React.ReactNode
  customBadge?: React.ReactNode
  customDetails?: React.ReactNode
}

const AuctionCard = ({ auction, onWatchlistClick, actionIcon = "heart", customBadge, customDetails }: AuctionCardProps) => {
  // Use Global Watchlist State
  const { watchlistIds, toggleWatchlist } = useUserActivity()
  const isWatchlisted = watchlistIds.includes(auction.id)
  
  const { openPrivateChat } = useChat()
  const user = JSON.parse(localStorage.getItem("user") || "null")

  const createdAtLabel = auction.createdAt
    ? new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(auction.createdAt))
    : null

  const handleWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevent Navigating to URL
    if (onWatchlistClick) {
      // Allow parent override (like Watchlist.tsx trash can)
      onWatchlistClick(e)
    } else {
      // Default Global Toggle
      await toggleWatchlist(auction.id)
    }
  }

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

  return (
    <Link 
      to={`/auctions/${auction.id}`} 
      className="group flex flex-col bg-white dark:bg-white/5 backdrop-blur-xl rounded-none overflow-hidden border border-slate-200 dark:border-white/10 hover:border-purple-500/50 hover:-translate-y-1.5 shadow-lg hover:shadow-xl hover:shadow-purple-500/10 hover:scale-[1.02] transition-all duration-300 ease-in-out relative"
    >
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-200 dark:bg-slate-800">
        <img 
          src={auction.imageUrl || getPlaceholderImg(auction.id)} 
          alt={auction.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
        />
        
        {/* Top left overlay (Status/Time) */}
        <div className="absolute top-3 left-3 z-10 flex gap-2">
          {customBadge || (
             <CountdownTimer endTime={auction.endTime} startTime={auction.startTime} biddingStartTime={auction.biddingStartTime} status={auction.status} badgeMode={true} />
          )}
        </div>

        {/* Top right overlay (Watchlist Action) */}
        <button 
          onClick={handleWatchlist}
          className={`absolute top-3 right-3 z-20 p-2.5 bg-slate-100 dark:bg-slate-900/50 hover:bg-slate-100 dark:bg-slate-900/90 backdrop-blur-md rounded-none transition-all border opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-lg hover:scale-110 active:scale-125 duration-300 group/btn ${
             isWatchlisted && actionIcon === "heart" ? "border-rose-500/50 opacity-100" : "text-slate-800 dark:text-slate-300 border-slate-700/50 hover:border-slate-500/50"
          }`}
          title={isWatchlisted && actionIcon === "heart" ? "Remove from Watchlist" : "Add to Watchlist"}
        >
          {actionIcon === "heart" ? (
             <Heart 
              className={`w-5 h-5 transition-transform duration-500 group-active/btn:scale-75 ${
                isWatchlisted 
                  ? "fill-rose-500 stroke-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.6)] animate-[pop_0.3s_ease-out]" 
                  : "fill-transparent stroke-current hover:stroke-rose-400"
              }`} 
             />
          ) : (
            <span className={actionIcon === "trash" ? "text-rose-400 flex items-center justify-center pointer-events-none" : ""}>{actionIcon === "trash" ? <Trash2 className="w-5 h-5" /> : actionIcon}</span>
          )}
        </button>
        
        {/* Gradient overlay at bottom of image to blend with card body */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-90 pointer-events-none" />
      </div>

      {/* Content Container */}
      <div className="p-5 flex flex-col h-full bg-slate-100 dark:bg-slate-900/40 relative z-10 -mt-2">
        {auction.category && (
          <div className="mb-2">
            <span className="inline-block px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
              {auction.category}
            </span>
          </div>
        )}
        <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-300 transition-colors pr-2">
          {auction.title}
        </h3>

        <div className="mb-4 space-y-2 rounded-xl border border-slate-800/60 bg-slate-950/45 p-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-500">Owner</span>
            <div className="flex items-center gap-2 truncate">
              <span className="truncate font-semibold text-slate-900 dark:text-slate-100">{auction.sellerName || "Unknown Seller"}</span>
              {auction.sellerId && user && user.id !== auction.sellerId && (
                <button 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    openPrivateChat(auction.sellerId!, auction.sellerName || "Unknown Seller")
                  }}
                  className="p-1 rounded-full bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all shadow-sm active:scale-95"
                  title="Message Seller"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-500">Created</span>
            <span className="text-right font-medium text-slate-800 dark:text-slate-300">{createdAtLabel || "Recently added"}</span>
          </div>
        </div>
        
        {customDetails ? customDetails : (
          <div className="space-y-4 mb-6 flex-grow">
            <div className="flex justify-between items-center bg-slate-950/50 p-3.5 rounded-xl border border-slate-300 dark:border-slate-800/50 group-hover:border-indigo-500/30 transition-colors shadow-inner">
              <span className="text-sm text-slate-600 dark:text-slate-400 font-medium tracking-wide">Current Bid</span>
              <span className="font-extrabold text-xl text-emerald-400 group-hover:scale-105 transition-transform origin-right object-right">${auction.currentPrice || auction.startingPrice}</span>
            </div>
          </div>
        )}
        
        {/* Call to action button */}
        <div className="w-full text-center px-4 py-3 bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-white/10 group-hover:bg-gradient-to-r group-hover:from-purple-500 group-hover:to-blue-500 text-slate-800 dark:text-slate-300 group-hover:text-white font-bold rounded-xl transition-all duration-300 mt-auto group-hover:shadow-lg group-hover:shadow-purple-500/20 active:scale-95 group-hover:border-transparent">
          {auction.status === 'PENDING' ? 'Starts Soon' : auction.status === 'JOINING' ? 'Waiting to Start' : auction.status === 'ACTIVE' ? 'Place Bid' : 'View Details'}
        </div>
      </div>
    </Link>
  )
}

export default AuctionCard
