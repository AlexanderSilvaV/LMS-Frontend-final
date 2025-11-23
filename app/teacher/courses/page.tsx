"use client"

import { useEffect, useState, type ChangeEvent } from "react"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, ArrowRight, Search, AlertCircle, Settings, Users, ImageUp, ImageOff, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

const COURSE_PLACEHOLDER = "/placeholder.jpg"

interface Course {
  nrc: number
  nombre: string
  descripcion: string
  activo: boolean
  fechaCreacion?: string
  rolEnCurso?: string
  portadaUrl?: string | null
}

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [uploadingCover, setUploadingCover] = useState<number | null>(null)
  const [removingCover, setRemovingCover] = useState<number | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchCourses()
  }, [])

  // Usar la MISMA lógica que funciona en el dashboard
  const fetchCourses = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem("token")
      if (!token) {
        setError("No se encontró token de autenticación")
        return
      }

      console.log("🔍 [TEACHER-COURSES] Fetching assigned courses...")

      // Usar exactamente el mismo endpoint y headers que el dashboard
      const response = await fetch("/api/courses/assigned", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("📡 [TEACHER-COURSES] Response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("📚 [TEACHER-COURSES] Raw response data:", data)

        // Aceptar tanto el formato directo (Array) como el envoltorio { dato: [...] }
        const coursesData = Array.isArray(data) ? data : data?.dato || []

        // Filtrar solo cursos donde el usuario es docente (si es necesario)
        const teacherCourses = coursesData.filter(
          (course: Course) => !course.rolEnCurso || course.rolEnCurso === "Docente" || course.rolEnCurso === "Profesor",
        )

        const normalizedCourses: Course[] = teacherCourses
          .map((course: any) => {
            const rawNrc = course.nrc ?? course.Nrc ?? course.cursoId ?? course.cursoNrc
            const sanitizedNrc = typeof rawNrc === "string" ? rawNrc.trim() : rawNrc
            const parsedNrc = Number.parseInt(String(sanitizedNrc), 10)

            if (Number.isNaN(parsedNrc)) {
              console.warn("⚠️ [TEACHER-COURSES] NRC inválido detectado", rawNrc, course)
              return null
            }

            return {
              ...course,
              nrc: parsedNrc,
              portadaUrl: course.portadaUrl ?? course.PortadaUrl ?? null,
            } as Course
          })
          .filter((course: Course | null): course is Course => course !== null)

        setCourses(normalizedCourses)
        console.log("✅ [TEACHER-COURSES] Loaded courses:", normalizedCourses.length)
      } else {
        const errorText = await response.text()
        console.error("❌ [TEACHER-COURSES] Error response:", errorText)
        throw new Error(`Error ${response.status}: ${errorText}`)
      }
    } catch (error) {
      console.error("❌ [TEACHER-COURSES] Error fetching courses:", error)
      setError(error instanceof Error ? error.message : "Error desconocido al cargar cursos")
    } finally {
      setLoading(false)
    }
  }

  const filteredCourses = courses.filter(
    (course) =>
      course.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.descripcion.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const refreshCourseCover = async (nrc: number) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        return
      }

      const response = await fetch(`/api/courses/${nrc}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        return
      }

      const courseData = await response.json()
      const parsedCourse = Array.isArray(courseData) ? courseData[0] : courseData?.dato || courseData

      if (parsedCourse) {
        const portada = parsedCourse.portadaUrl || parsedCourse.PortadaUrl || null
        setCourses((prev) =>
          prev.map((course) =>
            course.nrc === nrc
              ? {
                  ...course,
                  portadaUrl: portada ? `${portada}${portada.includes("?") ? "&" : "?"}t=${Date.now()}` : null,
                }
              : course,
          ),
        )
      }
    } catch (refreshError) {
      console.error("❌ [TEACHER-COURSES] Error refreshing cover:", refreshError)
    }
  }

  const handleCoverUpload = async (nrc: number, file: File) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        toast({
          title: "Sesión inválida",
          description: "Por favor inicia sesión nuevamente.",
          variant: "destructive",
        })
        return
      }

      setUploadingCover(nrc)

      const formData = new FormData()
      formData.append("archivo", file)

      const response = await fetch(`/api/courses/${nrc}/cover`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        let message = data?.mensaje || "No se pudo subir la portada"

        // Provide more specific error messages
        if (response.status === 404) {
          message = "El curso no existe o no tienes permisos para modificarlo"
        } else if (response.status === 401) {
          message = "Tu sesión ha expirado. Por favor inicia sesión nuevamente"
        } else if (response.status === 400) {
          message = data?.mensaje || "El archivo no es válido o es demasiado grande"
        }

        throw new Error(message)
      }

      toast({
        title: "Portada actualizada",
        description: "La imagen fue subida correctamente.",
      })

      await refreshCourseCover(nrc)
    } catch (uploadError) {
      console.error("❌ [TEACHER-COURSES] Error uploading cover:", uploadError)
      toast({
        title: "Error al subir",
        description: uploadError instanceof Error ? uploadError.message : "Intenta nuevamente más tarde.",
        variant: "destructive",
      })
    } finally {
      setUploadingCover(null)
    }
  }

  const handleCoverRemove = async (nrc: number) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        toast({
          title: "Sesión inválida",
          description: "Por favor inicia sesión nuevamente.",
          variant: "destructive",
        })
        return
      }

      setRemovingCover(nrc)

      const response = await fetch(`/api/courses/${nrc}/cover`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        const message = data?.mensaje || "No se pudo eliminar la portada"
        throw new Error(message)
      }

      toast({
        title: "Portada eliminada",
        description: "La imagen fue eliminada correctamente.",
      })

      setCourses((prev) => prev.map((course) => (course.nrc === nrc ? { ...course, portadaUrl: null } : course)))
    } catch (removeError) {
      console.error("❌ [TEACHER-COURSES] Error removing cover:", removeError)
      toast({
        title: "Error al eliminar",
        description: removeError instanceof Error ? removeError.message : "Intenta nuevamente más tarde.",
        variant: "destructive",
      })
    } finally {
      setRemovingCover(null)
    }
  }

  const handleCoverInputChange = (nrc: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      event.target.value = ""
      return
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    const maxBytes = 5 * 1024 * 1024

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Formato no soportado",
        description: "Solo se permiten imágenes PNG, JPG o WEBP.",
        variant: "destructive",
      })
      event.target.value = ""
      return
    }

    if (file.size > maxBytes) {
      toast({
        title: "Archivo demasiado grande",
        description: "La portada debe pesar máximo 5MB.",
        variant: "destructive",
      })
      event.target.value = ""
      return
    }

    void handleCoverUpload(nrc, file)
    event.target.value = ""
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar role="teacher" />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Mis Cursos</h1>
            <p className="text-gray-600 dark:text-gray-400">Gestiona tus cursos asignados y su contenido educativo</p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                <Button variant="outline" size="sm" className="ml-2 bg-transparent" onClick={fetchCourses}>
                  Reintentar
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Search */}
          {!loading && !error && courses.length > 0 && (
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar cursos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {/* Courses Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !error && filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => {
                const portadaUrl = course.portadaUrl ?? ""
                const hasCover = portadaUrl.trim() !== ""
                // Si es una URL completa de S3, usarla directamente; si no, usar el proxy
                const coverSrc = hasCover
                  ? (portadaUrl.startsWith('http://') || portadaUrl.startsWith('https://'))
                    ? portadaUrl
                    : `/api/courses/${course.nrc}/cover?ref=${encodeURIComponent(portadaUrl)}`
                  : COURSE_PLACEHOLDER

                return (
                  <Card key={course.nrc} className="flex h-full flex-col overflow-hidden hover:shadow-lg transition-shadow duration-200">
                    <div className="relative w-full h-32 bg-gray-100 dark:bg-gray-800">
                      <img
                        src={coverSrc}
                        alt={`Portada del curso ${course.nombre}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={(event) => {
                          if (!event.currentTarget.dataset.fallbackApplied) {
                            event.currentTarget.dataset.fallbackApplied = "true"
                            event.currentTarget.src = COURSE_PLACEHOLDER
                          }
                        }}
                      />
                    </div>
                    <CardHeader className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {course.nombre}
                          </CardTitle>
                          <CardDescription className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {course.descripcion}
                          </CardDescription>
                        </div>
                        <Badge variant={course.activo ? "default" : "secondary"} className="ml-2">
                          {course.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col justify-between space-y-4">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <BookOpen className="h-4 w-4 mr-1" />
                            <span>NRC: {course.nrc}</span>
                          </div>
                          {course.rolEnCurso && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{course.rolEnCurso}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-dashed"
                          onClick={() => document.getElementById(`teacher-cover-input-${course.nrc}`)?.click()}
                          disabled={uploadingCover === course.nrc || removingCover === course.nrc}
                        >
                          {uploadingCover === course.nrc ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <ImageUp className="h-4 w-4 mr-2" />
                          )}
                          {uploadingCover === course.nrc ? "Subiendo..." : "Subir portada"}
                        </Button>
                        <input
                          id={`teacher-cover-input-${course.nrc}`}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(event) => handleCoverInputChange(course.nrc, event)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCoverRemove(course.nrc)}
                          disabled={removingCover === course.nrc || !course.portadaUrl}
                          className="text-unab-red hover:text-unab-red-dark"
                        >
                          {removingCover === course.nrc ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <ImageOff className="h-4 w-4 mr-2" />
                          )}
                          {removingCover === course.nrc ? "Eliminando..." : "Eliminar portada"}
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Link href={`/teacher/courses/${course.nrc}`}>
                          <Button className="w-full" disabled={!course.activo}>
                            <span>Ver Contenido</span>
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                        <div className="flex space-x-2">
                          <Link href={`/teacher/materials?curso=${course.nrc}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full bg-transparent">
                              <Settings className="h-4 w-4 mr-1" />
                              Materiales
                            </Button>
                          </Link>
                          <Link href={`/teacher/courses/${course.nrc}/students`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full bg-transparent">
                              <Users className="h-4 w-4 mr-1" />
                              Estudiantes
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : !error && !loading ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {searchTerm ? "No se encontraron cursos" : "No tienes cursos asignados"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm
                  ? "Intenta con otros términos de búsqueda"
                  : "Contacta a tu administrador para que te asigne cursos"}
              </p>
              <div className="space-y-2">
                <Button variant="outline" onClick={fetchCourses}>
                  Actualizar
                </Button>
                <div className="text-xs text-gray-500">
                  Si el problema persiste, verifica que estés asignado como docente a los cursos
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  )
}
