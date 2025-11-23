import { type NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")

  if (!authHeader) {
    return NextResponse.json({ error: "No authorization header" }, { status: 401 })
  }

  const results = {
    backendUrl: API_BASE_URL,
    timestamp: new Date().toISOString(),
    tests: {} as any,
  }

  // Test endpoints that we know work
  const endpoints = [
    { name: "courses", url: "/api/cursos", method: "GET" },
    { name: "courseUsers", url: "/api/curso-usuarios/curso/12346", method: "GET" },
    { name: "modules", url: "/api/modulos", method: "GET" },
    { name: "materials", url: "/api/materials/modulo/1", method: "GET" },
  ]

  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Testing ${endpoint.name}: ${endpoint.url}`)

      const response = await fetch(`${API_BASE_URL}${endpoint.url}`, {
        method: endpoint.method,
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      })

      const responseText = await response.text()
      let responseData

      try {
        responseData = JSON.parse(responseText)
      } catch {
        responseData = responseText
      }

      results.tests[endpoint.name] = {
        status: response.status,
        success: response.ok,
        data: responseData,
        url: `${API_BASE_URL}${endpoint.url}`,
      }

      console.log(`✅ ${endpoint.name}: ${response.status}`)
    } catch (error) {
      results.tests[endpoint.name] = {
        status: 0,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        url: `${API_BASE_URL}${endpoint.url}`,
      }

      console.error(`❌ ${endpoint.name}:`, error)
    }
  }

  return NextResponse.json(results)
}
