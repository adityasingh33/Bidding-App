import { useState } from "react"
import { useNavigate } from "react-router-dom"
import API from "../services/api"

const Register = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await API.post("/auth/register", { email, password })
      navigate("/login")
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed")
    }
  }

  return (
    <div className="max-w-[400px] w-full mx-auto mt-20 p-8 sm:p-10 bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-800/60">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Create an account</h2>
        <p className="text-slate-400 mt-2 text-sm">Join BidSphere to start bidding</p>
      </div>

      {error && <p className="mb-6 p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-sm text-center">{error}</p>}
      
      <form onSubmit={handleRegister} className="flex flex-col gap-5">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-300 ml-1">Email Address</label>
          <input 
            type="email" 
            placeholder="name@example.com" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full p-3.5 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
            required 
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
          <input 
            type="password" 
            placeholder="Create a strong password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="w-full p-3.5 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
            required 
          />
        </div>
        <button type="submit" className="w-full p-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all mt-4 shadow-lg shadow-indigo-500/20 active:scale-[0.98]">
          Create Account
        </button>
      </form>
    </div>
  )
}

export default Register
