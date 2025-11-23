import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const authHeader = request.headers.get("authorization")

    console.log("=== MODULES SEARCH API POST ===")
    console.log("Search params:", body)

    if (!authHeader) {
      return NextResponse.json({ mensaje: "Token de autorización requerido" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const paginaActual = body.pagina || 1
    const cantidadPorPagina = Math.min(body.cantidadPorPagina || 50, 50)
    const nombre = body.nombre || null
    const cursoNrc = body.cursoNrc || null

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"

      // Construir URL base
      const url = `${backendUrl}/api/Modulos/buscar`

      console.log("Posting to:", url)

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pagina: paginaActual,
          cantidadPorPagina: cantidadPorPagina,
          nombre: nombre,
          cursoNrc: cursoNrc,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Backend error:", response.status, errorText)
        throw new Error(`Backend error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("Backend response:", data)

      // Handle different response formats
      if (data.exito !== undefined) {
        if (data.exito && data.dato) {
          return NextResponse.json({
            modulos: Array.isArray(data.dato) ? data.dato : data.dato.modulos || [],
            paginacion: data.dato.paginacion || {
              paginaActual,
              cantidadPorPagina,
              totalResultados: Array.isArray(data.dato) ? data.dato.length : 0,
              totalPaginas: 1,
            },
          })
        } else {
          throw new Error(data.mensaje || "Error fetching modules")
        }
      } else if (data.modulos !== undefined) {
        return NextResponse.json(data)
      } else if (Array.isArray(data)) {
        return NextResponse.json({
          modulos: data,
          paginacion: {
            paginaActual,
            cantidadPorPagina,
            totalResultados: data.length,
            totalPaginas: Math.ceil(data.length / cantidadPorPagina),
          },
        })
      } else {
        return NextResponse.json({
          modulos: [],
          paginacion: {
            paginaActual,
            cantidadPorPagina,
            totalResultados: 0,
            totalPaginas: 0,
          },
        })
      }
    } catch (error) {
      console.error("Backend service error:", error)
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"

      if (errorMessage.includes("401") || errorMessage.includes("unauthorized")) {
        return NextResponse.json({ mensaje: "No autorizado" }, { status: 401 })
      } else {
        return NextResponse.json({ mensaje: errorMessage }, { status: 500 })
      }
    }
  } catch (error) {
    console.error("Error in modules search API route:", error)
    return NextResponse.json(
      { mensaje: `Error de conexión: ${error instanceof Error ? error.message : "Error desconocido"}` },
      { status: 500 },
    )
  }
}
