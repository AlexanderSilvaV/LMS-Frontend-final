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
  Settings,
  ArrowLeft,
  Plus,
  Edit,
  AlertCircle,
  Eye,
} from "lucide-react"
import { backendService } from "@/app/lib/backend-service"

interface Course {
  nrc: number
  nombre: string
  descripcion: string
  activo: boolean
  estudiantesInscritos?: number
}

interface Module {
  id: number | string
  nombre: string
  descripcion: string
  orden: number
  materiales?: any[]
  materialesCount?: number
}

interface Student {
  id: string
  nombre: string
  correo: string
  fechaInscripcion: string
  rut?: string | null
}

export default function TeacherCoursePage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string

  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userRole = localStorage.getItem("userRole")

    if (!token) {
      router.push("/")
      return
    }

    if (userRole !== "Docente") {
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
  setCourse(Array.isArray(courseData) ? courseData[0] : courseData?.dato || courseData)

        // Load modules for this course
        const modulesResponse = await fetch(`/api/modules/course/${courseId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (modulesResponse.ok) {
          const modulesData = await modulesResponse.json()
          const modulesArray = Array.isArray(modulesData) ? modulesData : modulesData?.dato || []

          const modulesWithMaterials = await Promise.all(
            modulesArray.map(async (module: any, idx: number) => {
              const moduleId = module.id || module.moduloId || module.ModuloId || module.ModuloID

              // Load materials for each module
              const materialsResponse = await fetch(`/api/materials/modulo/${moduleId}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              })

              let materiales: any[] = []
              if (materialsResponse.ok) {
                const materialsData = await materialsResponse.json()
                const materialsArray = Array.isArray(materialsData) ? materialsData : materialsData?.dato || materialsData?.materiales || []

                materiales = materialsArray.map((mat: any) => ({
                  id: mat.id || mat.materialId || mat.MaterialId,
                  nombre: mat.nombre || mat.Nombre || mat.name || "Sin nombre",
                  descripcion: mat.descripcion || mat.Descripcion || "",
                  tipoArchivo: (mat.tipoArchivo || mat.tipo || (mat.ruta ? mat.ruta.split('.').pop() : undefined) || "archivo").toString(),
                  fechaCreacion: mat.fechaCreacion || mat.FechaCreacion || mat.fecha || new Date().toISOString(),
                  ruta: mat.ruta || mat.Ruta || mat.url || mat.link,
                }))
              }

              return {
                id: moduleId || `${module.nombre}-${idx}`,
                nombre: module.nombre || module.Nombre || module.title || "Sin título",
                descripcion: module.descripcion || module.Descripcion || "",
                orden: module.orden || module.Orden || idx + 1,
                materiales: materiales,
              }
            }),
          )

          setModules(modulesWithMaterials)
        }

        // Load students for this course
        const studentsResponse = await fetch(`/api/course-users/course/${courseId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (studentsResponse.ok) {
          const studentsData = await studentsResponse.json()
          const studentsArray = Array.isArray(studentsData) ? studentsData : studentsData?.dato || studentsData || []
          const courseStudents = studentsArray
            .filter((assignment: any) => {
              const role = assignment.rolEnCurso || assignment.rol || assignment.role
              return role === "Estudiante" || role === "Alumno" || role === "Student"
            })
            .map((assignment: any) => {
              const usuario = assignment.usuario || assignment.user || null
              const id = assignment.usuarioId || usuario?.id || assignment.userId || assignment.usuarioId
              const nombre = (assignment.nombreUsuario || usuario?.nombre || usuario?.name || assignment.nombre || "Usuario").toString().trim()
              const correo = (assignment.email || usuario?.correo || usuario?.email || "").toString().trim()
              const fecha = assignment.fechaAsignacion || assignment.fechaInscripcion || assignment.fecha
              const rut = assignment.rut || assignment.rutUsuario || usuario?.rut || usuario?.documento || usuario?.dni || null

              return {
                id,
                nombre,
                correo,
                fechaInscripcion: fecha,
                rut,
              }
            })
            .sort((a: Student, b: Student) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }))

          setStudents(courseStudents)
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

  const handleMaterialClick = async (material: any) => {
    try {
      const token = localStorage.getItem("token")
      const { action, url } = backendService.getMaterialAction(material)

      if (!url) {
        setError("URL de material no disponible")
        return
      }

      if (action === "redirect" || action === "open") {
        window.open(url, "_blank")
        return
      }

      // action === 'download'
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

      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)

      if (blob.type === "application/pdf" || (material.tipoArchivo && material.tipoArchivo.toLowerCase() === "pdf")) {
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

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar role="teacher" />
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
        <Sidebar role="teacher" />
        <div className="flex-1 lg:ml-64">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400">Curso no encontrado</p>
              <Button onClick={() => router.push("/teacher/courses")} className="mt-4">
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
      <Sidebar role="teacher" />

      <div className="flex-1 lg:ml-64 overflow-y-auto">
        <main className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="outline" size="sm" onClick={() => router.push("/teacher/courses")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{course.nombre}</h1>
                <p className="text-gray-600 dark:text-gray-400">{course.descripcion}</p>
              </div>
                <div className="flex items-center space-x-2">
                <Badge variant={course.activo ? "default" : "secondary"} className="text-sm">
                  {course.activo ? "Activo" : "Inactivo"}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/teacher/modules?curso=${course.nrc}`)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar
                </Button>
              </div>
            </div>
          </div>

          {/* Error Messages */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Course Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-unab-navy to-unab-navy-dark border-none">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/80">Estudiantes</p>
                    <p className="text-2xl font-bold text-white">{students.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-white" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-unab-navy to-unab-navy-dark border-none">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/80">Módulos</p>
                    <p className="text-2xl font-bold text-white">{modules.length}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-unab-navy to-unab-navy-dark border-none">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/80">Materiales</p>
                    <p className="text-2xl font-bold text-white">
                      {modules.reduce((total, module) => total + (module.materiales ? module.materiales.length : module.materialesCount || 0), 0)}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-white" />
                </div>
              </CardContent>
            </Card>

            {/* Labs removed: not applicable for this view */}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Course Modules */}
            <div>
                <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-unab-navy dark:text-white">Módulos del Curso</h2>
                <Button
                  size="sm"
                  className="bg-unab-navy hover:bg-unab-navy-dark text-white"
                  onClick={() => router.push(`/teacher/modules?curso=${course.nrc}`)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Módulo
                </Button>
              </div>

              {modules.length > 0 ? (
                <div className="space-y-4">
                      {modules.map((module, idx) => (
                        // use module.id when available; fallback to name+index to guarantee uniqueness
                        <Card key={module.id ?? `${module.nombre}-${idx}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg text-unab-navy dark:text-white truncate">{module.nombre}</CardTitle>
                            <CardDescription className="text-unab-gray-600 dark:text-white line-clamp-2">{module.descripcion}</CardDescription>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="bg-unab-navy/10 text-unab-navy border-unab-navy/20">
                              {module.orden ?? idx + 1}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-unab-navy text-unab-navy hover:bg-unab-navy hover:text-white"
                              onClick={() => router.push(`/teacher/modules?curso=${course.nrc}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div>
                          {module.materiales && module.materiales.length > 0 ? (
                            <div className="space-y-3">
                              <h4 className="font-medium text-unab-navy dark:text-white">
                                Materiales ({module.materiales.length})
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {module.materiales.map((material: any) => (
                                  <div
                                    key={material.id}
                                    className="flex items-center justify-between p-3 border border-unab-navy/20 rounded-lg hover:bg-unab-navy/5 dark:hover:bg-unab-navy/10 transition-colors"
                                  >
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                      <FileText className="h-5 w-5 text-unab-navy flex-shrink-0" />
                                      <div className="min-w-0 flex-1">
                                        <p className="font-medium text-sm text-unab-navy dark:text-white truncate">{material.nombre}</p>
                                        <div className="flex items-center space-x-2 mt-1">
                                          <Badge variant="outline" className="bg-unab-navy/10 text-unab-navy border-unab-navy/20">
                                            {(material.tipoArchivo || "archivo").toString().toUpperCase()}
                                          </Badge>
                                          <span className="text-xs text-unab-gray-600 dark:text-white">
                                            {new Date(material.fechaCreacion).toLocaleDateString("es-ES")}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <Button size="sm" variant="outline" className="border-unab-navy text-unab-navy hover:bg-unab-navy hover:text-white" onClick={() => handleMaterialClick(material)}>
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <FileText className="h-12 w-12 text-unab-navy/40 mx-auto mb-4" />
                              <p className="text-unab-gray-600 dark:text-white">No hay materiales disponibles en este módulo</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <BookOpen className="h-16 w-16 text-unab-navy/40 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-unab-navy dark:text-white mb-2">
                      No hay módulos creados
                    </h3>
                    <p className="text-unab-gray-600 dark:text-white mb-4">
                      Comienza creando módulos para organizar el contenido de tu curso
                    </p>
                    <Button
                      className="bg-unab-navy hover:bg-unab-navy-dark text-white"
                      onClick={() => router.push(`/teacher/courses/${course.nrc}/modules/new`)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Primer Módulo
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Students */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-unab-navy dark:text-white">Estudiantes Inscritos</h2>
                <Button size="sm" variant="outline" className="border-unab-navy text-unab-navy hover:bg-unab-navy hover:text-white" onClick={() => router.push(`/teacher/courses/${course.nrc}/students`)}>
                  <Users className="h-4 w-4 mr-2" />
                  Ver Todos
                </Button>
              </div>

              {students.length > 0 ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    {students.slice(0, 8).map((student) => (
                      <div key={student.id} className="flex items-center justify-between rounded-lg border border-unab-navy/15 bg-white px-4 py-2 shadow-sm dark:bg-unab-gray-900">
                        <span className="font-medium text-unab-navy dark:text-white">{student.nombre}</span>
                        <span className="text-xs text-unab-gray-600 dark:text-white">
                          {student.fechaInscripcion ? new Date(student.fechaInscripcion).toLocaleDateString("es-ES") : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                  {students.length > 8 && (
                    <div className="text-center">
                      <Button variant="outline" className="border-unab-navy text-unab-navy hover:bg-unab-navy hover:text-white" onClick={() => router.push(`/teacher/courses/${course.nrc}/students`)}>
                        Ver {students.length - 8} estudiantes más...
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Users className="h-16 w-16 text-unab-navy/40 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-unab-navy dark:text-white mb-2">
                      No hay estudiantes inscritos
                    </h3>
                    <p className="text-unab-gray-600 dark:text-white">
                      Los estudiantes aparecerán aquí cuando se inscriban al curso
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Quick Actions removed per UX request */}
        </main>
      </div>
    </div>
  )
}
