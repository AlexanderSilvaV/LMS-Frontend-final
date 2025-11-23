import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const backendUrl = process.env.NEXT_PUBLIC_API_URL

    console.log("=== BACKEND CONNECTION DEBUG ===")
    console.log("Backend URL:", backendUrl)
    console.log("Auth header present:", !!authHeader)

    if (!backendUrl) {
      return NextResponse.json(
        {
          error: "NEXT_PUBLIC_API_URL not configured",
          backendUrl: null,
          hasAuth: !!authHeader,
        },
        { status: 500 },
      )
    }

    if (!authHeader) {
      return NextResponse.json(
        {
          error: "No authorization header",
          backendUrl,
          hasAuth: false,
        },
        { status: 401 },
      )
    }

    const token = authHeader.replace("Bearer ", "")

    // Test connection with a simple search
    try {
      const response = await fetch(`${backendUrl}/api/cursos/buscar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pagina: 1,
          cantidadPorPagina: 1,
          nombre: null,
          activo: null,
          nrc: null,
        }),
      })

      console.log("Test response status:", response.status)
      console.log("Test response headers:", Object.fromEntries(response.headers.entries()))

      const responseText = await response.text()
      console.log("Test response body:", responseText)

      let responseData = null
      try {
        responseData = responseText ? JSON.parse(responseText) : null
      } catch (e) {
        console.error("Failed to parse response as JSON:", e)
      }

      return NextResponse.json({
        backendUrl,
        hasAuth: true,
        connectionTest: {
          status: response.status,
          ok: response.ok,
          responseText: responseText.substring(0, 500), // Limit response size
          responseData,
          headers: Object.fromEntries(response.headers.entries()),
        },
      })
    } catch (error) {
      console.error("Connection test failed:", error)
      return NextResponse.json(
        {
          backendUrl,
          hasAuth: true,
          connectionTest: {
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : null,
          },
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Debug endpoint error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
