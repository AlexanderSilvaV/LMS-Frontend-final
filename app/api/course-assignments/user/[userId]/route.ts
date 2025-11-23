import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ mensaje: "No autorizado" }, { status: 401 })
    }

    const { userId } = params
    console.log(`🔍 [API-USER-ASSIGNMENTS] Fetching assignments for user: ${userId}`)

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"

    // Usar el endpoint correcto para obtener asignaciones de un usuario específico
    const response = await fetch(`${apiUrl}/api/curso-usuarios/usuario/${userId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    console.log("📡 [API-USER-ASSIGNMENTS] Response status:", response.status)

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({
          exito: true,
          dato: [],
          mensaje: "No se encontraron asignaciones para este usuario",
        })
      }

      const errorText = await response.text()
      console.error("❌ [API-USER-ASSIGNMENTS] Error response:", errorText)
      return NextResponse.json(
        { mensaje: `Error del servidor: ${response.status} ${response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("📚 [API-USER-ASSIGNMENTS] Response data:", data)

    return NextResponse.json({
      exito: true,
      dato: data.dato || data || [],
      mensaje: "Asignaciones del usuario obtenidas exitosamente",
    })
  } catch (error) {
    console.error("❌ [API-USER-ASSIGNMENTS] Error:", error)
    return NextResponse.json(
      { mensaje: `Error de conexión: ${error instanceof Error ? error.message : "Error desconocido"}` },
      { status: 500 },
    )
  }
}
