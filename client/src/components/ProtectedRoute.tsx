import { Navigate, useLocation } from "react-router-dom"
import type { ReactNode } from "react"

interface ProtectedRouteProps {
  children: ReactNode
}

/**
 * Route guard that redirects unauthenticated users to /login.
 * Preserves the intended destination so they can be redirected back after login.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem("token")
  const location = useLocation()

  if (!token) {
    // Pass current path as state so Login can redirect back after auth
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}
