import { NextRequest, NextResponse } from "next/server"

/* eslint-disable @typescript-eslint/no-explicit-any */

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader) {
    return NextResponse.json({ mensaje: "No autorizado" }, { status: 401 })
  }

  try {
  const formData = await request.formData()
  const archivo = formData.get("archivo")

    // In some runtimes the uploaded file may appear as a Blob-like object.
    if (!archivo) {
      return NextResponse.json({ mensaje: "Debe adjuntar un archivo Excel" }, { status: 400 })
    }

    const backendFormData = new FormData()

    // Narrow the type: prefer File, otherwise accept Blob
    if ((archivo as any).name && typeof (archivo as any).name === 'string') {
      // File-like object with name
      backendFormData.append("archivo", archivo as File, (archivo as any).name)
    } else if (typeof (archivo as any).arrayBuffer === 'function' || typeof (archivo as any).stream === 'function') {
      // Blob-like object (has arrayBuffer or stream)
      backendFormData.append("archivo", archivo as unknown as Blob, 'upload.xlsx')
    } else {
      // Fallback: try to wrap primitive/string into a Blob
      try {
        const fallback = new Blob([archivo as unknown as any])
        backendFormData.append("archivo", fallback, 'upload.xlsx')
      } catch (_) {
        return NextResponse.json({ mensaje: 'Tipo de archivo no soportado' }, { status: 400 })
      }
    }

    const backendResponse = await fetch(`${BACKEND_BASE_URL}/api/BancoPreguntas/importar`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
      },
      body: backendFormData,
    })

    const responseText = await backendResponse.text()
    if (!backendResponse.ok) {
      const mensaje = (() => {
        try {
          const data = responseText ? JSON.parse(responseText) : {}
          return data.mensaje || data.Message || `Error ${backendResponse.status}`
        } catch {
          return responseText || `Error ${backendResponse.status}`
        }
      })()
      return NextResponse.json({ mensaje }, { status: backendResponse.status })
    }

    const data = responseText ? JSON.parse(responseText) : {}
    return NextResponse.json(data, { status: backendResponse.status })
  } catch (error) {
    console.error("Error en POST /api/banco-preguntas/importar:", error)
    return NextResponse.json(
      { mensaje: error instanceof Error ? error.message : "Error interno del servidor" },
      { status: 500 },
    )
  }
}
