// ─── Wallet Page ──────────────────────────────────────────────
// Full wallet management page with Razorpay payment integration.
// Shows balance, allows adding money, and displays transaction history.
//
// Flow:
// 1. User selects or enters an amount
// 2. "Add Money" calls POST /wallet/create-order
// 3. Razorpay Checkout popup opens with the order
// 4. On payment success, sends details to POST /wallet/verify-payment
// 5. Backend verifies signature and credits wallet
// 6. UI updates to show new balance

import { useEffect, useState } from "react"
import {
  Wallet as WalletIcon,
  Plus,
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  CheckCircle,
  Loader2,
  IndianRupee,
  Shield,
  Info,
} from "lucide-react"
import API from "../services/api"
import { toast } from "react-hot-toast"

// TypeScript declarations for Razorpay Checkout.js
declare global {
  interface Window {
    Razorpay: any
  }
}

interface WalletTransaction {
  id: number
  type: "CREDIT" | "DEBIT" | "LOCK" | "UNLOCK"
  amount: number
  description: string | null
  razorpayPaymentId: string | null
  createdAt: string
}

interface WalletData {
  id: number
  userId: number
  balance: number
  lockedBalance: number
  transactions: WalletTransaction[]
}

// Preset amounts for quick selection
const PRESET_AMOUNTS = [100, 500, 1000, 2000, 5000, 10000]

export default function Wallet() {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAmount, setSelectedAmount] = useState<number | null>(500)
  const [customAmount, setCustomAmount] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showTestInfo, setShowTestInfo] = useState(false)

  const user = JSON.parse(localStorage.getItem("user") || "null")
  const token = localStorage.getItem("token")

  // Fetch wallet data on mount — only if logged in
  useEffect(() => {
    if (token) {
      fetchWallet()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchWallet = async () => {
    try {
      const res = await API.get("/wallet")
      setWallet(res.data)
    } catch (err) {
      console.error("Failed to fetch wallet:", err)
      toast.error("Failed to load wallet")
    } finally {
      setLoading(false)
    }
  }

  // ─── Not Logged In ─────────────────────────────────────────
  if (!token) {
    return (
      <div className="max-w-5xl mx-auto text-center py-24 animate-[fadeIn_0.5s_ease-out]">
        <WalletIcon className="w-20 h-20 mx-auto mb-6 text-slate-300 dark:text-slate-600" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Login Required</h2>
        <p className="text-slate-500 mb-6">Please log in to access your wallet.</p>
        <a
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-purple-700 transition-all active:scale-95"
        >
          Log in
        </a>
      </div>
    )
  }

  // Get the final amount — custom input takes priority
  const getAmount = (): number => {
    if (customAmount) return parseFloat(customAmount)
    if (selectedAmount) return selectedAmount
    return 0
  }

  // ─── Razorpay Payment Flow ─────────────────────────────────
  const handleAddMoney = async () => {
    const amount = getAmount()

    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (amount < 1 || amount > 50000) {
      toast.error("Amount must be between ₹1 and ₹50,000")
      return
    }

    setIsProcessing(true)

    try {
      // Step 1: Create order on backend
      const orderRes = await API.post("/wallet/create-order", { amount })
      const { order_id, key_id } = orderRes.data

      // Step 2: Configure Razorpay Checkout options
      const options = {
        key: key_id || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: Math.round(amount * 100), // Paise
        currency: "INR",
        name: "BidSphere",
        description: "Wallet Recharge",
        order_id: order_id,
        handler: async (response: any) => {
          // Step 3: Send payment details to backend for verification
          try {
            const verifyRes = await API.post("/wallet/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount,
            })

            // Step 4: Update wallet state with new data
            setWallet(verifyRes.data.wallet)
            toast.success(`₹${amount.toLocaleString()} added to wallet!`, {
              icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
            })

            // Reset form
            setCustomAmount("")
            setSelectedAmount(500)
          } catch (err) {
            console.error("Payment verification failed:", err)
            toast.error("Payment verification failed. If money was deducted, it will be refunded.")
          }
        },
        prefill: {
          email: user?.email || "",
        },
        theme: {
          color: "#6366f1", // Indigo to match our theme
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false)
            toast("Payment cancelled", {
              icon: <Info className="w-5 h-5 text-slate-400" />,
            })
          },
        },
      }

      // Step 2.5: Open the Razorpay Checkout popup
      const rzp = new window.Razorpay(options)
      rzp.on("payment.failed", (response: any) => {
        console.error("Payment failed:", response.error)
        toast.error(`Payment failed: ${response.error.description}`)
      })
      rzp.open()
    } catch (err) {
      console.error("Failed to create order:", err)
      toast.error("Failed to initiate payment. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  // ─── Transaction type badge styling ────────────────────────
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "CREDIT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30">
            <ArrowDownLeft className="w-3 h-3" /> Credit
          </span>
        )
      case "DEBIT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/30">
            <ArrowUpRight className="w-3 h-3" /> Debit
          </span>
        )
      case "LOCK":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30">
            <Lock className="w-3 h-3" /> Locked
          </span>
        )
      case "UNLOCK":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/30">
            <Lock className="w-3 h-3" /> Unlocked
          </span>
        )
      default:
        return null
    }
  }

  // ─── Loading State ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-[pulse_1.5s_ease-in-out_infinite] opacity-60">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg mb-3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10"></div>
          <div className="h-48 bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10"></div>
        </div>
        <div className="h-96 bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10"></div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-[fadeIn_0.5s_ease-out]">
      {/* Header */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <WalletIcon className="w-9 h-9 text-indigo-400" />
            My Wallet
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Manage your funds and transaction history.
          </p>
        </div>
      </div>

      {/* ─── Balance Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Available Balance */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 p-8 rounded-2xl shadow-xl shadow-indigo-500/20 overflow-hidden group">
          <div className="absolute right-0 top-0 w-40 h-40 bg-white/10 rounded-bl-full blur-2xl transform group-hover:scale-110 transition-transform duration-500"></div>
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-purple-400/10 rounded-full blur-3xl"></div>
          <p className="text-sm font-bold text-indigo-100 uppercase tracking-wider mb-3 flex items-center gap-2">
            <IndianRupee className="w-4 h-4" /> Available Balance
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-medium text-indigo-200">₹</span>
            <span className="text-5xl font-black text-white tracking-tight">
              {(wallet?.balance ?? 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <p className="text-xs text-indigo-200 mt-3 font-medium">
            Ready for bidding
          </p>
        </div>

        {/* Locked Balance */}
        <div className="relative bg-white dark:bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg overflow-hidden group hover:border-amber-500/30 transition-colors">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" /> Locked (Stakes)
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-medium text-slate-400">₹</span>
            <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              {(wallet?.lockedBalance ?? 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-3 font-medium">
            5% stake per bid — released on auction end
          </p>
        </div>
      </div>

      {/* ─── Add Money Section ──────────────────────────────── */}
      <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-400" /> Add Money
          </h3>
          <button
            onClick={() => setShowTestInfo(!showTestInfo)}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
          >
            <CreditCard className="w-4 h-4" />
            Test Card Info
          </button>
        </div>

        {/* Test Card Info Banner */}
        {showTestInfo && (
          <div className="mb-6 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl animate-[fadeIn_0.3s_ease-out]">
            <h4 className="text-sm font-bold text-indigo-400 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Razorpay Test Mode — Use These Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Card Number</span>
                <p className="text-slate-900 dark:text-white font-mono font-bold mt-1">4111 1111 1111 1111</p>
              </div>
              <div>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Expiry</span>
                <p className="text-slate-900 dark:text-white font-mono font-bold mt-1">Any future date</p>
              </div>
              <div>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">CVV</span>
                <p className="text-slate-900 dark:text-white font-mono font-bold mt-1">Any 3 digits (e.g. 123)</p>
              </div>
              <div>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">OTP</span>
                <p className="text-slate-900 dark:text-white font-mono font-bold mt-1">Click "Success" in popup</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-indigo-500/10">
              <p className="text-xs text-slate-500">
                <strong className="text-amber-400">Simulate Failure:</strong> Use card <code className="font-mono text-slate-300">4111 1111 1111 1112</code> or click "Failure" on the OTP page.
              </p>
            </div>
          </div>
        )}

        {/* Preset Amount Buttons */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
          {PRESET_AMOUNTS.map((amt) => (
            <button
              key={amt}
              onClick={() => {
                setSelectedAmount(amt)
                setCustomAmount("")
              }}
              className={`px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 border ${
                selectedAmount === amt && !customAmount
                  ? "bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/30 scale-[1.02]"
                  : "bg-white dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-indigo-500/50 hover:text-indigo-400"
              }`}
            >
              ₹{amt.toLocaleString()}
            </button>
          ))}
        </div>

        {/* Custom Amount Input */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg">₹</span>
            <input
              type="number"
              placeholder="Enter custom amount..."
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value)
                setSelectedAmount(null)
              }}
              min="1"
              max="50000"
              className="w-full pl-10 pr-4 py-4 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
            />
          </div>
          <button
            onClick={handleAddMoney}
            disabled={isProcessing || getAmount() <= 0}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-lg shadow-lg shadow-indigo-500/25 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[180px]"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Processing...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" /> Add ₹{getAmount().toLocaleString() || "0"}
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          Payments are processed securely via Razorpay. Your card details are never stored on our servers.
        </p>
      </div>

      {/* ─── Transaction History ────────────────────────────── */}
      <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg p-6 sm:p-8">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-6 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-indigo-400" /> Transaction History
        </h3>

        {(!wallet?.transactions || wallet.transactions.length === 0) ? (
          <div className="text-center py-16 text-slate-500">
            <WalletIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-semibold">No transactions yet</p>
            <p className="text-sm mt-1">Add money to your wallet to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {wallet.transactions.map((txn) => {
              const date = new Date(txn.createdAt)
              const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
              const isPositive = txn.type === "CREDIT" || txn.type === "UNLOCK"

              return (
                <div
                  key={txn.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/50 hover:border-indigo-500/20 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isPositive
                          ? "bg-emerald-500/10 text-emerald-400"
                          : txn.type === "LOCK"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-rose-500/10 text-rose-400"
                      }`}
                    >
                      {isPositive ? (
                        <ArrowDownLeft className="w-5 h-5" />
                      ) : txn.type === "LOCK" ? (
                        <Lock className="w-5 h-5" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5" />
                      )}
                    </div>

                    {/* Details */}
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {txn.description || `${txn.type} transaction`}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {getTypeBadge(txn.type)}
                        <span className="text-[11px] text-slate-500 font-medium">
                          {dateStr} • {timeStr}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Amount */}
                  <span
                    className={`text-lg font-black tabular-nums ${
                      isPositive ? "text-emerald-400" : txn.type === "LOCK" ? "text-amber-400" : "text-rose-400"
                    }`}
                  >
                    {isPositive ? "+" : "−"}₹{txn.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
