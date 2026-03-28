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
    <div className="max-w-md mx-auto mt-16 p-8 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
      <h2 className="text-2xl font-bold text-center mb-6 text-white">Register</h2>
      {error && <p className="mb-4 p-3 bg-red-900/30 text-red-400 border border-red-800 rounded text-sm">{error}</p>}
      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-indigo-500 transition-colors"
          required 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-indigo-500 transition-colors"
          required 
        />
        <button type="submit" className="w-full p-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded transition-colors mt-2">
          Register
        </button>
      </form>
    </div>
  )
}

export default Register
