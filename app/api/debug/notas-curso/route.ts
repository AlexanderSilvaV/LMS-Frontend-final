import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cursoId = searchParams.get('cursoId')

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"

    console.log("=== NOTAS CURSO DEBUG ===")
    console.log("Backend URL:", backendUrl)
    console.log("Curso ID:", cursoId)

    // First test basic connectivity
    console.log("Testing basic connectivity to backend...")
    const healthResponse = await fetch(`${backendUrl}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }).catch(() => null)

    console.log("Health check status:", healthResponse?.status || 'Failed to connect')

    // Test different endpoints to see what works
    const testResults = []

    // Test 1: Basic courses endpoint
    try {
      console.log("Testing courses endpoint...")
      const coursesResponse = await fetch(`${backendUrl}/api/courses`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": request.headers.get("authorization") || "",
        },
      })
      const coursesData = await coursesResponse.json().catch(() => null)
      testResults.push({
        endpoint: `${backendUrl}/api/courses`,
        status: coursesResponse.status,
        dataLength: coursesData ? (Array.isArray(coursesData) ? coursesData.length : 'not array') : 'null',
        sampleData: coursesData ? (Array.isArray(coursesData) ? coursesData.slice(0, 2) : coursesData) : null
      })
    } catch (error) {
      testResults.push({
        endpoint: `${backendUrl}/api/courses`,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 3: Check authentication
    const authHeader = request.headers.get("authorization")
    testResults.push({
      endpoint: 'Authentication Check',
      hasAuthHeader: !!authHeader,
      authHeaderPreview: authHeader ? `${authHeader.substring(0, 20)}...` : 'No auth header'
    })

    // Test 4: Try with different course IDs if no cursoId specified
    if (!cursoId) {
      const testCourseIds = [1, 2, 3]
      for (const testId of testCourseIds) {
        try {
          console.log(`Testing notas for course ${testId}...`)
          const notasResponse = await fetch(`${backendUrl}/api/notas/curso/${testId}/estudiantes`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": request.headers.get("authorization") || "",
            },
          })
          const notasData = await notasResponse.json().catch(() => null)
          testResults.push({
            endpoint: `${backendUrl}/api/notas/curso/${testId}/estudiantes`,
            status: notasResponse.status,
            dataLength: notasData ? (Array.isArray(notasData) ? notasData.length : 'not array') : 'null',
            sampleData: notasData ? (Array.isArray(notasData) ? notasData.slice(0, 1) : notasData) : null
          })
        } catch (error) {
          testResults.push({
            endpoint: `${backendUrl}/api/notas/curso/${testId}/estudiantes`,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
    }

    return NextResponse.json({
      backendUrl,
      cursoId,
      healthCheck: {
        status: healthResponse?.status || 'Failed to connect',
        ok: healthResponse?.ok || false
      },
      testResults,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in debug endpoint:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        backendUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}