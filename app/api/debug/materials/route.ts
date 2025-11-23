import { type NextRequest, NextResponse } from "next/server"

interface EndpointResult {
  endpoint: string
  status?: number
  ok?: boolean
  statusText?: string
  data?: any
  dataType?: string
  hasExito?: boolean
  hasDato?: boolean
  hasMateriales?: boolean
  error?: string
  errorText?: string
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    console.log("=== DEBUG MATERIALS API ===")
    console.log("Auth header:", authHeader ? "Present" : "Missing")

    if (!authHeader) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")

    // Test multiple possible endpoints
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"
    const endpoints = [
      `${backendUrl}/api/Material`,
      `${backendUrl}/api/materials`,
      `${backendUrl}/api/material`,
      `${backendUrl}/api/materials`,
    ]

    const results: EndpointResult[] = []

    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 [DEBUG MATERIALS] Testing endpoint: ${endpoint}`)

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        const result: EndpointResult = {
          endpoint,
          status: response.status,
          ok: response.ok,
          statusText: response.statusText,
        }

        if (response.ok) {
          try {
            const data = await response.json()
            result.data = data
            result.dataType = Array.isArray(data) ? "array" : typeof data
            result.hasExito = data && typeof data === "object" && "exito" in data
            result.hasDato = data && typeof data === "object" && "dato" in data
            result.hasMateriales = data && typeof data === "object" && "materiales" in data
          } catch (e) {
            result.error = "Failed to parse JSON"
          }
        } else {
          try {
            const errorText = await response.text()
            result.errorText = errorText
          } catch (e) {
            result.error = "Failed to read error text"
          }
        }

        results.push(result)
        console.log(`📊 [DEBUG MATERIALS] Result for ${endpoint}:`, result)
      } catch (error) {
        results.push({
          endpoint,
          error: error instanceof Error ? error.message : "Unknown error",
        })
        console.error(`❌ [DEBUG MATERIALS] Error testing ${endpoint}:`, error)
      }
    }

    return NextResponse.json({
      backendUrl,
      token: token.substring(0, 20) + "...",
      results,
    })
  } catch (error) {
    console.error("❌ [DEBUG MATERIALS] Error in debug materials API:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
