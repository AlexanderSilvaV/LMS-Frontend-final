import { NextRequest, NextResponse } from "next/server"

const BACKEND_BASE_URL = 'http://localhost:5253'

export async function POST(request: NextRequest) {
  try {
    const { stolenToken, endpoint = '/api/estudiante/evaluaciones' } = await request.json()

    console.log("🔓 [TEST-SESSION-HIJACK] Testing session hijacking with stolen token")

    if (!stolenToken) {
      return NextResponse.json({
        success: false,
        error: "No stolen token provided"
      }, { status: 400 })
    }

    // Try to use the stolen token to access a protected endpoint
    const response = await fetch(`${BACKEND_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${stolenToken}`
      }
    })

    const responseData = await response.json()

    console.log("🔓 [TEST-SESSION-HIJACK] Response status:", response.status)
    console.log("🔓 [TEST-SESSION-HIJACK] Response data:", responseData)

    return NextResponse.json({
      success: true,
      message: response.ok ? "Session hijacking successful!" : "Session hijacking failed - token invalid",
      hijackResult: {
        status: response.status,
        success: response.ok,
        data: responseData,
        tokenValid: response.ok
      }
    })

  } catch (error) {
    console.error("❌ [TEST-SESSION-HIJACK] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    )
  }
}