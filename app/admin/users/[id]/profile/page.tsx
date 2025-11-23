"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, User, Mail, Shield, GraduationCap, UserCheck, Save, Calendar } from "lucide-react"

interface UserProfile {
  id: string
  nombre: string
  correo: string
  rut: string
  rol: string
  fotoPerfil?: string
  fechaCreacion: string
}

interface CourseInfo {
  id: string
  nombre: string
  rol: string
  fechaAsignacion: string
  activo: boolean
}

interface CourseStats {
  totalCursos: number
  cursosActivos: number
  cursosInactivos: number
  cursos: CourseInfo[]
}

export default function UserProfilePage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [courseStats, setCourseStats] = useState<CourseStats>({
    totalCursos: 0,
    cursosActivos: 0,
    cursosInactivos: 0,
    cursos: [],
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form states
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
  })

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userRole = localStorage.getItem("userRole")

    if (!token) {
      router.push("/")
      return
    }

    if (userRole !== "Administrador") {
      router.push("/")
      return
    }

    if (userId) {
      loadUserProfile()
    }
  }, [router, userId])

  const loadUserProfile = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token") || ""
      try {
        const { backendService } = await import("@/app/lib/backend-service")
        const data = await backendService.getUserById(userId, token)
        const profileData = data.dato || data

        setProfile(profileData)
        setFormData({ nombre: profileData.nombre, correo: profileData.correo })

        if (profileData.rol === "Alumno" || profileData.rol === "Docente") {
          await loadCourseStats(profileData.id)
        }
      } catch (err) {
        setError("Error al cargar el perfil del usuario")
      }
    } catch (error) {
      console.error("Error loading user profile:", error)
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const loadCourseStats = async (userId: string) => {
    try {
      try {
        const token = localStorage.getItem("token") || ""
        const { backendService } = await import("@/app/lib/backend-service")
        const data = await backendService.getUserCourses(userId, token)
        const cursos = data.map((item: any) => ({
          id: item.curso?.id || item.cursoId || item.cursoNrc || item.nrc,
          nombre: item.curso?.nombre || item.nombre || "Curso sin nombre",
          rol: item.rol || item.rolEnCurso,
          fechaAsignacion: item.fechaAsignacion,
          activo: item.curso?.activo !== undefined ? item.curso.activo : true,
        }))

        setCourseStats({
          totalCursos: cursos.length,
          cursosActivos: cursos.filter((c: CourseInfo) => c.activo).length,
          cursosInactivos: cursos.filter((c: CourseInfo) => !c.activo).length,
          cursos: cursos,
        })
      } catch (err) {
        console.error("Error loading course stats:", err)
      }
    } catch (error) {
      console.error("Error loading course stats:", error)
    }
  }

  const handleSaveProfile = async () => {
    if (!profile) return

    try {
      setSaving(true)
      setError("")
      setSuccess("")

      const token = localStorage.getItem("token") || ""
      try {
        const { backendService } = await import("@/app/lib/backend-service")
        await backendService.updateUser(profile.id, formData, token)
        const updatedProfile = { ...profile, ...formData }
        setProfile(updatedProfile)
        setEditMode(false)
        setSuccess("Perfil actualizado correctamente")
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al actualizar el perfil"
        setError(message)
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      setError("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  const getRoleInfo = () => {
    if (!profile) return { title: "Usuario", icon: User, color: "text-gray-600", bgColor: "bg-gray-100" }

    switch (profile.rol) {
      case "Administrador":
        return {
          title: "Administrador",
          icon: Shield,
          color: "text-red-600",
          bgColor: "bg-red-100 dark:bg-red-900/20",
        }
      case "Docente":
        return {
          title: "Docente",
          icon: GraduationCap,
          color: "text-blue-600",
          bgColor: "bg-blue-100 dark:bg-blue-900/20",
        }
      case "Alumno":
      default:
        return {
          title: "Estudiante",
          icon: UserCheck,
          color: "text-green-600",
          bgColor: "bg-green-100 dark:bg-green-900/20",
        }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-unab-gray-50 dark:bg-unab-navy-dark">
        <Sidebar role="admin" />
        <div className="flex-1 lg:ml-64">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex h-screen bg-unab-gray-50 dark:bg-unab-navy-dark">
        <Sidebar role="admin" />
        <div className="flex-1 lg:ml-64">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400">Usuario no encontrado</p>
              <Button onClick={() => router.push("/admin/users")} className="mt-4">
                Volver a Usuarios
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const roleInfo = getRoleInfo()

  return (
    <div className="flex h-screen bg-unab-gray-50 dark:bg-unab-navy-dark">
      <Sidebar role="admin" />

      <div className="flex-1 lg:ml-64 overflow-y-auto">
        <main className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="outline" size="sm" onClick={() => router.push("/admin/users")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Perfil de Usuario</h1>
            <p className="text-gray-600 dark:text-gray-400">Gestiona la información del usuario</p>
          </div>

          {/* Alerts */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Info */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Información Personal</CardTitle>
                      <CardDescription className="text-unab-gray-600 dark:text-white">Información del usuario en el sistema</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => setEditMode(!editMode)} disabled={saving}>
                      {editMode ? "Cancelar" : "Editar"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Header */}
                  <div className="flex items-center space-x-6">
                    <Avatar className="h-24 w-24">
                      {profile.fotoPerfil ? (
                        <AvatarImage
                          src={`${process.env.NEXT_PUBLIC_API_URL || "https://localhost:7297"}${profile.fotoPerfil}`}
                          alt="Foto de perfil"
                        />
                      ) : (
                        <AvatarFallback className={`text-2xl ${roleInfo.bgColor} ${roleInfo.color}`}>
                          {profile.nombre.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{profile.nombre}</h3>
                      <Badge variant="outline" className={`${roleInfo.bgColor} ${roleInfo.color} border-current mb-2`}>
                        <roleInfo.icon className="h-3 w-3 mr-1" />
                        {roleInfo.title}
                      </Badge>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4 mr-1" />
                        Registrado el {formatDate(profile.fechaCreacion)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre completo</Label>
                      {editMode ? (
                        <Input
                          id="nombre"
                          value={formData.nombre}
                          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                          placeholder="Ingresa el nombre completo"
                        />
                      ) : (
                        <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                          <User className="h-4 w-4 text-gray-500" />
                          <span>{profile.nombre}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="correo">Correo electrónico</Label>
                      {editMode ? (
                        <Input
                          id="correo"
                          type="email"
                          value={formData.correo}
                          onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                          placeholder="Ingresa el correo electrónico"
                        />
                      ) : (
                        <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span>{profile.correo}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>RUT</Label>
                      <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <span className="text-gray-600 dark:text-gray-400">{profile.rut}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Rol en el sistema</Label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <Badge variant="outline" className={`${roleInfo.bgColor} ${roleInfo.color} border-current`}>
                          <roleInfo.icon className="h-3 w-3 mr-1" />
                          {roleInfo.title}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {editMode && (
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setEditMode(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveProfile} disabled={saving}>
                        {saving ? "Guardando..." : "Guardar cambios"}
                        <Save className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Courses Section */}
              {(profile.rol === "Alumno" || profile.rol === "Docente") && courseStats.cursos.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Cursos Asociados</CardTitle>
                    <CardDescription className="text-unab-gray-600 dark:text-white">Cursos en los que participa este usuario</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {courseStats.cursos.map((curso) => (
                        <div key={curso.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{curso.nombre}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">
                                {curso.rol}
                              </Badge>
                              <Badge variant={curso.activo ? "default" : "secondary"}>
                                {curso.activo ? "Activo" : "Inactivo"}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(curso.fechaAsignacion)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Stats Sidebar */}
            <div>
              {(profile.rol === "Alumno" || profile.rol === "Docente") && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Estadísticas de Cursos</CardTitle>
                    <CardDescription className="text-unab-gray-600 dark:text-white">Resumen de participación</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total de cursos</span>
                      <Badge variant="outline">{courseStats.totalCursos}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Cursos activos</span>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        {courseStats.cursosActivos}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Cursos inactivos</span>
                      <Badge className="bg-gray-100 text-gray-800 border-gray-200">{courseStats.cursosInactivos}</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Información de Cuenta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Tipo de cuenta</span>
                    <Badge variant="outline" className={`${roleInfo.bgColor} ${roleInfo.color} border-current`}>
                      {roleInfo.title}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">RUT</span>
                    <span className="text-sm font-mono">{profile.rut}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Fecha de registro</span>
                    <span className="text-sm">{formatDate(profile.fechaCreacion)}</span>
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
