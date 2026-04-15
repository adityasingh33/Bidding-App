import { useState, useEffect, useRef } from "react"
import { X, Send, User as UserIcon } from "lucide-react"
import socket from "../socket"
import API from "../services/api"

interface ChatMessage {
  id: number
  senderId: number
  receiverId: number
  email: string
  message: string
  timestamp: string
}

interface ChatOverlayProps {
  partnerId: number
  partnerName: string
  onClose: () => void
}

export default function ChatOverlay({ partnerId, partnerName, onClose }: ChatOverlayProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState("")
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const userStr = localStorage.getItem("user")
  const currentUser = userStr ? JSON.parse(userStr) : null

  // Fetch History
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await API.get(`/user/chat/${partnerId}`)
        setMessages(res.data)
      } catch (err) {
        console.error("Failed to load chat history", err)
      } finally {
        setLoading(false)
      }
    }
    
    if (currentUser) {
      fetchHistory()
    }
  }, [partnerId])

  // Socket Listener
  useEffect(() => {
    const handleNewMessage = (msg: ChatMessage) => {
      // Only process if it belongs to this direct message thread
      if (
        (msg.senderId === partnerId && msg.receiverId === (currentUser.id || currentUser.userId)) ||
        (msg.senderId === (currentUser.id || currentUser.userId) && msg.receiverId === partnerId)
      ) {
        setMessages(prev => {
          // Avoid duplicates if socket is triggered twice
          if (prev.find(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      }
    }

    socket.on("privateMessage", handleNewMessage)
    return () => {
      socket.off("privateMessage", handleNewMessage)
    }
  }, [partnerId, currentUser])

  // Auto-Scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !currentUser) return

    socket.emit("sendPrivateMessage", {
      senderId: currentUser.id || currentUser.userId,
      receiverId: partnerId,
      email: currentUser.email,
      message: inputText.trim()
    })

    setInputText("")
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (!currentUser) return null

  return (
    <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white dark:bg-slate-900 shadow-[0_0_40px_rgba(0,0,0,0.15)] dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden z-50 animate-[slideUp_0.3s_ease-out]">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <UserIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white leading-tight truncate max-w-[180px]">{partnerName}</h3>
            <span className="text-[10px] text-white/80 font-medium">Private Chat</span>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-none transition-colors text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Message Area */}
      <div className="flex-1 p-4 h-80 overflow-y-auto bg-slate-50 dark:bg-slate-950/50 space-y-4 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-2">
            <UserIcon className="w-8 h-8 text-slate-500" />
            <p className="text-xs text-slate-500 font-medium text-center">No messages yet. Send a message to start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderId === (currentUser.id || currentUser.userId)
            return (
              <div key={msg.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                  isMe 
                    ? 'bg-indigo-600 text-white rounded-tr-sm' 
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-sm'
                }`}>
                  <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{formatTime(msg.timestamp)}</span>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="flex relative">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="w-full bg-slate-100 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white rounded-none py-2.5 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 border-transparent placeholder-slate-400"
            autoComplete="off"
            maxLength={1000}
          />
          <button 
            type="submit" 
            disabled={!inputText.trim()}
            className="absolute right-1 top-1 bottom-1 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-none hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
