"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  BookOpen,
  FileText,
  FlaskConical,
  Users,
  Clock,
  ArrowLeft,
  ArrowUpRight,
  AlertCircle,
  TrendingUp,
} from "lucide-react"
import { backendService } from "@/app/lib/backend-service"

interface Course {
  nrc: number
  nombre: string
  descripcion: string
  activo: boolean
  progreso?: number
}

interface Module {
  id: number
  nombre: string
  descripcion: string
  orden: number
  materiales: Material[]
}

interface Material {
  id: number
  nombre: string
  descripcion: string
  tipoArchivo: string
  fechaCreacion: string
}

export default function StudentCoursePage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string

  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userRole = localStorage.getItem("userRole")

    if (!token) {
      router.push("/")
      return
    }

    if (userRole !== "Alumno") {
      router.push("/")
      return
    }

    if (courseId) {
      loadCourseData()
    }
  }, [router, courseId])

  const loadCourseData = async () => {
    try {
      setLoading(true)
      setError("")

      const token = localStorage.getItem("token")

      // Load course details
      const courseResponse = await fetch(`/api/courses/${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (courseResponse.ok) {
        const courseData = await courseResponse.json()
        const rawCourse = courseData.dato || courseData
        setCourse({
          ...rawCourse,
          // Ensure activo is boolean and set sensible defaults
          activo: rawCourse.activo !== undefined ? rawCourse.activo : true,
          progreso: Math.floor(Math.random() * 100), // Mock progress
        })

        // Load modules for this course
          // Try the student-friendly proxy first (por-curso). Fall back to course if needed.
          const modulesResponse = await fetch(`/api/modules/por-curso/${courseId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

          if (modulesResponse.ok) {
            const modulesData = await modulesResponse.json()

            // Accept either an array or a wrapped object { dato: [...] }
            const modulesArray = Array.isArray(modulesData)
              ? modulesData
              : modulesData?.dato || modulesData?.modulos || []

            const modulesWithMaterials = await Promise.all(
              modulesArray.map(async (module: any, idx: number) => {
                // Normalize module id field (backend may use id or moduloId)
                const moduleId = module.id || module.moduloId || module.ModuloId || module.ModuloID

                // Load materials for each module using a tolerant approach
                const materialsResponse = await fetch(`/api/materials/modulo/${moduleId}`, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                })

                let materials: any[] = []
                if (materialsResponse.ok) {
                  const materialsData = await materialsResponse.json()

                  // materials proxy may return an array directly or an object wrapper
                  const matsArray = Array.isArray(materialsData)
                    ? materialsData
                    : materialsData?.dato || materialsData?.materials || materialsData?.materiales || []

                  // Normalize material fields to match the Material interface used by this page
                  materials = matsArray.map((mat: any) => ({
                    id: mat.id || mat.materialId || mat.MaterialId || mat.materialId,
                    nombre: mat.nombre || mat.Nombre || mat.name || "Sin nombre",
                    descripcion: mat.descripcion || mat.Descripcion || mat.descripcion || "",
                    tipoArchivo: (
                      mat.tipoArchivo || mat.tipo || mat.Tipo ||
                      // try to infer from ruta if present
                      (mat.ruta ? mat.ruta.split('.').pop() : undefined) || "archivo"
                    ),
                    fechaCreacion: mat.fechaCreacion || mat.FechaCreacion || mat.fecha || new Date().toISOString(),
                    // include ruta/contenido so download/preview logic can use them without extra backend calls
                    ruta: mat.ruta || mat.Ruta || mat.url || mat.link,
                    contenido: mat.contenido || mat.Contenido,
                  }))
                }

                return {
                  // ensure module has an id field and materiales array
                  id: module.id || module.moduloId || module.ModuloId || module.ModuloID,
                  nombre: module.nombre || module.Nombre || module.title || "Sin título",
                  descripcion: module.descripcion || module.Descripcion || module.description || "",
                  // Fallback to provided orden, or Orden, or use index+1 when not provided
                  orden: module.orden || module.Orden || (idx + 1),
                  materiales: materials,
                }
              }),
            )

            setModules(modulesWithMaterials)
          }
      } else {
        setError("Error al cargar el curso")
      }
    } catch (error) {
      console.error("Error loading course data:", error)
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const handleMaterialClick = async (material: Material) => {
    try {
      const token = localStorage.getItem("token")
      const { action, url } = backendService.getMaterialAction(material)

      console.log("[MATERIAL-CLICK] action, url, hasToken:", action, url, !!token)

      if (!url) {
        setError("URL de material no disponible")
        return
      }

      if (action === "redirect" || action === "open") {
        window.open(url, "_blank")
        return
      }

      // action === 'download'
      // Check if this is our download endpoint that returns a fresh signed URL
      const isDownloadEndpoint = url.includes("/download")
      const fetchUrl = url.startsWith("/") ? url : url

      const response = await fetch(fetchUrl, {
        headers: fetchUrl.startsWith("/")
          ? {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            }
          : {},
      })

      if (!response.ok) {
        if (response.status === 401) {
          setError("No autorizado para descargar/visualizar este material (401). Por favor inicia sesión de nuevo.")
        } else {
          const text = await response.text().catch(() => null)
          setError(`Error al obtener el material (${response.status})${text ? `: ${text}` : ""}`)
        }
        return
      }

      // If this is the download endpoint, it returns JSON with the fresh signed URL
      if (isDownloadEndpoint && fetchUrl.includes("/api/materials/")) {
        const data = await response.json()
        if (data.url) {
          // Open the fresh signed URL directly
          window.open(data.url, "_blank")
          return
        }
      }

      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)

      if (blob.type === "application/pdf" || material.tipoArchivo.toLowerCase() === "pdf") {
        window.open(blobUrl, "_blank")
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000)
        return
      }

      const a = document.createElement("a")
      a.style.display = "none"
      a.href = blobUrl
      a.download = material.nombre || "download"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(blobUrl)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error handling material action:", error)
      setError("Error al procesar el material")
    }
  }

  const getFileTypeColor = (tipoArchivo: string) => {
    switch (tipoArchivo.toLowerCase()) {
      case "pdf":
        return "bg-red-100 text-red-800 border-red-200"
      case "doc":
      case "docx":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "ppt":
      case "pptx":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar role="student" />
        <div className="flex-1 lg:ml-64">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar role="student" />
        <div className="flex-1 lg:ml-64">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400">Curso no encontrado</p>
              <Button onClick={() => router.push("/student/courses")} className="mt-4">
                Volver a Mis Cursos
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar role="student" />

      <div className="flex-1 lg:ml-64 overflow-y-auto">
        <main className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="outline" size="sm" onClick={() => router.push("/student/courses")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{course.nombre}</h1>
                <p className="text-gray-600 dark:text-gray-400">{course.descripcion}</p>
              </div>
              <Badge variant={course.activo ? "default" : "secondary"} className="text-sm">
                {course.activo ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          </div>

          {/* Error Messages */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Course Progress removed per request */}

          {/* Course Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Módulos</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{modules.length}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-unab-navy dark:text-unab-navy-light" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Materiales</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {modules.reduce((total, module) => total + module.materiales.length, 0)}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            {/* Laboratorios removed from course view for students */}
          </div>

          {/* Course Modules */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Contenido del Curso</h2>

            {modules.length > 0 ? (
              modules.map((module) => (
                <Card key={module.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-unab-navy dark:text-unab-navy-light flex-shrink-0" />
                          <span className="truncate">{module.nombre}</span>
                        </CardTitle>
                        <CardDescription className="text-unab-gray-600 dark:text-white line-clamp-2">{module.descripcion}</CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Módulo {module.orden}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {module.materiales.length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          Materiales ({module.materiales.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {module.materiales.map((material) => (
                            <div
                              key={material.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-sm truncate">{material.nombre}</p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Badge variant="outline" className={getFileTypeColor(material.tipoArchivo)}>
                                      {material.tipoArchivo.toUpperCase()}
                                    </Badge>
                                    <span className="text-xs text-gray-500">
                                      {new Date(material.fechaCreacion).toLocaleDateString("es-ES")}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Button size="sm" variant="outline" onClick={() => handleMaterialClick(material)}>
                                <ArrowUpRight className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">No hay materiales disponibles en este módulo</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No hay módulos disponibles
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Este curso aún no tiene módulos de contenido configurados
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick Actions removed per request */}
        </main>
      </div>
    </div>
  )
}
