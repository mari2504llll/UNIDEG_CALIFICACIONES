import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function exportAlumnoPDF(alumno, calificaciones) {
  const doc = new jsPDF()

  doc.setFontSize(16)
  doc.text('UNIDEG - Reporte de Calificaciones', 14, 18)

  doc.setFontSize(11)
  doc.text(`Alumno: ${alumno.nombre}`, 14, 28)
  doc.text(`Matrícula: ${alumno.matricula}`, 14, 34)
  doc.text(`Especialidad: ${alumno.especialidad || '-'}`, 14, 40)

  const rows = calificaciones.map((c) => [
    c.materias?.clave || '',
    c.materias?.nombre || '',
    c.parcial1 ?? '-',
    c.parcial2 ?? '-',
    c.parcial3 ?? '-',
    c.final ?? '-',
    c.estatus || '-',
  ])

  autoTable(doc, {
    startY: 48,
    head: [['Clave', 'Materia', 'P1', 'P2', 'P3', 'Final', 'Estatus']],
    body: rows,
    headStyles: { fillColor: [16, 42, 67] }, // azul UNIDEG
    styles: { fontSize: 9 },
  })

  const promedio =
    calificaciones.reduce((acc, c) => acc + (Number(c.final) || 0), 0) /
    (calificaciones.length || 1)

  doc.setFontSize(11)
  doc.text(`Promedio general: ${promedio.toFixed(1)}`, 14, doc.lastAutoTable.finalY + 10)

  doc.save(`calificaciones_${alumno.matricula}.pdf`)
}
