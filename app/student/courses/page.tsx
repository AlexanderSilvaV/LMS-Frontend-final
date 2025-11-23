"use client"

import { AlertDescription } from "@/components/ui/alert"

import { AlertTitle } from "@/components/ui/alert"

import { Alert } from "@/components/ui/alert"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, ArrowRight, Search, AlertCircle, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"

const COURSE_PLACEHOLDER = "/placeholder.svg"

interface Course {
  nrc: number
  nombre: string
  descripcion: string
  activo: boolean
  portadaUrl?: string | null
  fechaCreacion?: string
  fechaAsignacion?: string
  progreso?: number
  rolEnCurso?: string
}

export default function StudentCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  const buildCoverUrl = (portadaUrl?: string | null) => {
    if (!portadaUrl || portadaUrl.trim() === "") {
      return COURSE_PLACEHOLDER
    }
    // Si es una URL completa de S3, usarla directamente
    if (portadaUrl.startsWith('http://') || portadaUrl.startsWith('https://')) {
      return portadaUrl
    }
    // Fallback al placeholder si no es una URL válida
    return COURSE_PLACEHOLDER
  }

  useEffect(() => {
    checkTokenAndFetchCourses()
  }, [])

  const checkTokenAndFetchCourses = async () => {
    const token = localStorage.getItem("token")

    if (!token) {
      setError("No se encontró token de autenticación. Redirigiendo al login...")
      setTimeout(() => {
        router.push("/login")
      }, 2000)
      return
    }

    // Verificar si el token ha expirado
    try {
      const tokenPayload = JSON.parse(atob(token.split(".")[1]))
      if (tokenPayload.exp < Date.now() / 1000) {
        setError("El token ha expirado. Redirigiendo al login...")
        localStorage.removeItem("token")
        setTimeout(() => {
          router.push("/login")
        }, 2000)
        return
      }
    } catch (e) {
      console.error("Error parsing token:", e)
      setError("Token inválido. Redirigiendo al login...")
      setTimeout(() => {
        router.push("/login")
      }, 2000)
      return
    }

    await fetchCourses()
  }

  const fetchCourses = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem("token")
      if (!token) {
        setError("No se encontró token de autenticación")
        return
      }

      console.log("🔍 [STUDENT-COURSES] Fetching assigned courses...")

      const response = await fetch("/api/courses/assigned", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      console.log("📡 [STUDENT-COURSES] Response status:", response.status)

      if (response.status === 401) {
        setError("No autorizado. Tu sesión puede haber expirado. Redirigiendo al login...")
        localStorage.removeItem("token")
        setTimeout(() => {
          router.push("/login")
        }, 2000)
        return
      }

      if (response.status === 403) {
        setError("Acceso denegado. No tienes permisos para ver los cursos asignados.")
        return
      }

      const responseText = await response.text()
      console.log("📄 [STUDENT-COURSES] Response text:", responseText)

      if (!response.ok) {
        console.error("❌ [STUDENT-COURSES] Error response:", responseText)
        throw new Error(`Error ${response.status}: ${responseText}`)
      }

      let data
      try {
        data = JSON.parse(responseText)
        console.log("📚 [STUDENT-COURSES] Parsed response data:", data)
      } catch (e) {
        console.error("❌ [STUDENT-COURSES] Error parsing JSON:", e)
        throw new Error("Error al procesar la respuesta del servidor")
      }

      // Procesar los cursos según el formato del backend
      let coursesData: Course[] = []

      if (data.operacionExitosa && data.dato) {
        coursesData = Array.isArray(data.dato) ? data.dato : [data.dato]
      } else if (data.exito && data.dato) {
        coursesData = Array.isArray(data.dato) ? data.dato : [data.dato]
      } else if (Array.isArray(data)) {
        coursesData = data
      } else if (data.cursos) {
        coursesData = data.cursos
      }

      setCourses(coursesData)
      console.log("✅ [STUDENT-COURSES] Loaded courses:", coursesData.length)
    } catch (error) {
      console.error("❌ [STUDENT-COURSES] Error fetching courses:", error)
      setError(error instanceof Error ? error.message : "Error desconocido al cargar cursos")
    } finally {
      setLoading(false)
    }
  }

  const filteredCourses = courses.filter(
    (course) =>
      course.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar role="student" />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Mis Cursos</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Accede a tus cursos asignados y explora el contenido educativo
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error al cargar cursos</AlertTitle>
              <AlertDescription>
                {error}
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="sm" onClick={fetchCourses}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Reintentar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => router.push("/login")}>
                    Ir al Login
                  </Button>
                </div>
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
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !error && filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => {
                const coverSrc = buildCoverUrl(course.portadaUrl)
                return (
                  <Card key={course.nrc} className="hover:shadow-lg transition-shadow duration-200">
                    <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-gray-100 dark:bg-gray-800">
                      <Image
                        src={coverSrc}
                        alt={`Portada del curso ${course.nombre}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        priority={false}
                      />
                    </div>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 truncate">
                            {course.nombre || "Curso sin nombre"}
                          </CardTitle>
                          <CardDescription className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {course.descripcion || "Sin descripción"}
                          </CardDescription>
                        </div>
                        <Badge variant={course.activo ? "default" : "secondary"} className="ml-2">
                          {course.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                    </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-1" />
                          <span>NRC: {course.nrc}</span>
                        </div>
                        {course.rolEnCurso && (
                          <div className="text-sm">
                            <Badge variant="outline">{course.rolEnCurso}</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    <Link href={`/student/courses/${course.nrc}`}>
                      <Button className="w-full" disabled={!course.activo}>
                        <span>Acceder al Curso</span>
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
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
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={fetchCourses}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Actualizar
                </Button>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  )
}
