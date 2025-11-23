"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FlaskConical, Search, Play, Clock, BookOpen, CheckCircle, User } from "lucide-react"
import { evaluacionService } from "@/app/lib/evaluacion-service"
import { EvaluacionEstudianteDTO } from "@/DTOs/EvaluacionDTOs"

interface StudentLab {
  evaluacionId: number
  titulo: string
  descripcion: string
  cursoNombre: string
  docenteNombre: string
  duracionEstimada: number
  dificultad: "Básico" | "Intermedio" | "Avanzado"
  completado: boolean
  progreso: number
  fechaLimite?: string
  ultimoAcceso?: string
  puntuacion?: number
  intentosRestantes: number
  puedeRealizar: boolean
  estaEnTiempo: boolean
  preguntasPorSesion: number
}

const dificultadDesdePreguntas = (totalPreguntas: number): StudentLab["dificultad"] => {
  if (totalPreguntas >= 20) return "Avanzado"
  if (totalPreguntas >= 12) return "Intermedio"
  return "Básico"
}

export default function StudentLabsPage() {
  const router = useRouter()
  const [labs, setLabs] = useState<StudentLab[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "pending">("all")
  const [error, setError] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userRole = localStorage.getItem("userRole")

    if (!token) {
      router.push("/")
      return
    }

    // PROTECCIÓN: Estudiantes no pueden acceder a esta página
    // Solo Docentes y Administradores tienen acceso a laboratorios
    if (userRole === "Alumno") {
      router.push("/student/dashboard")
      return
    }

    // Si no es Alumno (es Docente o Administrador), redirigir a la página correspondiente
    if (userRole === "Docente") {
      router.push("/teacher/labs")
      return
    }

    if (userRole === "Administrador") {
      router.push("/admin/dashboard")
      return
    }

    loadLabs()
  }, [router])

  const loadLabs = async () => {
    try {
      setLoading(true)
      setError("")

      const evaluaciones: EvaluacionEstudianteDTO[] = await evaluacionService.obtenerEvaluacionesEstudiante()
      const labsData = evaluaciones
        .filter((evaluacion) => evaluacion.esLaboratorio3DLab)
        .map<StudentLab>((evaluacion) => {
          const completado = !evaluacion.puedeRealizarEvaluacion && evaluacion.intentosRealizados > 0
          const intentosIlimitados = !evaluacion.intentosMaximos || evaluacion.intentosMaximos <= 0
          const intentosRestantes = intentosIlimitados
            ? Number.POSITIVE_INFINITY
            : Math.max(evaluacion.intentosMaximos - evaluacion.intentosRealizados, 0)
          const progreso = completado
            ? 100
            : evaluacion.intentosRealizados > 0 && evaluacion.intentosMaximos > 0
              ? Math.min(100, Math.round((evaluacion.intentosRealizados / evaluacion.intentosMaximos) * 100))
              : 0
          const mejorPorcentaje = typeof evaluacion.mejorPorcentaje === "number"
            ? Math.round(evaluacion.mejorPorcentaje)
            : undefined
          const preguntasPorSesion = evaluacion.preguntasPorSesionLaboratorio && evaluacion.preguntasPorSesionLaboratorio > 0
            ? evaluacion.preguntasPorSesionLaboratorio
            : Math.max(1, Math.min(4, evaluacion.totalPreguntas ?? 0))

          return {
            evaluacionId: evaluacion.id,
            titulo: evaluacion.titulo ?? "Laboratorio sin título",
            descripcion: evaluacion.descripcion ?? "Laboratorio 3DLAB disponible en tu curso",
            cursoNombre: evaluacion.cursoNombre ?? evaluacion.curso?.nombre ?? "Curso no disponible",
            docenteNombre: evaluacion.docenteNombre ?? "Docente no asignado",
            duracionEstimada: evaluacion.tiempoLimiteMins ?? 0,
            dificultad: dificultadDesdePreguntas(evaluacion.totalPreguntas ?? 0),
            completado,
            progreso,
            fechaLimite: evaluacion.fechaFin ?? undefined,
            ultimoAcceso: evaluacion.ultimaFechaRealizada ?? evaluacion.ultimoIntento?.fechaInicio,
            puntuacion: mejorPorcentaje,
            intentosRestantes,
            puedeRealizar: evaluacion.puedeRealizarEvaluacion,
            estaEnTiempo: evaluacion.estaEnTiempo,
            preguntasPorSesion
          }
        })
        .sort((a, b) => Number(a.completado) - Number(b.completado))

      setLabs(labsData)
    } catch (err) {
      console.error("Error al cargar laboratorios 3DLAB:", err)
      setError("No se pudieron cargar los laboratorios. Intenta nuevamente más tarde.")
    } finally {
      setLoading(false)
    }
  }

  const handleStartLab = (lab: StudentLab) => {
    if (lab.completado) {
      router.push(`/student/evaluaciones/${lab.evaluacionId}/resultado`)
      return
    }

    if (!lab.puedeRealizar) {
      setError("El laboratorio aún no está disponible para ser realizado.")
      return
    }

    router.push(`/student/evaluaciones/${lab.evaluacionId}`)
  }

  const filteredLabs = labs.filter((lab) => {
    const search = searchTerm.toLowerCase()
    const matchesSearch =
      lab.titulo.toLowerCase().includes(search) ||
      lab.descripcion.toLowerCase().includes(search) ||
      lab.cursoNombre.toLowerCase().includes(search) ||
      lab.docenteNombre.toLowerCase().includes(search)

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "completed" && lab.completado) ||
      (filterStatus === "pending" && !lab.completado)

    return matchesSearch && matchesFilter
  })

  const getDifficultyColor = (dificultad: StudentLab["dificultad"]) => {
    switch (dificultad) {
      case "Básico":
        return "bg-green-100 text-green-800"
      case "Intermedio":
        return "bg-yellow-100 text-yellow-800"
      case "Avanzado":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const isOverdue = (fechaLimite?: string) => {
    if (!fechaLimite) return false
    return new Date(fechaLimite) < new Date()
  }

  const { completedLabs, totalLabs, averageScore, totalDurationHours } = useMemo(() => {
    const total = labs.length
    const completados = labs.filter((lab) => lab.completado).length
    const labsConPuntaje = labs.filter((lab) => typeof lab.puntuacion === "number")
    const promedio = labsConPuntaje.length > 0
      ? labsConPuntaje.reduce((sum, lab) => sum + (lab.puntuacion ?? 0), 0) / labsConPuntaje.length
      : 0
    const horasTotales = labs.reduce((sum, lab) => sum + lab.duracionEstimada, 0) / 60

    return {
      completedLabs: completados,
      totalLabs: total,
      averageScore: promedio,
      totalDurationHours: horasTotales,
    }
  }, [labs])

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

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar role="student" />

      <div className="flex-1 lg:ml-64 overflow-y-auto">
        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Laboratorios 3DLAB</h1>
            <p className="text-gray-600 dark:text-gray-400">Accede a tus laboratorios virtuales y revisa tus resultados</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Laboratorios Completados</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {completedLabs}/{totalLabs}
                </div>
                <Progress value={totalLabs > 0 ? (completedLabs / totalLabs) * 100 : 0} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Promedio de Puntuación</CardTitle>
                <FlaskConical className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(averageScore)}%</div>
                <p className="text-xs text-muted-foreground">Sobre laboratorios completados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tiempo Total Estimado</CardTitle>
                <Clock className="h-4 w-4 text-unab-navy dark:text-unab-navy-light" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(totalDurationHours)}h</div>
                <p className="text-xs text-muted-foreground">Sumando todos los laboratorios asignados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Laboratorios Pendientes</CardTitle>
                <FlaskConical className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.max(totalLabs - completedLabs, 0)}</div>
                <p className="text-xs text-muted-foreground">Aún disponibles para realizar</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar laboratorios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex space-x-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                onClick={() => setFilterStatus("all")}
                size="sm"
              >
                Todos
              </Button>
              <Button
                variant={filterStatus === "pending" ? "default" : "outline"}
                onClick={() => setFilterStatus("pending")}
                size="sm"
              >
                Pendientes
              </Button>
              <Button
                variant={filterStatus === "completed" ? "default" : "outline"}
                onClick={() => setFilterStatus("completed")}
                size="sm"
              >
                Completados
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredLabs.map((lab) => {
              const estado = lab.completado
                ? { etiqueta: "Completado", clase: "bg-green-100 text-green-800" }
                : lab.puedeRealizar
                  ? { etiqueta: "Disponible", clase: "bg-blue-100 text-blue-800" }
                  : { etiqueta: "No disponible", clase: "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300" }

              return (
                <Card
                  key={lab.evaluacionId}
                  className={isOverdue(lab.fechaLimite) && !lab.completado ? "border-red-200" : ""}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FlaskConical className="h-8 w-8 text-orange-600" />
                        <Badge className={estado.clase}>{estado.etiqueta}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-orange-100 text-orange-800">Laboratorio 3DLAB</Badge>
                        <Badge className={getDifficultyColor(lab.dificultad)}>{lab.dificultad}</Badge>
                      </div>
                    </div>
                    <CardTitle className="text-lg flex items-center gap-2">{lab.titulo}</CardTitle>
                    <CardDescription className="text-unab-gray-600 dark:text-gray-200">
                      {lab.descripcion}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <BookOpen className="h-4 w-4" />
                        <span>{lab.cursoNombre}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <User className="h-4 w-4" />
                        <span>{lab.docenteNombre}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="h-4 w-4" />
                        <span>
                          {lab.duracionEstimada > 0 ? `${lab.duracionEstimada} minutos estimados` : "Sin límite de tiempo"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Badge variant="outline" className="border-orange-200 text-orange-600 dark:border-orange-500 dark:text-orange-300">
                          {lab.preguntasPorSesion} pregunta(s) por sesión
                        </Badge>
                      </div>

                      {lab.fechaLimite && (
                        <div className="text-sm">
                          <span
                            className={
                              isOverdue(lab.fechaLimite) && !lab.completado
                                ? "text-unab-red dark:text-unab-red-light"
                                : "text-unab-gray-600 dark:text-unab-gray-400"
                            }
                          >
                            <strong>Fecha límite:</strong> {new Date(lab.fechaLimite).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      {lab.ultimoAcceso && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <strong>Último acceso:</strong> {new Date(lab.ultimoAcceso).toLocaleDateString()}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <strong>Intentos restantes:</strong>
                        <span>
                          {Number.isFinite(lab.intentosRestantes) ? lab.intentosRestantes : "Ilimitados"}
                        </span>
                      </div>

                      {lab.completado && typeof lab.puntuacion === "number" && (
                        <div className="text-sm">
                          <strong>Puntuación final:</strong>
                          <span
                            className={`ml-1 ${lab.puntuacion >= 60 ? "text-green-600 dark:text-green-400" : "text-unab-red dark:text-unab-red-light"}`}
                          >
                            {lab.puntuacion}%
                          </span>
                        </div>
                      )}

                      {!lab.completado && lab.progreso > 0 && (
                        <div>
                          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                            <span>Progreso</span>
                            <span>{lab.progreso}%</span>
                          </div>
                          <Progress value={lab.progreso} />
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end mt-4">
                      <Button
                        size="sm"
                        onClick={() => handleStartLab(lab)}
                        disabled={!lab.puedeRealizar && !lab.completado}
                        className={lab.completado ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        {lab.completado ? "Ver resultados" : lab.progreso > 0 ? "Continuar" : "Iniciar"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredLabs.length === 0 && (
            <div className="text-center py-12">
              <FlaskConical className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No hay laboratorios disponibles</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm
                  ? "No se encontraron laboratorios que coincidan con tu búsqueda"
                  : "Aún no tienes laboratorios 3DLAB asignados"}
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
