import React, { createContext, useContext, useState, useEffect } from "react"
import ChatOverlay from "../components/ChatOverlay"
import socket from "../socket"
import { toast } from "react-hot-toast"

interface ChatContextType {
  openPrivateChat: (partnerId: number, partnerName: string) => void
  closePrivateChat: () => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [partnerId, setPartnerId] = useState<number | null>(null)
  const [partnerName, setPartnerName] = useState<string>("")

  const openPrivateChat = (id: number, name: string) => {
    setPartnerId(id)
    setPartnerName(name)
    setIsOpen(true)
  }

  const closePrivateChat = () => {
    setIsOpen(false)
    setPartnerId(null)
  }

  useEffect(() => {
    const handleNewMessage = (msg: any) => {
      const userStr = localStorage.getItem("user")
      const currentUser = userStr ? JSON.parse(userStr) : null
      
      if (!currentUser) return
      
      // If WE are the receiver
      if (msg.receiverId === (currentUser.id || currentUser.userId)) {
        // If the chat box isn't currently open with this sender, notify them!
        if (!isOpen || partnerId !== msg.senderId) {
          toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white dark:bg-slate-900 shadow-xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 dark:ring-white/10 p-4 border border-indigo-500/20`}>
              <div className="flex-1 w-0 flex items-center">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                    <span className="text-indigo-500 font-bold">{msg.email.charAt(0).toUpperCase()}</span>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    New message from {msg.email.split('@')[0]}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                    {msg.message}
                  </p>
                </div>
              </div>
              <div className="ml-4 flex-shrink-0 flex items-center justify-center">
                <button
                  onClick={() => {
                    toast.dismiss(t.id)
                    openPrivateChat(msg.senderId, msg.email.split('@')[0] || "User")
                  }}
                  className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Reply
                </button>
              </div>
            </div>
          ), { duration: 5000 })
        }
      }
    }

    socket.on("privateMessage", handleNewMessage)
    return () => {
      socket.off("privateMessage", handleNewMessage)
    }
  }, [isOpen, partnerId])

  return (
    <ChatContext.Provider value={{ openPrivateChat, closePrivateChat }}>
      {children}
      {isOpen && partnerId && (
        <ChatOverlay partnerId={partnerId} partnerName={partnerName} onClose={closePrivateChat} />
      )}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) throw new Error("useChat must be used within a ChatProvider")
  return context
}
