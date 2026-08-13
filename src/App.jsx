import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import DirectorDashboard from './pages/DirectorDashboard'
import MaestroDashboard from './pages/MaestroDashboard'
import AlumnoDashboard from './pages/AlumnoDashboard'
import './styles.css'

function Home() {
  const { profile } = useAuth()
  if (!profile) return null
  if (profile.role === 'director') return <Navigate to="/director" replace />
  if (profile.role === 'maestro') return <Navigate to="/maestro" replace />
  return <Navigate to="/alumno" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/" element={
            <ProtectedRoute><Home /></ProtectedRoute>
          } />

          <Route path="/director" element={
            <ProtectedRoute allowedRoles={['director']}><DirectorDashboard /></ProtectedRoute>
          } />

          <Route path="/maestro" element={
            <ProtectedRoute allowedRoles={['maestro']}><MaestroDashboard /></ProtectedRoute>
          } />

          <Route path="/alumno" element={
            <ProtectedRoute allowedRoles={['alumno']}><AlumnoDashboard /></ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
