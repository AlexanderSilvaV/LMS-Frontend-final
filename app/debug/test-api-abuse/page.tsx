"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function TestAPIAbuse() {
  const [endpoint, setEndpoint] = useState('/api/estudiante/evaluaciones/1/iniciar')
  const [method, setMethod] = useState('POST')
  const [count, setCount] = useState(20)
  const [delay, setDelay] = useState(200)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testAPIAbuse = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/debug/test-api-abuse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ endpoint, method, count, delay })
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Prueba de API Abuse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="endpoint">Endpoint</Label>
            <Input
              id="endpoint"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="/api/endpoint"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="method">Método HTTP</Label>
              <Input
                id="method"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                placeholder="GET, POST, etc."
              />
            </div>
            <div>
              <Label htmlFor="count">Número de Requests</Label>
              <Input
                id="count"
                type="number"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
                min="1"
                max="100"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="delay">Delay entre requests (ms)</Label>
            <Input
              id="delay"
              type="number"
              value={delay}
              onChange={(e) => setDelay(parseInt(e.target.value))}
              min="0"
              max="5000"
            />
          </div>

          <Button onClick={testAPIAbuse} disabled={loading}>
            {loading ? "Probando..." : "Probar API Abuse"}
          </Button>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">{result.message}</p>
                  {result.results && (
                    <div className="text-sm">
                      <p>Total: {result.results.totalRequests}</p>
                      <p>Éxitos: {result.results.successCount}</p>
                      <p>Errores: {result.results.errorCount}</p>
                      <p>Tasa de éxito: {result.results.successRate.toFixed(1)}%</p>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}