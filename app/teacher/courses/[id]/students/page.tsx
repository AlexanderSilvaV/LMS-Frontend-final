"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Users, ArrowLeft, Search, AlertCircle } from "lucide-react"

interface Student {
  id: string
  nombre: string
  correo: string
  rut?: string | null
  fechaInscripcion?: string
}

export default function CourseStudentsPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string

  const [students, setStudents] = useState<Student[]>([])
  const [courseName, setCourseName] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userRole = localStorage.getItem("userRole")

    if (!token || userRole !== "Docente") {
      router.push("/")
      return
    }

    if (courseId) {
      loadStudents(token)
    }
  }, [courseId, router])

  const loadStudents = async (token: string) => {
    try {
      setLoading(true)
      setError(null)

      const courseResponse = await fetch(`/api/courses/${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (courseResponse.ok) {
        const courseData = await courseResponse.json()
        const course = Array.isArray(courseData) ? courseData[0] : courseData?.dato || courseData
        setCourseName(course?.nombre || "Curso")
      }

      const studentsResponse = await fetch(`/api/course-users/course/${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!studentsResponse.ok) {
        if (studentsResponse.status === 404) {
          setStudents([])
          return
        }

        const errorText = await studentsResponse.text().catch(() => "")
        throw new Error(errorText || "No se pudo cargar la lista de estudiantes")
      }

      const studentsData = await studentsResponse.json()
      const studentsArray = Array.isArray(studentsData) ? studentsData : studentsData?.dato || studentsData || []
      const parsedStudents: Student[] = studentsArray
        .filter((assignment: any) => {
          const role = assignment.rolEnCurso || assignment.rol || assignment.role
          return role === "Estudiante" || role === "Alumno" || role === "Student"
        })
        .map((assignment: any) => {
          const usuario = assignment.usuario || assignment.user || null
          const nombre = (assignment.nombreUsuario || usuario?.nombre || usuario?.name || assignment.nombre || "Usuario").toString().trim()
          const correo = (assignment.email || usuario?.correo || usuario?.email || "").toString().trim()
          const rut = assignment.rut || assignment.rutUsuario || usuario?.rut || usuario?.documento || usuario?.dni || null

          return {
            id: assignment.usuarioId || usuario?.id || assignment.userId || assignment.usuarioId,
            nombre,
            correo,
            rut,
            fechaInscripcion: assignment.fechaAsignacion || assignment.fechaInscripcion || assignment.fecha,
          }
        })
        .sort((a: Student, b: Student) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }))

      setStudents(parsedStudents)
    } catch (err) {
      console.error("Error loading course students:", err)
      setError(err instanceof Error ? err.message : "Error al cargar estudiantes")
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = useMemo(() => {
    if (!search.trim()) {
      return students
    }

    const term = search.trim().toLowerCase()
    return students.filter((student) => {
      return (
        student.nombre.toLowerCase().includes(term) ||
        student.correo.toLowerCase().includes(term) ||
        (student.rut ? student.rut.toLowerCase().includes(term) : false)
      )
    })
  }, [students, search])

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar role="teacher" />

      <div className="flex-1 lg:ml-64 overflow-y-auto">
        <main className="p-6 lg:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Button variant="outline" size="sm" onClick={() => router.push(`/teacher/courses/${courseId}`)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al curso
              </Button>
              <h1 className="mt-4 text-3xl font-bold text-unab-navy dark:text-white">Estudiantes del curso</h1>
              <p className="text-unab-gray-600 dark:text-white">{courseName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-unab-gray-600 dark:text-white">Total inscritos</p>
              <p className="text-2xl font-semibold text-unab-navy dark:text-white">{students.length}</p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader className="space-y-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Lista de estudiantes
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-unab-gray-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nombre, correo o RUT"
                  className="pl-9"
                  disabled={loading}
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-16 animate-pulse rounded-md bg-unab-gray-200 dark:bg-unab-gray-700" />
                  ))}
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-14 w-14 text-unab-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium text-unab-navy dark:text-white">No se encontraron estudiantes</p>
                  <p className="text-sm text-unab-gray-600 dark:text-white">Verifica el término de búsqueda o que existan inscripciones</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className="grid grid-cols-1 gap-2 rounded-lg border border-unab-navy/15 bg-white px-4 py-3 shadow-sm transition hover:border-unab-navy/30 md:grid-cols-3 md:items-center dark:bg-unab-gray-900"
                    >
                      <div>
                        <p className="font-semibold text-unab-navy dark:text-white">{student.nombre}</p>
                        {student.fechaInscripcion && (
                          <p className="text-xs text-unab-gray-500 dark:text-white/70">
                            Inscrito: {new Date(student.fechaInscripcion).toLocaleDateString("es-ES")}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-unab-gray-700 dark:text-white">{student.correo || "Correo no disponible"}</p>
                      </div>
                      <div className="md:text-right">
                        <p className="text-sm font-medium text-unab-navy dark:text-white">{student.rut || "RUT no disponible"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
