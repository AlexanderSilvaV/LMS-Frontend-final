"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Image from "next/image"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Users,
  AlertCircle,
  RefreshCw,
  UserPlus,
  UserMinus,
  GraduationCap,
  UserCheck,
  Loader2,
  CheckCircle,
  FileText,
  Copy,
  ImageUp,
  ImageOff,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { courseService, type Course } from "@/app/lib/course-service"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CreateCourseData {
  nrc: number
  nombre: string
  descripcion: string
  activo: boolean
}

interface User {
  id: string
  nombre: string
  apellido?: string
  email: string
  rol: string
}

interface CourseAssignment {
  usuarioId: string
  cursoId: number
  nombreUsuario: string
  email: string
  rolEnCurso: string
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [createCourseData, setCreateCourseData] = useState<CreateCourseData>({
    nrc: 0,
    nombre: "",
    descripcion: "",
    activo: true,
  })
  const [editCourseData, setEditCourseData] = useState({
    nombre: "",
    descripcion: "",
    activo: true,
  })
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [createCoverPreview, setCreateCoverPreview] = useState<string | null>(null)
  const [createCoverFile, setCreateCoverFile] = useState<File | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const itemsPerPage = 12
  const { toast } = useToast()

  // User assignment states
  const [showUsersDialog, setShowUsersDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [selectedCourseForUsers, setSelectedCourseForUsers] = useState<Course | null>(null)
  const [courseUsers, setCourseUsers] = useState<CourseAssignment[]>([])
  
  // Duplicate course states
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
  const [selectedCourseForDuplicate, setSelectedCourseForDuplicate] = useState<Course | null>(null)
  const [duplicateCourseData, setDuplicateCourseData] = useState({
    nrc: 0,
    nombre: "",
    descripcion: "",
  })
  const [duplicating, setDuplicating] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState("")
  const [selectedRole, setSelectedRole] = useState("Estudiante")
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [assigningUser, setAssigningUser] = useState(false)
  const [removingUser, setRemovingUser] = useState<string | null>(null)
  const [allCourseAssignments, setAllCourseAssignments] = useState<Record<number, CourseAssignment[]>>({})
  const [loadingAssignments, setLoadingAssignments] = useState(false)

  const buildCoverProxyUrl = (nrc: number, portadaUrl?: string | null) => {
    if (!portadaUrl || portadaUrl.trim() === "") {
      return null
    }

    // Si ya es una URL completa de S3, usarla directamente
    if (portadaUrl.startsWith('http://') || portadaUrl.startsWith('https://')) {
      return portadaUrl
    }

    // Si no, usar el proxy (para compatibilidad con URLs relativas)
    return `/api/courses/${nrc}/cover?ref=${encodeURIComponent(portadaUrl)}`
  }

  useEffect(() => {
    loadCourses()
    loadAvailableUsers()
  }, [currentPage])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        loadCourses()
      } else {
        setCurrentPage(1)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const loadAllCourseAssignments = async () => {
    try {
      setLoadingAssignments(true)
      const token = localStorage.getItem("token")

      if (courses.length === 0) {
        setLoadingAssignments(false)
        return
      }

      console.log("📊 [COURSES-PAGE] Loading assignments for", courses.length, "courses")

      const assignmentPromises = courses.map(async (course) => {
        try {
          const response = await fetch(`/api/course-users/course/${course.nrc}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          })

          if (response.ok) {
            const data = await response.json()
            const users = data.exito && data.dato ? (Array.isArray(data.dato) ? data.dato : [data.dato]) : []
            console.log(`📊 Course ${course.nrc} has ${users.length} assigned users`)
            return { courseNrc: course.nrc, users }
          }
          return { courseNrc: course.nrc, users: [] }
        } catch (error) {
          console.error(`Error loading users for course ${course.nrc}:`, error)
          return { courseNrc: course.nrc, users: [] }
        }
      })

      const results = await Promise.all(assignmentPromises)
      const assignmentsMap: Record<number, CourseAssignment[]> = {}

      results.forEach(({ courseNrc, users }) => {
        assignmentsMap[courseNrc] = users
      })

      setAllCourseAssignments(assignmentsMap)
      console.log("✅ [COURSES-PAGE] All course assignments loaded:", assignmentsMap)
    } catch (error) {
      console.error("Error loading course assignments:", error)
    } finally {
      setLoadingAssignments(false)
    }
  }

  const loadCourses = async () => {
    try {
      setLoading(true)
      setError("")

      console.log("🔍 [COURSES-PAGE] Loading courses...")

      const response = await courseService.getCourses({
        nombre: searchTerm.trim() || undefined,
        pagina: currentPage,
        cantidadPorPagina: itemsPerPage,
      })

      console.log("📚 [COURSES-PAGE] Courses loaded:", response.cursos.length)

      setCourses(response.cursos)
      setTotalPages(response.paginacion.totalPaginas)
      setTotalResults(response.paginacion.totalResultados)

      if (response.cursos.length === 0 && !searchTerm) {
        console.log("⚠️ [COURSES-PAGE] No courses found, trying fallback data...")
        const testCourses = await courseService.loadTestData()
        setCourses(testCourses.cursos)
        setTotalResults(testCourses.paginacion?.totalResultados ?? testCourses.cursos.length)
        setTotalPages(1)
      }

      // Load course assignments after courses are loaded
      setTimeout(() => {
        loadAllCourseAssignments()
      }, 100)
    } catch (error) {
      console.error("❌ [COURSES-PAGE] Error loading courses:", error)
      setError(`Error de conexión: ${error instanceof Error ? error.message : "Error desconocido"}`)

      try {
  const testCourses = await courseService.loadTestData()
  setCourses(testCourses.cursos)
  setTotalResults(testCourses.paginacion?.totalResultados ?? testCourses.cursos.length)
  setTotalPages(1)

        toast({
          title: "Modo sin conexión",
          description: "Mostrando datos de prueba. Verifica la conexión al servidor.",
          variant: "destructive",
        })
      } catch (fallbackError) {
        console.error("❌ [COURSES-PAGE] Fallback also failed:", fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableUsers = async () => {
    try {
  const token = localStorage.getItem("token") || ""
  const { backendService } = await import("@/app/lib/backend-service")
  const data = await backendService.getUsers({ paginaActual: 1, cantidadPorPagina: 100 }, token)
  setAvailableUsers(data.usuarios || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const loadCourseUsers = async (courseNrc: number) => {
    try {
      setLoadingUsers(true)
      const token = localStorage.getItem("token")

      const { backendService } = await import("@/app/lib/backend-service")
      try {
        const data = await backendService.getCourseUsers(courseNrc, token || "")
        setCourseUsers(Array.isArray(data) ? data : [])
      } catch (err) {
        setCourseUsers([])
      }
    } catch (error) {
      console.error("Error fetching course users:", error)
      setCourseUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleShowUsers = async (course: Course) => {
    setSelectedCourseForUsers(course)
    setShowUsersDialog(true)
    await loadCourseUsers(course.nrc)
  }

  // Export functionality removed per request

  const handleAssignUser = async () => {
    if (!selectedUser || !selectedCourseForUsers || !selectedRole) {
      setError("Debe seleccionar un usuario y un rol")
      return
    }

    try {
      setAssigningUser(true)
      setError("")
      const token = localStorage.getItem("token")

      const response = await fetch("/api/course-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          usuarioId: selectedUser,
          cursoId: selectedCourseForUsers.nrc,
          rolEnCurso: selectedRole,
        }),
      })

      if (response.ok) {
        const user = availableUsers.find((u) => u.id === selectedUser)
        setSuccess(`Usuario ${user?.nombre} asignado exitosamente como ${selectedRole}`)
        setShowAssignDialog(false)
        setSelectedUser("")
        setSelectedRole("Estudiante")
        await loadCourseUsers(selectedCourseForUsers.nrc)

        // Refresh all course assignments to update the counts
        await loadAllCourseAssignments()

        toast({
          title: "✅ Usuario Asignado",
          description: `${user?.nombre} ha sido asignado como ${selectedRole}`,
        })
      } else {
        const errorData = await response.json()
        setError(errorData.mensaje || "Error al asignar usuario")
        toast({
          title: "❌ Error",
          description: errorData.mensaje || "Error al asignar usuario",
          variant: "destructive",
        })
      }
    } catch (error) {
      setError("Error de conexión al asignar usuario")
      toast({
        title: "❌ Error de Conexión",
        description: "No se pudo conectar con el servidor",
        variant: "destructive",
      })
    } finally {
      setAssigningUser(false)
    }
  }

  const handleRemoveUser = async (usuarioId: string) => {
    if (!selectedCourseForUsers) return

    const user = availableUsers.find((u) => u.id === usuarioId)
    if (!confirm(`¿Estás seguro de que deseas desasignar a ${user?.nombre} del curso?`)) return

    try {
      setRemovingUser(usuarioId)
      setError("")
      const token = localStorage.getItem("token")

      const response = await fetch("/api/course-users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          usuarioId: usuarioId,
          cursoId: selectedCourseForUsers.nrc,
        }),
      })

      if (response.ok) {
        setSuccess(`Usuario ${user?.nombre} desasignado exitosamente`)
        await loadCourseUsers(selectedCourseForUsers.nrc)

        // Refresh all course assignments to update the counts
        await loadAllCourseAssignments()

        toast({
          title: "✅ Usuario Desasignado",
          description: `${user?.nombre} ha sido removido del curso`,
        })
      } else {
        const errorData = await response.json()
        setError(errorData.mensaje || "Error al desasignar usuario")
        toast({
          title: "❌ Error",
          description: errorData.mensaje || "Error al desasignar usuario",
          variant: "destructive",
        })
      }
    } catch (error) {
      setError("Error de conexión al desasignar usuario")
      toast({
        title: "❌ Error de Conexión",
        description: "No se pudo conectar con el servidor",
        variant: "destructive",
      })
    } finally {
      setRemovingUser(null)
    }
  }

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Validation
    if (!createCourseData.nrc || createCourseData.nrc <= 0) {
      setError("El NRC debe ser un número positivo")
      return
    }

    if (!createCourseData.nombre.trim()) {
      setError("El nombre del curso es obligatorio")
      return
    }

    if (createCourseData.nombre.trim().length < 3) {
      setError("El nombre del curso debe tener al menos 3 caracteres")
      return
    }

    if (!createCourseData.descripcion.trim()) {
      setError("La descripción del curso es obligatoria")
      return
    }

    if (createCourseData.descripcion.trim().length < 10) {
      setError("La descripción debe tener al menos 10 caracteres")
      return
    }

    try {
      console.log("🔍 [COURSES-PAGE] Creating course:", createCourseData)

      const newCourseNrc = createCourseData.nrc
      await courseService.createCourse(createCourseData)

      if (createCoverFile) {
        const formData = new FormData()
        formData.append("archivo", createCoverFile)

        const response = await fetch(`/api/courses/${newCourseNrc}/cover`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
          body: formData,
        })

        if (!response.ok) {
          const data = await response.json().catch(() => null)
          throw new Error(data?.mensaje || "Curso creado pero la portada no pudo subirse.")
        }
      }

      setSuccess("Curso creado exitosamente")
      resetCreateCoverState()
      setShowCreateDialog(false)
      setCreateCourseData({
        nrc: 0,
        nombre: "",
        descripcion: "",
        activo: true,
      })

      toast({
        title: "Éxito",
        description: "Curso creado exitosamente",
      })

      setTimeout(() => {
        loadCourses()
      }, 500)
    } catch (error) {
      console.error("❌ [COURSES-PAGE] Error creating course:", error)
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      setError(errorMessage)

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleEditCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCourse) return

    setError("")
    setSuccess("")

    try {
      console.log("🔍 [COURSES-PAGE] Updating course:", selectedCourse.nrc, editCourseData)

      await courseService.updateCourse(selectedCourse.nrc, editCourseData)

      if (coverFile) {
        const formData = new FormData()
        formData.append("archivo", coverFile)

        const response = await fetch(`/api/courses/${selectedCourse.nrc}/cover`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
          body: formData,
        })

        if (!response.ok) {
          const data = await response.json().catch(() => null)
          throw new Error(data?.mensaje || "Error al subir la portada")
        }
      }

      setSuccess("Curso actualizado exitosamente")
      closeEditDialog()

      toast({
        title: "Éxito",
        description: "Curso actualizado exitosamente",
      })

      loadCourses()
    } catch (error) {
      console.error("❌ [COURSES-PAGE] Error updating course:", error)
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      setError(errorMessage)

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleDeleteCourse = async (nrc: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este curso?")) return

    try {
      console.log("🔍 [COURSES-PAGE] Deleting course:", nrc)

      await courseService.deleteCourse(nrc)

      setSuccess("Curso eliminado exitosamente")

      toast({
        title: "Éxito",
        description: "Curso eliminado exitosamente",
      })

      loadCourses()
    } catch (error) {
      console.error("❌ [COURSES-PAGE] Error deleting course:", error)
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      setError(errorMessage)

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const openDuplicateDialog = (course: Course) => {
    setSelectedCourseForDuplicate(course)
    setDuplicateCourseData({
      nrc: 0,
      nombre: `${course.nombre} (Copia)`,
      descripcion: course.descripcion || "",
    })
    setShowDuplicateDialog(true)
  }

  const handleDuplicateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCourseForDuplicate) return

    // Enhanced validation
    if (!duplicateCourseData.nrc || duplicateCourseData.nrc <= 0) {
      setError("El NRC debe ser un número positivo")
      toast({
        title: "Error de validación",
        description: "El NRC debe ser un número positivo",
        variant: "destructive",
      })
      return
    }

    if (duplicateCourseData.nrc === selectedCourseForDuplicate.nrc) {
      setError("El nuevo NRC debe ser diferente al NRC original")
      toast({
        title: "Error de validación",
        description: "El nuevo NRC debe ser diferente al NRC original",
        variant: "destructive",
      })
      return
    }

    if (!duplicateCourseData.nombre.trim()) {
      setError("El nombre del curso es obligatorio")
      toast({
        title: "Error de validación",
        description: "El nombre del curso es obligatorio",
        variant: "destructive",
      })
      return
    }

    if (duplicateCourseData.nombre.trim().length < 3) {
      setError("El nombre debe tener al menos 3 caracteres")
      toast({
        title: "Error de validación",
        description: "El nombre debe tener al menos 3 caracteres",
        variant: "destructive",
      })
      return
    }

    try {
      setDuplicating(true)
      setError("")

      console.log("🔍 [COURSES-PAGE] Duplicating course:", {
        nrcOriginal: selectedCourseForDuplicate.nrc,
        newData: duplicateCourseData
      })

      // Use the duplicate endpoint with proper error handling
      const duplicatedCourse = await courseService.duplicateCourse({
        nrcOriginal: selectedCourseForDuplicate.nrc,
        nuevoNrc: duplicateCourseData.nrc,
        nuevoNombre: duplicateCourseData.nombre.trim(),
        nuevaDescripcion: duplicateCourseData.descripcion.trim() || undefined,
        activo: true, // Always create as active
      })

      console.log("✅ [COURSES-PAGE] Course duplicated successfully:", duplicatedCourse)

      setSuccess("Curso duplicado exitosamente con todos sus módulos y materiales")

      toast({
        title: "🎉 Éxito",
        description: `Curso "${duplicateCourseData.nombre}" duplicado exitosamente`,
      })

      // Reset form and close dialog
      setDuplicateCourseData({
        nrc: 0,
        nombre: "",
        descripcion: "",
      })
      setShowDuplicateDialog(false)
      setSelectedCourseForDuplicate(null)

      // Reload courses to show the new duplicate
      loadCourses()
    } catch (error) {
      console.error("❌ [COURSES-PAGE] Error duplicating course:", error)
      const errorMessage = error instanceof Error ? error.message : "Error al duplicar curso"
      setError(errorMessage)

      toast({
        title: "❌ Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setDuplicating(false)
    }
  }

  const openEditDialog = (course: Course) => {
    setSelectedCourse(course)
    setEditCourseData({
      nombre: course.nombre,
      descripcion: course.descripcion,
      activo: course.activo,
    })
    setCoverPreview(buildCoverProxyUrl(course.nrc, course.portadaUrl))
    setCoverFile(null)
    setShowEditDialog(true)
  }

  const closeEditDialog = () => {
    setShowEditDialog(false)
    setSelectedCourse(null)
    resetCoverState()
  }

  const handleRemoveCover = async () => {
    if (!selectedCourse) return

    try {
      const response = await fetch(`/api/courses/${selectedCourse.nrc}/cover`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.mensaje || "Error al eliminar la portada")
      }

      setCoverPreview(null)
      setCoverFile(null)

      toast({
        title: "Portada eliminada",
        description: "La imagen de portada se eliminó correctamente.",
      })

      loadCourses()
    } catch (error) {
      console.error("❌ Error removing cover:", error)
      const message = error instanceof Error ? error.message : "Error desconocido"
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    }
  }

  const handleCoverChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      setCoverFile(null)
      setCoverPreview(selectedCourse ? buildCoverProxyUrl(selectedCourse.nrc, selectedCourse.portadaUrl) : null)
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
      setCoverPreview(selectedCourse ? buildCoverProxyUrl(selectedCourse.nrc, selectedCourse.portadaUrl) : null)
      return
    }

    if (file.size > maxBytes) {
      toast({
        title: "Archivo demasiado grande",
        description: "La portada debe pesar máximo 5MB.",
        variant: "destructive",
      })
      event.target.value = ""
      setCoverPreview(selectedCourse ? buildCoverProxyUrl(selectedCourse.nrc, selectedCourse.portadaUrl) : null)
      return
    }

    if (coverPreview && coverPreview.startsWith("blob:")) {
      URL.revokeObjectURL(coverPreview)
    }

    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
    event.target.value = ""
  }

  const handleCreateCoverChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      resetCreateCoverState()
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
      resetCreateCoverState()
      return
    }

    if (file.size > maxBytes) {
      toast({
        title: "Archivo demasiado grande",
        description: "La portada debe pesar máximo 5MB.",
        variant: "destructive",
      })
      event.target.value = ""
      resetCreateCoverState()
      return
    }

    if (createCoverPreview && createCoverPreview.startsWith("blob:")) {
      URL.revokeObjectURL(createCoverPreview)
    }

    setCreateCoverFile(file)
    setCreateCoverPreview(URL.createObjectURL(file))
    event.target.value = ""
  }

  // Get available users for assignment (exclude already assigned)
  const getAvailableUsersForAssignment = () => {
    return availableUsers.filter((user) => !courseUsers.some((cu) => cu.usuarioId === user.id))
  }

  // Get user statistics for a course
  const getCourseUserStats = (courseNrc: number) => {
    const assignments = allCourseAssignments[courseNrc] || []
    const teachers = assignments.filter((cu) => cu.rolEnCurso === "Docente").length
    const students = assignments.filter((cu) => cu.rolEnCurso === "Estudiante" || cu.rolEnCurso === "Alumno").length
    return { teachers, students, total: assignments.length }
  }

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("")
        setError("")
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success, error])

  useEffect(() => {
    if (courses.length > 0) {
      loadAllCourseAssignments()
    }
  }, [courses])

  useEffect(() => {
    return () => {
      if (coverPreview && coverPreview.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreview)
      }
    }
  }, [coverPreview])

  useEffect(() => {
    return () => {
      if (createCoverPreview && createCoverPreview.startsWith("blob:")) {
        URL.revokeObjectURL(createCoverPreview)
      }
    }
  }, [createCoverPreview])

  const resetCoverState = () => {
    if (coverPreview && coverPreview.startsWith("blob:")) {
      URL.revokeObjectURL(coverPreview)
    }
    setCoverFile(null)
    setCoverPreview(null)
  }

  const resetCreateCoverState = () => {
    if (createCoverPreview && createCoverPreview.startsWith("blob:")) {
      URL.revokeObjectURL(createCoverPreview)
    }
    setCreateCoverFile(null)
    setCreateCoverPreview(null)
  }

  return (
    <div className="flex h-screen bg-unab-gray-50 dark:bg-unab-navy-dark">
      <Sidebar role="admin" />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-unab-navy dark:text-white mb-2">Gestión de Cursos</h1>
              <p className="text-unab-gray-600 dark:text-white">
                Administra todos los cursos del sistema educativo y sus asignaciones
                {totalResults > 0 && ` (${totalResults} cursos encontrados)`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadCourses} disabled={loading} className="border-unab-gray-300 hover:bg-unab-gray-50 dark:border-unab-navy-light dark:hover:bg-unab-navy">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
              <Dialog
                open={showCreateDialog}
                onOpenChange={(open) => {
                  setShowCreateDialog(open)
                  if (!open) {
                    resetCreateCoverState()
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button className="bg-unab-red hover:bg-unab-red-dark text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Curso
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Curso</DialogTitle>
                    <DialogDescription>
                      Completa la información para crear un nuevo curso en el sistema.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateCourse}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="nrc" className="text-right">
                          NRC *
                        </Label>
                        <Input
                          id="nrc"
                          type="number"
                          value={createCourseData.nrc || ""}
                          onChange={(e) =>
                            setCreateCourseData({ ...createCourseData, nrc: Number.parseInt(e.target.value) || 0 })
                          }
                          className="col-span-3"
                          required
                          min="1"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="nombre" className="text-right">
                          Nombre *
                        </Label>
                        <Input
                          id="nombre"
                          value={createCourseData.nombre}
                          onChange={(e) => setCreateCourseData({ ...createCourseData, nombre: e.target.value })}
                          className="col-span-3"
                          required
                          maxLength={100}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="descripcion" className="text-right">
                          Descripción *
                        </Label>
                        <Textarea
                          id="descripcion"
                          value={createCourseData.descripcion}
                          onChange={(e) => setCreateCourseData({ ...createCourseData, descripcion: e.target.value })}
                          className="col-span-3"
                          rows={3}
                          required
                          maxLength={500}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="activo" className="text-right">
                          Estado
                        </Label>
                        <div className="col-span-3 flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="activo"
                            checked={createCourseData.activo}
                            onChange={(e) => setCreateCourseData({ ...createCourseData, activo: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="activo" className="text-sm">
                            Curso activo
                          </Label>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="create-portada" className="text-right">
                          Portada
                        </Label>
                        <div className="col-span-3 space-y-3">
                          <div className="relative aspect-video w-full overflow-hidden rounded-md border border-dashed border-unab-gray-300 dark:border-unab-gray-700 bg-unab-gray-100/60 dark:bg-unab-gray-900/40">
                            {createCoverPreview ? (
                              <img src={createCoverPreview} alt="Vista previa de la portada" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full flex-col items-center justify-center gap-2 text-unab-gray-400 text-sm">
                                <ImageUp className="h-8 w-8" />
                                <span>Sube una imagen 1280x720 (PNG/JPG/WEBP)</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <Button type="button" variant="outline" className="border-dashed" onClick={() => document.getElementById("create-portada")?.click()}>
                              <ImageUp className="h-4 w-4 mr-2" />
                              Seleccionar imagen
                            </Button>
                            <input
                              id="create-portada"
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              className="hidden"
                              onChange={handleCreateCoverChange}
                            />
                            {createCoverPreview && (
                              <Button type="button" variant="ghost" className="text-unab-red hover:text-unab-red-dark" onClick={resetCreateCoverState}>
                                <ImageOff className="h-4 w-4 mr-2" />
                                Quitar portada
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {error && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <DialogFooter>
                      <Button type="submit">Crear Curso</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Duplicate Course Dialog */}
          <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Duplicar Curso</DialogTitle>
                <DialogDescription>
                  Duplicar "{selectedCourseForDuplicate?.nombre}" con todos sus módulos y materiales.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleDuplicateCourse}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="duplicate-nrc" className="text-right">
                      NRC *
                    </Label>
                    <Input
                      id="duplicate-nrc"
                      type="number"
                      value={duplicateCourseData.nrc || ""}
                      onChange={(e) =>
                        setDuplicateCourseData({ ...duplicateCourseData, nrc: Number.parseInt(e.target.value) || 0 })
                      }
                      className="col-span-3"
                      required
                      min="1"
                      placeholder="Ingresa el NRC del nuevo curso"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="duplicate-nombre" className="text-right">
                      Nombre *
                    </Label>
                    <Input
                      id="duplicate-nombre"
                      value={duplicateCourseData.nombre}
                      onChange={(e) => setDuplicateCourseData({ ...duplicateCourseData, nombre: e.target.value })}
                      className="col-span-3"
                      required
                      maxLength={70}
                      placeholder="Nombre del curso duplicado"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="duplicate-descripcion" className="text-right">
                      Descripción
                    </Label>
                    <Textarea
                      id="duplicate-descripcion"
                      value={duplicateCourseData.descripcion}
                      onChange={(e) => setDuplicateCourseData({ ...duplicateCourseData, descripcion: e.target.value })}
                      className="col-span-3"
                      maxLength={250}
                      placeholder="Descripción del curso duplicado (opcional)"
                      rows={3}
                    />
                  </div>
                  <div className="bg-unab-navy/10 dark:bg-unab-navy-light/5 p-4 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-5 w-5 text-unab-navy dark:text-unab-navy-light mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-unab-navy-dark dark:text-unab-navy-light">Información importante:</p>
                        <ul className="text-unab-navy dark:text-unab-navy-light/80 mt-1 space-y-1">
                          <li>• Se copiará todo el contenido del curso original</li>
                          <li>• Se incluirán todos los módulos y materiales</li>
                          <li>• NO se incluirán estudiantes inscritos</li>
                          <li>• El curso se creará en estado "Activo"</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowDuplicateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={duplicating}>
                    {duplicating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Duplicando...
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicar Curso
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Search */}
          <Card className="mb-6 border-unab-gray-200 dark:border-unab-navy-light">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-unab-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre del curso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-unab-gray-300 dark:border-unab-navy-light focus:border-unab-red focus:ring-unab-red"
                />
              </div>
            </CardContent>
          </Card>

          {/* Success/Error Messages */}
          {success && (
            <Alert className="mb-6 border-unab-navy/30 bg-unab-navy/5 text-unab-navy-dark dark:border-unab-navy-light/30 dark:bg-unab-navy-light/10 dark:text-unab-navy-light">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive" className="mb-6 bg-unab-red/10 border-unab-red text-unab-red dark:bg-unab-red/20 dark:text-unab-red-light">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-unab-gray-200 dark:bg-unab-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-unab-gray-200 dark:bg-unab-gray-700 rounded w-1/2 mb-4"></div>
                    <div className="h-16 bg-unab-gray-200 dark:bg-unab-gray-700 rounded mb-4"></div>
                    <div className="h-8 bg-unab-gray-200 dark:bg-unab-gray-700 rounded w-1/3"></div>
                  </CardContent>
                </Card>
              ))
            ) : courses.length > 0 ? (
              courses.map((course) => {
                const stats = getCourseUserStats(course.nrc)
                const coverImageSrc = buildCoverProxyUrl(course.nrc, course.portadaUrl)
                return (
                  <Card key={course.nrc} className="hover:shadow-lg transition-shadow border-unab-gray-200 dark:border-unab-navy-light">
                    <CardHeader className="pb-3 space-y-3">
                      <div className="relative aspect-video w-full overflow-hidden rounded-md bg-unab-gray-100 dark:bg-unab-gray-800">
                        {coverImageSrc ? (
                          <Image
                            src={coverImageSrc}
                            alt={`Portada del curso ${course.nombre}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            priority={false}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-unab-gray-400">
                            <ImageOff className="h-10 w-10" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-unab-navy dark:text-white">{course.nombre}</CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-unab-gray-600 hover:text-unab-navy dark:text-unab-gray-400 dark:hover:text-white">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-unab-gray-200 dark:border-unab-navy-light">
                            <DropdownMenuItem onClick={() => handleShowUsers(course)}>
                              <Users className="h-4 w-4 mr-2" />
                              Gestionar Usuarios
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(course)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDuplicateDialog(course)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicar Curso
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteCourse(course.nrc)} className="text-unab-red hover:text-unab-red-dark">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={course.activo ? "default" : "secondary"}
                          className={
                            course.activo
                              ? "bg-unab-navy/10 text-unab-navy dark:bg-unab-navy-light/10 dark:text-unab-navy-light"
                              : "bg-unab-gray-100 text-unab-gray-800 dark:bg-unab-gray-800 dark:text-white"
                          }
                        >
                          {course.activo ? "Activo" : "Inactivo"}
                        </Badge>
                        <span className="text-xs text-unab-gray-500 dark:text-unab-gray-400">NRC: {course.nrc}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-unab-gray-600 dark:text-white mb-4 line-clamp-3">{course.descripcion}</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-end text-xs text-unab-gray-500">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShowUsers(course)}
                            className="text-unab-red hover:text-unab-red-dark hover:bg-unab-red/5 border-unab-red/20"
                            disabled={loadingAssignments}
                          >
                            {loadingAssignments ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                Cargando...
                              </>
                            ) : (
                              <>
                                <Users className="h-4 w-4 mr-1" />
                                {stats.total} usuarios
                              </>
                            )}
                          </Button>
                        </div>
                        {stats.total > 0 || loadingAssignments ? (
                          <div className="flex items-center justify-between text-xs">
                            {loadingAssignments ? (
                              <div className="flex items-center space-x-2 text-gray-500">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Cargando usuarios...</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center text-unab-navy dark:text-unab-navy-light">
                                  <GraduationCap className="h-3 w-3 mr-1" />
                                  {stats.teachers} profesores
                                </div>
                                <div className="flex items-center text-unab-red dark:text-unab-red-light">
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  {stats.students} estudiantes
                                </div>
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-unab-gray-600 dark:text-white">
                  {searchTerm ? "No se encontraron cursos con ese criterio de búsqueda" : "No hay cursos creados"}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="mt-4 bg-gradient-to-r from-unab-red to-unab-red-dark hover:from-unab-red-dark hover:to-unab-red"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primer Curso
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <p className="text-sm text-unab-gray-600 dark:text-white">
                Página {currentPage} de {totalPages} ({totalResults} cursos en total)
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}

          {/* Edit Course Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Editar Curso</DialogTitle>
                <DialogDescription>Modifica la información del curso seleccionado.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditCourse}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-nombre" className="text-right">
                      Nombre *
                    </Label>
                    <Input
                      id="edit-nombre"
                      value={editCourseData.nombre}
                      onChange={(e) => setEditCourseData({ ...editCourseData, nombre: e.target.value })}
                      className="col-span-3"
                      required
                      maxLength={100}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-descripcion" className="text-right">
                      Descripción *
                    </Label>
                    <Textarea
                      id="edit-descripcion"
                      value={editCourseData.descripcion}
                      onChange={(e) => setEditCourseData({ ...editCourseData, descripcion: e.target.value })}
                      className="col-span-3"
                      rows={3}
                      required
                      maxLength={500}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-activo" className="text-right">
                      Estado
                    </Label>
                    <div className="col-span-3 flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="edit-activo"
                        checked={editCourseData.activo}
                        onChange={(e) => setEditCourseData({ ...editCourseData, activo: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="edit-activo" className="text-sm">
                        Curso activo
                      </Label>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="edit-portada" className="text-right">
                      Portada
                    </Label>
                    <div className="col-span-3 space-y-3">
                      <div className="relative aspect-video w-full overflow-hidden rounded-md border border-dashed border-unab-gray-300 dark:border-unab-gray-700 bg-unab-gray-100/60 dark:bg-unab-gray-900/40">
                        {coverPreview ? (
                          coverPreview.startsWith("blob:") ? (
                            <img src={coverPreview} alt="Vista previa de la portada" className="h-full w-full object-cover" />
                          ) : (
                            <Image
                              src={coverPreview}
                              alt="Vista previa de la portada"
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                          )
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center gap-2 text-unab-gray-400 text-sm">
                            <ImageUp className="h-8 w-8" />
                            <span>Sube una imagen 1280x720 (PNG/JPG/WEBP)</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <Button type="button" variant="outline" className="border-dashed" onClick={() => document.getElementById("edit-portada")?.click()}>
                          <ImageUp className="h-4 w-4 mr-2" />
                          Seleccionar imagen
                        </Button>
                        <input id="edit-portada" type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleCoverChange} />
                        {(coverPreview || selectedCourse?.portadaUrl) && (
                          <Button
                            type="button"
                            variant="ghost"
                            className="text-unab-red hover:text-unab-red-dark"
                            onClick={handleRemoveCover}
                          >
                            <ImageOff className="h-4 w-4 mr-2" />
                            Quitar portada
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <DialogFooter>
                  <Button type="submit">Guardar Cambios</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Users Management Dialog */}
          <Dialog open={showUsersDialog} onOpenChange={setShowUsersDialog}>
            <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Gestión de Usuarios - {selectedCourseForUsers?.nombre}</span>
                </DialogTitle>
                <DialogDescription>Administra los usuarios asignados a este curso y sus roles</DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="assigned" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="assigned">Usuarios Asignados ({courseUsers.length})</TabsTrigger>
                  <TabsTrigger value="assign">Asignar Nuevo Usuario</TabsTrigger>
                </TabsList>

                <TabsContent value="assigned" className="space-y-4">
                  {loadingUsers ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="animate-pulse flex items-center space-x-3 p-4 border rounded-lg">
                          <div className="h-10 w-10 bg-unab-gray-200 dark:bg-unab-gray-700 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-unab-gray-200 dark:bg-unab-gray-700 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-unab-gray-200 dark:bg-unab-gray-700 rounded w-1/2"></div>
                          </div>
                          <div className="h-8 w-20 bg-unab-gray-200 dark:bg-unab-gray-700 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : courseUsers.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No hay usuarios asignados</h3>
                      <p className="text-gray-500 mb-4">Este curso aún no tiene usuarios asignados</p>
                      <Button onClick={() => setShowAssignDialog(true)} className="bg-unab-navy hover:bg-unab-navy-dark dark:bg-unab-navy-light dark:hover:bg-unab-navy">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Asignar Primer Usuario
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {courseUsers.map((assignment, index) => {
                        const user = availableUsers.find((u) => u.id === assignment.usuarioId)
                        const isRemoving = removingUser === assignment.usuarioId
                        return (
                          <div
                            key={`${assignment.usuarioId}-${index}`}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-unab-gray-50 dark:hover:bg-unab-gray-800 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-unab-navy to-unab-navy-light flex items-center justify-center text-white font-medium">
                                {user ? `${user.nombre?.charAt(0) || ""}${user.apellido?.charAt(0) || ""}` : "?"}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                  {user ? `${user.nombre || ""} ${user.apellido || ""}` : "Usuario no encontrado"}
                                </p>
                                <div className="flex items-center space-x-3 text-sm text-gray-500">
                                  <span>
                                    {assignment.email || user?.email || "Email no disponible"}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      assignment.rolEnCurso === "Docente"
                                        ? "bg-unab-navy/10 text-unab-navy border-unab-navy/20 dark:bg-unab-navy/20 dark:text-unab-navy-light"
                                        : "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300"
                                    }`}
                                  >
                                    {assignment.rolEnCurso === "Docente" ? (
                                      <div className="flex items-center space-x-1">
                                        <GraduationCap className="h-3 w-3" />
                                        <span>Profesor</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center space-x-1">
                                        <UserCheck className="h-3 w-3" />
                                        <span>Estudiante</span>
                                      </div>
                                    )}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveUser(assignment.usuarioId)}
                              disabled={isRemoving}
                              className="text-unab-red hover:text-unab-red-dark hover:bg-unab-red/10"
                            >
                              {isRemoving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <UserMinus className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="assign" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="user-select">Seleccionar Usuario</Label>
                      <Select value={selectedUser} onValueChange={setSelectedUser}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar usuario para asignar" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableUsersForAssignment().length === 0 ? (
                            <div className="px-2 py-1.5 text-sm text-gray-500">
                              Todos los usuarios ya están asignados
                            </div>
                          ) : (
                            getAvailableUsersForAssignment().map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                <div className="flex items-center space-x-2">
                                  {user.rol === "Docente" ? (
                                    <GraduationCap className="h-4 w-4 text-unab-navy dark:text-unab-navy-light" />
                                  ) : (
                                    <UserCheck className="h-4 w-4 text-green-500" />
                                  )}
                                  <span>
                                    {user.nombre} {user.apellido} ({user.rol})
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="role-select">Rol en el Curso</Label>
                      <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Estudiante">
                            <div className="flex items-center space-x-2">
                              <UserCheck className="h-4 w-4 text-green-500" />
                              <span>Estudiante</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="Docente">
                            <div className="flex items-center space-x-2">
                              <GraduationCap className="h-4 w-4 text-unab-navy dark:text-unab-navy-light" />
                              <span>Docente</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleAssignUser}
                      disabled={!selectedUser || assigningUser || getAvailableUsersForAssignment().length === 0}
                      className="w-full bg-unab-navy hover:bg-unab-navy-dark dark:bg-unab-navy-light dark:hover:bg-unab-navy"
                    >
                      {assigningUser ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Asignando...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Asignar Usuario
                        </>
                      )}
                    </Button>

                    {getAvailableUsersForAssignment().length === 0 && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Todos los usuarios disponibles ya están asignados a este curso.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </TabsContent>

                {/* Export tab removed per request */}
              </Tabs>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  )
}
