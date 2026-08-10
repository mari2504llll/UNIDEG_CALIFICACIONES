import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { session, profile, loading } = useAuth()

  if (loading) return <div className="loading-screen">Cargando...</div>
  if (!session) return <Navigate to="/login" replace />
  if (!profile) return <div className="loading-screen">Cargando perfil...</div>

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />
  }

  return children
}
