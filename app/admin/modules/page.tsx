"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Plus, Search, Edit, Trash2, MoreHorizontal, Layers, RefreshCw, BookOpen, AlertCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { moduleService, type Module } from "@/app/lib/module-service"
import { courseService } from "@/app/lib/course-service"

interface CreateModuleData {
  nombre: string
  indice: number
  cursoId: number
}

interface EditModuleData {
  nombre: string
  indice: number
}

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCourse, setSelectedCourse] = useState("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [currentModule, setCurrentModule] = useState<Module | null>(null)
  const [createModuleData, setCreateModuleData] = useState<CreateModuleData>({
    nombre: "",
    indice: 1,
    cursoId: 0,
  })
  const [editModuleData, setEditModuleData] = useState<EditModuleData>({
    nombre: "",
    indice: 1,
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [nameError, setNameError] = useState("")
  const [editNameError, setEditNameError] = useState("")

  useEffect(() => {
    loadCourses()
  }, [])

  useEffect(() => {
    if (selectedCourse !== "all") {
      loadModules(Number.parseInt(selectedCourse))
    } else {
      setModules([])
    }
  }, [selectedCourse])

  const loadCourses = async () => {
    try {
      setLoading(true)
      const response = await courseService.getCourses({ cantidadPorPagina: 50 })
      setCourses(response.cursos || [])
    } catch (error) {
      setError("Error al cargar cursos")
    } finally {
      setLoading(false)
    }
  }

  const loadModules = async (cursoId: number) => {
    try {
      setLoading(true)
      setError("")
      const data = await moduleService.getModulesByCourse(cursoId)

      // Ordenar módulos por índice para mostrarlos en orden correcto
      const sortedModules = data.sort((a, b) => a.indice - b.indice)
      setModules(sortedModules)
    } catch (error) {
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
    setNameError("")

    const trimmedName = createModuleData.nombre.trim()

    if (!trimmedName) {
      setNameError("El nombre del módulo es obligatorio")
      return
    }

    if (trimmedName.length > 30) {
      setNameError("El nombre no puede exceder 30 caracteres")
      return
    }

    if (createModuleData.cursoId === 0) {
      setError("Debe seleccionar un curso")
      return
    }

    try {
      await moduleService.createModule({
        ...createModuleData,
        nombre: trimmedName,
      })
      setSuccess("Módulo creado exitosamente")
      setShowCreateDialog(false)
      setCreateModuleData({
        nombre: "",
        indice: 1,
        cursoId: 0,
      })

      // Recargar módulos para el curso seleccionado
      if (selectedCourse !== "all") {
        loadModules(Number.parseInt(selectedCourse))
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      setError(errorMessage)
    }
  }

  const handleEditModule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentModule) return

    setError("")
    setSuccess("")
    setEditNameError("")

    const trimmedName = editModuleData.nombre.trim()

    if (!trimmedName) {
      setEditNameError("El nombre del módulo es obligatorio")
      return
    }

    if (trimmedName.length > 30) {
      setEditNameError("El nombre no puede exceder 30 caracteres")
      return
    }

    try {
      await moduleService.updateModule(currentModule.moduloId, {
        ...editModuleData,
        nombre: trimmedName,
      })
      setSuccess("Módulo actualizado exitosamente")
      setShowEditDialog(false)
      setCurrentModule(null)

      // Recargar módulos para el curso seleccionado
      if (selectedCourse !== "all") {
        loadModules(Number.parseInt(selectedCourse))
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      setError(errorMessage)
    }
  }

  const handleDeleteModule = async (moduleId: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este módulo?")) return

    try {
      await moduleService.deleteModule(moduleId)
      setSuccess("Módulo eliminado exitosamente")

      // Recargar módulos para el curso seleccionado
      if (selectedCourse !== "all") {
        loadModules(Number.parseInt(selectedCourse))
      }
    } catch (error) {
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
      // Calcular el siguiente índice disponible
      const maxIndex = modules.length > 0 ? Math.max(...modules.map((m) => m.indice)) : 0
      setCreateModuleData({
        ...createModuleData,
        cursoId: Number.parseInt(selectedCourse),
        indice: maxIndex + 1,
      })
    }
    setShowCreateDialog(true)
  }

  const filteredModules = modules.filter((module) => module.nombre.toLowerCase().includes(searchTerm.toLowerCase()))

  const getCourseName = (cursoId: number) => {
    const course = courses.find((c) => c.nrc === cursoId)
    return course ? course.nombre : `Curso ${cursoId}`
  }

  // Limpiar mensajes después de 5 segundos
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("")
        setError("")
        setNameError("")
        setEditNameError("")
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success, error])

  return (
    <div className="flex h-screen bg-unab-gray-50 dark:bg-unab-navy-dark">
      <Sidebar role="admin" />

      <div className="flex-1 lg:ml-64 overflow-y-auto">
        <main className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Gestión de Módulos</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Administra todos los módulos del sistema educativo
                {modules.length > 0 && ` (${modules.length} módulos encontrados)`}
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
                    className="bg-gradient-to-r from-unab-red to-unab-red-dark hover:from-unab-red-dark hover:to-unab-red"
                    onClick={openCreateDialog}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Módulo
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Módulo</DialogTitle>
                    <DialogDescription>
                      Completa la información para crear un nuevo módulo en el sistema.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateModule}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="nombre" className="text-right">
                          Nombre *
                        </Label>
                        <div className="col-span-3">
                          <Input
                            id="nombre"
                            value={createModuleData.nombre}
                            onChange={(e) => {
                              setCreateModuleData({ ...createModuleData, nombre: e.target.value })
                              if (nameError) setNameError("")
                            }}
                            className={nameError ? "border-red-500" : ""}
                            required
                            maxLength={30}
                          />
                          <div className="flex justify-between text-xs mt-1">
                            <span className="text-red-500">{nameError}</span>
                            <span
                              className={`${createModuleData.nombre.length > 30 ? "text-red-500" : "text-gray-500"}`}
                            >
                              {createModuleData.nombre.length}/30 caracteres
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="indice" className="text-right">
                          Índice *
                        </Label>
                        <Input
                          id="indice"
                          type="number"
                          min="1"
                          value={createModuleData.indice}
                          onChange={(e) =>
                            setCreateModuleData({ ...createModuleData, indice: Number.parseInt(e.target.value) || 1 })
                          }
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="curso" className="text-right">
                          Curso *
                        </Label>
                        <Select
                          value={createModuleData.cursoId.toString()}
                          onValueChange={(value) =>
                            setCreateModuleData({ ...createModuleData, cursoId: Number.parseInt(value) })
                          }
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Seleccionar curso" />
                          </SelectTrigger>
                          <SelectContent>
                            {courses.map((course) => (
                              <SelectItem key={course.nrc} value={course.nrc.toString()}>
                                {course.nombre} (NRC: {course.nrc})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {error && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <DialogFooter>
                      <Button type="submit">Crear Módulo</Button>
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
                      <SelectItem value="all">Seleccionar curso</SelectItem>
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
            <Alert className="mb-6 border-unab-navy/30 bg-unab-navy/5 text-unab-navy-dark dark:border-unab-navy-light/30 dark:bg-unab-navy-light/10 dark:text-unab-navy-light">
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
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Selecciona un curso para ver sus módulos</p>
              </div>
            ) : filteredModules.length > 0 ? (
              filteredModules.map((module) => (
                <Card key={module.moduloId} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{module.nombre}</CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(module)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteModule(module.moduloId)}
                            className="text-red-600"
                            disabled={module.esPredeterminado}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-xs text-gray-500">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {getCourseName(module.cursoId)}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm
                    ? "No se encontraron módulos con ese criterio de búsqueda"
                    : "No hay módulos para este curso"}
                </p>
                {!searchTerm && selectedCourse !== "all" && (
                  <Button
                    onClick={openCreateDialog}
                    className="mt-4 bg-gradient-to-r from-unab-red to-unab-red-dark hover:from-unab-red-dark hover:to-unab-red"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primer Módulo
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Edit Module Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Editar Módulo</DialogTitle>
                <DialogDescription>Modifica la información del módulo seleccionado.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditModule}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-nombre" className="text-right">
                      Nombre *
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="edit-nombre"
                        value={editModuleData.nombre}
                        onChange={(e) => {
                          setEditModuleData({ ...editModuleData, nombre: e.target.value })
                          if (editNameError) setEditNameError("")
                        }}
                        className={editNameError ? "border-red-500" : ""}
                        required
                        maxLength={30}
                      />
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-red-500">{editNameError}</span>
                        <span className={`${editModuleData.nombre.length > 30 ? "text-red-500" : "text-gray-500"}`}>
                          {editModuleData.nombre.length}/30 caracteres
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-indice" className="text-right">
                      Índice *
                    </Label>
                    <Input
                      id="edit-indice"
                      type="number"
                      min="1"
                      value={editModuleData.indice}
                      onChange={(e) =>
                        setEditModuleData({ ...editModuleData, indice: Number.parseInt(e.target.value) || 1 })
                      }
                      className="col-span-3"
                      required
                    />
                  </div>
                  {currentModule && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Curso</Label>
                      <div className="col-span-3 text-sm text-gray-600 dark:text-gray-400">
                        {getCourseName(currentModule.cursoId)}
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
                  <Button type="submit">Guardar Cambios</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  )
}
