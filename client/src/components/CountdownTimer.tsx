import { useState, useEffect } from "react"

interface CountdownTimerProps {
  endTime?: string
  status: string
  className?: string
  badgeMode?: boolean
}

export default function CountdownTimer({ endTime, status, className = "", badgeMode = false }: CountdownTimerProps) {
  const [timeLeftMs, setTimeLeftMs] = useState<number>(() => {
    if (!endTime) return 0
    return Math.max(0, new Date(endTime).getTime() - Date.now())
  })

  useEffect(() => {
    if (status !== "ACTIVE" || !endTime) {
      setTimeLeftMs(0)
      return
    }

    // Initial check
    const initialRemaining = new Date(endTime).getTime() - Date.now()
    if (initialRemaining <= 0) {
      setTimeLeftMs(0)
      return
    }
    setTimeLeftMs(initialRemaining)

    // Tick every second
    const timer = setInterval(() => {
      const remaining = new Date(endTime).getTime() - Date.now()
      if (remaining <= 0) {
        setTimeLeftMs(0)
        clearInterval(timer)
      } else {
        setTimeLeftMs(remaining)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [endTime, status])

  const isEnded = status !== "ACTIVE" || timeLeftMs <= 0 || !endTime
  const isEndingSoon = timeLeftMs > 0 && timeLeftMs < 60000

  // Format the time left
  const formatTime = () => {
    const hours = Math.floor(timeLeftMs / (1000 * 60 * 60))
    const minutes = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((timeLeftMs % (1000 * 60)) / 1000)

    const hh = hours.toString().padStart(2, "0")
    const mm = minutes.toString().padStart(2, "0")
    const ss = seconds.toString().padStart(2, "0")

    if (hours >= 24) {
      const days = Math.floor(hours / 24)
      const remainingHours = hours % 24
      return `${days}d ${remainingHours.toString().padStart(2, "0")}:${mm}:${ss}`
    }
    
    return `${hh}:${mm}:${ss}`
  }

  // Pre-styled badge mode for Cards
  if (badgeMode) {
    if (isEnded) {
      return (
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-md border shadow-sm transition-colors bg-slate-900/80 text-slate-400 border-slate-700/80 ${className}`}>
          {status === 'ACTIVE' ? 'Ended' : status}
        </div>
      )
    }

    return (
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-md border shadow-sm transition-colors ${
        isEndingSoon 
          ? 'bg-rose-500/90 text-white border-rose-400/50 animate-pulse' 
          : 'bg-slate-900/80 text-emerald-400 border-slate-700/80'
      } ${className}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isEndingSoon ? 'bg-white' : 'bg-emerald-400'}`}></span>
        Ends in {formatTime()}
      </div>
    )
  }

  // Generic text mode for Details Page
  if (isEnded) {
    return <span className={className}>{status === 'ACTIVE' ? 'Ended' : status}</span>
  }

  return (
    <span className={`tabular-nums transition-colors duration-300 ${isEndingSoon ? "text-rose-500 animate-pulse" : ""} ${className}`}>
      {formatTime()}
    </span>
  )
}
