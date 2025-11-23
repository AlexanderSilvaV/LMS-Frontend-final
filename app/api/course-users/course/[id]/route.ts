import { type NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: courseId } = await params
    console.log(`🔍 [COURSE-USERS-API] Fetching users for course: ${courseId}`)

    // Get the authorization header from the request
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      console.error("❌ [COURSE-USERS-API] No authorization header")
      return NextResponse.json({ mensaje: "No autorizado" }, { status: 401 })
    }

    // Call the backend API
    const backendUrl = `${API_BASE_URL}/api/curso-usuarios/curso/${courseId}`
    console.log(`🔗 [COURSE-USERS-API] Calling backend: ${backendUrl}`)

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    })

    console.log(`📡 [COURSE-USERS-API] Backend response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [COURSE-USERS-API] Backend error: ${response.status}`, errorText)

      if (response.status === 404) {
        return NextResponse.json(
          {
            exito: true,
            dato: [],
            mensaje: "No hay usuarios asignados",
          },
          { status: 200 },
        )
      }

      return NextResponse.json({ mensaje: `Error del servidor: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    console.log(`✅ [COURSE-USERS-API] Backend response data:`, data)

    // Handle the operacionExitosa format from your C# backend
    if (data.operacionExitosa !== undefined) {
      const datoArray = Array.isArray(data.dato) ? data.dato : data.dato ? [data.dato] : []
      return NextResponse.json({
        exito: !!data.operacionExitosa,
        dato: datoArray,
        mensaje: data.mensaje,
      })
    }

    // If backend returned plain array or other shape, try to normalize to { dato: [] }
    if (Array.isArray(data)) {
      return NextResponse.json({ exito: true, dato: data })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("❌ [COURSE-USERS-API] Error:", error)
    return NextResponse.json({ mensaje: "Error interno del servidor" }, { status: 500 })
  }
}
