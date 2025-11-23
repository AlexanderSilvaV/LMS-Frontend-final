"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  BookOpen,
  Users,
  FileText,
  FlaskConical,
  TrendingUp,
  Activity,
  GraduationCap,
  RefreshCw,
  AlertCircle,
  Calendar,
  Eye,
  Plus,
} from "lucide-react"
import { backendService } from "@/app/lib/backend-service"

interface Course {
  nrc: number
  nombre: string
  descripcion: string
  fechaCreacion: string
  activo: boolean
  estudiantesInscritos?: number
  materialesCount?: number
}

interface TeacherStats {
  totalCursos: number
  cursosActivos: number
  totalEstudiantes: number
  totalMateriales: number
  loading: boolean
  error: string | null
}

export default function TeacherDashboard() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [stats, setStats] = useState<TeacherStats>({
    totalCursos: 0,
    cursosActivos: 0,
    totalEstudiantes: 0,
    totalMateriales: 0,
    loading: true,
    error: null,
  })
  const [userName, setUserName] = useState("")
  const [backendStatus, setBackendStatus] = useState<"connected" | "disconnected" | "checking">("checking")

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userRole = localStorage.getItem("userRole")
    const name = localStorage.getItem("userName") || "Docente"

    if (!token) {
      router.push("/")
      return
    }

    if (userRole !== "Docente") {
      router.push("/")
      return
    }

    setUserName(name)
    loadTeacherData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadTeacherData = async (forceRefresh = false) => {
    try {
      setStats((prev) => ({ ...prev, loading: true, error: null }))

      const token = localStorage.getItem("token")
      if (!token) {
        setStats((prev) => ({ ...prev, loading: false, error: "No hay token de autenticación" }))
        return
      }

      console.log("🔍 [TEACHER DASHBOARD] Loading teacher data...")

      // Load teacher assigned courses via the frontend proxy for consistent normalization
      const assignedResp = await fetch(`/api/courses/assigned`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      console.log("📚 [TEACHER DASHBOARD] Assigned courses response status:", assignedResp.status)

      let coursesArray: any[] = []
      if (assignedResp.ok) {
        const assignedData = await assignedResp.json()
        console.log("📚 [TEACHER DASHBOARD] Assigned data:", assignedData)
        coursesArray = Array.isArray(assignedData) ? assignedData : assignedData?.dato || []
      } else {
        const errText = await assignedResp.text().catch(() => "")
        throw new Error(`Error fetching assigned courses: ${assignedResp.status} ${errText}`)
      }

      setCourses(coursesArray)

      // Calculate stats
      const totalCursos = coursesArray.length
      const cursosActivos = coursesArray.filter((course: Course) => course.activo).length
      const totalEstudiantes = coursesArray.reduce(
        (sum: number, course: Course) => sum + (course.estudiantesInscritos || 0),
        0,
      )
      const totalMateriales = coursesArray.reduce(
        (sum: number, course: Course) => sum + (course.materialesCount || 0),
        0,
      )

      setStats({
        totalCursos,
        cursosActivos,
        totalEstudiantes,
        totalMateriales,
        loading: false,
        error: null,
      })

      setBackendStatus("connected")
      console.log("✅ [TEACHER DASHBOARD] Data loaded successfully")
    } catch (error) {
      console.error("❌ [TEACHER DASHBOARD] Error loading teacher data:", error)
      setBackendStatus("disconnected")
      setStats((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Error al cargar los datos del docente",
      }))
    }
  }

  const testBackendConnection = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setStats((prev) => ({ ...prev, error: "No hay token de autenticación" }))
        return
      }

      console.log("🔍 [TEACHER DASHBOARD] Testing backend connection...")
      setBackendStatus("checking")

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"
      const testUrl = `${backendUrl}/api/cursos/asignados`

      const response = await fetch(testUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        setBackendStatus("connected")
        setStats((prev) => ({ ...prev, error: null }))
        console.log("✅ [TEACHER DASHBOARD] Backend connection successful")
        return true
      } else {
        const errorData = await response.text()
        setBackendStatus("disconnected")
        setStats((prev) => ({ ...prev, error: `Error de conexión: ${response.status} - ${errorData}` }))
        return false
      }
    } catch (error) {
      console.error("❌ [TEACHER DASHBOARD] Backend connection test failed:", error)
      setBackendStatus("disconnected")
      setStats((prev) => ({
        ...prev,
        error: `Error de conexión: ${error instanceof Error ? error.message : "Error desconocido"}`,
      }))
      return false
    }
  }

  const dashboardStats = [
    {
      title: "Mis Cursos",
      value: stats.totalCursos.toString(),
      icon: BookOpen,
      color: "text-unab-navy dark:text-unab-navy-light",
      bgColor: "bg-unab-navy/10 dark:bg-unab-navy/10",
      detail: `${stats.cursosActivos} activos`,
    },
    {
      title: "Estudiantes",
      value: stats.totalEstudiantes.toString(),
      icon: Users,
      color: "text-unab-navy-dark dark:text-unab-navy-light",
      bgColor: "bg-unab-navy/5 dark:bg-unab-navy/10",
      detail: "Total inscritos",
    },
    {
      title: "Materiales",
      value: stats.totalMateriales.toString(),
      icon: FileText,
      color: "text-unab-red dark:text-unab-red-light",
      bgColor: "bg-unab-red/10 dark:bg-unab-red/10",
      detail: "Recursos creados",
    },
    {
      title: "Rendimiento",
      value: stats.totalCursos > 0 ? `${Math.round((stats.cursosActivos / stats.totalCursos) * 100)}%` : "0%",
      icon: TrendingUp,
      color: "text-unab-gray-700 dark:text-white",
      bgColor: "bg-unab-gray-100 dark:bg-unab-gray-700/20",
      detail: "Cursos activos",
    },
  ]

  const quickActions = [
    {
      title: "Ver Mis Cursos",
      description: "Gestionar cursos asignados",
      icon: BookOpen,
      href: "/teacher/courses",
      color: "bg-unab-navy hover:bg-unab-navy-dark",
    },
    {
      title: "Gestionar Estudiantes",
      description: "Ver y administrar estudiantes",
      icon: Users,
      href: "/teacher/students",
      color: "bg-unab-red hover:bg-unab-red-dark",
    },
    {
      title: "Crear Materiales",
      description: "Subir recursos educativos",
      icon: FileText,
      href: "/teacher/materials",
      color: "bg-unab-gray-600 hover:bg-unab-gray-700",
    },
    {
      title: "Laboratorios",
      description: "Gestionar laboratorios virtuales",
      icon: FlaskConical,
      href: "/teacher/labs",
      color: "bg-unab-navy-light hover:bg-unab-navy",
    },
  ]

  const recentActivities = [
    {
      title: "Dashboard cargado",
      time: "Ahora",
      type: "system",
      icon: Activity,
    },
    {
      title: "Cursos sincronizados",
      time: "Hace 5 minutos",
      type: "sync",
      icon: RefreshCw,
    },
    {
      title: "Sesión iniciada",
      time: "Hace 10 minutos",
      type: "auth",
      icon: GraduationCap,
    },
  ]

  if (stats.loading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar role="teacher" />
        <div className="flex-1 lg:ml-64">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-unab-red"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-unab-gray-50 dark:bg-unab-navy-dark">
      <Sidebar role="teacher" />

      <div className="flex-1 lg:ml-64 overflow-y-auto">
        <main className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-unab-navy dark:text-white mb-2">Panel del Docente</h1>
              <p className="text-unab-gray-600 dark:text-white">
                Bienvenido {userName}, gestiona tus cursos y materiales educativos
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-unab-navy/10 text-unab-navy border-unab-navy/20 dark:bg-unab-navy/20 dark:text-unab-navy-light dark:border-unab-navy-light">
                <GraduationCap className="h-3 w-3 mr-1" />
                Docente
              </Badge>
              <Button variant="outline" onClick={() => loadTeacherData(true)} disabled={stats.loading} className="border-unab-gray-300 hover:bg-unab-gray-50 dark:border-unab-navy-light dark:hover:bg-unab-navy">
                {stats.loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Actualizar"}
              </Button>
              {/* Removed: Probar Conexión button per UX request */}
            </div>
          </div>

          {/* Error Alert */}
          {stats.error && (
            <Alert variant="destructive" className="mb-6 bg-unab-red/10 border-unab-red text-unab-red dark:bg-unab-red/20 dark:text-unab-red-light">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{stats.error}</AlertDescription>
            </Alert>
          )}

          {/* Backend Status Alert */}
          {backendStatus === "disconnected" && (
            <Alert className="mb-6 border-unab-red/30 bg-unab-red/5 text-unab-red dark:border-unab-red/50 dark:bg-unab-red/10 dark:text-unab-red-light">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Advertencia:</strong> No se pudo conectar con el backend. Algunos datos pueden no estar
                actualizados.
              </AlertDescription>
            </Alert>
          )}

          {/* Statistics removed from dashboard as requested */}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {/* My Courses */}
              <Card className="mt-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Mis Cursos</CardTitle>
                      <CardDescription className="text-unab-gray-600 dark:text-white">Cursos que tienes asignados</CardDescription>
                    </div>
                    <Button onClick={() => router.push("/teacher/courses")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Ver Todos
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {courses.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-unab-gray-400 dark:text-unab-gray-500 mx-auto mb-4" />
                      <p className="text-unab-gray-600 dark:text-white">No tienes cursos asignados</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {courses.slice(0, 4).map((course) => (
                        <Card key={course.nrc} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{course.nombre}</CardTitle>
                              <Badge variant={course.activo ? "default" : "secondary"}>
                                {course.activo ? "Activo" : "Inactivo"}
                              </Badge>
                            </div>
                            <CardDescription className="line-clamp-2 text-unab-gray-600 dark:text-white">{course.descripcion}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="mb-3 text-sm text-unab-gray-600 dark:text-white">
                              <p className="text-xs text-unab-gray-500 dark:text-unab-gray-200">
                                NRC: {course.nrc} • Creado: {new Date(course.fechaCreacion).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => router.push(`/teacher/courses/${course.nrc}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Curso
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-unab-navy dark:text-unab-navy-light" />
                    <span>Actividad Reciente</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                          <activity.icon className="h-4 w-4 text-unab-navy dark:text-unab-navy-light" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{activity.title}</p>
                          <p className="text-xs text-unab-gray-500 dark:text-white">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* System Status */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-unab-navy dark:text-unab-navy-light" />
                    <span>Estado del Sistema</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-unab-gray-600 dark:text-white">Conexión Backend</span>
                    <Badge
                      variant="outline"
                      className={
                        backendStatus === "connected"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : backendStatus === "checking"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : "bg-red-50 text-red-700 border-red-200"
                      }
                    >
                      {backendStatus === "connected"
                        ? "Conectado"
                        : backendStatus === "checking"
                          ? "Verificando..."
                          : "Desconectado"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-unab-gray-600 dark:text-white">Cursos Cargados</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {courses.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-unab-gray-600 dark:text-white">Última Actualización</span>
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600">
                      Ahora
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
