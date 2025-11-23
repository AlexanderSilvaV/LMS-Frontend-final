import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const moduleId = searchParams.get("moduleId") || "1" // Default to module 1

    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "No authorization token provided" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"

    console.log(`🧪 [DEBUG-MODULE] Testing materials for specific module: ${moduleId}`)

    // Probar el endpoint exacto del MaterialesController
    const endpoint = `${backendUrl}/api/materials/modulo/${moduleId}`

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    const responseText = await response.text()

    let parsedData = null
    let parseError = null

    if (responseText) {
      try {
        parsedData = JSON.parse(responseText)
      } catch (e) {
        parseError = e instanceof Error ? e.message : "Failed to parse JSON"
      }
    }

    const result = {
      moduleId,
      endpoint,
      request: {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token.substring(0, 20)}...`,
        },
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        bodyText: responseText,
        parsedData,
        parseError,
      },
      analysis: {
        isWorking: response.ok,
        materialsCount: parsedData && Array.isArray(parsedData) ? parsedData.length : 0,
        dataStructure: parsedData ? typeof parsedData : "No data",
      },
    }

    console.log(`🧪 [DEBUG-MODULE] Test result:`, result.analysis)

    return NextResponse.json(result)
  } catch (error) {
    console.error("❌ [DEBUG-MODULE] Error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
