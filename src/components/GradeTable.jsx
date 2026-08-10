import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

const CAMPOS = ['parcial1', 'parcial2', 'parcial3', 'final']

export default function GradeTable({ calificaciones, onChange }) {
  const { profile } = useAuth()
  const [savingId, setSavingId] = useState(null)
  const [drafts, setDrafts] = useState({})

  function getValue(row, campo) {
    const draft = drafts[row.id]
    if (draft && draft[campo] !== undefined) return draft[campo]
    return row[campo] ?? ''
  }

  function handleEdit(rowId, campo, value) {
    setDrafts((prev) => ({
      ...prev,
      [rowId]: { ...prev[rowId], [campo]: value },
    }))
  }

  async function handleSave(row) {
    const draft = drafts[row.id]
    if (!draft) return
    setSavingId(row.id)

    const updates = {}
    for (const campo of CAMPOS) {
      if (draft[campo] !== undefined && draft[campo] !== '') {
        updates[campo] = Number(draft[campo])
      }
    }
    updates.updated_by = profile.id

    const { error: updErr } = await supabase
      .from('calificaciones')
      .update(updates)
      .eq('id', row.id)

    setSavingId(null)

    if (updErr) {
      alert('No se pudo guardar: ' + updErr.message)
      return
    }

    setDrafts((prev) => {
      const next = { ...prev }
      delete next[row.id]
      return next
    })
    onChange?.()
  }

  return (
    <table className="grade-table">
      <thead>
        <tr>
          <th>Alumno</th>
          <th>Materia</th>
          <th>P1</th>
          <th>P2</th>
          <th>P3</th>
          <th>Final</th>
          <th>Estatus</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {calificaciones.map((row) => {
          const dirty = !!drafts[row.id]
          return (
            <tr key={row.id} className={dirty ? 'row-dirty' : ''}>
              <td>{row.alumnos?.nombre}</td>
              <td>{row.materias?.nombre}</td>
              {CAMPOS.map((campo) => (
                <td key={campo}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={getValue(row, campo)}
                    onChange={(e) => handleEdit(row.id, campo, e.target.value)}
                  />
                </td>
              ))}
              <td>{row.estatus}</td>
              <td>
                <button
                  disabled={!dirty || savingId === row.id}
                  onClick={() => handleSave(row)}
                >
                  {savingId === row.id ? 'Guardando...' : 'Guardar'}
                </button>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
