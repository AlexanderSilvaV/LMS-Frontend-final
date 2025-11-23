import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")
    const body = await request.json()

    if (!token) {
      return NextResponse.json({ mensaje: "No autorizado" }, { status: 401 })
    }

    console.log("🔍 [API-COURSES-SEARCH] Searching courses with params:", body)

    // Llamar al endpoint correcto del backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"
    const response = await fetch(`${apiUrl}/api/cursos/buscar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })

    console.log("📡 [API-COURSES-SEARCH] Backend response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ [API-COURSES-SEARCH] Backend error:", errorText)
      return NextResponse.json(
        { mensaje: `Error del backend: ${response.status} ${errorText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("✅ [API-COURSES-SEARCH] Backend response:", data)

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("❌ [API-COURSES-SEARCH] Error:", error)
    return NextResponse.json(
      { mensaje: `Error de conexión: ${error instanceof Error ? error.message : "Error desconocido"}` },
      { status: 500 },
    )
  }
}
