import { useState } from "react"
import { useNavigate } from "react-router-dom"
import API from "../services/api"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await API.post("/auth/login", { email, password })
      localStorage.setItem("token", res.data.token)
      localStorage.setItem("user", JSON.stringify(res.data.user))
      navigate("/auctions")
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed")
    }
  }

  return (
    <div className="max-w-[400px] w-full mx-auto mt-20 p-8 sm:p-10 bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Welcome back</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">Enter your credentials to access your account</p>
      </div>
      
      {error && <p className="mb-6 p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-sm text-center">{error}</p>}
      
      <form onSubmit={handleLogin} className="flex flex-col gap-5">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-800 dark:text-slate-300 ml-1">Email Address</label>
          <input 
            type="email" 
            placeholder="name@example.com" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full p-3.5 bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
            required 
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-800 dark:text-slate-300 ml-1">Password</label>
          <input 
            type="password" 
            placeholder="********" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="w-full p-3.5 bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
            required 
          />
        </div>
        <button type="submit" className="w-full p-3.5 bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500 hover:shadow-purple-500/30 transition-all duration-300 text-white font-semibold rounded-xl transition-all mt-4 shadow-lg shadow-indigo-500/20 active:scale-[0.98]">
          Sign In
        </button>
      </form>
    </div>
  )
}

export default Login
