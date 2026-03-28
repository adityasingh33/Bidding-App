import { Routes, Route, Navigate } from "react-router-dom"
import { useEffect } from "react"
import { Toaster, toast } from "react-hot-toast"
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

function App() {
  const userStr = localStorage.getItem("user")

  useEffect(() => {
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        socket.emit("joinUserRoom", user.id)

        socket.on("outbid", (data) => {
          toast(`You were outbid on "${data.title || 'an auction'}"!`, {
            icon: '⚠️',
            style: {
              borderRadius: '10px',
              background: '#333',
              color: '#fff',
            },
          })
        })

        socket.on("auctionEnded", (data) => {
          if (data.winnerId === user.id) {
            toast.success(`You won an auction! 🎉`, {
              style: {
                borderRadius: '10px',
                background: '#333',
                color: '#fff',
              },
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
  }, [userStr])

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <Toaster position="top-right" />
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/auctions" replace />} />
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
  )
}

export default App
