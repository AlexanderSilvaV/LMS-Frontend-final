"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AuthenticatedAvatar } from "@/components/authenticated-avatar"
import { User, Mail, Shield, GraduationCap, UserCheck, Save, Camera, Upload, Trash2, ImageIcon } from "lucide-react"

interface UserProfile {
  id: string
  nombre: string
  correo: string
  rut: string
  rol: string
  fotoPerfil?: string
  descripcion?: string
  Descripcion?: string
  fechaCreacion: string
  TieneAvatar?: boolean
}

export default function ProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [userRole, setUserRole] = useState<"admin" | "teacher" | "student">("student")

  // Form states
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
  descripcion: "",
  })

  // Photo preview state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    const role = localStorage.getItem("userRole")

    if (!token) {
      router.push("/")
      return
    }

    // Mapear roles del backend a roles del frontend
    let mappedRole: "admin" | "teacher" | "student" = "student"
    if (role === "Administrador") {
      mappedRole = "admin"
    } else if (role === "Docente") {
      mappedRole = "teacher"
    } else if (role === "Alumno") {
      mappedRole = "student"
    }

    setUserRole(mappedRole)
    loadProfile()
  }, [router])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token") || ""

      const data = await (await import("@/app/lib/backend-service")).backendService.getProfile(token)
      const profileData = data.dato || data

      // Normalize profile data with support for bitmap avatars
      const normalizedProfile = {
        ...profileData,
        rut: profileData.rut || profileData.Rut || profileData.RUT || "",
        // For bitmap avatars, we use the API endpoint instead of direct URLs
        TieneAvatar: profileData.TieneAvatar || profileData.tieneAvatar || false
      }
      
      setProfile(normalizedProfile)
      
      setFormData({
        nombre: profileData.nombre || profileData.Nombre || "",
        descripcion: profileData.descripcion || profileData.Descripcion || "",
        correo: profileData.correo || profileData.Correo || profileData.email || "",
      })

      // Set photo preview for bitmap avatars - use the API endpoint
      const hasAvatar = profileData.TieneAvatar || profileData.tieneAvatar
      if (hasAvatar) {
        const avatarUrl = `/api/profile/photo?t=${Date.now()}`
        setPhotoPreview(avatarUrl)
        // Update localStorage for components that need avatar info
        try { 
          localStorage.setItem("userAvatar", avatarUrl)
          localStorage.setItem("userHasAvatar", "true")
          window.dispatchEvent(new CustomEvent("avatarUpdated", { detail: { avatar: avatarUrl, hasAvatar: true } }))
        } catch (e) {}
      } else {
        setPhotoPreview(null)
        try { 
          localStorage.removeItem("userAvatar")
          localStorage.setItem("userHasAvatar", "false")
          window.dispatchEvent(new CustomEvent("avatarUpdated", { detail: { avatar: null, hasAvatar: false } }))
        } catch (e) {}
      }
    } catch (error) {
      console.error("Error loading profile:", error)
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!profile) return

    try {
      setSaving(true)
      setError("")
      setSuccess("")

      const token = localStorage.getItem("token") || ""
      // Use the authenticated user's endpoint
  const svc = (await import("@/app/lib/backend-service")).backendService
  await svc.updateMyProfile(formData, token)
  // Update description via dedicated endpoint
  await svc.updateMyDescription({ descripcion: formData.descripcion }, token)

      const updatedProfile = { ...profile, ...formData }
      setProfile(updatedProfile)
      localStorage.setItem("userName", formData.nombre)
      localStorage.setItem("userEmail", formData.correo)
      setEditMode(false)
      setSuccess("Perfil actualizado correctamente")
    } catch (error) {
      console.error("Error saving profile:", error)
      setError("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (file: File) => {
    if (!file) return

    // Validate file type (must match backend: jpeg/png)
    const allowedTypes = ["image/jpeg", "image/png"]
    if (!allowedTypes.includes(file.type)) {
      setError("Solo se permiten archivos de imagen (JPG, PNG)")
      return
    }

    // Validate file size (2MB to match backend limits)
    if (file.size > 2 * 1024 * 1024) {
      setError("La imagen no puede ser mayor a 2MB")
      return
    }

    try {
      setUploadingPhoto(true)
      setError("")
      setSuccess("")

      const token = localStorage.getItem("token")
  const formData = new FormData()
  // Backend controller expects the file field named "archivo"
  formData.append("archivo", file)

      const response = await fetch("/api/profile/photo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        
        // Update profile state to reflect avatar upload success
        setProfile((prev) => (prev ? { ...prev, TieneAvatar: true } : null))
        
        // Update preview with timestamped URL to force refresh (for bitmap storage)
        const newPhotoUrl = `/api/profile/photo?t=${Date.now()}`
        setPhotoPreview(newPhotoUrl)
        
        // Update localStorage and notify components about avatar change
        try { 
          localStorage.setItem("userAvatar", newPhotoUrl)
          localStorage.setItem("userHasAvatar", "true")
          window.dispatchEvent(new CustomEvent("avatarUpdated", { detail: { avatar: newPhotoUrl, hasAvatar: true } }))
        } catch (e) {}
        
        setSuccess("Foto de perfil actualizada correctamente")
      } else {
        const errorData = await response.json()
        setError(errorData.mensaje || "Error al subir la foto")
      }
    } catch (error) {
      console.error("Error uploading photo:", error)
      setError("Error al subir la foto")
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleDeletePhoto = async () => {
    try {
      setUploadingPhoto(true)
      setError("")
      setSuccess("")

      const token = localStorage.getItem("token")
      const response = await fetch("/api/profile/photo", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        // Update profile state to reflect avatar deletion
        setProfile((prev) => (prev ? { ...prev, TieneAvatar: false } : null))
        setPhotoPreview(null)
        
        // Update localStorage and notify components about avatar removal
        try { 
          localStorage.removeItem("userAvatar")
          localStorage.setItem("userHasAvatar", "false")
          window.dispatchEvent(new CustomEvent("avatarUpdated", { detail: { avatar: null, hasAvatar: false } }))
        } catch (e) {}
        
        setSuccess("Foto de perfil eliminada correctamente")
      } else {
        const errorData = await response.json()
        setError(errorData.mensaje || "Error al eliminar la foto")
      }
    } catch (error) {
      console.error("Error deleting photo:", error)
      setError("Error al eliminar la foto")
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handlePhotoUpload(file)
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const getRoleInfo = () => {
    if (!profile) return { title: "Usuario", icon: User, color: "text-unab-gray-600 dark:text-white", bgColor: "bg-unab-gray-200 dark:bg-unab-gray-700" }

    switch (profile.rol) {
      case "Administrador":
        return {
          title: "Administrador",
          icon: Shield,
          color: "text-unab-red dark:text-unab-red-light",
          bgColor: "bg-unab-red/10 dark:bg-unab-red/20",
        }
      case "Docente":
        return {
          title: "Docente",
          icon: GraduationCap,
          color: "text-unab-navy dark:text-unab-navy-light",
          bgColor: "bg-unab-navy/10 dark:bg-unab-navy/20",
        }
      case "Alumno":
      default:
        return {
          title: "Estudiante",
          icon: UserCheck,
          color: "text-unab-gray-600 dark:text-white",
          bgColor: "bg-unab-gray-200 dark:bg-unab-gray-700/50",
        }
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-unab-gray-50 dark:bg-unab-navy-dark">
        <Sidebar role={userRole} />
        <div className="flex-1 lg:ml-64">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-unab-red"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex h-screen bg-unab-gray-50 dark:bg-unab-navy-dark">
        <Sidebar role={userRole} />
        <div className="flex-1 lg:ml-64">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-unab-gray-600 dark:text-white">Error al cargar el perfil</p>
              <Button onClick={() => router.back()} className="mt-4 bg-unab-red hover:bg-unab-red-dark text-white">
                Volver
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
      <Sidebar role={userRole} />

      <div className="flex-1 lg:ml-64 overflow-y-auto">
        <main className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-unab-navy dark:text-white mb-2">Mi Perfil</h1>
            <p className="text-unab-gray-600 dark:text-white">Gestiona tu información personal</p>
          </div>

          {/* Alerts */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 border-unab-navy/30 bg-unab-navy/5 text-unab-navy-dark dark:border-unab-navy-light/30 dark:bg-unab-navy-light/10 dark:text-unab-navy-light">
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
                                            <CardDescription className="text-unab-gray-600 dark:text-white">Actualiza tu información personal y datos de contacto</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => setEditMode(!editMode)} disabled={saving}>
                      {editMode ? "Cancelar" : "Editar"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Photo Section */}
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <AuthenticatedAvatar
                        src={photoPreview}
                        alt="Foto de perfil"
                        fallback={profile.nombre.charAt(0).toUpperCase()}
                        size="lg"
                        className={`h-24 w-24 text-2xl ${roleInfo.bgColor} ${roleInfo.color}`}
                      />

                      {/* Photo Upload/Edit Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 bg-transparent"
                        onClick={triggerFileSelect}
                        disabled={uploadingPhoto}
                      >
                        {uploadingPhoto ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                      </Button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>

                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-unab-navy dark:text-white mb-2">{profile.nombre}</h3>
                      <Badge variant="outline" className={`${roleInfo.bgColor} ${roleInfo.color} border-current mb-3`}>
                        <roleInfo.icon className="h-3 w-3 mr-1" />
                        {roleInfo.title}
                      </Badge>

                      {/* Photo Management Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={triggerFileSelect}
                          disabled={uploadingPhoto}
                          className="flex items-center gap-2 bg-transparent"
                        >
                          <Upload className="h-4 w-4" />
                          {photoPreview ? "Cambiar foto" : "Subir foto"}
                        </Button>

                        {photoPreview && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleDeletePhoto}
                            disabled={uploadingPhoto}
                            className="flex items-center gap-2 text-unab-red hover:text-unab-red-dark bg-transparent border-unab-red hover:border-unab-red-dark"
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </Button>
                        )}
                      </div>

                      {uploadingPhoto && (
                        <p className="text-sm text-unab-gray-500 dark:text-unab-gray-400 mt-2">
                          {photoPreview ? "Actualizando foto..." : "Subiendo foto..."}
                        </p>
                      )}
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
                          placeholder="Ingresa tu nombre completo"
                        />
                      ) : (
                        <div className="flex items-center space-x-2 p-3 bg-unab-gray-50 dark:bg-unab-navy rounded-md border border-unab-gray-200 dark:border-unab-navy-light">
                          <User className="h-4 w-4 text-unab-gray-500 dark:text-unab-gray-400" />
                          <span className="text-unab-navy dark:text-unab-gray-200">{profile.nombre}</span>
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
                          placeholder="Ingresa tu correo electrónico"
                        />
                      ) : (
                        <div className="flex items-center space-x-2 p-3 bg-unab-gray-50 dark:bg-unab-navy rounded-md border border-unab-gray-200 dark:border-unab-navy-light">
                          <Mail className="h-4 w-4 text-unab-gray-500 dark:text-unab-gray-400" />
                          <span className="text-unab-navy dark:text-unab-gray-200">{profile.correo}</span>
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="descripcion">Descripción</Label>
                      {editMode ? (
                        <textarea
                          id="descripcion"
                          value={formData.descripcion}
                          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                          placeholder="Escribe una breve descripción sobre ti (aparece en tu perfil)"
                          className="w-full p-2 border rounded-md bg-white dark:bg-unab-navy border-unab-gray-300 dark:border-unab-navy-light text-unab-navy dark:text-unab-gray-200 focus:border-unab-red focus:ring-unab-red"
                          rows={3}
                        />
                      ) : (
                        <div className="p-3 bg-unab-gray-50 dark:bg-unab-navy rounded-md border border-unab-gray-200 dark:border-unab-navy-light text-sm text-unab-navy dark:text-unab-gray-200">
                          {profile?.descripcion || profile?.Descripcion || "No hay descripción"}
                        </div>
                      )}
                    </div>

                    {/* RUT field intentionally hidden in profile UI */}

                    <div className="space-y-2">
                      <Label>Rol en el sistema</Label>
                      <div className="p-3 bg-unab-gray-50 dark:bg-unab-navy rounded-md border border-unab-gray-200 dark:border-unab-navy-light">
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
                      <Button onClick={handleSaveProfile} disabled={saving} className="bg-unab-red hover:bg-unab-red-dark text-white">
                        {saving ? "Guardando..." : "Guardar cambios"}
                        <Save className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Stats Sidebar */}
            <div>
              {/* Photo Tips Card */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Foto de Perfil
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-unab-gray-600 dark:text-unab-gray-400">
                    <p>
                      <strong className="text-unab-navy dark:text-white">Formatos permitidos:</strong> JPG, PNG
                    </p>
                    <p>
                      <strong className="text-unab-navy dark:text-white">Tamaño máximo:</strong> 2MB
                    </p>
                    <p>
                      <strong className="text-unab-navy dark:text-white">Recomendación:</strong> Imagen cuadrada para mejor resultado
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Información de Cuenta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-unab-gray-600 dark:text-unab-gray-400">Tipo de cuenta</span>
                    <Badge variant="outline" className={`${roleInfo.bgColor} ${roleInfo.color} border-current`}>
                      {roleInfo.title}
                    </Badge>
                  </div>
                  {/* RUT hidden on personal account card */}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
