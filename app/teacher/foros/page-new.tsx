"use client";

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/use-toast';
import { 
  Plus, 
  Search, 
  MessageSquare, 
  Users, 
  Clock, 
  Edit, 
  Trash2, 
  RefreshCw, 
  BookOpen,
  AlertCircle,
  Eye,
  Archive,
  MoreHorizontal
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cursoService } from '@/app/lib/services/curso-service';
import { foroService } from '@/app/lib/services/foro-service';
import Link from 'next/link';

// Interfaces basadas en los patrones exitosos
interface Course {
  id: number;
  nombre: string;
  nrc: string;
}

interface Module {
  moduloId: number;
  nombre: string;
  cursoId: number;
  curso?: string; // Para mostrar el nombre del curso
}

interface Forum {
  foroId: number;
  titulo: string;
  descripcion: string;
  moduloId: number;
  fechaCreacion: string;
  activo: boolean;
  cantidadHilos?: number;
  cantidadPosts?: number;
  modulo?: { nombre: string };
  curso?: { nombre: string };
}

interface CreateForumData {
  titulo: string;
  descripcion: string;
  moduloId: number;
}

export default function TeacherForumsPage() {
  // Estados basados en patrones exitosos (materials/modules pages)
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [forums, setForums] = useState<Forum[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form states
  const [forumTitle, setForumTitle] = useState("");
  const [forumDescription, setForumDescription] = useState("");

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingForum, setEditingForum] = useState<Forum | null>(null);

  // Messages
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadTeacherCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse && selectedCourse !== "all") {
      loadModules(parseInt(selectedCourse));
      setSelectedModule(""); // Reset module selection when course changes
    } else {
      setModules([]);
      setSelectedModule("");
    }
    setForums([]); // Clear forums when course changes
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedModule && selectedModule !== "all") {
      loadForums(parseInt(selectedModule));
    } else if (selectedCourse && selectedCourse === "all") {
      loadAllForums();
    } else {
      setForums([]);
    }
  }, [selectedModule, selectedCourse]);

  const loadTeacherCourses = async () => {
    try {
      setLoadingCourses(true);
      setError("");
      
      const cursosData = await cursoService.obtenerCursosAsignados();
      
      if (!Array.isArray(cursosData)) {
        console.error('Error: cursosData no es un array:', cursosData);
        setError("Error al cargar cursos");
        return;
      }

      // Mapear a la estructura Course
      const cursosConvertidos: Course[] = cursosData.map((curso) => ({
        id: curso.nrc, // Usar nrc como ID
        nombre: curso.nombre,
        nrc: curso.nrc.toString()
      }));
      
      setCourses(cursosConvertidos);
      
      if (cursosConvertidos.length > 0) {
        setSelectedCourse(cursosConvertidos[0].id.toString());
      }

      setSuccess("Cursos cargados exitosamente");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error('Error al cargar cursos:', error);
      setError("Error al cargar cursos asignados");
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadModules = async (courseId: number) => {
    try {
      setLoading(true);
      setError("");
      
      const modulesData = await cursoService.obtenerModulosPorCurso(courseId);
      
      if (!Array.isArray(modulesData)) {
        console.error('Error: modulesData no es un array:', modulesData);
        setError("Error al cargar módulos");
        return;
      }

      // Agregar información del curso a cada módulo
      const courseName = courses.find(c => c.id === courseId)?.nombre || "";
      const modulesWithCourse: Module[] = modulesData.map((module) => ({
        ...module,
        curso: courseName
      }));
      
      setModules(modulesWithCourse);
      
      if (modulesWithCourse.length > 0) {
        setSelectedModule("all"); // Mostrar todos los foros por defecto
      }
    } catch (error) {
      console.error('Error al cargar módulos:', error);
      setError("Error al cargar módulos del curso");
    } finally {
      setLoading(false);
    }
  };

  const loadForums = async (moduleId: number) => {
    try {
      setLoading(true);
      setError("");
      
      const forosResponse = await foroService.listarForos({
        moduloId: moduleId,
        incluirArchivados: false,
        pagina: 1,
        cantidadPorPagina: 50
      });

      if (forosResponse.operacionExitosa && forosResponse.dato) {
        const forumsWithDetails = forosResponse.dato.items.map(forum => ({
          foroId: forum.foroId,
          titulo: forum.titulo,
          descripcion: "", // No disponible en ForoListItemDTO
          moduloId: forum.moduloId,
          fechaCreacion: forum.fechaCreacion.toISOString(),
          activo: forum.estado === 'Activo',
          modulo: undefined, // No disponible en ForoListItemDTO
          curso: undefined // No disponible en ForoListItemDTO
        }));
        setForums(forumsWithDetails);
      } else {
        setForums([]);
        setError(forosResponse.mensaje || "Error al cargar foros");
      }
    } catch (error) {
      console.error('Error al cargar foros:', error);
      setError("Error al cargar foros del módulo");
    } finally {
      setLoading(false);
    }
  };

  const loadAllForums = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Cargar foros de todos los módulos del curso seleccionado
      const allForums: Forum[] = [];
      
      for (const module of modules) {
        try {
          const forosResponse = await foroService.listarForos({
            moduloId: module.moduloId,
            incluirArchivados: false,
            pagina: 1,
            cantidadPorPagina: 50
          });

          if (forosResponse.operacionExitosa && forosResponse.dato) {
            const forumsWithDetails = forosResponse.dato.items.map(forum => ({
              foroId: forum.foroId,
              titulo: forum.titulo,
              descripcion: "",
              moduloId: forum.moduloId,
              fechaCreacion: forum.fechaCreacion.toISOString(),
              activo: forum.estado === 'Activo',
              modulo: { nombre: module.nombre },
              curso: { nombre: module.curso || "" }
            }));
            allForums.push(...forumsWithDetails);
          }
        } catch (error) {
          console.error(`Error al cargar foros del módulo ${module.moduloId}:`, error);
        }
      }
      
      setForums(allForums);
    } catch (error) {
      console.error('Error al cargar todos los foros:', error);
      setError("Error al cargar foros");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForum = async () => {
    if (!forumTitle.trim()) {
      setError("El título es obligatorio");
      return;
    }

    if (!selectedModule || selectedModule === "all") {
      setError("Debe seleccionar un módulo específico");
      return;
    }

    try {
      setCreating(true);
      setError("");

      const forumData: CreateForumData = {
        titulo: forumTitle,
        descripcion: forumDescription,
        moduloId: parseInt(selectedModule)
      };

      const response = await foroService.crearForo(forumData);

      if (response.operacionExitosa) {
        setSuccess("Foro creado exitosamente");
        setShowCreateDialog(false);
        resetForm();
        
        // Recargar foros
        if (selectedModule !== "all") {
          await loadForums(parseInt(selectedModule));
        } else {
          await loadAllForums();
        }
      } else {
        setError(response.mensaje || "Error al crear foro");
      }
    } catch (error) {
      console.error('Error al crear foro:', error);
      setError("Error al crear foro");
    } finally {
      setCreating(false);
    }
  };

  const handleEditForum = async (forum: Forum) => {
    try {
      setCreating(true);
      setError("");

      const response = await foroService.editarForo(forum.foroId, {
        titulo: forumTitle,
        descripcion: forumDescription
      });

      if (response.operacionExitosa) {
        setSuccess("Foro actualizado exitosamente");
        setEditingForum(null);
        resetForm();
        
        // Recargar foros
        if (selectedModule !== "all") {
          await loadForums(parseInt(selectedModule));
        } else {
          await loadAllForums();
        }
      } else {
        setError(response.mensaje || "Error al actualizar foro");
      }
    } catch (error) {
      console.error('Error al actualizar foro:', error);
      setError("Error al actualizar foro");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteForum = async (forumId: number) => {
    if (!confirm("¿Está seguro de que desea eliminar este foro?")) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await foroService.eliminarForo(forumId);

      if (response.operacionExitosa) {
        setSuccess("Foro eliminado exitosamente");
        
        // Recargar foros
        if (selectedModule !== "all") {
          await loadForums(parseInt(selectedModule));
        } else {
          await loadAllForums();
        }
      } else {
        setError(response.mensaje || "Error al eliminar foro");
      }
    } catch (error) {
      console.error('Error al eliminar foro:', error);
      setError("Error al eliminar foro");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForumTitle("");
    setForumDescription("");
    setEditingForum(null);
  };

  const openEditDialog = (forum: Forum) => {
    setEditingForum(forum);
    setForumTitle(forum.titulo);
    setForumDescription(forum.descripcion);
    setShowCreateDialog(true);
  };

  const filteredForums = forums.filter(forum =>
    forum.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    forum.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-background">
      <Sidebar role="teacher" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Gestión de Foros</h1>
              <p className="text-muted-foreground">
                Administra los foros de discusión de tus cursos
              </p>
            </div>
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Foro
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingForum ? 'Editar Foro' : 'Crear Nuevo Foro'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingForum 
                      ? 'Modifica los datos del foro'
                      : 'Completa la información para crear un nuevo foro'
                    }
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="titulo">Título</Label>
                    <Input
                      id="titulo"
                      value={forumTitle}
                      onChange={(e) => setForumTitle(e.target.value)}
                      placeholder="Título del foro"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      value={forumDescription}
                      onChange={(e) => setForumDescription(e.target.value)}
                      placeholder="Descripción del foro"
                      rows={3}
                    />
                  </div>
                  
                  {!editingForum && (
                    <div>
                      <Label htmlFor="modulo">Módulo</Label>
                      <Select value={selectedModule} onValueChange={setSelectedModule}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar módulo" />
                        </SelectTrigger>
                        <SelectContent>
                          {modules.map((module) => (
                            <SelectItem key={module.moduloId} value={module.moduloId.toString()}>
                              {module.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowCreateDialog(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={editingForum ? () => handleEditForum(editingForum) : handleCreateForum}
                    disabled={creating}
                  >
                    {creating ? "Procesando..." : (editingForum ? "Actualizar" : "Crear")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="course-select">Curso</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar curso" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.nombre} ({course.nrc})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="module-select">Módulo</Label>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar módulo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los módulos</SelectItem>
                  {modules.map((module) => (
                    <SelectItem key={module.moduloId} value={module.moduloId.toString()}>
                      {module.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar foros..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="flex items-end">
              <Button variant="outline" onClick={loadTeacherCourses} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {(loadingCourses || loading) && (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin" />
              <span className="ml-2">
                {loadingCourses ? "Cargando cursos..." : "Cargando..."}
              </span>
            </div>
          )}

          {/* Forums Grid */}
          {!loadingCourses && !loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredForums.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay foros</h3>
                  <p className="text-muted-foreground mb-4">
                    {selectedCourse 
                      ? "No se encontraron foros para los criterios seleccionados"
                      : "Selecciona un curso para ver los foros"
                    }
                  </p>
                  {selectedCourse && selectedModule && selectedModule !== "all" && (
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Primer Foro
                    </Button>
                  )}
                </div>
              ) : (
                filteredForums.map((forum) => (
                  <Card key={forum.foroId} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold line-clamp-2">
                            {forum.titulo}
                          </CardTitle>
                          <CardDescription className="mt-1 line-clamp-2">
                            {forum.descripcion}
                          </CardDescription>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => openEditDialog(forum)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteForum(forum.foroId)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-3">
                        {/* Module and Course Info */}
                        {(forum.modulo || forum.curso) && (
                          <div className="flex flex-wrap gap-2">
                            {forum.modulo && (
                              <Badge variant="secondary">
                                <BookOpen className="w-3 h-3 mr-1" />
                                {forum.modulo.nombre}
                              </Badge>
                            )}
                            {forum.curso && (
                              <Badge variant="outline">
                                {forum.curso.nombre}
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        {/* Stats */}
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            {forum.cantidadHilos || 0} hilos
                          </div>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {forum.cantidadPosts || 0} posts
                          </div>
                        </div>
                        
                        {/* Date */}
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="w-4 h-4 mr-1" />
                          {new Date(forum.fechaCreacion).toLocaleDateString()}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button asChild size="sm" className="flex-1">
                            <Link href={`/teacher/foros/${forum.foroId}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Foro
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
