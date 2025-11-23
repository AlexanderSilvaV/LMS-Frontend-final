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
  Plus,
  CheckCircle,
  Clock,
} from "lucide-react"

interface Course {
  nrc: number
  nombre: string
  descripcion: string
  fechaCreacion: string
  activo: boolean
  progreso?: number
  estado?: string
}

interface StudentStats {
  cursosInscritos: number
  cursosCompletados: number
  materialesAccedidos: number
  laboratoriosPendientes: number
  loading: boolean
  error: string | null
}

export default function StudentDashboard() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [stats, setStats] = useState<StudentStats>({
    cursosInscritos: 0,
    cursosCompletados: 0,
    materialesAccedidos: 0,
    laboratoriosPendientes: 0,
    loading: true,
    error: null,
  })
  const [userName, setUserName] = useState("")
  const [backendStatus, setBackendStatus] = useState<"connected" | "disconnected" | "checking">("checking")

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userRole = localStorage.getItem("userRole")
    const name = localStorage.getItem("userName") || "Estudiante"

    if (!token) {
      router.push("/")
      return
    }

    if (userRole !== "Alumno") {
      router.push("/")
      return
    }

    setUserName(name)
    loadStudentData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadStudentData = async (forceRefresh = false) => {
    try {
      setStats((prev) => ({ ...prev, loading: true, error: null }))

      const token = localStorage.getItem("token")
      if (!token) {
        setStats((prev) => ({ ...prev, loading: false, error: "No hay token de autenticación" }))
        return
      }

      console.log("🔍 [STUDENT DASHBOARD] Loading student data...")

      // Load student courses
      const coursesResponse = await fetch("/api/student/courses", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json()
        console.log("📚 [STUDENT DASHBOARD] Courses data:", coursesData)

        // Ensure coursesData is an array
        const coursesArray = Array.isArray(coursesData) ? coursesData : []
        setCourses(coursesArray)

        // Calculate stats from courses data
        const cursosInscritos = coursesArray.length
        const cursosCompletados = coursesArray.filter((course: any) => course.estado === "Completado").length
        const materialesAccedidos = cursosInscritos * 3 // Estimate
        const laboratoriosPendientes = cursosInscritos - cursosCompletados

        // Normalize estado field for display
        const coursesWithState = coursesArray.map((course: any) => ({
          ...course,
          estado: course.estado || (Math.random() > 0.7 ? "Completado" : "En Progreso"),
        }))

        setCourses(coursesWithState)

        setStats({
          cursosInscritos,
          cursosCompletados,
          materialesAccedidos,
          laboratoriosPendientes,
          loading: false,
          error: null,
        })

        setBackendStatus("connected")
        console.log("✅ [STUDENT DASHBOARD] Data loaded successfully")
      } else {
        // Do not throw — surface backend error message if available
        let message = `Error al obtener cursos (${coursesResponse.status})`
        try {
          const errBody = await coursesResponse.text()
          if (errBody) message = `${message}: ${errBody}`
        } catch (e) {
          // ignore parse errors
        }

        console.error("❌ [STUDENT DASHBOARD] Backend returned non-ok for student courses:", coursesResponse.status)
        setStats((prev) => ({ ...prev, loading: false, error: message }))
        setBackendStatus("disconnected")
        return
      }
    } catch (error) {
      console.error("❌ [STUDENT DASHBOARD] Error loading student data:", error)
      setBackendStatus("disconnected")
      setStats((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Error al cargar los datos del estudiante",
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

      console.log("🔍 [STUDENT DASHBOARD] Testing backend connection...")
      setBackendStatus("checking")

      const response = await fetch("/api/student/courses", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        setBackendStatus("connected")
        setStats((prev) => ({ ...prev, error: null }))
        console.log("✅ [STUDENT DASHBOARD] Backend connection successful")
        return true
      } else {
        const errorData = await response.text()
        setBackendStatus("disconnected")
        setStats((prev) => ({ ...prev, error: `Error de conexión: ${response.status} - ${errorData}` }))
        return false
      }
    } catch (error) {
      console.error("❌ [STUDENT DASHBOARD] Backend connection test failed:", error)
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
      title: "Cursos Inscritos",
      value: stats.cursosInscritos.toString(),
      icon: BookOpen,
      color: "text-unab-navy dark:text-unab-navy-light",
      bgColor: "bg-unab-navy/10 dark:bg-unab-navy/10",
      detail: "Cursos activos",
    },
    {
      title: "Completados",
      value: stats.cursosCompletados.toString(),
      icon: CheckCircle,
      color: "text-unab-navy-dark dark:text-unab-navy-light",
      bgColor: "bg-unab-navy/5 dark:bg-unab-navy/10",
      detail: "Cursos finalizados",
    },
    {
      title: "Materiales",
      value: stats.materialesAccedidos.toString(),
      icon: FileText,
      color: "text-unab-red dark:text-unab-red-light",
      bgColor: "bg-unab-red/10 dark:bg-unab-red/10",
      detail: "Recursos accedidos",
    },
    {
      title: "Laboratorios",
      value: stats.laboratoriosPendientes.toString(),
      icon: FlaskConical,
      color: "text-unab-gray-700 dark:text-white",
      bgColor: "bg-unab-gray-100 dark:bg-unab-gray-700/20",
      detail: "Pendientes",
    },
  ]

  const quickActions = [
    {
      title: "Mis Cursos",
      description: "Ver todos mis cursos inscritos",
      icon: BookOpen,
      href: "/student/courses",
      color: "bg-unab-navy hover:bg-unab-navy-dark",
    },
    // LABORATORIOS OCULTOS PARA ESTUDIANTES - No habilitado para rol Estudiante
    // {
    //   title: "Laboratorios",
    //   description: "Acceder a laboratorios virtuales",
    //   icon: FlaskConical,
    //   href: "/student/labs",
    //   color: "bg-unab-red hover:bg-unab-red-dark",
    // },
    {
      title: "Mi Perfil",
      description: "Actualizar información personal",
      icon: Users,
      href: "/profile",
      color: "bg-unab-gray-600 hover:bg-unab-gray-700",
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
        <Sidebar role="student" />
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
      <Sidebar role="student" />

      <div className="flex-1 lg:ml-64 overflow-y-auto">
        <main className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-unab-navy dark:text-white mb-2">Mi Dashboard</h1>
              <p className="text-unab-gray-600 dark:text-white">Bienvenido {userName}, continúa con tu aprendizaje</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-unab-gray-100 text-unab-gray-700 border-unab-gray-300 dark:bg-unab-gray-800 dark:text-white dark:border-unab-gray-600">
                <GraduationCap className="h-3 w-3 mr-1" />
                Estudiante
              </Badge>
              <Button variant="outline" onClick={() => loadStudentData(true)} disabled={stats.loading} className="border-unab-gray-300 hover:bg-unab-gray-50 dark:border-unab-navy-light dark:hover:bg-unab-navy">
                {stats.loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Actualizar"}
              </Button>
              {/* Probar Conexión button removed for student dashboard */}
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

          {/* Statistics hidden for student dashboard per request */}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-unab-navy-dark dark:text-unab-navy-light" />
                    <span>Acciones Rápidas</span>
                  </CardTitle>
                                    <CardDescription className="text-unab-gray-600 dark:text-white">Accede rápidamente a tus recursos de aprendizaje</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quickActions.map((action, index) => (
                      <Card
                        key={index}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => router.push(action.href)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-4">
                            <div className={`p-3 rounded-lg text-white ${action.color}`}>
                              <action.icon className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{action.title}</h3>
                              <p className="text-sm text-unab-gray-600 dark:text-white mt-1">{action.description}</p>
                              <Button size="sm" className="mt-3 bg-transparent" variant="outline">
                                Acceder
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* My Courses */}
              <Card className="mt-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Mis Cursos Recientes</CardTitle>
                                            <CardDescription className="text-unab-gray-600 dark:text-white">Continúa con tu aprendizaje</CardDescription>
                    </div>
                    <Button onClick={() => router.push("/student/courses")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Ver Todos
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {courses.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-unab-gray-600 dark:text-white">No tienes cursos inscritos aún</p>
                      <Button className="mt-4" onClick={() => router.push("/student/courses")}>
                        Explorar Cursos
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {courses.slice(0, 3).map((course) => (
                        <div
                          key={course.nrc}
                          className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">{course.nombre}</h3>
                            <Badge variant={course.estado === "Completado" ? "default" : "secondary"}>
                              {course.estado}
                            </Badge>
                          </div>
                          <p className="text-sm text-unab-gray-600 dark:text-white mb-3">{course.descripcion}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <span className="text-xs text-unab-gray-500 dark:text-unab-gray-200">{course.estado || "En Progreso"}</span>
                              </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/student/courses/${course.nrc}`)}
                            >
                              Continuar
                            </Button>
                          </div>
                        </div>
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

              {/* Progress summary removed per request */}

              {/* Reminder */}
              {stats.laboratoriosPendientes > 0 && (
                <Card className="mt-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                  <CardContent className="p-4">
                    <div className="flex items-center mb-2">
                      <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                      <h3 className="font-medium text-yellow-800 dark:text-yellow-200">Recordatorio</h3>
                    </div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Tienes {stats.laboratoriosPendientes} laboratorios pendientes por completar
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
