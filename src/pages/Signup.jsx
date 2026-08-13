import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Signup() {
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre }, // el trigger de la base de datos usa esto para el perfil
      },
    })

    setLoading(false)

    if (signUpError) {
      setError(signUpError.message || 'No se pudo crear la cuenta.')
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>¡Listo!</h1>
          <p className="subtitle">
            Tu cuenta se creó correctamente. Revisa tu correo si Supabase pide
            confirmación, y ya puedes iniciar sesión.
          </p>
          <button onClick={() => navigate('/login')}>Ir a iniciar sesión</button>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>UNIDEG</h1>
        <p className="subtitle">Crear cuenta</p>

        <label>Nombre completo</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />

        <label>Correo</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />

        {error && <p className="error-text">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>

        <p className="subtitle" style={{ marginTop: '1rem' }}>
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </form>
    </div>
  )
}
