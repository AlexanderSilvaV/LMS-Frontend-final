"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle, User, BookOpen, Key, RefreshCw } from "lucide-react"

interface UserType {
  id: string
  userName: string
  email: string
  nombre: string
  apellido: string
  rol: string
}

interface Course {
  nrc: number
  nombre: string
  descripcion: string
  activo: boolean
}

export default function CourseAssignmentAuthPage() {
  const [users, setUsers] = useState<UserType[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedUser, setSelectedUser] = useState("")
  const [selectedCourse, setSelectedCourse] = useState("")
  const [selectedRole, setSelectedRole] = useState("Alumno")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")
  const [token, setToken] = useState("")
  const [authStatus, setAuthStatus] = useState<"unknown" | "valid" | "invalid">("unknown")

  useEffect(() => {
    // Check for token in localStorage
    const storedToken = localStorage.getItem("token")
    if (storedToken) {
      setToken(storedToken)
      validateToken(storedToken)
    }

    fetchData()
  }, [])

  const validateToken = async (tokenToValidate: string) => {
    try {
      const { backendService } = await import("@/app/lib/backend-service")
      await backendService.getProfile(tokenToValidate)
      setAuthStatus("valid")
    } catch (error) {
      setAuthStatus("invalid")
    }
  }

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("No hay token de autenticación. Por favor, inicia sesión.")
        return
      }

      // Fetch users and courses
      const { backendService } = await import("@/app/lib/backend-service")
      const tokenValue = token || ""
      const usersData = await backendService.getUsers({ paginaActual: 1, cantidadPorPagina: 100 }, tokenValue)
      if (usersData && (usersData.usuarios || usersData.Usuarios)) {
        setUsers(usersData.usuarios || [])
      }
      const coursesData = await backendService.getCourses({ paginaActual: 1, cantidadPorPagina: 100 }, tokenValue)
      if (coursesData && (coursesData.cursos || coursesData.cursos)) {
        setCourses(coursesData.cursos || [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Error al cargar datos")
    }
  }

  const handleAssignUser = async () => {
    if (!selectedUser || !selectedCourse || !selectedRole) {
      setError("Debe seleccionar un usuario, un curso y un rol")
      return
    }

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("No hay token de autenticación")
        return
      }

      console.log("🔄 Assigning user with data:", {
        usuarioId: selectedUser,
        cursoId: Number.parseInt(selectedCourse),
        rolEnCurso: selectedRole,
      })

      const response = await fetch("/api/course-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          usuarioId: selectedUser,
          cursoId: Number.parseInt(selectedCourse),
          rolEnCurso: selectedRole,
        }),
      })

      console.log("📡 Response status:", response.status)

      const responseText = await response.text()
      console.log("📄 Response text:", responseText)

      let data: any = {}
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        data = { mensaje: responseText }
      }

      setResult({
        status: response.status,
        ok: response.ok,
        data: data,
        headers: Object.fromEntries(response.headers.entries()),
      })

      if (response.ok) {
        // Reset form on success
        setSelectedUser("")
        setSelectedCourse("")
        setSelectedRole("Alumno")
      } else {
        setError(data.mensaje || `Error ${response.status}`)
      }
    } catch (error) {
      console.error("❌ Error assigning user:", error)
      setError(`Error de conexión: ${error instanceof Error ? error.message : "Error desconocido"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Debug: Asignación de Usuarios a Cursos</h1>
        <p className="text-gray-600">Prueba la funcionalidad de asignación con autenticación</p>
      </div>

      {/* Auth Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Estado de Autenticación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge
              variant={authStatus === "valid" ? "default" : authStatus === "invalid" ? "destructive" : "secondary"}
            >
              {authStatus === "valid"
                ? "✅ Token Válido"
                : authStatus === "invalid"
                  ? "❌ Token Inválido"
                  : "⏳ Verificando"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const currentToken = localStorage.getItem("token")
                if (currentToken) {
                  validateToken(currentToken)
                }
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Verificar Token
            </Button>
          </div>
          {token && <div className="mt-2 text-sm text-gray-600">Token: {token.substring(0, 20)}...</div>}
        </CardContent>
      </Card>

      <Tabs defaultValue="assign" className="space-y-6">
        <TabsList>
          <TabsTrigger value="assign">Asignar Usuario</TabsTrigger>
          <TabsTrigger value="data">Datos Cargados</TabsTrigger>
          <TabsTrigger value="result">Resultado</TabsTrigger>
        </TabsList>

        <TabsContent value="assign">
          <Card>
            <CardHeader>
              <CardTitle>Asignar Usuario a Curso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="user-select">Usuario</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar usuario" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>
                              {user.nombre} {user.apellido} ({user.rol})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="course-select">Curso</Label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.nrc} value={course.nrc.toString()}>
                          <div className="flex items-center space-x-2">
                            <BookOpen className="h-4 w-4" />
                            <span>
                              {course.nombre} (NRC: {course.nrc})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="role-select">Rol en Curso</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Alumno">Alumno</SelectItem>
                      <SelectItem value="Docente">Docente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleAssignUser} disabled={loading} className="w-full">
                {loading ? "Asignando..." : "Asignar Usuario"}
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Usuarios Cargados ({users.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium">
                          {user.nombre} {user.apellido}
                        </div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </div>
                      <Badge variant="outline">{user.rol}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cursos Cargados ({courses.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {courses.map((course) => (
                    <div key={course.nrc} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium">{course.nombre}</div>
                        <div className="text-sm text-gray-600">NRC: {course.nrc}</div>
                      </div>
                      <Badge variant={course.activo ? "default" : "secondary"}>
                        {course.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="result">
          <Card>
            <CardHeader>
              <CardTitle>Resultado de la Última Operación</CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {result.ok ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <Badge variant={result.ok ? "default" : "destructive"}>Status: {result.status}</Badge>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Respuesta:</h4>
                    <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Headers:</h4>
                    <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                      {JSON.stringify(result.headers, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">No hay resultados aún. Realiza una asignación para ver los resultados.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
