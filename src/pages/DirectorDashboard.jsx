import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function DirectorDashboard() {
  const { profile, logout } = useAuth()
  const [calificaciones, setCalificaciones] = useState([])
  const [materiaFiltro, setMateriaFiltro] = useState('')
  const [maestroFiltro, setMaestroFiltro] = useState('')
  const [materias, setMaterias] = useState([])
  const [maestros, setMaestros] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFiltros() {
      const { data: m } = await supabase.from('materias').select('id, clave, nombre').order('clave')
      setMaterias(m || [])
      const { data: mt } = await supabase.from('profiles').select('id, nombre').eq('role', 'maestro')
      setMaestros(mt || [])
    }
    loadFiltros()
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      let query = supabase
        .from('calificaciones')
        .select('*, alumnos(nombre, matricula), materias(clave, nombre), profiles:maestro_id(nombre)')
        .order('updated_at', { ascending: false })

      if (materiaFiltro) query = query.eq('materia_id', materiaFiltro)
      if (maestroFiltro) query = query.eq('maestro_id', maestroFiltro)

      const { data } = await query.limit(500)
      setCalificaciones(data || [])
      setLoading(false)
    }
    load()
  }, [materiaFiltro, maestroFiltro])

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Panel del Director</h1>
        <div>
          <span>{profile.nombre}</span>
          <button onClick={logout}>Salir</button>
        </div>
      </header>

      <p className="hint-text">
        Aquí puedes ver todas las calificaciones capturadas por cada maestro, con
        fecha de la última actualización. La edición sigue siendo responsabilidad
        del maestro de cada materia; el director tiene solo lectura y supervisión.
      </p>

      <div className="filtros">
        <select value={materiaFiltro} onChange={(e) => setMateriaFiltro(e.target.value)}>
          <option value="">Todas las materias</option>
          {materias.map((m) => (
            <option key={m.id} value={m.id}>{m.clave} - {m.nombre}</option>
          ))}
        </select>

        <select value={maestroFiltro} onChange={(e) => setMaestroFiltro(e.target.value)}>
          <option value="">Todos los maestros</option>
          {maestros.map((m) => (
            <option key={m.id} value={m.id}>{m.nombre}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table className="grade-table read-only">
          <thead>
            <tr>
              <th>Alumno</th><th>Materia</th><th>Maestro</th>
              <th>P1</th><th>P2</th><th>P3</th><th>Final</th>
              <th>Última actualización</th>
            </tr>
          </thead>
          <tbody>
            {calificaciones.map((c) => (
              <tr key={c.id}>
                <td>{c.alumnos?.nombre} <span className="muted">({c.alumnos?.matricula})</span></td>
                <td>{c.materias?.nombre}</td>
                <td>{c.profiles?.nombre || '—'}</td>
                <td>{c.parcial1 ?? '-'}</td>
                <td>{c.parcial2 ?? '-'}</td>
                <td>{c.parcial3 ?? '-'}</td>
                <td>{c.final ?? '-'}</td>
                <td>{c.updated_at ? new Date(c.updated_at).toLocaleString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
