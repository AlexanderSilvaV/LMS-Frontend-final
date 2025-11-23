import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ mensaje: "No autorizado" }, { status: 401 })
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"

    console.log("🔍 [DEBUG-ASSIGNMENTS] Testing backend endpoints...")
    console.log("🔗 [DEBUG-ASSIGNMENTS] Backend URL:", apiUrl)

    // Probar diferentes endpoints que podrían existir
    const endpointsToTest = [
      "/api/curso-usuarios",
      "/api/cursousuario",
      "/api/curso-usuarios/asignar",
      "/api/cursousuario/asignar",
      "/api/curso-usuarios/listar",
      "/api/cursousuario/listar",
    ]

    const results = []

    for (const endpoint of endpointsToTest) {
      try {
        console.log(`🧪 [DEBUG-ASSIGNMENTS] Testing: ${apiUrl}${endpoint}`)

        const response = await fetch(`${apiUrl}${endpoint}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        results.push({
          endpoint,
          status: response.status,
          statusText: response.statusText,
          method: "GET",
          headers: Object.fromEntries(response.headers.entries()),
          bodyPreview: await response.text().then((text) => text.substring(0, 200)),
        })
      } catch (error) {
        results.push({
          endpoint,
          error: error instanceof Error ? error.message : "Unknown error",
          method: "GET",
        })
      }
    }

    // También probar con POST
    try {
      const postResponse = await fetch(`${apiUrl}/api/curso-usuarios`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })

      results.push({
        endpoint: "/api/curso-usuarios",
        status: postResponse.status,
        statusText: postResponse.statusText,
        method: "POST",
        bodyPreview: await postResponse.text().then((text) => text.substring(0, 200)),
      })
    } catch (error) {
      results.push({
        endpoint: "/api/curso-usuarios",
        method: "POST",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }

    return NextResponse.json({
      mensaje: "Prueba de endpoints completada",
      backendUrl: apiUrl,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ [DEBUG-ASSIGNMENTS] Error:", error)
    return NextResponse.json(
      {
        mensaje: `Error en debug: ${error instanceof Error ? error.message : "Error desconocido"}`,
        error: error instanceof Error ? error.stack : "No stack trace",
      },
      { status: 500 },
    )
  }
}
