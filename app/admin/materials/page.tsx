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
  Bug,
  FileText,
  LinkIcon,
  Video,
  Search,
  ExternalLink,
  Download,
  AlertCircle,
} from "lucide-react"
import { materialService, type Material, type CreateMaterialData } from "@/app/lib/material-service"
import { courseService } from "@/app/lib/course-service"
import { moduleService } from "@/app/lib/module-service"

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

export default function MaterialsPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [selectedModule, setSelectedModule] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
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
  const [showDebugDialog, setShowDebugDialog] = useState(false)

  // Messages
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  // Debug states
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    loadCourses()
  }, [])

  useEffect(() => {
    if (selectedCourse && selectedCourse !== "all") {
      loadModules(Number.parseInt(selectedCourse))
    } else {
      setModules([])
      setSelectedModule("")
    }
  }, [selectedCourse])

  useEffect(() => {
    if (selectedModule && selectedModule !== "all") {
      loadMaterialsForModule(Number.parseInt(selectedModule))
    } else {
      // No cargar materiales automáticamente, solo limpiar la lista
      setMaterials([])
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

  const loadCourses = async () => {
    try {
      const coursesData = await courseService.getCourses()
      console.log("Raw courses data:", coursesData)

      let coursesArray: any[] = []

      // Manejar diferentes formatos de respuesta
      if (Array.isArray(coursesData)) {
        coursesArray = coursesData
      } else if (coursesData && typeof coursesData === "object") {
        // Intentar extraer el array de diferentes propiedades
        coursesArray = (coursesData as any).cursos || (coursesData as any).dato || (coursesData as any).data || []
      }

      // Filtrar y normalizar cursos válidos
      const validCourses = coursesArray
        .filter((course) => {
          const id = getCourseId(course)
          const hasName = course.nombre && typeof course.nombre === "string"
          return id !== null && hasName
        })
        .map((course) => ({
          cursoId: getCourseId(course)!,
          nombre: course.nombre,
          descripcion: course.descripcion || "",
        }))

      setCourses(validCourses)
    } catch (error) {
      console.error("Error loading courses:", error)
      setCourses([])
      setError("Error al cargar los cursos")
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

      // Filtrar y normalizar módulos válidos
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

  const loadAllMaterials = async () => {
    // No hacer nada - los materiales solo se cargan por módulo
    setMaterials([])
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

      // Reset form
      setMaterialName("")
      setMaterialContent("")
      setShowCreateDialog(false)

      // Reload materials
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

      // Reset form
      setUploadFile(null)
      const fileInput = document.getElementById("file-upload") as HTMLInputElement
      if (fileInput) fileInput.value = ""
      setShowUploadDialog(false)

      // Reload materials
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

      // Reload materials
      if (selectedModule && selectedModule !== "all") {
        await loadMaterialsForModule(Number.parseInt(selectedModule))
      }

      setSuccess("Material eliminado exitosamente")
    } catch (error) {
      console.error("Error deleting material:", error)
      setError(`Error al eliminar material: ${error instanceof Error ? error.message : "Error desconocido"}`)
    }
  }

  const runDebugCheck = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/debug/materials-check", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      setDebugInfo(data)
      setShowDebugDialog(true)
    } catch (error) {
      console.error("Error running debug check:", error)
      setError("Error al ejecutar el debug check")
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

  const filteredModules =
    selectedCourse && selectedCourse !== "all"
      ? modules.filter((module) => module.cursoId === Number.parseInt(selectedCourse))
      : modules

  // Filter materials based on search term
  const filteredMaterials = materials.filter((material) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return material.nombre.toLowerCase().includes(searchLower)
    }
    return true
  })

  return (
    <div className="flex h-screen bg-unab-gray-50 dark:bg-unab-navy-dark">
      <Sidebar role="admin" />

      <div className="flex-1 lg:ml-64 overflow-y-auto">
        <main className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Gestión de Materiales</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Administra los materiales educativos por módulo
                {selectedModule && selectedModule !== "all"
                  ? ` (${materials.length} materiales en este módulo)`
                  : " - Selecciona un curso y módulo para comenzar"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => loadAllMaterials()}
                disabled={loading || !selectedModule || selectedModule === "all"}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
              <Button variant="outline" onClick={runDebugCheck} size="sm">
                <Bug className="h-4 w-4 mr-2" />
                Debug
              </Button>
              <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-unab-navy hover:bg-unab-navy-dark text-white">
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
                  <Button className="bg-unab-red hover:bg-unab-red-dark">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Material
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
                          <SelectItem value="Enlace">Enlace</SelectItem>
                          <SelectItem value="Video">Video</SelectItem>
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

          {/* Filters */}
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nombre del material..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Seleccionar curso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los cursos</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.cursoId} value={course.cursoId!.toString()}>
                    {course.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Seleccionar módulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los módulos</SelectItem>
                {filteredModules.map((module) => (
                  <SelectItem key={module.moduloId} value={module.moduloId!.toString()}>
                    {module.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Materials Grid */}
          {loading ? (
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
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              {!selectedCourse || selectedCourse === "all" ? (
                <>
                  <p className="text-gray-600 dark:text-gray-400 text-lg font-medium mb-2">
                    Selecciona un curso para comenzar
                  </p>
                  <p className="text-sm text-gray-500">
                    Primero elige un curso, luego un módulo para ver y gestionar sus materiales
                  </p>
                </>
              ) : !selectedModule || selectedModule === "all" ? (
                <>
                  <p className="text-gray-600 dark:text-gray-400 text-lg font-medium mb-2">
                    Selecciona un módulo específico
                  </p>
                  <p className="text-sm text-gray-500">
                    Los materiales están organizados por módulos. Selecciona uno para ver su contenido.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-gray-600 dark:text-gray-400 text-lg font-medium mb-2">
                    No hay materiales en este módulo
                  </p>
                  <p className="text-sm text-gray-500">
                    Crea el primer material para este módulo usando los botones de arriba
                  </p>
                </>
              )}
            </div>
          ) : (
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
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {getModuleName(material.moduloId)}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{material.tipo}</Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={(() => {
                            try {
                              const m: any = material as any
                              const ruta = m.ruta || m.Ruta || m.url || m.link
                              const id = m.id || material.materialId || m.materialID || m.idMaterial
                              if (m.contenido && id) return `/api/materials/${id}/download`
                              if (typeof ruta === "string" && /^https?:\/\//i.test(ruta.trim())) return ruta.trim()
                              const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"
                              if (typeof ruta === "string" && ruta.trim().length > 0) return ruta.trim().startsWith("/") ? `${backendBase}${ruta.trim()}` : `${backendBase}/${ruta.trim().replace(/^\//, "")}`
                              if (id) return `/api/materials/${id}/download`
                              return "#"
                            } catch (err) {
                              console.error(err)
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
          )}

          {/* Debug Dialog */}
          <Dialog open={showDebugDialog} onOpenChange={setShowDebugDialog}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Debug Information</DialogTitle>
                <DialogDescription>Información de diagnóstico del sistema de materiales</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <strong>Cursos:</strong> {courses.length}
                  </div>
                  <div>
                    <strong>Módulos:</strong> {modules.length}
                  </div>
                  <div>
                    <strong>Materiales:</strong> {materials.length}
                  </div>
                  <div>
                    <strong>Filtrados:</strong> {filteredMaterials.length}
                  </div>
                </div>
                {debugInfo && (
                  <div className="text-xs">
                    <pre className="bg-unab-gray-100 dark:bg-unab-gray-800 p-4 rounded overflow-auto max-h-60">
                      {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={() => setShowDebugDialog(false)}>Cerrar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  )
}
