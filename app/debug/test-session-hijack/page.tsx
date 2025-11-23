"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function TestSessionHijack() {
  const [stolenToken, setStolenToken] = useState('')
  const [endpoint, setEndpoint] = useState('/api/estudiante/evaluaciones')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testSessionHijack = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug/test-session-hijack", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ stolenToken, endpoint })
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

  const getCurrentToken = () => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token')
    if (token) {
      setStolenToken(token)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Prueba de Session Hijacking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="endpoint">Endpoint a acceder</Label>
            <input
              id="endpoint"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="/api/endpoint"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <Label htmlFor="token">Token Robado</Label>
            <Textarea
              id="token"
              value={stolenToken}
              onChange={(e) => setStolenToken(e.target.value)}
              placeholder="Pega aquí el token JWT robado..."
              rows={4}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={getCurrentToken}
              className="mt-2"
            >
              Usar Token Actual (para testing)
            </Button>
          </div>

          <Button onClick={testSessionHijack} disabled={loading || !stolenToken}>
            {loading ? "Probando..." : "Probar Session Hijacking"}
          </Button>

          {result && (
            <Alert variant={result.hijackResult?.tokenValid ? "destructive" : "default"}>
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">{result.message}</p>
                  {result.hijackResult && (
                    <div className="text-sm">
                      <p>Status: {result.hijackResult.status}</p>
                      <p>Token válido: {result.hijackResult.tokenValid ? 'Sí' : 'No'}</p>
                      {result.hijackResult.tokenValid && (
                        <p className="text-red-600 font-medium">
                          ⚠️ VULNERABILIDAD: El token robado funciona!
                        </p>
                      )}
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