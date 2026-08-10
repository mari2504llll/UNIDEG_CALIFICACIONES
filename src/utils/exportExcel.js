import * as XLSX from 'xlsx'

export function exportAlumnoExcel(alumno, calificaciones) {
  const rows = calificaciones.map((c) => ({
    Clave: c.materias?.clave || '',
    Materia: c.materias?.nombre || '',
    Parcial1: c.parcial1 ?? '',
    Parcial2: c.parcial2 ?? '',
    Parcial3: c.parcial3 ?? '',
    Final: c.final ?? '',
    Estatus: c.estatus || '',
    'Tipo Curso': c.tipo_curso || '',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Calificaciones')

  // Hoja con datos del alumno
  const infoWs = XLSX.utils.json_to_sheet([
    { Campo: 'Nombre', Valor: alumno.nombre },
    { Campo: 'Matrícula', Valor: alumno.matricula },
    { Campo: 'Especialidad', Valor: alumno.especialidad },
  ])
  XLSX.utils.book_append_sheet(wb, infoWs, 'Datos Alumno')

  XLSX.writeFile(wb, `calificaciones_${alumno.matricula}.xlsx`)
}
