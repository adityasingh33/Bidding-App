import React, { createContext, useContext, useState } from "react"
import ChatOverlay from "../components/ChatOverlay"

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
