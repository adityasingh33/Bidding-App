import { Routes, Route, Navigate } from "react-router-dom"
import { useEffect } from "react"
import { Toaster } from "react-hot-toast"
import socket from "./socket"
import Navbar from "./components/Navbar"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Auctions from "./pages/Auctions"
import AuctionDetail from "./pages/AuctionDetail"
import CreateAuction from "./pages/CreateAuction"
import MyAuctions from "./pages/MyAuctions"
import MyBids from "./pages/MyBids"
import Watchlist from "./pages/Watchlist"
import Dashboard from "./pages/Dashboard"
import Categories from "./pages/Categories"
import { UserActivityProvider, useUserActivity } from "./context/UserActivityContext"
import { useTheme } from "./context/ThemeContext"
import { ChatProvider } from "./context/ChatContext"

function AppContent() {
  const userStr = localStorage.getItem("user")
  const { addNotification } = useUserActivity()
  const { theme } = useTheme()

  useEffect(() => {
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        socket.emit("joinUserRoom", user.id)

        socket.on("outbid", (data) => {
          addNotification({
            type: "error",
            title: "Outbid Alert!",
            message: `You were outbid on "${data.title || 'an auction'}"!`,
          })
        })

        socket.on("auctionEnded", (data) => {
          if (data.winnerId === user.id) {
            addNotification({
              type: "success",
              title: "You Won!",
              message: `You won an auction!`,
            })
          }
        })

        socket.on("categoryNotification", (data) => {
          addNotification({
            type: data.type || "info",
            title: data.title,
            message: data.message,
          })
        })
      } catch (e) {
        console.error("Error parsing user for socket", e)
      }
    }

    return () => {
      socket.off("outbid")
      socket.off("auctionEnded")
      socket.off("categoryNotification")
    }
  }, [userStr, addNotification])

  return (
    <div className="min-h-screen text-slate-900 bg-slate-50 dark:text-white dark:bg-gradient-to-br dark:from-[#1a0f2e] dark:via-[#0f172a] dark:to-[#1e1b4b] font-sans selection:bg-purple-500/30 transition-colors duration-500 relative z-0">
      {/* Subtle Ambient Glow Effect (Dark Mode Only) */}
      <div className="absolute inset-0 hidden dark:block bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.15),transparent_40%)] pointer-events-none -z-10" />
      <div className="absolute -z-10 blur-3xl opacity-30 bg-purple-600 w-[500px] h-[500px] rounded-full top-0 left-0 pointer-events-none hidden dark:block"></div>

      <Toaster position="top-right"
        toastOptions={{ 
          style: { 
            borderRadius: '12px', 
            background: theme === 'dark' ? '#0f172a' : '#ffffff', 
            color: theme === 'dark' ? '#ffffff' : '#0f172a', 
            border: theme === 'dark' ? '1px solid rgba(51, 65, 85, 0.5)' : '1px solid rgba(226, 232, 240, 1)' 
          } 
        }} 
      />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/auctions" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auctions" element={<Auctions />} />
            <Route path="/auctions/:id" element={<AuctionDetail />} />
            <Route path="/create" element={<CreateAuction />} />
            <Route path="/my-auctions" element={<MyAuctions />} />
            <Route path="/my-bids" element={<MyBids />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/categories" element={<Categories />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <UserActivityProvider>
      <ChatProvider>
        <AppContent />
      </ChatProvider>
    </UserActivityProvider>
  )
}

export default App
