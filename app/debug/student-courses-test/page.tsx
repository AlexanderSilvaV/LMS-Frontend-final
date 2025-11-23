"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, BookOpen, User } from "lucide-react"
import { StudentCoursesService, type AssignedCourse } from "@/app/lib/student-courses-service"

export default function StudentCoursesTestPage() {
  const [courses, setCourses] = useState<AssignedCourse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<any>(null)

  const testCoursesEndpoint = async () => {
    setLoading(true)
    setError(null)
    setTestResult(null)

    try {
      console.log("🧪 Testing courses endpoint...")
      const result = await StudentCoursesService.getAssignedCourses()

      setTestResult({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      })

      if (result.operacionExitosa) {
        setCourses(result.dato)
      } else {
        setError(result.mensaje)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      setError(errorMessage)
      setTestResult({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  const testDirectFetch = async () => {
    setLoading(true)
    const token = localStorage.getItem("token")

    try {
      const response = await fetch("/api/courses/assigned", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      setTestResult({
        success: response.ok,
        status: response.status,
        data: data,
        timestamp: new Date().toISOString(),
        method: "Direct Fetch",
      })

      if (response.ok && data.operacionExitosa) {
        setCourses(data.dato)
        setError(null)
      } else {
        setError(data.mensaje || "Error en la respuesta")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      setError(errorMessage)
      setTestResult({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        method: "Direct Fetch",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Test: Cursos del Estudiante</h1>
        <p className="text-gray-600">Prueba el endpoint de cursos asignados para estudiantes</p>
      </div>

      <div className="grid gap-6">
        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Controles de Prueba</CardTitle>
            <CardDescription>Prueba diferentes métodos para obtener los cursos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={testCoursesEndpoint} disabled={loading}>
                {loading ? "Probando..." : "Probar con Servicio"}
              </Button>
              <Button onClick={testDirectFetch} disabled={loading} variant="outline">
                {loading ? "Probando..." : "Probar Fetch Directo"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        {testResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                Resultado de la Prueba
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <strong>Método:</strong> {testResult.method || "Service"}
                </div>
                <div>
                  <strong>Estado:</strong>{" "}
                  <Badge variant={testResult.success ? "default" : "destructive"}>
                    {testResult.success ? "Éxito" : "Error"}
                  </Badge>
                </div>
                {testResult.status && (
                  <div>
                    <strong>Status HTTP:</strong> {testResult.status}
                  </div>
                )}
                <div>
                  <strong>Timestamp:</strong> {testResult.timestamp}
                </div>
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer font-medium">Ver respuesta completa</summary>
                <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-60">
                  {JSON.stringify(testResult.data || testResult.error, null, 2)}
                </pre>
              </details>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Courses Display */}
        {courses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Cursos Asignados ({courses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {courses.map((course) => (
                  <div key={course.nrc} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{course.nombre}</h3>
                        <p className="text-sm text-gray-600 mt-1">{course.descripcion}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">NRC: {course.nrc}</Badge>
                          <Badge variant={course.activo ? "default" : "secondary"}>
                            {course.activo ? "Activo" : "Inactivo"}
                          </Badge>
                          {course.rolEnCurso && <Badge variant="outline">{course.rolEnCurso}</Badge>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Courses Message */}
        {!loading && !error && courses.length === 0 && testResult && (
          <Alert>
            <User className="h-4 w-4" />
            <AlertTitle>Sin Cursos</AlertTitle>
            <AlertDescription>No se encontraron cursos asignados para este estudiante.</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
