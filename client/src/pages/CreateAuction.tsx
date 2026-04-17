import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import API from "../services/api"
import { AUCTION_CATEGORIES } from "../constants/categories"

export default function CreateAuction() {
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState(AUCTION_CATEGORIES[0])
  const [startingPrice, setStartingPrice] = useState("")
  const [durationHours, setDurationHours] = useState("24")
  const [biddingStartTime, setBiddingStartTime] = useState("")
  
  // Image Upload States
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const DURATION_OPTIONS = [
    { label: "1 Hour", value: "1" },
    { label: "6 Hours", value: "6" },
    { label: "12 Hours", value: "12" },
    { label: "24 Hours (1 Day)", value: "24" },
    { label: "3 Days", value: "72" },
    { label: "7 Days", value: "168" },
  ]

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      // Basic validation
      if (!file.type.startsWith('image/')) {
        setError("Please upload a valid image file")
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      setError("")
    }
  }

  const uploadToCloudinary = async (): Promise<string | null> => {
    if (!imageFile) return null;
    
    // Safety check for ENV Variables missing
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    
    if (!cloudName || cloudName.includes('YOUR_CLOUD_NAME') || !uploadPreset || uploadPreset.includes('YOUR_UPLOAD_PRESET')) {
      throw new Error("Cloudinary setup is incomplete. Ensure .env vars are set.");
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", imageFile)
    formData.append("upload_preset", uploadPreset)

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData
      })
      const data = await response.json()
      if (data.secure_url) {
        return data.secure_url
      } else {
        throw new Error(data.error?.message || "Cloudinary upload failed")
      }
    } catch (err: any) {
      console.error("Cloudinary error:", err)
      throw new Error(err.message || "Failed to upload image")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadToCloudinary()
      }

      const res = await API.post("/auction/create", {
        title,
        category,
        startingPrice: Number(startingPrice),
        durationHours: Number(durationHours),
        biddingStartTime: biddingStartTime ? new Date(biddingStartTime).toISOString() : undefined,
        imageUrl
      })
      navigate(`/auctions/${res.data.id}`)
    } catch (err: any) {
      setError(err.message || err.response?.data?.error || "Failed to create auction")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl w-full mx-auto mt-20 p-8 sm:p-10 bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Create New Auction</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">List your exclusive item for bidding</p>
      </div>
      
      {error && <p className="mb-6 p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-sm font-medium text-center">{error}</p>}
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        {/* Image Upload Area */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-800 dark:text-slate-300 ml-1">Item Image (Optional)</label>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
              imagePreview 
                ? 'border-indigo-500/50 bg-slate-100 dark:bg-slate-900/50' 
                : 'border-slate-200 dark:border-white/10 bg-slate-950/50 hover:border-indigo-500/50 hover:bg-slate-100 dark:bg-slate-900/50'
            }`}
          >
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImageSelect}
            />
            {imagePreview ? (
              <div className="relative group">
                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                  <span className="text-slate-900 dark:text-white font-medium text-sm">Click to change image</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 space-y-3">
                <svg className="w-8 h-8 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Click to upload an image from your device</span>
              </div>
            )}
          </div>
        </div>

        {/* Title Input */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-800 dark:text-slate-300 ml-1">Auction Title</label>
          <input
            placeholder="e.g. Vintage Rolex Submariner"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3.5 bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
            required
          />
        </div>
        
        {/* Category Input */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-800 dark:text-slate-300 ml-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-3.5 bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner appearance-none cursor-pointer"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em' }}
          >
            {AUCTION_CATEGORIES.map(cat => (
              <option key={cat} value={cat} className="bg-slate-100 dark:bg-slate-900">{cat}</option>
            ))}
          </select>
        </div>
        
        {/* Row for Details */}
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="space-y-1 flex-1">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-300 ml-1">Starting Price ($)</label>
            <input
              placeholder="100.00"
              type="number"
              min="1"
              step="0.01"
              value={startingPrice}
              onChange={(e) => setStartingPrice(e.target.value)}
              className="w-full p-3.5 bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
              required
            />
          </div>

          <div className="space-y-1 flex-1">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-300 ml-1">Duration</label>
            <select
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
              className="w-full p-3.5 bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner appearance-none pr-10 cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em' }}
            >
              {DURATION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-slate-100 dark:bg-slate-900">{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Start Time Input */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-800 dark:text-slate-300 ml-1">Bidding Start Time (Optional)</label>
          <input
            type="datetime-local"
            value={biddingStartTime}
            onChange={(e) => setBiddingStartTime(e.target.value)}
            className="w-full p-3.5 bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner [color-scheme:light] dark:[color-scheme:dark]"
          />
          <p className="text-xs text-slate-500 ml-1 mt-1">If left blank, bidding will start in 7 minutes.</p>
        </div>
        
        <button 
          type="submit" 
          disabled={loading || isUploading}
          className="w-full flex justify-center py-4 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all outline-none focus:ring-4 focus:ring-indigo-500/50 active:scale-[0.99] disabled:opacity-50 rounded-none uppercase tracking-widest mt-6 border border-indigo-400/20"
        >
          {isUploading ? "Uploading Image..." : loading ? "Starting Auction..." : "Launch Auction"}
        </button>
      </form>
    </div>
  )
}
