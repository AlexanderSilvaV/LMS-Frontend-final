import { type NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [DEBUG] Testing course-users API connection...")

    // Get authorization header from the request
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 })
    }

    // Test connection to backend
    const backendResponse = await fetch(`${API_BASE_URL}/api/curso-usuarios/curso/12346`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    })

    console.log("📊 [DEBUG] Backend response status:", backendResponse.status)

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text()
      console.error("❌ [DEBUG] Backend error:", errorText)
      return NextResponse.json(
        {
          error: "Backend API error",
          status: backendResponse.status,
          message: errorText,
          url: `${API_BASE_URL}/api/curso-usuarios/curso/12346`,
        },
        { status: backendResponse.status },
      )
    }

    const data = await backendResponse.json()
    console.log("✅ [DEBUG] Backend data received:", data)

    return NextResponse.json({
      success: true,
      backendUrl: `${API_BASE_URL}/api/curso-usuarios/curso/12346`,
      data: data,
      message: "Successfully connected to backend API",
    })
  } catch (error) {
    console.error("❌ [DEBUG] Connection error:", error)
    return NextResponse.json(
      {
        error: "Connection failed",
        message: error instanceof Error ? error.message : "Unknown error",
        backendUrl: API_BASE_URL,
      },
      { status: 500 },
    )
  }
}
