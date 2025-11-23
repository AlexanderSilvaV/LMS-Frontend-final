import { NextRequest, NextResponse } from "next/server"

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader) {
    return NextResponse.json({ mensaje: "No autorizado" }, { status: 401 })
  }

  try {
    const backendResponse = await fetch(`${BACKEND_BASE_URL}/api/BancoPreguntas/categorias`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
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
    const operacionExitosa = data.operacionExitosa ?? data.exito ?? false
    if (!operacionExitosa) {
      return NextResponse.json({ mensaje: data.mensaje || "Error al obtener categorías" }, { status: 500 })
    }

    const categorias = data.dato || []
    return NextResponse.json({ categorias })
  } catch (error) {
    console.error("Error en GET /api/banco-preguntas/categorias:", error)
    return NextResponse.json(
      { mensaje: error instanceof Error ? error.message : "Error interno del servidor" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader) {
    return NextResponse.json({ mensaje: "No autorizado" }, { status: 401 })
  }

  try {
    const bodyText = await request.text()
    const backendResponse = await fetch(`${BACKEND_BASE_URL}/api/BancoPreguntas/categorias`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: bodyText,
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
    console.error("Error en POST /api/banco-preguntas/categorias:", error)
    return NextResponse.json(
      { mensaje: error instanceof Error ? error.message : "Error interno del servidor" },
      { status: 500 },
    )
  }
}
