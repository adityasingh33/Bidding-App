// ─── Home Page — eBay-inspired clean layout ────────────────────
// Sections:
// 1. Horizontal Category Strip with Lucide icons
// 2. Auto-sliding Hero Banner
// 3. Live Auctions Grid (eBay "Daily Deals" style)
// 4. Mid-page promotional CTA
// 5. Featured Categories (card grid)
// 6. "Why BidSphere" trust strip

import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Gavel,
  ShieldCheck,
  Zap,
  Trophy,
  Clock,
  TrendingUp,
  Search,
  Landmark,
  Palette,
  Baby,
  BookOpen,
  Factory,
  Camera,
  Smartphone,
  Shirt,
  Coins,
  Album,
  Laptop,
  Headphones,
  Scissors,
  Heart,
  Clapperboard,
  Gift,
  Sparkles,
  Home as HomeIcon,
  Gem,
  Music,
  Guitar,
  PawPrint,
  Wine,
  Building2,
  Wrench,
  Dumbbell,
  Medal,
  Mail,
  Ticket,
  Puzzle,
  Plane,
  Gamepad2,
  Car,
  Package,
  type LucideIcon,
} from "lucide-react"
import API from "../services/api"
import AuctionCard from "../components/AuctionCard"
import { AUCTION_CATEGORIES } from "../constants/categories"

// ─── Category icon mapping ─────────────────────────────────────
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "Antiques": Landmark,
  "Art": Palette,
  "Baby": Baby,
  "Books": BookOpen,
  "Business & Industrial": Factory,
  "Cameras & Photo": Camera,
  "Cell Phones & Accessories": Smartphone,
  "Clothing, Shoes & Accessories": Shirt,
  "Coins & Paper Money": Coins,
  "Collectibles": Album,
  "Computers, Tablets & Networking": Laptop,
  "Consumer Electronics": Headphones,
  "Crafts": Scissors,
  "Dolls & Bears": Heart,
  "Entertainment Memorabilia": Clapperboard,
  "Gift Cards & Coupons": Gift,
  "Health & Beauty": Sparkles,
  "Home & Garden": HomeIcon,
  "Jewelry & Watches": Gem,
  "Music": Music,
  "Musical Instruments & Gear": Guitar,
  "Pet Supplies": PawPrint,
  "Pottery & Glass": Wine,
  "Real Estate": Building2,
  "Specialty Services": Wrench,
  "Sporting Goods": Dumbbell,
  "Sports Mem, Cards & Fan Shop": Medal,
  "Stamps": Mail,
  "Tickets & Experiences": Ticket,
  "Toys & Hobbies": Puzzle,
  "Travel": Plane,
  "Video Games & Consoles": Gamepad2,
  "Vehicles (Cars, Bikes, Boats)": Car,
  "Other": Package,
}

// Featured subset for the category strip
const FEATURED_CATEGORIES = [
  "Consumer Electronics",
  "Clothing, Shoes & Accessories",
  "Vehicles (Cars, Bikes, Boats)",
  "Jewelry & Watches",
  "Collectibles",
  "Sporting Goods",
  "Home & Garden",
  "Art",
  "Toys & Hobbies",
  "Video Games & Consoles",
  "Cell Phones & Accessories",
  "Cameras & Photo",
  "Books",
  "Music",
  "Antiques",
]

export default function Home() {
  const [activeAuctions, setActiveAuctions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const liveAuctionsRef = useRef<HTMLDivElement>(null)
  const categoriesStripRef = useRef<HTMLDivElement>(null)

  // Fetch Live Auctions
  useEffect(() => {
    const fetchLiveAuctions = async () => {
      try {
        const res = await API.get("/auction?limit=20")
        const active = res.data.filter(
          (a: any) => a.status === "ACTIVE" || a.status === "JOINING"
        )
        setActiveAuctions(active)
      } catch (err) {
        console.error("Failed to fetch live auctions", err)
      } finally {
        setLoading(false)
      }
    }
    fetchLiveAuctions()
  }, [])



  // Carousel scroll handler
  const scrollCarousel = (
    ref: React.RefObject<HTMLDivElement | null>,
    direction: "left" | "right"
  ) => {
    if (ref.current) {
      const scrollAmount = direction === "left" ? -350 : 350
      ref.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }
  }

  return (
    <div className="w-full space-y-0 pb-0 -mt-8">
      {/* ─────────────────────────────────────────────────────────
          1. CATEGORY STRIP — eBay-style horizontal icon row
      ───────────────────────────────────────────────────────── */}
      <section className="py-6 border-b border-slate-200 dark:border-white/10">
        <div className="relative group/strip">
          {/* Left Arrow */}
          <button
            onClick={() => scrollCarousel(categoriesStripRef, "left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg opacity-0 group-hover/strip:opacity-100 transition-opacity hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>

          <div
            ref={categoriesStripRef}
            className="flex overflow-x-auto gap-2 sm:gap-4 px-6"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {FEATURED_CATEGORIES.map((cat) => (
              <Link
                key={cat}
                to={`/auctions?category=${encodeURIComponent(cat)}`}
                className="flex flex-col items-center gap-2 min-w-[88px] py-2 px-1 group/cat"
              >
                <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-transparent group-hover/cat:border-indigo-500 flex items-center justify-center transition-all duration-300 group-hover/cat:shadow-lg group-hover/cat:shadow-indigo-500/20 group-hover/cat:scale-105">
                  {(() => { const Icon = CATEGORY_ICONS[cat] || Package; return <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-slate-600 dark:text-slate-300 group-hover/cat:text-indigo-500 transition-colors" />; })()}
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 text-center leading-tight line-clamp-2 group-hover/cat:text-indigo-600 dark:group-hover/cat:text-indigo-400 transition-colors max-w-[84px]">
                  {cat.split(",")[0].split("(")[0].trim()}
                </span>
              </Link>
            ))}
          </div>

          {/* Right Arrow */}
          <button
            onClick={() => scrollCarousel(categoriesStripRef, "right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg opacity-0 group-hover/strip:opacity-100 transition-opacity hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          2. HERO BANNER — Auto-sliding with overlay
      ───────────────────────────────────────────────────────── */}
      <section className="relative w-full h-[280px] sm:h-[340px] md:h-[420px] lg:h-[480px] overflow-hidden group mt-6 rounded-2xl">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/40 to-transparent z-10" />
          <img
            src="/assets/hero_banner.png"
            alt="Hero Banner"
            className="w-full h-full object-cover"
          />

          <div className="absolute bottom-8 left-6 sm:bottom-12 sm:left-10 md:bottom-16 md:left-14 z-20 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full mb-4">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-white/90 tracking-wide uppercase">
                Live Auctions
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-[1.15] tracking-tight mb-3">
              Score Unbeatable
              <br />
              Deals Today
            </h1>
            <p className="text-white/70 text-sm sm:text-base mb-6 max-w-md hidden sm:block">
              Bid on thousands of items across every category. New auctions
              added daily.
            </p>
            <Link
              to="/auctions"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 hover:bg-slate-100 font-bold text-sm rounded-full transition-all shadow-xl hover:shadow-2xl active:scale-95"
            >
              Explore Auctions
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          3. LIVE AUCTIONS — Grid layout with "See All"
      ───────────────────────────────────────────────────────── */}
      <section className="py-10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Live Auctions
            </h2>
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 text-rose-500 rounded-full text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              LIVE
            </span>
          </div>
          <Link
            to="/auctions"
            className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors"
          >
            See all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-[420px] bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-xl border border-slate-200 dark:border-white/5"
              />
            ))}
          </div>
        ) : activeAuctions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {activeAuctions.slice(0, 8).map((auction) => (
              <div
                key={auction.id}
                className="transition-transform hover:-translate-y-1 duration-300"
              >
                <AuctionCard auction={auction} />
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full py-20 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10">
            <Gavel className="w-14 h-14 text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-lg font-bold text-slate-600 dark:text-slate-400">
              No live auctions right now
            </p>
            <p className="text-sm text-slate-500 mt-1 mb-5">
              Check back soon or browse all listings
            </p>
            <Link
              to="/auctions"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-full transition-colors"
            >
              Browse All Auctions
            </Link>
          </div>
        )}

        {/* Show more button if there are more than 8 */}
        {!loading && activeAuctions.length > 8 && (
          <div className="text-center mt-8">
            <Link
              to="/auctions"
              className="inline-flex items-center gap-2 px-8 py-3 border-2 border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-white font-bold text-sm rounded-full transition-all duration-300"
            >
              Show More Auctions
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────
          4. PROMOTIONAL CTA BANNER
      ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl" />
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-indigo-300/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 px-8 sm:px-12 py-10 sm:py-12">
          <div className="flex-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full mb-4">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
              <span className="text-xs font-bold text-white/90 tracking-wide uppercase">
                Start Selling
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight mb-3">
              Turn your stuff into cash
            </h2>
            <p className="text-indigo-100 text-sm sm:text-base max-w-md">
              List your first item in minutes. No experience needed — our tools
              make it easy for anyone to sell.
            </p>
          </div>
          <Link
            to="/create"
            className="px-8 py-3.5 bg-white text-indigo-700 hover:bg-slate-50 font-bold text-sm rounded-full shadow-xl hover:shadow-2xl transition-all active:scale-95 whitespace-nowrap flex items-center gap-2"
          >
            List an Item
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          5. FEATURED CATEGORIES — Grid cards
      ───────────────────────────────────────────────────────── */}
      <section className="py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Explore Popular Categories
          </h2>
          <Link
            to="/categories"
            className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors"
          >
            See all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {AUCTION_CATEGORIES.slice(0, 12).map((cat) => (
            <Link
              key={cat}
              to={`/auctions?category=${encodeURIComponent(cat)}`}
              className="group flex flex-col items-center gap-3 p-5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 flex items-center justify-center bg-slate-50 dark:bg-slate-700/50 rounded-xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-colors">
                {(() => { const Icon = CATEGORY_ICONS[cat] || Package; return <Icon className="w-7 h-7 text-slate-600 dark:text-slate-300 group-hover:text-indigo-500 transition-colors" />; })()}
              </div>
              <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                {cat.split("(")[0].trim()}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          6. TRUST / WHY BIDSPHERE — Feature strip
      ───────────────────────────────────────────────────────── */}
      <section className="py-10 border-t border-slate-200 dark:border-white/10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <div className="flex flex-col items-center text-center gap-3 p-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Secure Payments
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every transaction is protected with Razorpay's bank-grade security
            </p>
          </div>

          <div className="flex flex-col items-center text-center gap-3 p-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Real-Time Bidding
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Instant updates with live bid tracking powered by WebSockets
            </p>
          </div>

          <div className="flex flex-col items-center text-center gap-3 p-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Fair Auctions
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Transparent leaderboard system with 5% stake to prevent spam bids
            </p>
          </div>

          <div className="flex flex-col items-center text-center gap-3 p-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Easy Discovery
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Browse by category, watchlist favorites, and get personalized
              alerts
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
