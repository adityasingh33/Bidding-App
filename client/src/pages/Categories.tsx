import { useState, useEffect } from "react"
import { Check, Loader2 } from "lucide-react"
import API from "../services/api"
import { AUCTION_CATEGORIES } from "../constants/categories"
import { toast } from "react-hot-toast"

export default function Categories() {
  const [favorites, setFavorites] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await API.get("/user/categories")
        setFavorites(res.data)
      } catch (err) {
        console.error("Failed to load favorite categories", err)
        toast.error("Failed to load favorite categories")
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  const toggleCategory = (category: string) => {
    setFavorites(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await API.put("/user/categories", { categories: favorites })
      toast.success("Favorite categories updated successfully!")
    } catch (err) {
      console.error(err)
      toast.error("Failed to update categories")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 mt-4 animate-[fadeIn_0.5s_ease-out]">
      {/* Premium Header */}
      <div className="relative bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-8 sm:p-12 overflow-hidden shadow-2xl border border-indigo-500/30">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
        
        <div className="relative z-10">
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4 drop-shadow-md">
            Your Premium Feed
          </h2>
          <p className="text-indigo-100/80 text-lg max-w-2xl font-medium leading-relaxed">
            Curate your marketplace experience. Select the categories you care about most and receive lightning-fast notifications the second a new auction goes live.
          </p>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden">
        
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Active Categories</h3>
          <span className="text-sm font-semibold px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full border border-slate-200 dark:border-slate-700">
            {favorites.length} Selected
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {AUCTION_CATEGORIES.filter(c => c !== "ALL").map(category => {
            const isSelected = favorites.includes(category)
            return (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`relative group flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl border transition-all duration-300 ease-out active:scale-95 overflow-hidden ${
                  isSelected
                    ? "bg-indigo-500/10 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                    : "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-indigo-400/50 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                {/* Active Gradient Background Fill */}
                <div className={`absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-0 transition-opacity duration-300 ${isSelected ? 'opacity-10' : 'group-hover:opacity-5'}`}></div>
                
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors duration-300 ${
                  isSelected 
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/40" 
                    : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/10"
                }`}>
                  {isSelected ? <Check className="w-6 h-6 animate-[pop_0.3s_ease-out]" /> : <div className="w-2.5 h-2.5 rounded-full bg-current opacity-70"></div>}
                </div>
                
                <span className={`font-bold text-sm sm:text-base tracking-wide transition-colors duration-300 z-10 ${
                  isSelected ? "text-indigo-600 dark:text-indigo-300" : "text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white"
                }`}>
                  {category}
                </span>

                {/* Subtle active ring */}
                {isSelected && (
                  <div className="absolute -bottom-1 -right-1 w-16 h-16 bg-indigo-500/20 rounded-full blur-2xl"></div>
                )}
              </button>
            )
          })}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-6">
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm text-center sm:text-left">
            Changes are saved to your profile immediately.
          </p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto flex items-center justify-center px-10 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-none shadow-lg shadow-indigo-500/25 transition-all outline-none focus:ring-4 focus:ring-indigo-500/50 active:scale-95 text-lg"
          >
            {saving ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : null}
            {saving ? "Saving Preferences..." : "Confirm Selections"}
          </button>
        </div>
      </div>
    </div>
  )
}
