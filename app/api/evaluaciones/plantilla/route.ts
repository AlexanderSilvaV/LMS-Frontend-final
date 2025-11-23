import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

const buildPlantillaWorkbook = () => {
  const metadataSheet = XLSX.utils.aoa_to_sheet([
    ["Instrucciones"],
    [
      "Complete la hoja 'Preguntas' con una fila por cada ítem. Los encabezados deben permanecer sin cambios.",
    ],
    [
      "Use números enteros entre 1 y 100 en la columna Puntos. Solo se admiten cuatro opciones (A-D).",
    ],
    [
      "En 'RespuestaCorrecta' ingrese la letra A, B, C o D correspondiente a la opción correcta.",
    ],
    [
      "La columna Retroalimentacion es opcional. Guarde como XLSX antes de importar desde el creador de evaluaciones.",
    ],
  ])

  const preguntasHeader = [
    "Enunciado",
    "Categoria",
    "Puntos",
    "OpcionA",
    "OpcionB",
    "OpcionC",
    "OpcionD",
    "RespuestaCorrecta",
    "Retroalimentacion",
  ]

  const ejemploPreguntas = [
    [
      "¿Cuál es el número atómico del Oxígeno?",
      "Química",
      "5",
      "6",
      "8",
      "12",
      "16",
      "B",
      "El oxígeno tiene número atómico 8.",
    ],
    [
      "¿Cuál de los siguientes es un gas noble?",
      "Química",
      "5",
      "Nitrógeno",
      "Oxígeno",
      "Argón",
      "Cloro",
      "C",
      "El argón es un gas noble, presente en la tabla periódica.",
    ],
    [
      "¿Qué tipo de enlace se forma entre sodio y cloro en la sal de mesa?",
      "Química",
      "5",
      "Covalente",
      "Iónico",
      "Metálico",
      "Puente de hidrógeno",
      "B",
      "El NaCl se forma por enlace iónico entre Na+ y Cl-.",
    ],
    [
      "¿Cuál es la fórmula química del ácido sulfúrico?",
      "Química",
      "5",
      "HCl",
      "H2SO4",
      "HNO3",
      "H2CO3",
      "B",
      "El ácido sulfúrico es H2SO4.",
    ],
    [
      "¿Qué ley afirma que la materia no se crea ni se destruye, solo se transforma?",
      "Química",
      "5",
      "Ley de conservación de la energía",
      "Ley de conservación de la masa",
      "Ley de los gases ideales",
      "Ley periódica",
      "B",
      "La ley de Lavoisier establece que la masa se conserva en una reacción.",
    ],
  ]

  const preguntasSheet = XLSX.utils.aoa_to_sheet([
    preguntasHeader,
    ...ejemploPreguntas,
    Array(preguntasHeader.length).fill(""),
  ])

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, preguntasSheet, "Preguntas")
  XLSX.utils.book_append_sheet(workbook, metadataSheet, "Guía")

  return workbook
}

export async function GET() {
  const workbook = buildPlantillaWorkbook()
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" })

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=plantilla_evaluacion_banco.xlsx",
      "Cache-Control": "no-store",
    },
  })
}
