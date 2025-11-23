"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { getMaterialsByModule } from "@/app/lib/assigned-courses-service"

export default function StudentMaterialsAccessDebug() {
  const [moduleId, setModuleId] = useState("1")
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const testMaterialsAccess = async () => {
    setLoading(true)
    setError(null)
    setMaterials([])
    setDebugInfo(null)

    try {
      console.log(`🧪 [DEBUG] Testing materials access for module: ${moduleId}`)

      const token = localStorage.getItem("token")
      console.log(`🔑 [DEBUG] Token exists: ${!!token}`)

      if (token) {
        // Decodificar el token para ver la información del usuario
        const tokenParts = token.split(".")
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]))
          console.log(`👤 [DEBUG] Token payload:`, payload)
          setDebugInfo({ tokenPayload: payload })
        }
      }

      const result = await getMaterialsByModule(moduleId)
      console.log(`📊 [DEBUG] Result:`, result)

      if (typeof result === 'object' && result !== null && 'error' in result) {
        setError(result.error)
        setMaterials(result.materials || [])
      } else {
        setMaterials(Array.isArray(result) ? result : [])
      }

      setDebugInfo((prev: any) => ({ ...prev, result }))
    } catch (error) {
      console.error("❌ [DEBUG] Error:", error)
      setError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const testDirectBackendAccess = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("No token found")
        return
      }

      console.log(`🔗 [DEBUG] Testing direct backend access...`)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/materials/modulo/${moduleId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      console.log(`📡 [DEBUG] Direct backend response status: ${response.status}`)

      if (response.ok) {
        const data = await response.json()
        console.log(`✅ [DEBUG] Direct backend success:`, data)
        setMaterials(data)
        setDebugInfo((prev: any) => ({ ...prev, directBackend: { success: true, data } }))
      } else {
        const errorText = await response.text()
        console.error(`❌ [DEBUG] Direct backend error:`, errorText)
        setError(`Direct backend error: ${response.status} - ${errorText}`)
        setDebugInfo((prev: any) => ({
          ...prev,
          directBackend: { success: false, status: response.status, error: errorText },
        }))
      }
    } catch (error) {
      console.error("❌ [DEBUG] Direct backend error:", error)
      setError(`Direct backend error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Debug: Student Materials Access</h1>
        <Badge variant="outline">Debug Mode</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Materials Access</CardTitle>
          <CardDescription>Test if students can access materials from a specific module</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Module ID</label>
              <Input
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
                placeholder="Enter module ID (e.g., 1)"
              />
            </div>
            <Button onClick={testMaterialsAccess} disabled={loading}>
              {loading ? "Testing..." : "Test API Route"}
            </Button>
            <Button onClick={testDirectBackendAccess} disabled={loading} variant="outline">
              {loading ? "Testing..." : "Test Direct Backend"}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {materials.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Materials Found ({materials.length}):</h3>
              <div className="grid gap-2">
                {materials.map((material, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="font-medium">{material.nombre}</div>
                    <div className="text-sm text-gray-600">
                      Type: {material.tipo} | ID: {material.materialId}
                    </div>
                    {material.ruta && <div className="text-xs text-blue-600 truncate">URL: {material.ruta}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {materials.length === 0 && !error && !loading && (
            <Alert>
              <AlertDescription>No materials found for this module</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {debugInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
