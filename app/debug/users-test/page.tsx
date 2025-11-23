"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function UsersTestPage() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState<string>("")

  useEffect(() => {
    const storedToken = localStorage.getItem("token")
    if (storedToken) {
      setToken(storedToken)
    }
  }, [])

  const testDirectBackend = async () => {
    setLoading(true)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"
      console.log("Testing direct backend connection to:", backendUrl)

      const response = await fetch(`${backendUrl}/api/usuarios?PaginaActual=1&CantidadPorPagina=10`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("Direct backend response status:", response.status)
      console.log("Direct backend response headers:", Object.fromEntries(response.headers.entries()))

      const responseText = await response.text()
      console.log("Direct backend response text:", responseText)

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        data = { error: "Failed to parse JSON", raw: responseText }
      }

      setResults((prev: any) => ({
        ...prev,
        directBackend: {
          status: response.status,
          ok: response.ok,
          data: data,
          raw: responseText,
        },
      }))
    } catch (error) {
      console.error("Direct backend test error:", error)
      setResults((prev: any) => ({
        ...prev,
        directBackend: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }))
    }
    setLoading(false)
  }

  const testFrontendAPI = async () => {
    setLoading(true)
    try {
      console.log("Testing frontend API route")

      const response = await fetch("/api/users?PaginaActual=1&CantidadPorPagina=10", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("Frontend API response status:", response.status)
      console.log("Frontend API response headers:", Object.fromEntries(response.headers.entries()))

      const responseText = await response.text()
      console.log("Frontend API response text:", responseText)

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        data = { error: "Failed to parse JSON", raw: responseText }
      }

      setResults((prev: any) => ({
        ...prev,
        frontendAPI: {
          status: response.status,
          ok: response.ok,
          data: data,
          raw: responseText,
        },
      }))
    } catch (error) {
      console.error("Frontend API test error:", error)
      setResults((prev: any) => ({
        ...prev,
        frontendAPI: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }))
    }
    setLoading(false)
  }

  const testBackendService = async () => {
    setLoading(true)
    try {
      console.log("Testing backend service")

      const { backendService } = await import("@/app/lib/backend-service")
      const data = await backendService.getUsers(
        {
          paginaActual: 1,
          cantidadPorPagina: 10,
        },
        token,
      )

      console.log("Backend service response:", data)

      setResults((prev: any) => ({
        ...prev,
        backendService: {
          success: true,
          data: data,
        },
      }))
    } catch (error) {
      console.error("Backend service test error:", error)
      setResults((prev: any) => ({
        ...prev,
        backendService: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }))
    }
    setLoading(false)
  }

  const runAllTests = async () => {
    setResults({})
    await testDirectBackend()
    await testFrontendAPI()
    await testBackendService()
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Users Connection Test</h1>

      <div className="mb-6">
        <Alert>
          <AlertDescription>
            <strong>Backend URL:</strong> {process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"}
            <br />
            <strong>Token:</strong> {token ? "Present" : "Missing"}
          </AlertDescription>
        </Alert>
      </div>

      <div className="grid gap-4 mb-6">
        <Button onClick={runAllTests} disabled={loading || !token}>
          {loading ? "Testing..." : "Run All Tests"}
        </Button>
        <div className="flex gap-2">
          <Button onClick={testDirectBackend} disabled={loading || !token} variant="outline">
            Test Direct Backend
          </Button>
          <Button onClick={testFrontendAPI} disabled={loading || !token} variant="outline">
            Test Frontend API
          </Button>
          <Button onClick={testBackendService} disabled={loading || !token} variant="outline">
            Test Backend Service
          </Button>
        </div>
      </div>

      {!token && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>No authentication token found. Please login first.</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {results.directBackend && (
          <Card>
            <CardHeader>
              <CardTitle>Direct Backend Test</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(results.directBackend, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {results.frontendAPI && (
          <Card>
            <CardHeader>
              <CardTitle>Frontend API Test</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(results.frontendAPI, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {results.backendService && (
          <Card>
            <CardHeader>
              <CardTitle>Backend Service Test</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(results.backendService, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
