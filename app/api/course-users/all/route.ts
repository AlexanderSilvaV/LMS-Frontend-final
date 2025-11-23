import { type NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [ALL-COURSE-USERS-API] Fetching all course-user assignments")

    // Get the authorization header from the request
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      console.error("❌ [ALL-COURSE-USERS-API] No authorization header")
      return NextResponse.json({ mensaje: "No autorizado" }, { status: 401 })
    }

    // Call the backend API to get all course-user assignments
    const backendUrl = `${API_BASE_URL}/api/curso-usuarios`
    console.log(`🔗 [ALL-COURSE-USERS-API] Calling backend: ${backendUrl}`)

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    })

    console.log(`📡 [ALL-COURSE-USERS-API] Backend response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [ALL-COURSE-USERS-API] Backend error: ${response.status}`, errorText)

      if (response.status === 404) {
        return NextResponse.json(
          {
            exito: true,
            dato: [],
            mensaje: "No hay asignaciones de usuarios a cursos",
          },
          { status: 200 },
        )
      }

      return NextResponse.json({ mensaje: `Error del servidor: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    console.log(`✅ [ALL-COURSE-USERS-API] Backend response data:`, data)

    // Si el backend devuelve { exito: true, dato: [...] } o { operacionExitosa: true, dato: [...] }
    // normalizar y devolver directamente el array en el body para que el frontend lo consuma.
    if (data) {
      if (data.exito !== undefined && data.dato !== undefined) {
        return NextResponse.json(Array.isArray(data.dato) ? data.dato : [data.dato])
      }

      if (data.operacionExitosa !== undefined && data.dato !== undefined) {
        return NextResponse.json(Array.isArray(data.dato) ? data.dato : [data.dato])
      }

      if (Array.isArray(data)) {
        return NextResponse.json(data)
      }
    }

    // Fallback: devolver lo que retornó el backend
    return NextResponse.json(data)
  } catch (error) {
    console.error("❌ [ALL-COURSE-USERS-API] Error:", error)
    return NextResponse.json({ mensaje: "Error interno del servidor" }, { status: 500 })
  }
}
