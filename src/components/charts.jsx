import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from 'recharts'

const COLORS = {
  aprobado: '#2e7d32',
  reprobado: '#c0392b',
  bar: '#e0a527',
  line1: '#e0a527',
  line2: '#1f4068',
  grid: '#e5e7eb',
}

// --- Tarjetas de estadísticas rápidas -------------------------------
export function StatCards({ stats }) {
  return (
    <div className="stat-cards">
      {stats.map((s) => (
        <div className="stat-card" key={s.label}>
          <div className="stat-value">{s.value}</div>
          <div className="stat-label">{s.label}</div>
        </div>
      ))}
    </div>
  )
}

// --- Dona: aprobados vs reprobados ----------------------------------
export function PassFailDonut({ calificaciones, umbral = 70 }) {
  const finales = calificaciones
    .map((c) => Number(c.final))
    .filter((n) => !isNaN(n))

  const aprobados = finales.filter((n) => n >= umbral).length
  const reprobados = finales.length - aprobados

  const data = [
    { name: 'Aprobados', value: aprobados },
    { name: 'Reprobados', value: reprobados },
  ]

  if (finales.length === 0) {
    return <p className="chart-empty">Sin calificaciones finales todavía.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
        >
          <Cell fill={COLORS.aprobado} />
          <Cell fill={COLORS.reprobado} />
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

// --- Barras: promedio agrupado por una clave (materia, grupo, etc) --
export function AveragesBarChart({ calificaciones, groupBy, label = 'Promedio' }) {
  const groups = {}
  for (const c of calificaciones) {
    const key = groupBy(c) || 'Sin dato'
    const val = Number(c.final)
    if (isNaN(val)) continue
    if (!groups[key]) groups[key] = { sum: 0, count: 0 }
    groups[key].sum += val
    groups[key].count += 1
  }

  const data = Object.entries(groups).map(([name, { sum, count }]) => ({
    name: name.length > 18 ? name.slice(0, 18) + '…' : name,
    promedio: Math.round((sum / count) * 10) / 10,
  }))

  if (data.length === 0) {
    return <p className="chart-empty">Sin datos suficientes para graficar.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
        <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} height={60} fontSize={11} />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Bar dataKey="promedio" fill={COLORS.bar} name={label} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// --- Línea: evolución P1 -> P2 -> P3 --------------------------------
export function ParcialesLineChart({ calificaciones }) {
  function avg(campo) {
    const vals = calificaciones.map((c) => Number(c[campo])).filter((n) => !isNaN(n))
    if (vals.length === 0) return null
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
  }

  const data = [
    { parcial: 'Parcial 1', promedio: avg('parcial1') },
    { parcial: 'Parcial 2', promedio: avg('parcial2') },
    { parcial: 'Parcial 3', promedio: avg('parcial3') },
  ].filter((d) => d.promedio !== null)

  if (data.length === 0) {
    return <p className="chart-empty">Sin calificaciones parciales todavía.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
        <XAxis dataKey="parcial" fontSize={12} />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Line type="monotone" dataKey="promedio" stroke={COLORS.line2} strokeWidth={3} dot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
