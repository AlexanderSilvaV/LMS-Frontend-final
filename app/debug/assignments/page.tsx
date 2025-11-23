"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from "lucide-react"

export default function DebugAssignmentsPage() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runDebug = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem("token")
      if (!token) {
        setError("No se encontró token de autenticación")
        return
      }

      const response = await fetch("/api/debug/course-assignments", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setResults(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-green-100 text-green-800"
    if (status >= 400 && status < 500) return "bg-yellow-100 text-yellow-800"
    if (status >= 500) return "bg-red-100 text-red-800"
    return "bg-gray-100 text-gray-800"
  }

  const getStatusIcon = (status: number) => {
    if (status >= 200 && status < 300) return <CheckCircle className="h-4 w-4" />
    if (status >= 400) return <XCircle className="h-4 w-4" />
    return <AlertCircle className="h-4 w-4" />
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Debug: Endpoints de Asignaciones</h1>
        <p className="text-gray-600">Herramienta para diagnosticar problemas con los endpoints del backend</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mb-6">
        <Button onClick={runDebug} disabled={loading} className="flex items-center gap-2">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {loading ? "Ejecutando pruebas..." : "Ejecutar Debug"}
        </Button>
      </div>

      {results && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong>Backend URL:</strong> {results.backendUrl}
                </div>
                <div>
                  <strong>Timestamp:</strong> {new Date(results.timestamp).toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resultados de Endpoints</CardTitle>
              <CardDescription>Pruebas realizadas en diferentes endpoints del backend</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.results.map((result: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{result.method}</Badge>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">{result.endpoint}</code>
                      </div>
                      {result.status && (
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          <Badge className={getStatusColor(result.status)}>
                            {result.status} {result.statusText}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {result.error && (
                      <div className="text-red-600 text-sm mt-2">
                        <strong>Error:</strong> {result.error}
                      </div>
                    )}

                    {result.bodyPreview && (
                      <div className="mt-2">
                        <strong className="text-sm">Respuesta (preview):</strong>
                        <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">{result.bodyPreview}</pre>
                      </div>
                    )}

                    {result.headers && Object.keys(result.headers).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-sm font-medium cursor-pointer">Headers de respuesta</summary>
                        <pre className="text-xs bg-gray-50 p-2 rounded mt-1">
                          {JSON.stringify(result.headers, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Preguntas para el Backend</AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-2 text-sm">
                <p>
                  <strong>Comparte estos resultados con el encargado del backend y pregunta:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>¿Cuál es el endpoint correcto para obtener las asignaciones de un usuario?</li>
                  <li>¿El endpoint soporta método GET o necesita POST?</li>
                  <li>¿Cuál es la estructura exacta del request body si es POST?</li>
                  <li>¿Hay algún endpoint para listar todas las asignaciones?</li>
                  <li>¿Los endpoints requieren algún header adicional?</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  )
}
