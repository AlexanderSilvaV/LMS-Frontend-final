import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ mensaje: "No autorizado" }, { status: 401 })
    }

    console.log("🔍 [API-COURSE-ASSIGNMENTS] Fetching all course assignments...")

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"

    // Intentar obtener todas las asignaciones
    const response = await fetch(`${apiUrl}/api/curso-usuarios`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    console.log("📡 [API-COURSE-ASSIGNMENTS] Response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ [API-COURSE-ASSIGNMENTS] Error response:", errorText)
      return NextResponse.json(
        { mensaje: `Error del servidor: ${response.status} ${response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("📚 [API-COURSE-ASSIGNMENTS] Response data:", data)

    return NextResponse.json({
      exito: true,
      dato: data.dato || data || [],
      mensaje: "Asignaciones obtenidas exitosamente",
    })
  } catch (error) {
    console.error("❌ [API-COURSE-ASSIGNMENTS] Error:", error)
    return NextResponse.json(
      { mensaje: `Error de conexión: ${error instanceof Error ? error.message : "Error desconocido"}` },
      { status: 500 },
    )
  }
}
