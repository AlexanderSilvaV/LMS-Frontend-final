import { type NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 })
    }

    // Test the assignment endpoint with POST method
    const testData = {
      CursoId: 12346, // Use the course ID from your database
      UsuarioId: "test-user-id",
      RolEnCurso: "Estudiante",
    }

    console.log("Testing assignment endpoint with data:", testData)

    const response = await fetch(`${API_BASE_URL}/api/curso-usuarios/asignar`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    })

    const responseText = await response.text()

    return NextResponse.json({
      endpoint: "/api/curso-usuarios/asignar",
      method: "POST",
      status: response.status,
      statusText: response.statusText,
      responseBody: responseText,
      testData,
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
