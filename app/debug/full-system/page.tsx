"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function FullSystemDebugPage() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState<string | null>(null)

  // Form states
  const [userId, setUserId] = useState("92e683d6-7d2e-4dee-bca3-010e4e67797c") // Nicolas Cheuque
  const [courseId, setCourseId] = useState("12346")
  const [role, setRole] = useState("Estudiante")
  const [moduleId, setModuleId] = useState("")
  const [materialName, setMaterialName] = useState("Material de Prueba")
  const [materialType, setMaterialType] = useState("Enlace")
  const [materialUrl, setMaterialUrl] = useState("https://example.com")

  const testFunction = async (testName: string, testFn: () => Promise<any>) => {
    setLoading(testName)
    try {
      const result = await testFn()
      setResults((prev: any) => ({ ...prev, [testName]: result }))
    } catch (error) {
      setResults((prev: any) => ({ ...prev, [testName]: { error: (error as Error).message } }))
    } finally {
      setLoading(null)
    }
  }

  const testAssignedCourses = async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No token found")
    }

    console.log("🔍 Testing assigned courses...")
    const response = await fetch("/api/courses/assigned", {
      method: "GET", // Explicitly specify GET
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    console.log("📡 Response status:", response.status)

    const data = await response.json()
    console.log("📊 Response data:", data)

    return {
      status: response.status,
      data: data,
      success: response.ok,
    }
  }

  const testCourseAssignment = async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No token found")
    }

    console.log("🔍 Testing course assignment with data:", {
      usuarioId: userId,
      cursoId: Number.parseInt(courseId),
      rolEnCurso: role,
    })

    const response = await fetch("/api/course-users", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        usuarioId: userId,
        cursoId: Number.parseInt(courseId),
        rolEnCurso: role,
      }),
    })

    console.log("📡 Response status:", response.status)

    const data = await response.json()
    console.log("📊 Response data:", data)

    return {
      status: response.status,
      data: data,
      success: response.ok,
    }
  }

  const testMaterials = async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No token found")
    }

    console.log("🔍 Testing materials...")

    // If we have a module ID, use the specific endpoint
    const url = moduleId ? `/api/materials/modulo/${moduleId}` : "/api/materials"
    console.log("🔗 Using URL:", url)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    console.log("📡 Response status:", response.status)

    const data = await response.json()
    console.log("📊 Response data:", data)

    return {
      status: response.status,
      data: data,
      success: response.ok,
    }
  }

  const testCreateMaterial = async () => {
    if (!moduleId) {
      throw new Error("Module ID is required for creating materials")
    }

    const token = localStorage.getItem("token")
    const response = await fetch("/api/materials", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nombre: materialName,
        tipo: materialType,
        contenido: materialUrl,
        moduloId: Number.parseInt(moduleId),
      }),
    })

    const data = await response.json()
    return {
      status: response.status,
      data: data,
    }
  }

  const testCourseUsers = async () => {
    const token = localStorage.getItem("token")
    const response = await fetch(`/api/course-users/course/${courseId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()
    return {
      status: response.status,
      data: data,
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Sistema LMS - Debug Completo</h1>

      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="courses">Cursos</TabsTrigger>
          <TabsTrigger value="assignments">Asignaciones</TabsTrigger>
          <TabsTrigger value="materials">Materiales</TabsTrigger>
          <TabsTrigger value="results">Resultados</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pruebas de Cursos</CardTitle>
              <CardDescription>Probar la funcionalidad de cursos asignados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => testFunction("assignedCourses", testAssignedCourses)}
                disabled={loading === "assignedCourses"}
                className="w-full"
              >
                {loading === "assignedCourses" ? "Probando..." : "Probar Cursos Asignados"}
              </Button>

              <Button
                onClick={() => testFunction("courseUsers", testCourseUsers)}
                disabled={loading === "courseUsers"}
                className="w-full"
              >
                {loading === "courseUsers" ? "Probando..." : `Probar Usuarios del Curso ${courseId}`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pruebas de Asignaciones</CardTitle>
              <CardDescription>Probar la asignación de usuarios a cursos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="userId">User ID</Label>
                  <Input id="userId" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="User ID" />
                </div>
                <div>
                  <Label htmlFor="courseId">Course ID</Label>
                  <Input
                    id="courseId"
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    placeholder="Course ID"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="role">Rol</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Estudiante">Estudiante</SelectItem>
                    <SelectItem value="Docente">Docente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => testFunction("courseAssignment", testCourseAssignment)}
                disabled={loading === "courseAssignment"}
                className="w-full"
              >
                {loading === "courseAssignment" ? "Asignando..." : "Probar Asignación de Curso"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pruebas de Materiales</CardTitle>
              <CardDescription>Probar la gestión de materiales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="moduleId">Module ID (opcional para listar)</Label>
                <Input
                  id="moduleId"
                  value={moduleId}
                  onChange={(e) => setModuleId(e.target.value)}
                  placeholder="Module ID"
                />
              </div>

              <Button
                onClick={() => testFunction("materials", testMaterials)}
                disabled={loading === "materials"}
                className="w-full"
              >
                {loading === "materials" ? "Probando..." : "Probar Listar Materiales"}
              </Button>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Crear Material</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="materialName">Nombre</Label>
                    <Input
                      id="materialName"
                      value={materialName}
                      onChange={(e) => setMaterialName(e.target.value)}
                      placeholder="Nombre del material"
                    />
                  </div>
                  <div>
                    <Label htmlFor="materialType">Tipo</Label>
                    <Select value={materialType} onValueChange={setMaterialType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Enlace">Enlace</SelectItem>
                        <SelectItem value="Archivo">Archivo</SelectItem>
                        <SelectItem value="Video">Video</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-2">
                  <Label htmlFor="materialUrl">URL/Contenido</Label>
                  <Input
                    id="materialUrl"
                    value={materialUrl}
                    onChange={(e) => setMaterialUrl(e.target.value)}
                    placeholder="URL del material"
                  />
                </div>

                <Button
                  onClick={() => testFunction("createMaterial", testCreateMaterial)}
                  disabled={loading === "createMaterial" || !moduleId}
                  className="w-full mt-4"
                >
                  {loading === "createMaterial" ? "Creando..." : "Probar Crear Material"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resultados de las Pruebas</CardTitle>
              <CardDescription>Resultados detallados de todas las pruebas</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(results).length === 0 ? (
                <p className="text-gray-500">No hay resultados aún. Ejecuta algunas pruebas.</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(results).map(([testName, result]: [string, any]) => (
                    <div key={testName} className="border rounded p-4">
                      <h4 className="font-medium mb-2">{testName}</h4>
                      {result.error ? (
                        <Alert variant="destructive">
                          <AlertDescription>{result.error}</AlertDescription>
                        </Alert>
                      ) : (
                        <div>
                          <p className={`text-sm mb-2 ${result.status === 200 ? "text-green-600" : "text-red-600"}`}>
                            Status: {result.status}
                          </p>
                          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-60">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
