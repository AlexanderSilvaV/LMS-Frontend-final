import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Map frontend fields to backend expected fields
    const backendBody = {
      Correo: body.email,
      Contraseña: body.password,
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"
    let response: Response
    try {
      response = await fetch(`${baseUrl}/api/usuarios/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(backendBody),
      })
    } catch (err) {
      console.error("Login fetch failed:", err)
      return NextResponse.json({ mensaje: `No se pudo conectar al backend en ${baseUrl}. Asegúrate de que esté levantado.` }, { status: 502 })
    }

    const contentType = response.headers.get("content-type")
    let data: any

    // Only parse JSON if content-type indicates JSON
    if (contentType && contentType.includes("application/json")) {
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error("Failed to parse JSON response:", jsonError)
        const text = await response.text()
        return NextResponse.json({ mensaje: "Error al procesar la respuesta del servidor", detalles: text }, { status: response.status })
      }
    } else {
      // If not JSON, get text response
      const text = await response.text()
      data = { mensaje: text || "Error desconocido" }
    }

    if (response.ok) {
      return NextResponse.json(data)
    } else {
      return NextResponse.json(data, { status: response.status })
    }
  } catch (error) {
    console.error("Login API error:", error)
    return NextResponse.json({ mensaje: "Error interno del servidor" }, { status: 500 })
  }
}
