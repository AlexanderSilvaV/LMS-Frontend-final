"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function MaterialsTestPage() {
  const [moduleId, setModuleId] = useState("1")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testMaterials = async () => {
    setLoading(true)
    try {
      console.log(`Testing materials for module ID: ${moduleId}`)

      // Usar el endpoint correcto con parámetro 'id'
      const response = await fetch(`/api/materials/modulo/${moduleId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Agregar token si está disponible
          ...(typeof window !== "undefined" &&
            localStorage.getItem("token") && {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            }),
        },
      })

      const data = await response.json()

      setResult({
        status: response.status,
        ok: response.ok,
        data: data,
        url: `/api/materials/modulo/${moduleId}`,
      })

      console.log("Materials test result:", {
        status: response.status,
        data: data,
      })
    } catch (error) {
      console.error("Error testing materials:", error)
      setResult({
        status: 500,
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
        url: `/api/materials/modulo/${moduleId}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Materials Test Page</h1>

      <Card>
        <CardHeader>
          <CardTitle>Test Materials by Module</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="moduleId">Module ID</Label>
              <Input
                id="moduleId"
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
                placeholder="Enter module ID (e.g., 1)"
              />
            </div>

            <Button onClick={testMaterials} disabled={loading || !moduleId}>
              {loading ? "Testing..." : "Test Materials Endpoint"}
            </Button>
          </div>

          {result && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Test Result:</h3>
              <div className="space-y-2">
                <p>
                  <strong>URL:</strong> {result.url}
                </p>
                <p>
                  <strong>Status:</strong>
                  <span
                    className={`ml-2 px-2 py-1 rounded text-sm ${
                      result.ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {result.status}
                  </span>
                </p>
                <div>
                  <strong>Response:</strong>
                  <pre className="mt-2 p-4 bg-gray-100 rounded-md overflow-auto max-h-96 text-sm">
                    {JSON.stringify(result.data || result.error, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p>
              <strong>Expected Endpoint:</strong> /api/materials/modulo/[id]
            </p>
            <p>
              <strong>Backend URL:</strong> {process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"}
            </p>
            <p>
              <strong>Backend Endpoint:</strong> /api/materials/modulo/{moduleId}
            </p>
            <p>
              <strong>Note:</strong> The endpoint uses 'id' as the parameter name, not 'moduleId'
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
