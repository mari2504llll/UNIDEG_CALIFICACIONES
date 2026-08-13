import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import GradeTable from '../components/GradeTable'
import { StatCards, PassFailDonut, AveragesBarChart, ParcialesLineChart } from '../components/charts'

export default function MaestroDashboard() {
  const { profile, logout } = useAuth()
  const [materias, setMaterias] = useState([])
  const [materiaId, setMateriaId] = useState(null)
  const [calificaciones, setCalificaciones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMaterias() {
      const { data } = await supabase
        .from('maestro_materia')
        .select('materia_id, materias(id, clave, nombre)')
        .eq('maestro_id', profile.id)
      const list = (data || []).map((r) => r.materias)
      setMaterias(list)
      if (list.length) setMateriaId(list[0].id)
      setLoading(false)
    }
    loadMaterias()
  }, [profile.id])

  const loadCalificaciones = useCallback(async () => {
    if (!materiaId) return
    const { data } = await supabase
      .from('calificaciones')
      .select('*, alumnos(nombre, matricula), materias(clave, nombre)')
      .eq('materia_id', materiaId)
      .order('id')
    setCalificaciones(data || [])
  }, [materiaId])

  useEffect(() => {
    loadCalificaciones()
  }, [loadCalificaciones])

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Panel del Maestro</h1>
        <div>
          <span>{profile.nombre}</span>
          <button onClick={logout}>Salir</button>
        </div>
      </header>

      {loading ? (
        <p>Cargando materias...</p>
      ) : materias.length === 0 ? (
        <p>No tienes materias asignadas todavía. Pide al director que te asigne una.</p>
      ) : (
        <>
          <div className="materia-selector">
            <label>Materia: </label>
            <select value={materiaId ?? ''} onChange={(e) => setMateriaId(Number(e.target.value))}>
              {materias.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.clave} - {m.nombre}
                </option>
              ))}
            </select>
          </div>

          <GradeTable calificaciones={calificaciones} onChange={loadCalificaciones} />

          <StatCards
            stats={[
              { label: 'Alumnos', value: calificaciones.length },
              {
                label: 'Promedio grupo',
                value: (() => {
                  const finales = calificaciones.map((c) => Number(c.final)).filter((n) => !isNaN(n))
                  return finales.length ? (finales.reduce((a, b) => a + b, 0) / finales.length).toFixed(1) : '—'
                })(),
              },
            ]}
          />

          <div className="charts-grid">
            <div className="chart-card">
              <h3>Aprobados vs Reprobados</h3>
              <PassFailDonut calificaciones={calificaciones} />
            </div>
            <div className="chart-card">
              <h3>Evolución por parcial</h3>
              <ParcialesLineChart calificaciones={calificaciones} />
            </div>
            <div className="chart-card">
              <h3>Promedio por alumno</h3>
              <AveragesBarChart calificaciones={calificaciones} groupBy={(c) => c.alumnos?.nombre} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
