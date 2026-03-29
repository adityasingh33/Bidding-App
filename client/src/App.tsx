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
import { UserActivityProvider, useUserActivity } from "./context/UserActivityContext"

function AppContent() {
  const userStr = localStorage.getItem("user")
  const { addNotification } = useUserActivity()

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
              message: `You won an auction! 🎉`,
            })
          }
        })
      } catch (e) {
        console.error("Error parsing user for socket", e)
      }
    }

    return () => {
      socket.off("outbid")
      socket.off("auctionEnded")
    }
  }, [userStr, addNotification])

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-white">
      {/* Subtle Background Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-indigo-500 opacity-20 blur-[100px]"></div>

      <Toaster position="top-right" 
        toastOptions={{ 
          style: { borderRadius: '12px', background: '#0f172a', color: '#fff', border: '1px solid rgba(51, 65, 85, 0.5)' } 
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
          </Routes>
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <UserActivityProvider>
      <AppContent />
    </UserActivityProvider>
  )
}

export default App
