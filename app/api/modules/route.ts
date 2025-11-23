import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const searchParams = request.nextUrl.searchParams

    console.log("=== MODULES API GET ===")
    console.log("Auth header:", authHeader ? "Present" : "Missing")

    if (!authHeader) {
      return NextResponse.json({ mensaje: "Token de autorización requerido" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"
      const url = `${backendUrl}/api/Modulos`

      console.log("Getting modules from:", url)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Backend error:", response.status, errorText)
        throw new Error(`Backend error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("Modules retrieved:", data)

      return NextResponse.json(data)
    } catch (error) {
      console.error("Error getting modules:", error)
      return NextResponse.json(
        { mensaje: `Error al obtener módulos: ${error instanceof Error ? error.message : "Error desconocido"}` },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in modules API route:", error)
    return NextResponse.json(
      { mensaje: `Error de conexión: ${error instanceof Error ? error.message : "Error desconocido"}` },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const body = await request.json()

    console.log("=== MODULES API POST ===")
    console.log("Creating module:", body)

    if (!authHeader) {
      return NextResponse.json({ mensaje: "Token de autorización requerido" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"
      const url = `${backendUrl}/api/Modulos`

      console.log("Creating module at:", url)

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Backend error:", response.status, errorText)
        throw new Error(`Backend error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("Module created:", data)

      return NextResponse.json(data)
    } catch (error) {
      console.error("Error creating module:", error)
      return NextResponse.json(
        { mensaje: `Error al crear módulo: ${error instanceof Error ? error.message : "Error desconocido"}` },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in create module API route:", error)
    return NextResponse.json(
      { mensaje: `Error de conexión: ${error instanceof Error ? error.message : "Error desconocido"}` },
      { status: 500 },
    )
  }
}
