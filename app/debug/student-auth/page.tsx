"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, User, Clock, Shield } from "lucide-react"

export default function StudentAuthDebugPage() {
  const [tokenInfo, setTokenInfo] = useState<any>(null)
  const [authTest, setAuthTest] = useState<any>(null)
  const [coursesTest, setCoursesTest] = useState<any>(null)
  const [directBackendTest, setDirectBackendTest] = useState<any>(null)
  const [alternativeTest, setAlternativeTest] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkToken()
  }, [])

  const checkToken = () => {
    const token = localStorage.getItem("token")

    if (!token) {
      setTokenInfo({ error: "No token found" })
      return
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]))
      const now = Date.now() / 1000

      setTokenInfo({
        token: token.substring(0, 50) + "...",
        userId: payload.sub || payload.nameid || payload.id,
        email: payload.email,
        role: payload.role || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
        exp: payload.exp,
        iat: payload.iat,
        isExpired: payload.exp < now,
        timeToExpiry: payload.exp - now,
        fullPayload: payload,
      })
    } catch (error) {
      setTokenInfo({ error: "Invalid token format" })
    }
  }

  const testAuth = async () => {
    setLoading(true)
    const token = localStorage.getItem("token")

    try {
      const { backendService } = await import("@/app/lib/backend-service")
      try {
        const tok = token || ""
        const data = await backendService.getProfile(tok)
        setAuthTest({
          status: 200,
          ok: true,
          data: data,
          timestamp: new Date().toISOString(),
        })
      } catch (err) {
        setAuthTest({
          status: 500,
          ok: false,
          error: err instanceof Error ? err.message : String(err),
          timestamp: new Date().toISOString(),
        })
      }
    } catch (error) {
      setAuthTest({
        status: 0,
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  const testCourses = async () => {
    setLoading(true)
    const token = localStorage.getItem("token")

    try {
      try {
        const { backendService } = await import("@/app/lib/backend-service")
        const tok = token || ""
        const data = await backendService.getAssignedCourses(tok)
        setCoursesTest({ status: 200, ok: true, data: data, timestamp: new Date().toISOString() })
      } catch (err) {
        setCoursesTest({ status: 500, ok: false, error: err instanceof Error ? err.message : String(err), timestamp: new Date().toISOString() })
      }
    } catch (error) {
      setCoursesTest({
        status: 0,
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  const testDirectBackend = async () => {
    setLoading(true)
    const token = localStorage.getItem("token")
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"

    try {
      const response = await fetch(`${apiUrl}/api/cursos/asignados`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      setDirectBackendTest({
        status: response.status,
        ok: response.ok,
        data: data,
        timestamp: new Date().toISOString(),
        url: `${apiUrl}/api/cursos/asignados`,
      })
    } catch (error) {
      setDirectBackendTest({
        status: 0,
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        url: `${apiUrl}/api/cursos/asignados`,
      })
    } finally {
      setLoading(false)
    }
  }

  const testAlternative = async () => {
    setLoading(true)
    const token = localStorage.getItem("token")

    try {
      const userId = tokenInfo?.userId
      if (!userId) {
        throw new Error("No user ID found in token")
      }

      const response = await fetch(`/api/course-users/user/${userId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      setAlternativeTest({
        status: response.status,
        ok: response.ok,
        data: data,
        timestamp: new Date().toISOString(),
        userId: userId,
      })
    } catch (error) {
      setAlternativeTest({
        status: 0,
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Debug: Autenticación de Estudiante</h1>
        <p className="text-gray-600">Herramienta para diagnosticar problemas de autenticación</p>
      </div>

      <Tabs defaultValue="token" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="token">Token</TabsTrigger>
          <TabsTrigger value="auth">Auth</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="direct">Direct</TabsTrigger>
          <TabsTrigger value="alternative">Alternative</TabsTrigger>
        </TabsList>

        <TabsContent value="token" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Información del Token
              </CardTitle>
              <CardDescription>Detalles del token de autenticación almacenado</CardDescription>
            </CardHeader>
            <CardContent>
              {tokenInfo ? (
                tokenInfo.error ? (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{tokenInfo.error}</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">Usuario ID:</span>
                          <span className="text-sm font-mono">{tokenInfo.userId}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Email:</span>
                          <span className="text-sm">{tokenInfo.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Rol:</span>
                          <Badge variant="outline">{tokenInfo.role}</Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">Estado:</span>
                          {tokenInfo.isExpired ? (
                            <Badge variant="destructive">Expirado</Badge>
                          ) : (
                            <Badge variant="default">Válido</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Tiempo restante:</span>
                          <span className="text-sm">
                            {tokenInfo.isExpired ? "Expirado" : `${Math.floor(tokenInfo.timeToExpiry / 60)} minutos`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <details className="mt-4">
                      <summary className="cursor-pointer font-medium">Ver payload completo</summary>
                      <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
                        {JSON.stringify(tokenInfo.fullPayload, null, 2)}
                      </pre>
                    </details>
                  </div>
                )
              ) : (
                <div>Cargando información del token...</div>
              )}

              <div className="mt-4">
                <Button onClick={checkToken} variant="outline">
                  Actualizar Token Info
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test de Autenticación</CardTitle>
              <CardDescription>Prueba el endpoint de perfil de usuario</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={testAuth} disabled={loading}>
                  {loading ? "Probando..." : "Probar Autenticación"}
                </Button>

                {authTest && (
                  <Alert className={authTest.ok ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    {authTest.ok ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertTitle>
                      Status: {authTest.status} - {authTest.ok ? "Éxito" : "Error"}
                    </AlertTitle>
                    <AlertDescription>
                      <div className="mt-2">
                        <strong>Timestamp:</strong> {authTest.timestamp}
                      </div>
                      <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(authTest.data || authTest.error, null, 2)}
                      </pre>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test de Cursos Asignados (Frontend API)</CardTitle>
              <CardDescription>Prueba el endpoint del frontend que obtiene los cursos del estudiante</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={testCourses} disabled={loading}>
                  {loading ? "Probando..." : "Probar Cursos Asignados"}
                </Button>

                {coursesTest && (
                  <Alert className={coursesTest.ok ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    {coursesTest.ok ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertTitle>
                      Status: {coursesTest.status} - {coursesTest.ok ? "Éxito" : "Error"}
                    </AlertTitle>
                    <AlertDescription>
                      <div className="mt-2">
                        <strong>Endpoint:</strong> /api/courses/assigned
                      </div>
                      <div className="mt-1">
                        <strong>Timestamp:</strong> {coursesTest.timestamp}
                      </div>
                      <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(coursesTest.data || coursesTest.error, null, 2)}
                      </pre>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="direct" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Directo al Backend</CardTitle>
              <CardDescription>Prueba directa al endpoint del backend C#</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={testDirectBackend} disabled={loading}>
                  {loading ? "Probando..." : "Probar Backend Directo"}
                </Button>

                {directBackendTest && (
                  <Alert className={directBackendTest.ok ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    {directBackendTest.ok ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertTitle>
                      Status: {directBackendTest.status} - {directBackendTest.ok ? "Éxito" : "Error"}
                    </AlertTitle>
                    <AlertDescription>
                      <div className="mt-2">
                        <strong>URL:</strong> {directBackendTest.url}
                      </div>
                      <div className="mt-1">
                        <strong>Timestamp:</strong> {directBackendTest.timestamp}
                      </div>
                      <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(directBackendTest.data || directBackendTest.error, null, 2)}
                      </pre>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alternative" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Método Alternativo</CardTitle>
              <CardDescription>Prueba usando el endpoint de asignaciones por usuario</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={testAlternative} disabled={loading || !tokenInfo?.userId}>
                  {loading ? "Probando..." : "Probar Método Alternativo"}
                </Button>

                {alternativeTest && (
                  <Alert className={alternativeTest.ok ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    {alternativeTest.ok ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertTitle>
                      Status: {alternativeTest.status} - {alternativeTest.ok ? "Éxito" : "Error"}
                    </AlertTitle>
                    <AlertDescription>
                      <div className="mt-2">
                        <strong>User ID:</strong> {alternativeTest.userId}
                      </div>
                      <div className="mt-1">
                        <strong>Timestamp:</strong> {alternativeTest.timestamp}
                      </div>
                      <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(alternativeTest.data || alternativeTest.error, null, 2)}
                      </pre>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
