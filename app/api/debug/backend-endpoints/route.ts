import { type NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 })
    }

    // Test different endpoints to see which ones exist
    const endpointsToTest = [
      "/api/curso-usuarios/usuario/test-id",
      "/api/cursos/asignados",
      "/api/curso-usuarios/asignar",
      "/api/cursos/buscar",
      "/api/usuarios",
    ]

    const results = []

    for (const endpoint of endpointsToTest) {
      try {
        console.log(`Testing endpoint: ${API_BASE_URL}${endpoint}`)

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: "GET",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
          },
        })

        results.push({
          endpoint,
          status: response.status,
          statusText: response.statusText,
          exists: response.status !== 404,
        })
      } catch (error) {
        results.push({
          endpoint,
          status: "ERROR",
          error: error instanceof Error ? error.message : "Unknown error",
          exists: false,
        })
      }
    }

    return NextResponse.json({
      backendUrl: API_BASE_URL,
      endpoints: results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
