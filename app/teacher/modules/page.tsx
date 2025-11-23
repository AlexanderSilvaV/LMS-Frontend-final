"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Search, BookOpen, Edit, Trash2, RefreshCw, AlertCircle, GraduationCap, FileText } from "lucide-react"
import { moduleService, type Module } from "@/app/lib/module-service"

interface Course {
  nrc: number
  nombre: string
  descripcion: string
  activo: boolean
}

export default function TeacherModulesPage() {
  const [modules, setModules] = useState<Module[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCourse, setSelectedCourse] = useState("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [currentModule, setCurrentModule] = useState<Module | null>(null)
  const [createModuleData, setCreateModuleData] = useState({
    nombre: "",
    indice: 1,
    cursoId: 0,
  })
  const [editModuleData, setEditModuleData] = useState({
    nombre: "",
    indice: 1,
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    loadTeacherCourses()
  }, [])

  useEffect(() => {
    if (selectedCourse !== "all") {
      loadModules(Number.parseInt(selectedCourse))
    } else {
      setModules([])
    }
  }, [selectedCourse])

  const loadTeacherCourses = async () => {
    try {
      setLoading(true)
      setError("")

      const token = localStorage.getItem("token")
      if (!token) {
        setError("No se encontró token de autenticación")
        return
      }

      console.log("🔍 [TEACHER-MODULES] Fetching assigned courses...")

      // Usar exactamente el mismo endpoint y headers que el dashboard
      const response = await fetch("/api/courses/assigned", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("📡 [TEACHER-MODULES] Response status:", response.status)

      if (response.ok) {
  const data = await response.json()
  console.log("📚 [TEACHER-MODULES] Raw response data:", data)

  // Aceptar tanto el formato directo (Array) como el envoltorio { dato: [...] }
  const coursesData = Array.isArray(data) ? data : data?.dato || []

        // Filtrar solo cursos donde el usuario es docente
        const teacherCourses = coursesData.filter(
          (course: any) => !course.rolEnCurso || course.rolEnCurso === "Docente" || course.rolEnCurso === "Profesor",
        )

        // Mapear a la estructura esperada
        const mappedCourses = teacherCourses.map((course: any) => ({
          nrc: course.nrc,
          nombre: course.nombre,
          descripcion: course.descripcion || "",
          activo: course.activo !== false,
        }))

        setCourses(mappedCourses)
        console.log("✅ [TEACHER-MODULES] Loaded courses:", mappedCourses.length)
      } else {
        const errorText = await response.text()
        console.error("❌ [TEACHER-MODULES] Error response:", errorText)
        throw new Error(`Error ${response.status}: ${errorText}`)
      }
    } catch (error) {
      console.error("❌ [TEACHER-MODULES] Error fetching courses:", error)
      setError(error instanceof Error ? error.message : "Error desconocido al cargar cursos")
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const loadModules = async (cursoId: number) => {
    try {
      setLoading(true)
      setError("")
      const data = await moduleService.getModulesByCourse(cursoId)
      setModules(data.sort((a, b) => a.indice - b.indice))
    } catch (error) {
      console.error("Error loading modules:", error)
      setError("Error al cargar módulos")
      setModules([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!createModuleData.nombre.trim()) {
      setError("El nombre del módulo es obligatorio")
      return
    }

    if (createModuleData.nombre.length > 30) {
      setError("El nombre no puede exceder 30 caracteres")
      return
    }

    if (createModuleData.cursoId === 0) {
      setError("Debe seleccionar un curso")
      return
    }

    try {
      await moduleService.createModule(createModuleData)
      setSuccess("Módulo creado exitosamente")
      setShowCreateDialog(false)
      setCreateModuleData({
        nombre: "",
        indice: 1,
        cursoId: 0,
      })

      if (selectedCourse !== "all") {
        loadModules(Number.parseInt(selectedCourse))
      }
    } catch (error) {
      console.error("Error creating module:", error)
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      setError(errorMessage)
    }
  }

  const handleEditModule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentModule) return

    setError("")
    setSuccess("")

    if (!editModuleData.nombre.trim()) {
      setError("El nombre del módulo es obligatorio")
      return
    }

    if (editModuleData.nombre.length > 30) {
      setError("El nombre no puede exceder 30 caracteres")
      return
    }

    try {
      await moduleService.updateModule(currentModule.moduloId, editModuleData)
      setSuccess("Módulo actualizado exitosamente")
      setShowEditDialog(false)
      setCurrentModule(null)

      if (selectedCourse !== "all") {
        loadModules(Number.parseInt(selectedCourse))
      }
    } catch (error) {
      console.error("Error updating module:", error)
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      setError(errorMessage)
    }
  }

  const handleDeleteModule = async (moduleId: number, moduleName: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el módulo "${moduleName}"?`)) return

    try {
      await moduleService.deleteModule(moduleId)
      setSuccess("Módulo eliminado exitosamente")

      if (selectedCourse !== "all") {
        loadModules(Number.parseInt(selectedCourse))
      }
    } catch (error) {
      console.error("Error deleting module:", error)
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      setError(errorMessage)
    }
  }

  const openEditDialog = (module: Module) => {
    setCurrentModule(module)
    setEditModuleData({
      nombre: module.nombre,
      indice: module.indice,
    })
    setShowEditDialog(true)
  }

  const openCreateDialog = () => {
    if (selectedCourse !== "all") {
      setCreateModuleData({
        ...createModuleData,
        cursoId: Number.parseInt(selectedCourse),
        indice: modules.length + 1,
      })
    }
    setShowCreateDialog(true)
  }

  const filteredModules = modules.filter((module) => module.nombre.toLowerCase().includes(searchTerm.toLowerCase()))

  const getCourseName = (cursoId: number) => {
    const course = courses.find((c) => c.nrc === cursoId)
    return course ? course.nombre : `Curso ${cursoId}`
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

  return (
    <div className="flex h-screen bg-unab-gray-50 dark:bg-unab-navy-dark">
      <Sidebar role="teacher" />

  <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Gestión de Módulos</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Administra los módulos de tus cursos asignados
                {modules.length > 0 && ` (${modules.length} módulos)`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => selectedCourse !== "all" && loadModules(Number.parseInt(selectedCourse))}
                disabled={loading || selectedCourse === "all"}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-gradient-to-r from-unab-red to-unab-red-dark hover:from-unab-red-dark hover:to-unab-red text-white border-0 shadow-lg"
                    onClick={openCreateDialog}
                    disabled={selectedCourse === "all"}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Contenido
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Módulo</DialogTitle>
                    <DialogDescription>
                      Completa la información para crear un nuevo módulo en el curso.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateModule}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="nombre" className="text-right">
                          Nombre *
                        </Label>
                        <Input
                          id="nombre"
                          value={createModuleData.nombre}
                          onChange={(e) => setCreateModuleData({ ...createModuleData, nombre: e.target.value })}
                          className="col-span-3"
                          required
                          maxLength={30}
                          placeholder="Ej: Introducción a la Química"
                        />
                      </div>
                      <div className="text-sm text-gray-500 text-right">
                        {createModuleData.nombre.length}/30 caracteres
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="indice" className="text-right">
                          Orden *
                        </Label>
                        <Input
                          id="indice"
                          type="number"
                          min="1"
                          value={createModuleData.indice}
                          onChange={(e) =>
                            setCreateModuleData({ ...createModuleData, indice: Number.parseInt(e.target.value) })
                          }
                          className="col-span-3"
                          required
                        />
                      </div>
                      {selectedCourse !== "all" && (
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right">Curso</Label>
                          <div className="col-span-3 text-sm text-unab-gray-600 dark:text-white">
                            {getCourseName(Number.parseInt(selectedCourse))}
                          </div>
                        </div>
                      )}
                    </div>
                    {error && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <DialogFooter>
                      <Button type="submit" className="bg-unab-red hover:bg-unab-red-dark">
                        Crear Módulo
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar por nombre del módulo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      disabled={selectedCourse === "all"}
                    />
                  </div>
                </div>
                <div className="sm:w-64">
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar curso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los cursos</SelectItem>
                      {courses.map((course) => (
                        <SelectItem key={course.nrc} value={course.nrc.toString()}>
                          {course.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Success/Error Messages */}
          {success && (
            <Alert className="mb-6 border-unab-red/20 bg-unab-red/10 text-unab-red dark:border-unab-red/30 dark:bg-unab-red/20 dark:text-unab-red-light">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  </CardContent>
                </Card>
              ))
            ) : selectedCourse === "all" ? (
              <div className="col-span-full text-center py-12">
                <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-unab-gray-600 dark:text-white">Selecciona un curso para ver sus módulos</p>
              </div>
            ) : filteredModules.length > 0 ? (
              filteredModules.map((module) => (
                <Card key={module.moduloId} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-unab-navy/10 dark:bg-unab-navy/20 rounded-lg">
                          <BookOpen className="h-5 w-5 text-unab-navy dark:text-unab-navy-light" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{module.nombre}</CardTitle>
                                                    <CardDescription className="text-unab-gray-600 dark:text-white">Curso: {getCourseName(module.cursoId)}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(module)} className="flex-1">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteModule(module.moduloId, module.nombre)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-unab-gray-600 dark:text-white mb-4">No hay módulos en este curso</p>
                <Button onClick={openCreateDialog} className="bg-unab-red hover:bg-unab-red-dark">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Módulo
                </Button>
              </div>
            )}
          </div>

          {/* Edit Module Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Editar Módulo</DialogTitle>
                <DialogDescription>Modifica la información del módulo.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditModule}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-nombre" className="text-right">
                      Nombre *
                    </Label>
                    <Input
                      id="edit-nombre"
                      value={editModuleData.nombre}
                      onChange={(e) => setEditModuleData({ ...editModuleData, nombre: e.target.value })}
                      className="col-span-3"
                      required
                      maxLength={30}
                    />
                  </div>
                  <div className="text-sm text-gray-500 text-right">{editModuleData.nombre.length}/30 caracteres</div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-indice" className="text-right">
                      Orden *
                    </Label>
                    <Input
                      id="edit-indice"
                      type="number"
                      min="1"
                      value={editModuleData.indice}
                      onChange={(e) =>
                        setEditModuleData({ ...editModuleData, indice: Number.parseInt(e.target.value) })
                      }
                      className="col-span-3"
                      required
                    />
                  </div>
                </div>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <DialogFooter>
                  <Button type="submit" className="bg-unab-red hover:bg-unab-red-dark">
                    Guardar Cambios
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  )
}
