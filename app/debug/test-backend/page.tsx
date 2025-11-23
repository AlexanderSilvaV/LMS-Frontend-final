"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function TestBackend() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testBackend = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/test/backend", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
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
          <CardTitle>Prueba de Conectividad Backend</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testBackend} disabled={loading}>
            {loading ? "Probando..." : "Probar Conexión"}
          </Button>
          
          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              <AlertDescription>
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
