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
    <div className="max-w-4xl mx-auto space-y-8 mt-10">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Favorite Categories</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2">Select your favorite categories to get instant notifications when new auctions start!</p>
      </div>

      <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {AUCTION_CATEGORIES.filter(c => c !== "ALL").map(category => {
            const isSelected = favorites.includes(category)
            return (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`flex items-center justify-between p-4 rounded-xl border text-sm font-bold transition-all duration-300 active:scale-95 ${
                  isSelected
                    ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                    : "bg-slate-100 dark:bg-slate-900/50 border-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:bg-slate-800 hover:text-slate-700 dark:text-slate-200"
                }`}
              >
                {category}
                {isSelected && <Check className="w-5 h-5 text-indigo-400 animate-[pop_0.3s_ease-out]" />}
              </button>
            )
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center px-8 py-3.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 min-w-[150px]"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  )
}
