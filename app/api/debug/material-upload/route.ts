import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"

    console.log("=== MATERIAL UPLOAD DEBUG ===")
    console.log("Backend URL:", backendUrl)
    console.log("Expected endpoint:", `${backendUrl}/api/materials/modulo/1/archivo`)

    // Probar conectividad básica
    const testResponse = await fetch(`${backendUrl}/api/materials/modulo/1`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    return NextResponse.json({
      backendUrl,
      testEndpoint: `${backendUrl}/api/materials/modulo/1`,
      testStatus: testResponse.status,
      testStatusText: testResponse.statusText,
      uploadEndpoint: `${backendUrl}/api/materials/modulo/{id}/archivo`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        backendUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253",
      },
      { status: 500 },
    )
  }
}
