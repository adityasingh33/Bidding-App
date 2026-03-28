import { Link, useNavigate } from "react-router-dom"

const Navbar = () => {
  const navigate = useNavigate()
  const token = localStorage.getItem("token")
  const user = JSON.parse(localStorage.getItem("user") || "null")

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/login")
  }

  return (
    <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
      <div className="text-2xl font-bold text-indigo-500 hover:text-indigo-400 transition-colors">
        <Link to="/">Live Auctions</Link>
      </div>
      <div className="flex items-center gap-6">
        {token ? (
          <>
            <Link to="/auctions" className="text-gray-300 hover:text-indigo-400 font-medium transition-colors">Auctions</Link>
            <Link to="/watchlist" className="text-gray-300 hover:text-pink-400 font-medium transition-colors flex items-center gap-1"><span>❤️</span> Watchlist</Link>
            <Link to="/my-auctions" className="text-gray-300 hover:text-indigo-400 font-medium transition-colors">My Auctions</Link>
            <Link to="/my-bids" className="text-gray-300 hover:text-indigo-400 font-medium transition-colors">My Bids</Link>
            <Link to="/create" className="text-gray-300 hover:text-indigo-400 font-medium transition-colors">Create</Link>
            {user && <span className="text-sm text-gray-400 mr-2">Hi, {user.email}</span>}
            <button 
              onClick={handleLogout} 
              className="px-4 py-2 rounded border border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-medium transition-all"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-gray-300 hover:text-indigo-400 font-medium transition-colors">Login</Link>
            <Link to="/register" className="text-gray-300 hover:text-indigo-400 font-medium transition-colors">Register</Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar
