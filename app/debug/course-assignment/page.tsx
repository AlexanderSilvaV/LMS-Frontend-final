"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function CourseAssignmentDebugPage() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [testData, setTestData] = useState({
    cursoId: "12346",
    usuarioId: "",
    rolEnCurso: "Estudiante",
  })

  const testAssignedCourses = async () => {
    try {
      setLoading(true)
      setError("")

      const token = localStorage.getItem("token")
      if (!token) {
        setError("No token found")
        return
      }

      console.log("Testing assigned courses endpoint...")

      const response = await fetch("/api/courses/assigned", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const responseText = await response.text()
      let responseData = null

      try {
        responseData = JSON.parse(responseText)
      } catch (e) {
        // Response is not JSON
      }

      setResults({
        type: "assigned-courses",
        status: response.status,
        statusText: response.statusText,
        responseText,
        responseData,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const testCourseAssignment = async () => {
    try {
      setLoading(true)
      setError("")

      const token = localStorage.getItem("token")
      if (!token) {
        setError("No token found")
        return
      }

      if (!testData.usuarioId) {
        setError("Please enter a user ID")
        return
      }

      console.log("Testing course assignment with data:", testData)

      const response = await fetch("/api/course-users", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      })

      const responseText = await response.text()
      let responseData = null

      try {
        responseData = JSON.parse(responseText)
      } catch (e) {
        // Response is not JSON
      }

      setResults({
        type: "course-assignment",
        status: response.status,
        statusText: response.statusText,
        responseText,
        responseData,
        testData,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Course Assignment Debug</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Assigned Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={testAssignedCourses} disabled={loading} className="w-full">
              {loading ? "Testing..." : "Test Get Assigned Courses"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Course Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cursoId">Course ID (NRC)</Label>
              <Input
                id="cursoId"
                value={testData.cursoId}
                onChange={(e) => setTestData({ ...testData, cursoId: e.target.value })}
                placeholder="12346"
              />
            </div>
            <div>
              <Label htmlFor="usuarioId">User ID</Label>
              <Input
                id="usuarioId"
                value={testData.usuarioId}
                onChange={(e) => setTestData({ ...testData, usuarioId: e.target.value })}
                placeholder="Enter user ID from database"
              />
            </div>
            <div>
              <Label htmlFor="rolEnCurso">Role</Label>
              <Select
                value={testData.rolEnCurso}
                onValueChange={(value) => setTestData({ ...testData, rolEnCurso: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Estudiante">Estudiante</SelectItem>
                  <SelectItem value="Docente">Docente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={testCourseAssignment} disabled={loading} className="w-full">
              {loading ? "Testing..." : "Test Course Assignment"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results - {results.type}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Status:</strong> {results.status} {results.statusText}
                </div>
                <div>
                  <strong>Time:</strong> {results.timestamp}
                </div>
              </div>

              {results.testData && (
                <div>
                  <strong>Test Data Sent:</strong>
                  <pre className="bg-gray-100 p-2 rounded text-sm mt-1">
                    {JSON.stringify(results.testData, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <strong>Response:</strong>
                <pre className="bg-gray-100 p-2 rounded text-sm mt-1 max-h-96 overflow-auto">
                  {results.responseData ? JSON.stringify(results.responseData, null, 2) : results.responseText}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
