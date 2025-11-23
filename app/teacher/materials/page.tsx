"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Trash2,
  Upload,
  Plus,
  RefreshCw,
  FileText,
  LinkIcon,
  Video,
  Search,
  ExternalLink,
  Download,
  AlertCircle,
  BookOpen,
  GraduationCap,
} from "lucide-react"
import { moduleService } from "@/app/lib/module-service"
import { materialService, type Material, type CreateMaterialData } from "@/app/lib/material-service"

interface Course {
  cursoId?: number
  nrc?: number
  id?: number
  nombre: string
  descripcion?: string
}

interface Module {
  moduloId?: number
  id?: number
  nombre: string
  cursoId?: number
  courseId?: number
}

export default function TeacherMaterialsPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [selectedModule, setSelectedModule] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [creating, setCreating] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Form states
  const [materialName, setMaterialName] = useState("")
  const [materialType, setMaterialType] = useState<"Enlace" | "Video">("Enlace")
  const [materialContent, setMaterialContent] = useState("")
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  // Messages
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    loadTeacherCourses()
  }, [])

  useEffect(() => {
    if (selectedCourse && selectedCourse !== "all") {
      loadModules(Number.parseInt(selectedCourse))
      setSelectedModule("") // Reset module selection when course changes
    } else {
      setModules([])
      setSelectedModule("")
    }
    setMaterials([]) // Clear materials when course changes
  }, [selectedCourse])

  useEffect(() => {
    if (selectedModule && selectedModule !== "all") {
      loadMaterialsForModule(Number.parseInt(selectedModule))
    } else {
      setMaterials([]) // Clear materials when no specific module is selected
    }
  }, [selectedModule])

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

  // Helper function to get course ID from different possible properties
  const getCourseId = (course: any): number | null => {
    return course.cursoId || course.nrc || course.id || null
  }

  // Helper function to get module ID from different possible properties
  const getModuleId = (module: any): number | null => {
    return module.moduloId || module.id || null
  }

  // Helper function to get course ID from module
  const getModuleCourseId = (module: any): number | null => {
    return module.cursoId || module.courseId || null
  }

  const loadTeacherCourses = async () => {
    try {
      setLoadingCourses(true)
      setError("")

      const token = localStorage.getItem("token")
      if (!token) {
        setError("No se encontró token de autenticación")
        return
      }

      console.log("🔍 [TEACHER-MATERIALS] Fetching assigned courses...")

      const response = await fetch("/api/courses/assigned", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("📡 [TEACHER-MATERIALS] Response status:", response.status)

      if (response.ok) {
  const data = await response.json()
  console.log("📚 [TEACHER-MATERIALS] Raw response data:", data)

  const coursesData = Array.isArray(data) ? data : data?.dato || []

        const teacherCourses = coursesData.filter(
          (course: any) => !course.rolEnCurso || course.rolEnCurso === "Docente" || course.rolEnCurso === "Profesor",
        )

        const mappedCourses = teacherCourses.map((course: any) => ({
          cursoId: course.nrc,
          nrc: course.nrc,
          nombre: course.nombre,
          descripcion: course.descripcion || "",
        }))

        setCourses(mappedCourses)
        console.log("✅ [TEACHER-MATERIALS] Loaded courses:", mappedCourses.length)
      } else {
        const errorText = await response.text()
        console.error("❌ [TEACHER-MATERIALS] Error response:", errorText)
        throw new Error(`Error ${response.status}: ${errorText}`)
      }
    } catch (error) {
      console.error("❌ [TEACHER-MATERIALS] Error fetching courses:", error)
      setError(error instanceof Error ? error.message : "Error desconocido al cargar cursos")
      setCourses([])
    } finally {
      setLoadingCourses(false)
    }
  }

  const loadModules = async (courseId: number) => {
    try {
      const modulesData = await moduleService.getModulesByCourse(courseId)
      console.log("Raw modules data:", modulesData)

      let modulesArray: any[] = []

      if (Array.isArray(modulesData)) {
        modulesArray = modulesData
      } else if (modulesData && typeof modulesData === "object") {
        modulesArray = (modulesData as any).dato || (modulesData as any).data || []
      }

      const validModules = modulesArray
        .filter((module) => {
          const id = getModuleId(module)
          const hasName = module.nombre && typeof module.nombre === "string"
          return id !== null && hasName
        })
        .map((module) => ({
          moduloId: getModuleId(module)!,
          nombre: module.nombre,
          cursoId: getModuleCourseId(module) || courseId,
        }))

      setModules(validModules)
    } catch (error) {
      console.error("Error loading modules:", error)
      setModules([])
      setError("Error al cargar los módulos")
    }
  }

  const loadMaterialsForModule = async (moduleId: number) => {
    setLoading(true)
    try {
      const materialsData = await materialService.getMaterialsByModule(moduleId)
      setMaterials(Array.isArray(materialsData) ? materialsData : [])
    } catch (error) {
      console.error("Error loading materials for module:", error)
      setMaterials([])
      setError("Error al cargar los materiales del módulo")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMaterial = async () => {
    if (!materialName || !materialContent || !selectedModule || selectedModule === "all") {
      setError("Por favor completa todos los campos y selecciona un módulo específico")
      return
    }

    setCreating(true)
    setError("")
    setSuccess("")

    try {
      const materialData: CreateMaterialData = {
        nombre: materialName,
        tipo: materialType,
        contenido: materialContent,
        moduloId: Number.parseInt(selectedModule),
      }

      await materialService.createMaterial(materialData)

      setMaterialName("")
      setMaterialContent("")
      setShowCreateDialog(false)

      await loadMaterialsForModule(Number.parseInt(selectedModule))

      setSuccess("Material creado exitosamente")
    } catch (error) {
      console.error("Error creating material:", error)
      setError(`Error al crear material: ${error instanceof Error ? error.message : "Error desconocido"}`)
    } finally {
      setCreating(false)
    }
  }

  const handleFileUpload = async () => {
    if (!uploadFile || !selectedModule || selectedModule === "all") {
      setError("Por favor selecciona un archivo y un módulo específico")
      return
    }

    setUploading(true)
    setError("")
    setSuccess("")

    try {
      await materialService.uploadFile(Number.parseInt(selectedModule), uploadFile)

      setUploadFile(null)
      const fileInput = document.getElementById("file-upload") as HTMLInputElement
      if (fileInput) fileInput.value = ""
      setShowUploadDialog(false)

      await loadMaterialsForModule(Number.parseInt(selectedModule))

      setSuccess("Archivo subido exitosamente")
    } catch (error) {
      console.error("Error uploading file:", error)
      setError(`Error al subir archivo: ${error instanceof Error ? error.message : "Error desconocido"}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteMaterial = async (materialId: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este material?")) {
      return
    }

    try {
      await materialService.deleteMaterial(materialId)

      if (selectedModule && selectedModule !== "all") {
        await loadMaterialsForModule(Number.parseInt(selectedModule))
      }

      setSuccess("Material eliminado exitosamente")
    } catch (error) {
      console.error("Error deleting material:", error)
      setError(`Error al eliminar material: ${error instanceof Error ? error.message : "Error desconocido"}`)
    }
  }

  const getTypeIcon = (tipo: string) => {
    switch (tipo) {
      case "Video":
        return <Video className="h-4 w-4 text-unab-red" />
      case "Enlace":
        return <LinkIcon className="h-4 w-4 text-unab-navy dark:text-unab-navy-light" />
      case "Archivo":
        return <FileText className="h-4 w-4 text-unab-red" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getModuleName = (moduleId: number) => {
    const module = modules.find((m) => m.moduloId === moduleId)
    return module ? module.nombre : "Módulo desconocido"
  }

  const getCourseName = (courseId: number) => {
    const course = courses.find((c) => c.cursoId === courseId)
    return course ? course.nombre : "Curso desconocido"
  }

  const filteredModules =
    selectedCourse && selectedCourse !== "all"
      ? modules.filter((module) => module.cursoId === Number.parseInt(selectedCourse))
      : modules

  const filteredMaterials = materials.filter((material) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return material.nombre.toLowerCase().includes(searchLower)
    }
    return true
  })

  return (
    <div className="flex h-screen bg-unab-gray-50 dark:bg-unab-navy-dark">
      <Sidebar role="teacher" />

  <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Gestión de Materiales</h1>
              <p className="text-unab-gray-600 dark:text-white">Administra los materiales educativos de tus cursos</p>
              <p className="text-sm text-unab-gray-500 dark:text-unab-gray-200 mt-1">
                Tienes acceso a {courses.length} curso{courses.length !== 1 ? "s" : ""} asignado
                {courses.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => loadTeacherCourses()} disabled={loadingCourses}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingCourses ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
              <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-unab-navy/30 text-unab-navy-dark dark:text-white hover:bg-unab-navy/5 hover:text-unab-navy dark:hover:text-white hover:border-unab-navy/50"
                    disabled={!selectedModule || selectedModule === "all"}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Archivo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Subir Archivo</DialogTitle>
                    <DialogDescription>
                      Sube un archivo PDF, DOCX o PPTX que se almacenará en Google Drive
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="file-upload">Seleccionar Archivo</Label>
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".pdf,.docx,.pptx"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleFileUpload}
                      disabled={uploading || !selectedModule || selectedModule === "all" || !uploadFile}
                      className="bg-unab-navy hover:bg-unab-navy-dark text-white"
                    >
                      {uploading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Subir
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-gradient-to-r from-unab-red to-unab-red-dark hover:from-unab-red-dark hover:to-unab-red text-white border-0 shadow-lg"
                    disabled={!selectedModule || selectedModule === "all"}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Contenido
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Material</DialogTitle>
                    <DialogDescription>Crea un nuevo material de tipo enlace o video</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="material-name">Nombre del Material</Label>
                      <Input
                        id="material-name"
                        value={materialName}
                        onChange={(e) => setMaterialName(e.target.value)}
                        placeholder="Nombre del material"
                      />
                    </div>
                    <div>
                      <Label htmlFor="material-type">Tipo</Label>
                      <Select
                        value={materialType}
                        onValueChange={(value: "Enlace" | "Video") => setMaterialType(value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Enlace">🔗 Enlace</SelectItem>
                          <SelectItem value="Video">🎥 Video</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="material-content">URL del Material</Label>
                      <Textarea
                        id="material-content"
                        value={materialContent}
                        onChange={(e) => setMaterialContent(e.target.value)}
                        placeholder="https://ejemplo.com/recurso"
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCreateMaterial}
                      disabled={creating || !selectedModule || selectedModule === "all"}
                      className="bg-unab-red hover:bg-unab-red-dark text-white"
                    >
                      {creating ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Creando...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Crear
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

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

          {/* Selection Flow Guide */}
          <Card className="mb-6 border-unab-navy/20 bg-unab-navy/10 dark:border-unab-navy/30 dark:bg-unab-navy/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 text-sm text-unab-navy dark:text-unab-navy-light">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-unab-navy text-white flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <span className="font-medium">Selecciona un curso</span>
                </div>
                <div className="text-unab-red dark:text-unab-red-light">→</div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-unab-navy text-white flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <span className="font-medium">Selecciona un módulo</span>
                </div>
                <div className="text-unab-red dark:text-unab-red-light">→</div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-unab-navy text-white flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <span className="font-medium">Gestiona materiales</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nombre del material..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                disabled={!selectedModule || selectedModule === "all"}
              />
            </div>
            <Select
              value={selectedCourse}
              onValueChange={setSelectedCourse}
              disabled={loadingCourses || courses.length === 0}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="1. Seleccionar curso" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.cursoId} value={course.cursoId!.toString()}>
                    {course.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedModule}
              onValueChange={setSelectedModule}
              disabled={!selectedCourse || modules.length === 0}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="2. Seleccionar módulo" />
              </SelectTrigger>
              <SelectContent>
                {filteredModules.map((module) => (
                  <SelectItem key={module.moduloId} value={module.moduloId!.toString()}>
                    {module.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content Area */}
          {loadingCourses ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-unab-gray-600 dark:text-white">Cargando tus cursos...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-unab-gray-600 dark:text-white">No tienes cursos asignados como docente</p>
              <p className="text-sm text-unab-gray-500 dark:text-unab-gray-200 mt-2">
                Contacta al administrador para que te asigne cursos y puedas gestionar materiales
              </p>
            </div>
          ) : !selectedCourse ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-unab-navy dark:text-unab-navy-light mx-auto mb-4" />
              <p className="text-unab-gray-600 dark:text-white text-lg font-medium mb-2">
                Selecciona un curso para comenzar
              </p>
              <p className="text-sm text-unab-gray-500 dark:text-unab-gray-200">
                Tienes {courses.length} curso{courses.length !== 1 ? "s" : ""} disponible
                {courses.length !== 1 ? "s" : ""}
              </p>
            </div>
          ) : !selectedModule ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-unab-navy dark:text-unab-navy-light mx-auto mb-4" />
              <p className="text-unab-gray-600 dark:text-white text-lg font-medium mb-2">Ahora selecciona un módulo</p>
              <p className="text-sm text-unab-gray-500 dark:text-unab-gray-200">
                Curso seleccionado:{" "}
                <span className="font-medium">{getCourseName(Number.parseInt(selectedCourse))}</span>
              </p>
              {modules.length === 0 && (
                <p className="text-sm text-unab-red dark:text-unab-red-light mt-2">
                  Este curso no tiene módulos. Crea módulos primero en la sección de Gestión de Módulos.
                </p>
              )}
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-4 w-4 bg-unab-gray-200 dark:bg-unab-gray-700 rounded"></div>
                      <div className="h-8 w-8 bg-unab-gray-200 dark:bg-unab-gray-700 rounded"></div>
                    </div>
                    <div className="h-6 bg-unab-gray-200 dark:bg-unab-gray-700 rounded mb-2"></div>
                    <div className="h-4 bg-unab-gray-200 dark:bg-unab-gray-700 rounded mb-4"></div>
                    <div className="flex justify-between">
                      <div className="h-8 bg-unab-gray-200 dark:bg-unab-gray-700 rounded w-16"></div>
                      <div className="h-8 bg-unab-gray-200 dark:bg-unab-gray-700 rounded w-8"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-unab-red dark:text-unab-red-light mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg font-medium mb-2">
                {searchTerm ? "No se encontraron materiales" : "No hay materiales en este módulo"}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Módulo: <span className="font-medium">{getModuleName(Number.parseInt(selectedModule))}</span>
              </p>
              {!searchTerm && (
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-unab-red hover:bg-unab-red-dark text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primer Material
                  </Button>
                  <Button
                    onClick={() => setShowUploadDialog(true)}
                    variant="outline"
                    className="border-unab-navy/20 text-unab-navy hover:bg-unab-navy/10 dark:border-unab-navy/30 dark:text-unab-navy-light dark:hover:bg-unab-navy/20"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Archivo
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Materials Count */}
              <div className="mb-4 text-sm text-unab-gray-600 dark:text-white">
                Mostrando {filteredMaterials.length} material{filteredMaterials.length !== 1 ? "es" : ""} en{" "}
                <span className="font-medium">{getModuleName(Number.parseInt(selectedModule))}</span>
              </div>

              {/* Materials Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredMaterials.map((material) => (
                  <Card key={material.materialId} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        {getTypeIcon(material.tipo)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMaterial(material.materialId)}
                          className="text-unab-red hover:text-unab-red-dark hover:bg-unab-red/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <h3 className="font-semibold text-lg mb-2 truncate">{material.nombre}</h3>
                      <p className="text-sm text-unab-gray-600 dark:text-white mb-4 line-clamp-2">
                        {getModuleName(material.moduloId)}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{material.tipo}</Badge>
                        <Button variant="ghost" size="sm" asChild>
                          {/* Use backendService to decide how to handle material links/downloads */}
                          <a
                            href={(() => {
                              try {
                                const m: any = material as any
                                const ruta = m.ruta || m.Ruta || m.url || m.link
                                const id = m.id || material.materialId || m.materialID || m.idMaterial

                                // If content embedded, use proxy if we have id
                                if (m.contenido && id) return `/api/materials/${id}/download`

                                if (typeof ruta === "string" && ruta.trim().length > 0) {
                                  const trimmed = ruta.trim()
                                  const isAbsolute = /^https?:\/\//i.test(trimmed)
                                  if (isAbsolute) return trimmed

                                  // Relative path (e.g. /uploads/...) -> must point to backend, not frontend
                                  const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"
                                  if (trimmed.startsWith("/")) return `${backendBase}${trimmed}`
                                  // Fallback: if we have an id use proxy, else build backend absolute
                                  if (id) return `/api/materials/${id}/download`
                                  return `${backendBase}/${trimmed.replace(/^\//, "")}`
                                }

                                // Default: if we have an id, use download proxy
                                if (id) return `/api/materials/${id}/download`
                                return "#"
                              } catch (err) {
                                console.error("Error computing material link:", err)
                                return material.ruta || "#"
                              }
                            })()}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {material.tipo === "Archivo" ? (
                              <Download className="h-4 w-4" />
                            ) : (
                              <ExternalLink className="h-4 w-4" />
                            )}
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

        </main>
      </div>
    </div>
  )
}
