import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    // Log the request details
    console.log("Debug API - Authorization header present:", !!authHeader)

    // Make the request to the backend
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/cursos/buscar`
    console.log("Debug API - Fetching from:", backendUrl)

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader || "",
      },
      body: JSON.stringify({
        Pagina: 1,
        CantidadPorPagina: 100,
      }),
    })

    console.log("Debug API - Backend response status:", response.status)

    const data = await response.json()
    console.log("Debug API - Raw backend response:", data)

    // Return both the raw data and a processed version
    return NextResponse.json({
      raw: data,
      processed: {
        success: data.exito,
        message: data.mensaje,
        courses: data.dato?.cursos || [],
        pagination: data.dato?.paginacion || {},
        statusCode: response.status,
      },
      requestDetails: {
        url: backendUrl,
        authHeaderPresent: !!authHeader,
      },
    })
  } catch (error) {
    console.error("Debug API - Error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : null,
      },
      { status: 500 },
    )
  }
}
