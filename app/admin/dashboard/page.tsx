"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Users,
  BookOpen,
  FileText,
  Settings,
  TrendingUp,
  Activity,
  Shield,
  Database,
  Atom,
  Layers,
  AlertCircle,
  RefreshCw,
  Bug,
} from "lucide-react"
import { dashboardService, type DashboardStats } from "@/app/lib/dashboard-service"

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsuarios: 0,
    totalCursos: 0,
    totalModulos: 0,
    totalMateriales: 0,
    cursosActivos: 0,
    cursosInactivos: 0,
    loading: true,
    error: null,
  })
  const [userName, setUserName] = useState("")
  const [backendStatus, setBackendStatus] = useState<"connected" | "disconnected" | "checking">("checking")
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    const name = localStorage.getItem("userName") || "Administrador"
    setUserName(name)
    loadStats()
  }, [])

  const loadStats = async (forceRefresh = false) => {
    try {
      setStats((prev) => ({ ...prev, loading: true }))
      const newStats = await dashboardService.getStats(forceRefresh)
      setStats(newStats)

      if (newStats.error) {
        setBackendStatus("disconnected")
      } else {
        setBackendStatus("connected")
      }
    } catch (error) {
      console.error("❌ [DASHBOARD] Error loading stats:", error)
      setBackendStatus("disconnected")
      setStats((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      }))
    }
  }

  // Server test and debug functions removed per request

  const statsCards = [
    {
      title: "Usuarios",
      value: stats.totalUsuarios.toString(),
      icon: Users,
      color: "text-unab-navy dark:text-unab-navy-light",
      bgColor: "bg-unab-navy/10 dark:bg-unab-navy/20",
    },
    {
      title: "Total Cursos",
      value: stats.totalCursos.toString(),
      icon: BookOpen,
      color: "text-unab-red dark:text-unab-red-light",
      bgColor: "bg-unab-red/10 dark:bg-unab-red/20",
      detail:
        stats.cursosActivos > 0 || stats.cursosInactivos > 0
          ? `${stats.cursosActivos} activos, ${stats.cursosInactivos} inactivos`
          : undefined,
    },
    {
      title: "Materiales",
      value: stats.totalMateriales.toString(),
      icon: FileText,
      color: "text-unab-red dark:text-unab-red-light",
      bgColor: "bg-unab-red/10 dark:bg-unab-red/10",
    },
    {
      title: "Módulos",
      value: stats.totalModulos.toString(),
      icon: Layers,
      color: "text-unab-navy dark:text-unab-navy-light",
      bgColor: "bg-unab-navy/10 dark:bg-unab-navy/10",
    },
  ]

  const recentActivities = [
    {
      title: "Sistema iniciado",
      time: "Hace 1 hora",
      type: "system",
      icon: Settings,
    },
    {
      title: "Conexión con base de datos establecida",
      time: "Hace 1 hora",
      type: "database",
      icon: Database,
    },
    {
      title: "Panel de administración cargado",
      time: "Ahora",
      type: "admin",
      icon: Shield,
    },
  ]

  const quickActions = [
    {
      title: "Crear Usuario",
      description: "Agregar nuevo estudiante o docente",
      icon: Users,
      href: "/admin/users",
      color: "bg-unab-navy hover:bg-unab-navy-dark",
    },
    {
      title: "Nuevo Curso",
      description: "Crear un nuevo curso",
      icon: BookOpen,
      href: "/admin/courses",
      color: "bg-unab-navy hover:bg-unab-navy-dark",
    },
    {
      title: "Gestionar Módulos",
      description: "Organizar contenido educativo",
      icon: Atom,
      href: "/admin/modules",
      color: "bg-unab-navy hover:bg-unab-navy-dark",
    },
    {
      title: "Asignar Cursos",
      description: "Asignar profesores y estudiantes",
      icon: Users,
      href: "/admin/courses",
      color: "bg-unab-navy-light hover:bg-unab-navy",
    },
  ]

  const handleQuickAction = (href: string) => {
    router.push(href)
  }

  return (
    <div className="flex h-screen bg-unab-gray-50 dark:bg-unab-navy-dark">
      <Sidebar role="admin" />

      <div className="flex-1 lg:ml-64 overflow-y-auto">
        <main className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-unab-navy dark:text-white mb-2">Panel de Administración</h1>
              <p className="text-unab-gray-600 dark:text-white">
                Gestiona usuarios, cursos y configuraciones del sistema
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-unab-red/10 text-unab-red border-unab-red/20 dark:bg-unab-red/20 dark:text-unab-red-light">
                <Shield className="h-3 w-3 mr-1" />
                Administrador
              </Badge>
              <Button variant="outline" onClick={() => loadStats(true)} disabled={stats.loading} className="border-unab-gray-300 hover:bg-unab-gray-50 dark:border-unab-navy-light dark:hover:bg-unab-navy">
                {stats.loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Actualizar"}
              </Button>
              {/* Server test buttons removed */}
            </div>
          </div>

          {/* Error Alert */}
          {stats.error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{stats.error}</AlertDescription>
            </Alert>
          )}

          {/* Backend Status Alert */}
          {backendStatus === "disconnected" && (
            <Alert className="mb-6 border-unab-red/30 bg-unab-red/5 text-unab-red dark:border-unab-red/50 dark:bg-unab-red/10 dark:text-unab-red-light">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Advertencia:</strong> No se pudo conectar con el backend. Verifique que el servidor esté
                ejecutándose en {process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"}.
              </AlertDescription>
            </Alert>
          )}

          {/* Debug Info */}
          {debugInfo && (
            <Alert className="mb-6 border-unab-navy/30 bg-unab-navy/5 text-unab-navy-dark dark:border-unab-navy-light/30 dark:bg-unab-navy-light/10 dark:text-unab-navy-light">
              <Bug className="h-4 w-4" />
              <AlertDescription>
                <strong>Debug Info:</strong> Backend URL: {debugInfo.backendUrl} | Usuarios:{" "}
                {debugInfo.endpoints.users?.count || 0} | Cursos: {debugInfo.endpoints.courses?.count || 0} | Módulos:{" "}
                {debugInfo.endpoints.modules?.count || 0}
              </AlertDescription>
            </Alert>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsCards.map((stat, index) => (
              <Card key={index} className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-unab-gray-600 dark:text-unab-gray-400">{stat.title}</p>
                      <p className="text-3xl font-bold text-unab-navy dark:text-white">
                        {stats.loading ? "..." : stat.value}
                      </p>
                      {stat.detail && (
                        <p className="text-xs text-unab-gray-500 dark:text-unab-gray-400 mt-1">
                          <Activity className="inline h-3 w-3 mr-1" />
                          {stat.detail}
                        </p>
                      )}
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-unab-red" />
                    <span className="text-unab-navy dark:text-white">Acciones Rápidas</span>
                  </CardTitle>
                  <CardDescription className="text-unab-gray-600 dark:text-white">Tareas administrativas más comunes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quickActions.map((action, index) => (
                      <Card
                        key={index}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleQuickAction(action.href)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-4">
                            <div className={`p-3 rounded-lg text-white ${action.color}`}>
                              <action.icon className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-unab-navy dark:text-white">{action.title}</h3>
                              <p className="text-sm text-unab-gray-600 dark:text-white mt-1">{action.description}</p>
                              <Button size="sm" className="mt-3 bg-unab-red hover:bg-unab-red-dark text-white border-0" variant="outline">
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
            </div>

            {/* Recent Activity */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-unab-navy dark:text-unab-navy-light" />
                    <span>Actividad del Sistema</span>
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
                    <Database className="h-5 w-5 text-green-600" />
                    <span>Estado del Sistema</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-unab-gray-600 dark:text-white">Frontend</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Operativo
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-unab-gray-600 dark:text-white">API Backend</span>
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
                    <span className="text-sm text-unab-gray-600 dark:text-white">Base de Datos</span>
                    <Badge
                      variant="outline"
                      className={
                        backendStatus === "connected"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
                      }
                    >
                      {backendStatus === "connected" ? "Operativo" : "Desconocido"}
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
