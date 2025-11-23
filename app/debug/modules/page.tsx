"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface TestResult {
  endpoint: string
  description: string
  status: number | null
  statusText: string | null
  success: boolean
  headers: Record<string, string>
  data: any
  error: string | null
}

interface DebugResults {
  timestamp: string
  backendUrl: string
  tests: TestResult[]
}

export default function ModulesDebugPage() {
  const [results, setResults] = useState<DebugResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runTests = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/debug/modules")
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (test: TestResult) => {
    if (test.error) {
      return <Badge variant="destructive">ERROR</Badge>
    }
    if (test.success) {
      return <Badge variant="default">✅ {test.status}</Badge>
    }
    if (test.status === 401) {
      return <Badge variant="secondary">🔒 {test.status}</Badge>
    }
    if (test.status === 404) {
      return <Badge variant="outline">❓ {test.status}</Badge>
    }
    if (test.status === 405) {
      return <Badge variant="destructive">🚫 {test.status}</Badge>
    }
    return <Badge variant="destructive">❌ {test.status}</Badge>
  }

  const getStatusIcon = (test: TestResult) => {
    if (test.error) return <XCircle className="h-4 w-4 text-red-500" />
    if (test.success) return <CheckCircle2 className="h-4 w-4 text-green-500" />
    return <AlertCircle className="h-4 w-4 text-yellow-500" />
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Debug de Módulos</h1>
          <p className="text-muted-foreground">Prueba todos los endpoints de módulos del backend</p>
        </div>
        <Button onClick={runTests} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Ejecutando..." : "Ejecutar Pruebas"}
        </Button>
      </div>

      {error && (
        <Alert className="mb-6 bg-red-50 text-red-800 border-red-200">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {results && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información de Conexión</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong>Backend URL:</strong>
                  <p className="font-mono text-sm bg-muted p-2 rounded mt-1">{results.backendUrl}</p>
                </div>
                <div>
                  <strong>Timestamp:</strong>
                  <p className="font-mono text-sm bg-muted p-2 rounded mt-1">{results.timestamp}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {results.tests.map((test, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getStatusIcon(test)}
                        <code className="text-sm">{test.endpoint}</code>
                      </CardTitle>
                      <CardDescription>{test.description}</CardDescription>
                    </div>
                    {getStatusBadge(test)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {test.error && (
                      <Alert className="bg-red-50 text-red-800 border-red-200">
                        <XCircle className="h-4 w-4" />
                        <AlertTitle>Error de Conexión</AlertTitle>
                        <AlertDescription>{test.error}</AlertDescription>
                      </Alert>
                    )}

                    {test.status && (
                      <div>
                        <strong>Status:</strong> {test.status} {test.statusText}
                      </div>
                    )}

                    {test.data && (
                      <div>
                        <strong>Respuesta:</strong>
                        <pre className="bg-muted p-3 rounded text-xs overflow-auto mt-2">
                          {JSON.stringify(test.data, null, 2)}
                        </pre>
                      </div>
                    )}

                    {Object.keys(test.headers).length > 0 && (
                      <details>
                        <summary className="cursor-pointer font-medium">Headers de Respuesta</summary>
                        <pre className="bg-muted p-3 rounded text-xs overflow-auto mt-2">
                          {JSON.stringify(test.headers, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resumen de Resultados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {results.tests.filter((t) => t.success).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Exitosos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {results.tests.filter((t) => t.status === 405).length}
                  </div>
                  <div className="text-sm text-muted-foreground">405 (No Permitido)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {results.tests.filter((t) => t.status === 404).length}
                  </div>
                  <div className="text-sm text-muted-foreground">404 (No Encontrado)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{results.tests.filter((t) => t.error).length}</div>
                  <div className="text-sm text-muted-foreground">Errores de Conexión</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!results && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Ejecutar Pruebas de Debug</h3>
            <p className="text-muted-foreground mb-4">
              Haz clic en "Ejecutar Pruebas" para probar todos los endpoints de módulos
            </p>
            <Button onClick={runTests}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Ejecutar Pruebas
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
