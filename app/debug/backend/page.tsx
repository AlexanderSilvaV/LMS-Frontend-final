"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

export default function BackendDebugPage() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const testBackendEndpoints = async () => {
    try {
      setLoading(true)
      setError("")

      const token = localStorage.getItem("token")
      if (!token) {
        setError("No token found")
        return
      }

      const response = await fetch("/api/debug/backend-endpoints", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      setResults(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Backend Endpoints Debug</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Backend Connectivity</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={testBackendEndpoints} disabled={loading}>
            {loading ? "Testing..." : "Test Backend Endpoints"}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Backend Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <strong>Backend URL:</strong> {results.backendUrl}
              </div>
              <div>
                <strong>Test Time:</strong> {results.timestamp}
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Endpoint Results:</h3>
                {results.endpoints.map((endpoint: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <span className="font-mono text-sm">{endpoint.endpoint}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant={endpoint.exists ? "default" : "destructive"}>{endpoint.status}</Badge>
                      <Badge variant={endpoint.exists ? "default" : "secondary"}>
                        {endpoint.exists ? "EXISTS" : "NOT FOUND"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
