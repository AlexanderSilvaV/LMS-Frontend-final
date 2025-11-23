import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    console.log("[MATERIALS-DOWNLOAD-API] Generating download URL for material " + id)

    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ mensaje: "Token de autorización requerido" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"

    const response = await fetch(backendUrl + "/api/materiales/" + id + "/download", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    })

    console.log("[MATERIALS-DOWNLOAD-API] Backend response status: " + response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[MATERIALS-DOWNLOAD-API] Backend error:", errorText)

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
    console.log("[MATERIALS-DOWNLOAD-API] Download URL generated successfully")

    return NextResponse.json(data)
  } catch (error) {
    console.error("[MATERIALS-DOWNLOAD-API] Error:", error)
    return NextResponse.json(
      { mensaje: "Error de conexión: " + (error instanceof Error ? error.message : "Error desconocido") },
      { status: 500 },
    )
  }
}
