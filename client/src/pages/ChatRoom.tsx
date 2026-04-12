import { useEffect, useState, useRef } from "react"
import { Send, MessageSquare } from "lucide-react"
import socket from "../socket"

interface ChatMessage {
  id: string
  userId: number
  email: string
  message: string
  timestamp: string
}

export default function ChatRoom() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const user = JSON.parse(localStorage.getItem("user") || "null")

  useEffect(() => {
    // Join the global chat room when mounting
    socket.emit("joinGlobalChat")

    // Listen for incoming messages
    socket.on("globalMessage", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg])
    })

    return () => {
      socket.off("globalMessage")
    }
  }, [])

  useEffect(() => {
    // Scroll to the bottom exactly when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !user) return

    socket.emit("sendGlobalMessage", {
      userId: user.id || user.userId,
      email: user.email,
      message: inputText.trim(),
    })

    setInputText("")
  }

  const formatTime = (isoDate: string) => {
    const d = new Date(isoDate)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-[fadeIn_0.5s_ease-out]">
        <MessageSquare className="w-16 h-16 text-slate-500 mb-4 opacity-50" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Community Chat</h2>
        <p className="text-slate-600 dark:text-slate-400">Please log in to join the conversation.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col pt-4 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex items-center gap-3 mb-6 px-2">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-indigo-500" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Community Chat</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Discuss live auctions with other prospectors</p>
        </div>
      </div>

      <div className="flex-1 bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl flex flex-col overflow-hidden relative">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-50 text-slate-500 gap-2">
              <MessageSquare className="w-12 h-12 mb-2" />
              <p className="font-medium text-center">It's quiet in here...<br/>Be the first to say hello!</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMe = msg.userId === (user.id || user.userId)
              // Create a consistent color based on email string
              const colorCode = msg.email.length % 3
              let bubbleBorder = "border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
              
              if (isMe) {
                 bubbleBorder = "border-indigo-500/30 bg-indigo-500 text-white"
              }

              return (
                <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group animate-[fadeIn_0.2s_ease-out]`}>
                  <div className={`max-w-[75%] rounded-2xl p-4 shadow-sm border ${bubbleBorder} ${isMe ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
                    {!isMe && (
                      <p className="text-xs font-bold mb-1 opacity-70 text-indigo-500">{msg.email.split('@')[0]}</p>
                    )}
                    <p className={`text-sm ${isMe ? 'text-white' : 'text-slate-800 dark:text-slate-200'} leading-relaxed break-words whitespace-pre-wrap`}>
                      {msg.message}
                    </p>
                    <span className={`text-[10px] block mt-2 font-semibold ${isMe ? 'text-indigo-200 text-right' : 'text-slate-500 dark:text-slate-400 text-left'}`}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50">
          <form onSubmit={handleSend} className="flex items-center gap-3 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Message the community..."
              className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium placeholder-slate-400"
              autoComplete="off"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-5 py-3.5 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 flex items-center justify-center relative overflow-hidden group"
            >
              <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
