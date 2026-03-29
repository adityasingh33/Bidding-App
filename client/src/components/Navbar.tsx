import { useState, useRef, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem("token")
  const user = JSON.parse(localStorage.getItem("user") || "null")

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  
  const profileRef = useRef<HTMLDivElement>(null)

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/login")
  }

  const navLinks = [
    { name: "Auctions", path: "/auctions" },
    { name: "Watchlist", path: "/watchlist" },
    { name: "My Auctions", path: "/my-auctions" },
    { name: "My Bids", path: "/my-bids" },
    { name: "Create", path: "/create" },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/60 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-[72px]">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center pr-6">
            <Link to="/" className="text-2xl font-extrabold tracking-tight text-white hover:opacity-80 transition-opacity flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <span className="text-white text-xl leading-none font-black block mt-[2px]">B</span>
              </div>
              <span className="hidden sm:block">
                <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Bid</span>Sphere
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {token ? (
            <div className="hidden md:flex items-center gap-1.5 lg:gap-3 flex-1 overflow-x-auto justify-center">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-3 lg:px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 relative group flex items-center gap-2 ${
                    isActive(link.path) 
                      ? "text-white bg-white/10 shadow-sm border border-white/5" 
                      : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  {link.name === "Watchlist" && <span className="text-xs">❤️</span>}
                  {link.name}
                  {isActive(link.path) && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-500 rounded-full blur-[2px] opacity-70"></span>
                  )}
                </Link>
              ))}
            </div>
          ) : null}

          {/* Right side items (Notifications, Profile/Auth) */}
          <div className="hidden md:flex items-center gap-5 pl-6">
            {token ? (
              <>
                {/* Notification Badge */}
                <button className="relative p-2.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 border-2 border-slate-900 rounded-full animate-pulse shadow-sm"></span>
                </button>

                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-3 focus:outline-none pl-2 border-l border-slate-800"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 p-[2px] cursor-pointer hover:scale-105 transition-transform shadow-md shadow-indigo-500/20 ring-2 ring-transparent focus-within:ring-indigo-500/50">
                      <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center border-2 border-slate-900">
                        <span className="text-white font-bold text-sm tracking-widest mt-[1px]">
                          {user?.email?.substring(0, 2).toUpperCase() || "US"}
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-3 w-56 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 py-2 z-50 transform origin-top-right transition-all">
                      <div className="px-4 py-3 border-b border-slate-700/50 mb-2 bg-slate-800/30">
                        <p className="text-sm font-semibold text-white truncate">{user?.email}</p>
                        <p className="text-xs text-emerald-400 mt-1 font-medium flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online</p>
                      </div>
                      <Link to="/my-auctions" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors mx-2 rounded-xl">
                        Dashboard
                      </Link>
                      <Link to="/watchlist" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors mx-2 rounded-xl">
                        Watchlist
                      </Link>
                      <div className="border-t border-slate-700/50 my-2"></div>
                      <button 
                        onClick={() => { setIsProfileOpen(false); handleLogout(); }}
                        className="w-full flex items-center gap-3 text-left px-4 py-2.5 text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors mx-2 rounded-xl"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="px-4 py-2 text-sm font-bold text-slate-300 hover:text-white transition-colors">Log in</Link>
                <Link to="/register" className="px-5 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 transition-all active:scale-95">Sign up</Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            {token && (
              <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 border border-slate-900 rounded-full animate-pulse"></span>
              </button>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800/80 bg-slate-900/95 backdrop-blur-2xl absolute w-full shadow-2xl">
          <div className="px-4 py-5 space-y-2">
            {token ? (
              <>
                <div className="px-3 flex items-center gap-4 py-4 mb-4 border-b border-slate-800 bg-slate-800/20 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 p-[2px]">
                    <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">{user?.email?.substring(0, 2).toUpperCase() || "US"}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-base font-bold text-white truncate max-w-[200px]">{user?.email}</p>
                    <p className="text-sm text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Active
                    </p>
                  </div>
                </div>
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`block px-4 py-3.5 rounded-xl text-base font-bold transition-all ${
                      isActive(link.path)
                        ? "text-indigo-400 bg-indigo-500/10 border border-indigo-500/20"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="border-t border-slate-800/80 mt-6 pt-6">
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                    className="w-full flex items-center justify-center text-center px-4 py-3.5 rounded-xl text-base font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-colors border border-rose-500/20"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-4 px-2 pt-2 pb-6">
                <Link to="/login" className="w-full text-center px-5 py-3.5 text-base font-bold rounded-xl text-slate-200 border border-slate-700 bg-slate-800/40 hover:bg-slate-800 transition-colors">Log in</Link>
                <Link to="/register" className="w-full text-center px-5 py-3.5 text-base font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20 transition-all">Sign up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
