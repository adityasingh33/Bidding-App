import { useState, useRef, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { CheckCircle, AlertTriangle, Bell, Inbox, LogOut, Package, History, Sun, Moon } from "lucide-react"
import { useUserActivity } from "../context/UserActivityContext"
import { useTheme } from "../context/ThemeContext"

const Navbar = () => {
  const getRelativeTime = (date: Date) => {
    const elapsed = Date.now() - date.getTime()
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

    const days = Math.floor(elapsed / (1000 * 60 * 60 * 24))
    if (days > 0) return rtf.format(-days, 'day')

    const hours = Math.floor(elapsed / (1000 * 60 * 60))
    if (hours > 0) return rtf.format(-hours, 'hour')

    const minutes = Math.floor(elapsed / (1000 * 60))
    if (minutes > 0) return rtf.format(-minutes, 'minute')

    return rtf.format(-Math.floor(elapsed / 1000), 'second')
  }

  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem("token")
  const user = JSON.parse(localStorage.getItem("user") || "null")

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useUserActivity()
  const { theme, toggleTheme } = useTheme()

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  
  const profileRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false)
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
    { name: "Dashboard", path: "/dashboard" },
    { name: "Auctions", path: "/auctions" },
    { name: "Watchlist", path: "/watchlist" },
    { name: "Create", path: "/create" },
    { name: "Chat", path: "/chat" },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-[72px]">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center pr-6">
            <Link to="/" className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white hover:opacity-80 transition-opacity flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <span className="text-slate-900 dark:text-white text-xl leading-none font-black block mt-[2px]">B</span>
              </div>
              <span className="hidden sm:block">
                <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Bid</span>Sphere
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {token ? (
            <div className="hidden md:flex items-center gap-1 lg:gap-3 flex-1 overflow-x-auto justify-center">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-3 lg:px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 relative group flex items-center gap-1.5 ${
                    isActive(link.path) 
                      ? "text-slate-900 bg-slate-100 dark:text-white dark:bg-white/10 shadow-sm border border-slate-200 dark:border-white/5" 
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-900 dark:text-white dark:hover:bg-white dark:bg-white/5 border border-transparent"
                  }`}
                >
                  {link.name}
                  {isActive(link.path) && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-500 rounded-full blur-[2px] opacity-70"></span>
                  )}
                </Link>
              ))}
            </div>
          ) : null}

          {/* Right side items (Notifications, Profile/Auth) */}
          <div className="hidden md:flex items-center gap-4 lg:gap-5 pl-6">
            {/* Theme Toggle Desktop */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-900 dark:text-white dark:hover:bg-slate-200 dark:bg-slate-800/80 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {token ? (
              <>
                {/* Notification Dropdown Container */}
                <div className="relative" ref={notifRef}>
                  <button 
                    onClick={() => {
                        setIsNotifOpen(!isNotifOpen)
                        setIsProfileOpen(false) // toggle sibling
                    }}
                    className={`relative p-2.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${isNotifOpen ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-200 dark:bg-slate-800/80'}`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-2 flex min-w-[14px] h-[14px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-slate-900 animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Menu */}
                  {isNotifOpen && (
                    <div className="absolute right-0 mt-3 w-80 bg-slate-100 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 py-2 z-50 transform origin-top-right transition-all animate-[fadeIn_0.2s_ease-out] flex flex-col max-h-[28rem] overflow-hidden">
                      <div className="flex justify-between items-center px-4 py-3 border-b border-slate-700/50 mb-1 bg-slate-100 dark:bg-slate-900/95">
                        <span className="font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                           Notifications
                           {unreadCount > 0 && <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 text-xs">{unreadCount}</span>}
                        </span>
                        {unreadCount > 0 && (
                          <button onClick={markAllAsRead} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">Mark all read</button>
                        )}
                      </div>
                      
                      <div className="flex flex-col overflow-y-auto custom-scrollbar flex-1">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-10 flex flex-col items-center justify-center gap-2">
                             <Inbox className="w-12 h-12 mx-auto opacity-50 text-slate-600 dark:text-slate-400 mb-2" />
                             <p className="text-sm font-medium text-slate-500 relative mt-2 text-center">You're all caught up!</p>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div 
                              key={n.id} 
                              onClick={() => markAsRead(n.id)}
                              className={`px-4 py-3.5 border-b border-slate-300 dark:border-slate-800/50 cursor-pointer transition-colors ${!n.read ? 'bg-indigo-500/5 hover:bg-indigo-500/10' : 'hover:bg-slate-200 dark:bg-slate-800/50 opacity-80'}`}
                            >
                              <div className="flex gap-3.5 items-start">
                                <div className="mt-0.5 text-xl">
                                  {n.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : n.type === 'error' ? <AlertTriangle className="w-5 h-5 text-rose-500" /> : <Bell className="w-5 h-5 text-indigo-500" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm tracking-tight ${!n.read ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-800 dark:text-slate-300 font-medium'}`}>{n.title}</p>
                                  <p className="text-[13px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug break-words">{n.message}</p>
                                  <p className="text-[10px] uppercase font-bold text-slate-500 mt-2 mb-0.5 tracking-wider">
                                     {getRelativeTime(new Date(n.createdAt))}
                                  </p>
                                </div>
                                {!n.read && <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button 
                    onClick={() => {
                        setIsProfileOpen(!isProfileOpen)
                        setIsNotifOpen(false) // toggle sibling
                    }}
                    className="flex items-center gap-3 focus:outline-none pl-2 border-l border-slate-200 dark:border-white/10"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 p-[2px] cursor-pointer hover:scale-105 transition-transform shadow-md shadow-indigo-500/20 ring-2 ring-transparent focus-within:ring-indigo-500/50">
                      <div className="w-full h-full bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center border-2 border-slate-900">
                        <span className="text-slate-900 dark:text-white font-bold text-sm tracking-widest mt-[1px]">
                          {user?.email?.substring(0, 2).toUpperCase() || "US"}
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-3 w-56 bg-slate-100 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 py-2 z-50 transform origin-top-right transition-all animate-[fadeIn_0.2s_ease-out]">
                      <div className="px-4 py-3 border-b border-slate-700/50 mb-2 bg-slate-200 dark:bg-slate-800/30">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.email}</p>
                        <p className="text-xs text-emerald-400 mt-1 font-medium flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online</p>
                      </div>
                      <Link to="/categories" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:bg-slate-200 dark:bg-slate-800/80 transition-colors mx-2 rounded-xl mt-1">
                        <span className="w-4 h-4 flex items-center justify-center text-amber-400">⭐</span> Favorite Categories
                      </Link>
                      <Link to="/my-auctions" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:bg-slate-200 dark:bg-slate-800/80 transition-colors mx-2 rounded-xl">
                        <Package className="w-4 h-4 text-indigo-400" /> Inventory
                      </Link>
                      <Link to="/my-bids" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:bg-slate-200 dark:bg-slate-800/80 transition-colors mx-2 rounded-xl">
                        <History className="w-4 h-4 text-purple-400" /> Bid History
                      </Link>
                      <div className="border-t border-slate-700/50 my-2"></div>
                      <button 
                        onClick={() => { setIsProfileOpen(false); handleLogout(); }}
                        className="w-full flex items-center gap-3 text-left px-4 py-2.5 text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors mx-2 rounded-xl"
                      >
                        <LogOut className="w-4 h-4" /> Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="px-4 py-2 text-sm font-bold text-slate-800 dark:text-slate-300 hover:text-slate-900 dark:text-white transition-colors">Log in</Link>
                <Link to="/register" className="px-5 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90 text-white shadow-lg shadow-purple-500/25 transition-all duration-300 active:scale-95">Sign up</Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2 relative">
            {/* Theme Toggle Mobile */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-900 dark:text-white dark:hover:bg-slate-200 dark:bg-slate-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {token && (
              <div className="relative">
                <button 
                   onClick={() => {
                        setIsNotifOpen(!isNotifOpen)
                        if (!isNotifOpen) setIsMobileMenuOpen(false)
                   }}
                   className={`p-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${isNotifOpen ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-200 dark:bg-slate-800/50'}`}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                     <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border border-slate-900 rounded-full animate-pulse"></span>
                  )}
                </button>
                
                {/* Mobile Notification Dropdown */}
                {isNotifOpen && (
                   <div className="absolute right-0 top-12 w-screen max-w-sm px-4 z-50 animate-[fadeIn_0.2s_ease-out]">
                      <div className="bg-slate-100 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[60vh] overflow-hidden">
                         <div className="flex justify-between items-center px-4 py-3 border-b border-slate-700/50 bg-slate-200 dark:bg-slate-800/30">
                           <span className="font-bold text-slate-900 dark:text-white tracking-tight">Notifications</span>
                           {unreadCount > 0 && (
                             <button onClick={markAllAsRead} className="text-xs font-semibold text-indigo-400">Mark all read</button>
                           )}
                         </div>
                         <div className="flex flex-col overflow-y-auto w-full">
                           {notifications.length === 0 ? (
                             <div className="p-6 text-center text-sm font-medium text-slate-500">You're all caught up!</div>
                           ) : (
                             notifications.map((n) => (
                               <div key={n.id} onClick={() => markAsRead(n.id)} className={`px-4 py-3 border-b border-slate-300 dark:border-slate-800/50 ${!n.read ? 'bg-indigo-500/5' : ''}`}>
                                 <p className={`text-sm tracking-tight ${!n.read ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-800 dark:text-slate-300'}`}>{n.title}</p>
                                 <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                                 <p className="text-[10px] uppercase font-bold text-slate-500 mt-1 tracking-wider">
                                    {getRelativeTime(new Date(n.createdAt))}
                                 </p>
                               </div>
                             ))
                           )}
                         </div>
                      </div>
                   </div>
                )}
              </div>
            )}
            
            <button
              onClick={() => {
                  setIsMobileMenuOpen(!isMobileMenuOpen)
                  setIsNotifOpen(false)
              }}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-200 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors"
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
        <div className="md:hidden border-t border-slate-800/80 bg-slate-100 dark:bg-slate-900/95 backdrop-blur-2xl absolute w-full shadow-2xl">
          <div className="px-4 py-5 space-y-2">
            {token ? (
              <>
                <div className="px-3 flex items-center gap-4 py-4 mb-4 border-b border-slate-200 dark:border-white/10 bg-slate-200 dark:bg-slate-800/20 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 p-[2px]">
                    <div className="w-full h-full bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center">
                      <span className="text-slate-900 dark:text-white font-bold text-lg">{user?.email?.substring(0, 2).toUpperCase() || "US"}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{user?.email}</p>
                    <p className="text-sm text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Active
                    </p>
                  </div>
                </div>
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`flex items-center gap-2 px-4 py-3.5 rounded-xl text-base font-bold transition-all ${
                      isActive(link.path)
                        ? "text-indigo-400 bg-indigo-500/10 border border-indigo-500/20"
                        : "text-slate-800 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:bg-white dark:bg-white/5 border border-transparent"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="border-t border-slate-800/80 mt-6 pt-6 grid grid-cols-2 gap-3">
                  <Link to="/my-auctions" onClick={() => setIsMobileMenuOpen(false)} className="col-span-1 text-center px-4 py-3 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-300 bg-slate-200 dark:bg-slate-800/40 hover:bg-slate-200 dark:bg-slate-800/80 border border-slate-700/50">Inventory</Link>
                  <Link to="/my-bids" onClick={() => setIsMobileMenuOpen(false)} className="col-span-1 text-center px-4 py-3 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-300 bg-slate-200 dark:bg-slate-800/40 hover:bg-slate-200 dark:bg-slate-800/80 border border-slate-700/50">Bid History</Link>
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                    className="col-span-2 mt-2 w-full flex items-center justify-center text-center px-4 py-3 rounded-xl text-base font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-colors border border-rose-500/20"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-4 px-2 pt-2 pb-6">
                <Link to="/login" className="w-full text-center px-5 py-3.5 text-base font-bold rounded-xl text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 bg-slate-200 dark:bg-slate-800/40 hover:bg-slate-200 dark:bg-slate-800 transition-colors">Log in</Link>
                <Link to="/register" className="w-full text-center px-5 py-3.5 text-base font-bold rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90 text-white shadow-lg shadow-purple-500/20 transition-all duration-300 active:scale-95">Sign up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
