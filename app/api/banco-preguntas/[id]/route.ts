import { NextRequest, NextResponse } from "next/server"

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"

type RouteContext = {
  params: {
    id: string
  }
}

const buildBackendUrl = (id: string) => `${BACKEND_BASE_URL}/api/BancoPreguntas/${id}`

export async function PUT(request: NextRequest, context: RouteContext) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader) {
    return NextResponse.json({ mensaje: "No autorizado" }, { status: 401 })
  }

  const { id } = context.params
  const bodyText = await request.text()

  try {
    const backendResponse = await fetch(buildBackendUrl(id), {
      method: "PUT",
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
    console.error(`Error en PUT /api/banco-preguntas/${id}:`, error)
    return NextResponse.json(
      { mensaje: error instanceof Error ? error.message : "Error interno del servidor" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader) {
    return NextResponse.json({ mensaje: "No autorizado" }, { status: 401 })
  }

  const { id } = context.params

  try {
    const backendResponse = await fetch(buildBackendUrl(id), {
      method: "DELETE",
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
    return NextResponse.json(data, { status: backendResponse.status })
  } catch (error) {
    console.error(`Error en DELETE /api/banco-preguntas/${id}:`, error)
    return NextResponse.json(
      { mensaje: error instanceof Error ? error.message : "Error interno del servidor" },
      { status: 500 },
    )
  }
}
