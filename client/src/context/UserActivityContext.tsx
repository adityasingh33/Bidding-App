import { createContext, useContext, useState, useEffect } from "react"
import type { ReactNode } from "react"
import { toast } from "react-hot-toast"
import { Heart, HeartOff, Bell, AlertTriangle, CheckCircle } from "lucide-react"
import API from "../services/api"

export type NotificationType = "success" | "error" | "info"

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: Date
}

interface UserActivityContextType {
  watchlistIds: number[]
  toggleWatchlist: (auctionId: number) => Promise<boolean>
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, "id" | "read" | "createdAt">) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  unreadCount: number
}

const UserActivityContext = createContext<UserActivityContextType | undefined>(undefined)

export function UserActivityProvider({ children }: { children: ReactNode }) {
  const [watchlistIds, setWatchlistIds] = useState<number[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  const token = localStorage.getItem("token")
  const currentUser = JSON.parse(localStorage.getItem("user") || "null")

  useEffect(() => {
    if (token && currentUser && !isInitialized) {
      // Fetch initial watchlist to populate hearts
      const fetchWatchlist = async () => {
        try {
          const res = await API.get("/user/watchlist")
          const ids = res.data.map((item: any) => item.auction.id)
          setWatchlistIds(ids)
          setIsInitialized(true)
        } catch (err) {
          console.error("Failed to fetch initial watchlist", err)
        }
      }
      fetchWatchlist()
    }
  }, [token, currentUser, isInitialized])

  const toggleWatchlist = async (auctionId: number): Promise<boolean> => {
    if (!token) {
      toast.error("Please log in to manage your watchlist.")
      return false
    }

    const isWatchlisted = watchlistIds.includes(auctionId)
    
    try {
      if (isWatchlisted) {
        // Optimistic update
        setWatchlistIds(prev => prev.filter(id => id !== auctionId))
        await API.delete(`/user/watchlist/${auctionId}`)
        toast.success("Removed from Watchlist", { icon: <HeartOff className="w-5 h-5 text-slate-600 dark:text-slate-400" /> })
        return false
      } else {
        // Optimistic update
        setWatchlistIds(prev => [...prev, auctionId])
        await API.post("/user/watchlist", { auctionId })
        toast.success("Added to Watchlist", { icon: <Heart className="w-5 h-5 text-rose-500 fill-rose-500" /> })
        return true
      }
    } catch (err: any) {
      // Revert on error
      if (isWatchlisted) {
        setWatchlistIds(prev => [...prev, auctionId])
      } else {
        setWatchlistIds(prev => prev.filter(id => id !== auctionId))
      }
      toast.error(err.response?.data?.error || "Failed to update watchlist")
      return isWatchlisted
    }
  }

  const addNotification = (notification: Omit<Notification, "id" | "read" | "createdAt">) => {
    const newNotif: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      read: false,
      createdAt: new Date(),
    }
    setNotifications(prev => [newNotif, ...prev])

    // Also trigger toast for the new notification
    switch (notification.type) {
      case "success":
        toast.success(notification.title, { icon: <CheckCircle className="w-5 h-5 text-emerald-500" /> })
        break
      case "error":
         toast.error(notification.title, { icon: <AlertTriangle className="w-5 h-5 text-rose-500" /> })
         break
      default:
         toast(notification.title, { icon: <Bell className="w-5 h-5 text-indigo-500" />, style: { background: "#1e293b", color: "#fff" } })
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <UserActivityContext.Provider 
      value={{ 
        watchlistIds, 
        toggleWatchlist, 
        notifications, 
        addNotification, 
        markAsRead, 
        markAllAsRead, 
        unreadCount 
      }}
    >
      {children}
    </UserActivityContext.Provider>
  )
}

export function useUserActivity() {
  const context = useContext(UserActivityContext)
  if (context === undefined) {
    throw new Error("useUserActivity must be used within a UserActivityProvider")
  }
  return context
}
