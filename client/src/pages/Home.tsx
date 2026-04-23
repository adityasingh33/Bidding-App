import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react"
import API from "../services/api"
import AuctionCard from "../components/AuctionCard"
import { AUCTION_CATEGORIES } from "../constants/categories"

export default function Home() {
  const [activeAuctions, setActiveAuctions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0)

  // References for manual scrolling carousels
  const liveAuctionsRef = useRef<HTMLDivElement>(null)
  const categoriesRef = useRef<HTMLDivElement>(null)

  const heroBanners = [
    "/assets/hero_banner_1_1776433126809.png",
    "/assets/hero_banner_2_1776433143240.png"
  ]

  const staticBanner = "/assets/static_promo_banner_1776433159333.png"

  const categoryImages: Record<string, string> = {
    "Art": "/assets/cat_art_1776433175755.png",
    "Vehicles (Cars, Bikes, Boats)": "/assets/cat_vehicles_1776433193875.png",
    // We will use fallbacks for the rest
  }

  // Fetch Live Auctions
  useEffect(() => {
    const fetchLiveAuctions = async () => {
      try {
        const res = await API.get('/auction?limit=20')
        // Filter out those that are currently ACTIVE status
        const active = res.data.filter((a: any) => a.status === 'ACTIVE' || a.status === 'JOINING')
        setActiveAuctions(active)
      } catch (err) {
        console.error("Failed to fetch live auctions", err)
      } finally {
        setLoading(false)
      }
    }
    fetchLiveAuctions()
  }, [])

  // Auto-sliding Hero Banner Hook
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroBanners.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [heroBanners.length])

  // Scroll handler function for Carousels
  const scrollCarousel = (ref: React.RefObject<HTMLDivElement|null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -350 : 350
      ref.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }
  }

  return (
    <div className="w-full space-y-16 pb-16">
      
      {/* 1. Auto Sliding Hero Banner */}
      <section className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] rounded-3xl overflow-hidden shadow-2xl group border border-slate-200 dark:border-white/10 mt-6 lg:mt-0">
        {heroBanners.map((banner, idx) => (
          <div 
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentHeroIndex ? "opacity-100" : "opacity-0"}`}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent z-10"></div>
            <img src={banner} alt="Hero Banner" className="w-full h-full object-cover" />
            
            <div className="absolute bottom-10 left-8 md:bottom-16 md:left-16 z-20 max-w-2xl">
              <span className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-300 font-bold tracking-wider text-xs rounded-full mb-4 border border-indigo-500/30 backdrop-blur-md pb-1 uppercase">Exclusivity Awaits</span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight mb-4 drop-shadow-lg">
                Discover Premium <br/> Digital Auctions
              </h1>
              <p className="text-slate-300 text-lg mb-8 max-w-lg">Secure the most exclusive assets in real-time. Experience the leading platform for verified high-end auctions.</p>
              <Link to="/auctions" className="px-8 py-3.5 bg-white text-slate-900 hover:bg-slate-200 font-bold rounded-xl transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                Start Bidding
              </Link>
            </div>
          </div>
        ))}

        {/* Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {heroBanners.map((_, idx) => (
            <button 
              key={idx}
              onClick={() => setCurrentHeroIndex(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentHeroIndex ? "bg-white w-8" : "bg-white/40 hover:bg-white/80"}`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* 2. Live Auctions Carousel (Manual Slider) */}
      <section className="relative">
        <div className="flex justify-between items-end mb-6 px-2">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="bg-rose-500 w-3 h-3 rounded-full animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.8)]"></span>
              Live Right Now
            </h2>
            <p className="text-slate-500 text-sm mt-1">Auctions accepting bids actively</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => scrollCarousel(liveAuctionsRef, 'left')}
              className="p-2.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors focus:ring-2 focus:ring-indigo-500"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => scrollCarousel(liveAuctionsRef, 'right')}
              className="p-2.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors focus:ring-2 focus:ring-indigo-500"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div 
          ref={liveAuctionsRef}
          className="flex overflow-x-auto gap-6 pb-6 px-2 snap-x snap-mandatory hide-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {loading ? (
            Array.from({length: 4}).map((_, i) => (
              <div key={i} className="w-[300px] md:w-[320px] flex-shrink-0 snap-start h-80 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl border border-slate-300 dark:border-white/5" />
            ))
          ) : activeAuctions.length > 0 ? (
            activeAuctions.map(auction => (
              <div key={auction.id} className="w-[300px] md:w-[320px] flex-shrink-0 snap-start transition-transform hover:-translate-y-1 duration-300">
                <AuctionCard auction={auction} />
              </div>
            ))
          ) : (
            <div className="w-full py-16 flex flex-col items-center justify-center text-slate-500 bg-slate-100 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-white/5 border-dashed">
              <span className="text-4xl mb-3">📭</span>
              <p className="font-semibold">No live auctions right now</p>
              <Link to="/auctions" className="text-indigo-500 mt-2 hover:underline text-sm font-medium">Browse All Inventory</Link>
            </div>
          )}
        </div>
      </section>

      {/* 3. Static Promotional Banner */}
      <section className="relative w-full h-[250px] md:h-[300px] rounded-3xl overflow-hidden shadow-2xl group border border-slate-200 dark:border-white/10">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-transparent z-10"></div>
        <img src={staticBanner} alt="Promotional Banner" className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-y-0 left-8 md:left-16 z-20 flex flex-col justify-center max-w-lg">
          <span className="text-amber-400 font-bold uppercase tracking-widest text-xs mb-2">Sell With Confidence</span>
          <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">Ready to host your own luxury auction?</h2>
          <Link to="/create" className="inline-flex max-w-max items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.4)]">
            Create Auction <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 4. Categories Carousel (Manual Slider) */}
      <section className="relative pb-10">
        <div className="flex justify-between items-end mb-6 px-2">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Featured Categories</h2>
            <p className="text-slate-500 text-sm mt-1">Explore inventory by curated segments</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => scrollCarousel(categoriesRef, 'left')}
              className="p-2.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors focus:ring-2 focus:ring-indigo-500"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => scrollCarousel(categoriesRef, 'right')}
              className="p-2.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors focus:ring-2 focus:ring-indigo-500"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div 
          ref={categoriesRef}
          className="flex overflow-x-auto gap-4 pb-6 px-2 snap-x snap-mandatory hide-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {AUCTION_CATEGORIES.map((cat, idx) => {
            const hasImage = categoryImages[cat]
            return (
              <Link 
                to={`/auctions?category=${encodeURIComponent(cat)}`} 
                key={idx} 
                className="w-[180px] md:w-[220px] lg:w-[250px] flex-shrink-0 snap-start h-48 md:h-64 rounded-2xl overflow-hidden relative group border border-slate-200 dark:border-white/10 shadow-lg"
              >
                {hasImage ? (
                  <>
                    <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/20 transition-colors z-10"></div>
                    <img src={categoryImages[cat]} alt={cat} className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 transform transition-transform duration-700 group-hover:scale-105 z-0 flex items-center justify-center opacity-30">
                     <span className="text-6xl blur-sm opacity-50">🖼️</span>
                  </div>
                )}
                
                {/* Category Card Text Area */}
                <div className={`absolute bottom-0 left-0 w-full p-4 md:p-5 z-20 backdrop-blur-sm transition-all duration-300 ${hasImage ? 'bg-gradient-to-t from-slate-900/90 to-transparent' : 'bg-white/40 dark:bg-slate-900/60 border-t border-white/20'}`}>
                  <h3 className={`font-bold text-lg md:text-xl drop-shadow-md ${hasImage ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{cat}</h3>
                  <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                    <span className={`text-xs font-semibold ${hasImage ? 'text-indigo-300' : 'text-indigo-600 dark:text-indigo-400'}`}>View Items</span>
                    <ArrowRight className={`w-3 h-3 ${hasImage ? 'text-indigo-300' : 'text-indigo-600 dark:text-indigo-400'}`} />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
      
    </div>
  )
}
