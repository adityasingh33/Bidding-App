import { useState, useEffect } from "react"

interface CountdownTimerProps {
  endTime?: string
  startTime?: string
  biddingStartTime?: string
  status: string
  className?: string
  badgeMode?: boolean
}

export default function CountdownTimer({ endTime, startTime, biddingStartTime, status, className = "", badgeMode = false }: CountdownTimerProps) {
  const getTargetDate = () => {
    if (status === "PENDING") return startTime;
    if (status === "JOINING") return biddingStartTime;
    return endTime;
  }
  
  const targetDate = getTargetDate();

  const [timeLeftMs, setTimeLeftMs] = useState<number>(() => {
    if (!targetDate) return 0
    return Math.max(0, new Date(targetDate).getTime() - Date.now())
  })

  useEffect(() => {
    if (status === "ENDED" || !targetDate) {
      setTimeLeftMs(0)
      return
    }

    // Initial check
    const initialRemaining = new Date(targetDate).getTime() - Date.now()
    if (initialRemaining <= 0) {
      setTimeLeftMs(0)
      return
    }
    setTimeLeftMs(initialRemaining)

    // Tick every second
    const timer = setInterval(() => {
      const remaining = new Date(targetDate).getTime() - Date.now()
      if (remaining <= 0) {
        setTimeLeftMs(0)
        clearInterval(timer)
      } else {
        setTimeLeftMs(remaining)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate, status])

  const isEnded = status === "ENDED" || (status === "ACTIVE" && (timeLeftMs <= 0 || !endTime))
  const isEndingSoon = status === "ACTIVE" && timeLeftMs > 0 && timeLeftMs < 60000

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
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-md border shadow-sm transition-colors bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-slate-700/80 ${className}`}>
          Ended
        </div>
      )
    }

    let prefix = "Ends in"
    let colorClass = "bg-slate-100 dark:bg-slate-900/80 text-emerald-400 border-slate-700/80"
    let dotClass = "bg-emerald-400"
    
    if (status === "PENDING") {
      prefix = "Starts in"
      colorClass = "bg-slate-100 dark:bg-slate-900/80 text-amber-400 border-slate-700/80"
      dotClass = "bg-amber-400"
    } else if (status === "JOINING") {
      prefix = "Opens in"
      colorClass = "bg-indigo-500/90 text-slate-900 dark:text-white border-indigo-400/50 animate-pulse"
      dotClass = "bg-white"
    } else if (isEndingSoon) {
      colorClass = "bg-rose-500/90 text-slate-900 dark:text-white border-rose-400/50 animate-pulse"
      dotClass = "bg-white"
    }

    return (
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-md border shadow-sm transition-colors ${colorClass} ${className}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`}></span>
        {prefix} {formatTime()}
      </div>
    )
  }

  // Generic text mode for Details Page
  if (isEnded) {
    return <span className={className}>Ended</span>
  }

  return (
    <span className={`tabular-nums transition-colors duration-300 ${isEndingSoon ? "text-rose-500 animate-pulse" : (status === "PENDING" ? "text-amber-400" : (status === "JOINING" ? "text-indigo-400 animate-pulse" : ""))} ${className}`}>
      {formatTime()}
    </span>
  )
}
