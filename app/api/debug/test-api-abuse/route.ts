import { NextRequest, NextResponse } from "next/server"

const BACKEND_BASE_URL = 'http://localhost:5253'

export async function POST(request: NextRequest) {
  try {
    const { endpoint, method = 'GET', count = 10, delay = 100 } = await request.json()

    console.log("🔥 [TEST-API-ABUSE] Testing API abuse with:", { endpoint, method, count, delay })

    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    const results = []
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < count; i++) {
      try {
        console.log(`🔥 [TEST-API-ABUSE] Request ${i + 1}/${count} to ${endpoint}`)

        const response = await fetch(`${BACKEND_BASE_URL}${endpoint}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        })

        const status = response.status
        const success = response.ok

        results.push({
          request: i + 1,
          status,
          success,
          timestamp: new Date().toISOString()
        })

        if (success) {
          successCount++
        } else {
          errorCount++
        }

        // Delay between requests
        if (delay > 0 && i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }

      } catch (error) {
        console.error(`❌ [TEST-API-ABUSE] Request ${i + 1} failed:`, error)
        results.push({
          request: i + 1,
          status: 'ERROR',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })
        errorCount++
      }
    }

    console.log(`🔥 [TEST-API-ABUSE] Completed: ${successCount} success, ${errorCount} errors`)

    return NextResponse.json({
      success: true,
      message: `API abuse test completed: ${successCount} success, ${errorCount} errors`,
      results: {
        totalRequests: count,
        successCount,
        errorCount,
        successRate: (successCount / count) * 100,
        results
      }
    })

  } catch (error) {
    console.error("❌ [TEST-API-ABUSE] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    )
  }
}