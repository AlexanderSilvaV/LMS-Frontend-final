import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ mensaje: "No autorizado" }, { status: 401 })
    }

    // Parámetros de búsqueda
    const pagina = searchParams.get("PaginaActual") || searchParams.get("pagina") || "1"
    const cantidadPorPagina = searchParams.get("CantidadPorPagina") || searchParams.get("cantidadPorPagina") || "10"
    const nombre = searchParams.get("Nombre") || searchParams.get("nombre") || null
    const activo = searchParams.get("Activo") || searchParams.get("activo") || null
    const nrc = searchParams.get("NRC") || searchParams.get("nrc") || null

    // Construir el cuerpo de la solicitud para el endpoint de búsqueda
    const requestBody = {
      pagina: Number.parseInt(pagina),
      cantidadPorPagina: Number.parseInt(cantidadPorPagina),
      nombre,
      activo: activo === "true" ? true : activo === "false" ? false : null,
      nrc: nrc ? Number.parseInt(nrc) : null,
    }

    console.log("🔍 [API-COURSES] Fetching courses with params:", requestBody)

    // Llamar al endpoint de búsqueda del backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"
    const response = await fetch(`${apiUrl}/api/cursos/buscar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ [API-COURSES] Error response from backend:", errorText)
      return NextResponse.json(
        { mensaje: `Error del backend: ${response.status} ${response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("✅ [API-COURSES] Backend response:", data)

    // Procesar la respuesta según el formato del backend
    if (data.operacionExitosa || data.exito) {
      const result = data.dato || {}

      // Formatear la respuesta para el frontend
      return NextResponse.json({
        cursos: result.cursos || [],
        paginacion: {
          paginaActual: result.paginacion?.paginaActual || Number.parseInt(pagina),
          cantidadPorPagina: result.paginacion?.cantidadPorPagina || Number.parseInt(cantidadPorPagina),
          totalResultados: result.paginacion?.totalResultados || result.cursos?.length || 0,
          totalPaginas: result.paginacion?.totalPaginas || 1,
        },
      })
    } else {
      return NextResponse.json({ mensaje: data.mensaje || "Error desconocido" }, { status: 500 })
    }
  } catch (error) {
    console.error("❌ [API-COURSES] Error:", error)
    return NextResponse.json(
      { mensaje: `Error de conexión: ${error instanceof Error ? error.message : "Error desconocido"}` },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")
    const body = await request.json()

    if (!token) {
      return NextResponse.json({ mensaje: "No autorizado" }, { status: 401 })
    }

    console.log("🔍 [API-COURSES] Creating course:", body)

    // Llamar al endpoint del backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"
    const response = await fetch(`${apiUrl}/api/cursos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    console.log("✅ [API-COURSES] Backend response:", data)

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("❌ [API-COURSES] Error:", error)
    return NextResponse.json(
      { mensaje: `Error de conexión: ${error instanceof Error ? error.message : "Error desconocido"}` },
      { status: 500 },
    )
  }
}
