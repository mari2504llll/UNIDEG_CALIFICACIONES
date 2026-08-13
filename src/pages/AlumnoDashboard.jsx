import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { exportAlumnoPDF } from '../utils/exportPDF'
import { exportAlumnoExcel } from '../utils/exportExcel'
import { ParcialesLineChart, AveragesBarChart } from '../components/charts'

export default function AlumnoDashboard() {
  const { profile, logout } = useAuth()
  const [alumno, setAlumno] = useState(null)
  const [calificaciones, setCalificaciones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: alumnoData } = await supabase
        .from('alumnos')
        .select('*')
        .eq('profile_id', profile.id)
        .single()
      setAlumno(alumnoData)

      if (alumnoData) {
        const { data: califs } = await supabase
          .from('calificaciones')
          .select('*, materias(clave, nombre)')
          .eq('alumno_id', alumnoData.id)
        setCalificaciones(califs || [])
      }
      setLoading(false)
    }
    load()
  }, [profile.id])

  if (loading) return <p>Cargando...</p>
  if (!alumno) return <p>No se encontró tu ficha de alumno. Contacta al director.</p>

  const promedio =
    calificaciones.reduce((acc, c) => acc + (Number(c.final) || 0), 0) /
    (calificaciones.length || 1)

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Mis Calificaciones</h1>
        <div>
          <span>{profile.nombre}</span>
          <button onClick={logout}>Salir</button>
        </div>
      </header>

      <div className="alumno-info">
        <h2>{alumno.nombre}</h2>
        <p>{alumno.matricula} · {alumno.especialidad}</p>
        <div className="promedio-badge">{promedio.toFixed(1)}</div>
      </div>

      <div className="export-buttons">
        <button onClick={() => exportAlumnoPDF(alumno, calificaciones)}>Exportar PDF</button>
        <button onClick={() => exportAlumnoExcel(alumno, calificaciones)}>Exportar Excel</button>
      </div>

      <table className="grade-table read-only">
        <thead>
          <tr>
            <th>Clave</th><th>Materia</th><th>P1</th><th>P2</th><th>P3</th><th>Final</th><th>Estatus</th>
          </tr>
        </thead>
        <tbody>
          {calificaciones.map((c) => (
            <tr key={c.id}>
              <td>{c.materias?.clave}</td>
              <td>{c.materias?.nombre}</td>
              <td>{c.parcial1 ?? '-'}</td>
              <td>{c.parcial2 ?? '-'}</td>
              <td>{c.parcial3 ?? '-'}</td>
              <td>{c.final ?? '-'}</td>
              <td>{c.estatus}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Mi evolución por parcial</h3>
          <ParcialesLineChart calificaciones={calificaciones} />
        </div>
        <div className="chart-card">
          <h3>Mi promedio por materia</h3>
          <AveragesBarChart calificaciones={calificaciones} groupBy={(c) => c.materias?.nombre} label="Calificación" />
        </div>
      </div>
    </div>
  )
}
