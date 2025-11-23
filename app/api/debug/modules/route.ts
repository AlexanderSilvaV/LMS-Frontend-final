import { NextResponse } from "next/server"

export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    backendUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253",
    tests: [] as any[],
  }

  // Token de prueba (deberías usar uno real)
  const testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // Usar un token real aquí

  const endpoints = [
    { method: "GET", url: "/api/modulos", description: "Get all modules" },
    { method: "POST", url: "/api/modulos", description: "Create module" },
    { method: "GET", url: "/api/modulos/1", description: "Get module by ID" },
    { method: "PUT", url: "/api/modulos/1", description: "Update module" },
    { method: "DELETE", url: "/api/modulos/1", description: "Delete module" },
    { method: "POST", url: "/api/modulos/buscar", description: "Search modules" },
  ]

  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Testing ${endpoint.method} ${endpoint.url}`)

      const requestOptions: RequestInit = {
        method: endpoint.method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
      }

      // Add body for POST requests
      if (endpoint.method === "POST") {
        if (endpoint.url.includes("buscar")) {
          requestOptions.body = JSON.stringify({
            pagina: 1,
            cantidadPorPagina: 10,
            nombre: null,
            cursoNrc: null,
          })
        } else if (endpoint.url === "/api/modulos") {
          requestOptions.body = JSON.stringify({
            nombre: "Módulo de Prueba",
            descripcion: "Descripción de prueba",
            orden: 1,
            cursoNrc: 1,
          })
        }
      } else if (endpoint.method === "PUT") {
        requestOptions.body = JSON.stringify({
          nombre: "Módulo Actualizado",
          descripcion: "Descripción actualizada",
          orden: 1,
        })
      }

      const response = await fetch(`${results.backendUrl}${endpoint.url}`, requestOptions)

      let responseData = null
      let responseText = ""

      try {
        responseText = await response.text()
        if (responseText) {
          responseData = JSON.parse(responseText)
        }
      } catch {
        responseData = responseText
      }

      results.tests.push({
        endpoint: `${endpoint.method} ${endpoint.url}`,
        description: endpoint.description,
        status: response.status,
        statusText: response.statusText,
        success: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData,
        error: null,
      })

      console.log(`✅ ${endpoint.method} ${endpoint.url}: ${response.status}`)
    } catch (error) {
      results.tests.push({
        endpoint: `${endpoint.method} ${endpoint.url}`,
        description: endpoint.description,
        status: null,
        statusText: null,
        success: false,
        headers: {},
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      })

      console.log(`❌ ${endpoint.method} ${endpoint.url}: ${error}`)
    }
  }

  return NextResponse.json(results, { status: 200 })
}
