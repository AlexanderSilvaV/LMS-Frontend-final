"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Database, CheckCircle, AlertCircle, Users } from "lucide-react"

export default function DebugCourseUsersPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const testConnection = async () => {
    try {
      setLoading(true)
      setError("")
      setResult(null)

      const token = localStorage.getItem("token")
      if (!token) {
        setError("No authentication token found. Please login first.")
        return
      }

      console.log("🔍 Testing course-users API connection...")

      const response = await fetch("/api/debug/course-users", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
        console.log("✅ API test successful:", data)
      } else {
        setError(`API Error: ${data.message || data.error}`)
        setResult(data)
        console.error("❌ API test failed:", data)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setError(`Connection Error: ${errorMessage}`)
      console.error("❌ Connection test failed:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Users API Debug</h1>
          <p className="text-gray-600">Test the connection to the course-users backend API</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>API Connection Test</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testConnection} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Test Course Users API
                </>
              )}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {result && (
              <div className="space-y-4">
                {result.success ? (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      ✅ Successfully connected to backend API
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>❌ Backend API connection failed</AlertDescription>
                  </Alert>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">API Response Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Backend URL:</span>
                        <Badge variant="outline" className="font-mono text-xs">
                          {result.backendUrl}
                        </Badge>
                      </div>

                      {result.data && (
                        <div className="space-y-2">
                          <span className="text-sm font-medium">Response Data:</span>
                          <div className="bg-gray-100 p-3 rounded-md">
                            <pre className="text-xs overflow-x-auto">{JSON.stringify(result.data, null, 2)}</pre>
                          </div>

                          {result.data.exito && result.data.dato && (
                            <div className="flex items-center space-x-2 text-sm text-green-600">
                              <Users className="h-4 w-4" />
                              <span>
                                Found {Array.isArray(result.data.dato) ? result.data.dato.length : 1} course
                                assignment(s)
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {result.error && (
                        <div className="space-y-2">
                          <span className="text-sm font-medium text-red-600">Error Details:</span>
                          <div className="bg-red-50 p-3 rounded-md">
                            <pre className="text-xs text-red-800 overflow-x-auto">
                              {JSON.stringify(result, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Expected Database Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 space-y-2">
              <p>Based on your database screenshot, the system should have:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  <strong>Cursos table:</strong> Contains courses like "Química 1" (NRC: 12346)
                </li>
                <li>
                  <strong>CursoUsuarios table:</strong> Contains user-course assignments
                </li>
                <li>
                  <strong>AspNetUsers table:</strong> Contains user accounts
                </li>
              </ul>
              <p className="mt-3 text-blue-600">
                This debug tool tests if the API can fetch assignments for course NRC 12346 (Química 1).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
