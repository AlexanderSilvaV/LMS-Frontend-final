import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, context: { params: Promise<{ moduloId: string }> }) {
  try {
    const { moduloId } = await context.params
    console.log("[MATERIALS-MODULO-API] Fetching materials for module " + moduloId)

    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ mensaje: "Token de autorización requerido" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"

    const response = await fetch(backendUrl + "/api/materiales/modulo/" + moduloId, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    })

    console.log("[MATERIALS-MODULO-API] Backend response status: " + response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[MATERIALS-MODULO-API] Backend error:", errorText)

      let errorMessage = "Error del servidor: " + response.status
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.mensaje) {
          errorMessage = errorData.mensaje
        }
      } catch (e) {
        errorMessage = errorText || errorMessage
      }

      return NextResponse.json({ mensaje: errorMessage }, { status: response.status })
    }

    const data = await response.json()
    console.log("[MATERIALS-MODULO-API] Materials fetched successfully:", data)

    return NextResponse.json(data)
  } catch (error) {
    console.error("[MATERIALS-MODULO-API] Error:", error)
    return NextResponse.json(
      { mensaje: "Error de conexión: " + (error instanceof Error ? error.message : "Error desconocido") },
      { status: 500 },
    )
  }
}
