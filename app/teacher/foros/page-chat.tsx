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
  Send,
  Hash,
  Pin,
  TrendingUp,
  Calendar,
  Activity,
  MessageCircle,
  User,
  Zap
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cursoService } from '@/app/lib/services/curso-service';
import { foroService } from '@/app/lib/services/foro-service';
import Link from 'next/link';

// Interfaces para el diseño tipo chat
interface Course {
  id: number;
  nombre: string;
  nrc: string;
}

interface Module {
  moduloId: number;
  nombre: string;
  cursoId: number;
  curso?: string;
}

interface ChatForum {
  foroId: number;
  titulo: string;
  descripcion: string;
  moduloId: number;
  fechaCreacion: string;
  activo: boolean;
  cantidadHilos?: number;
  cantidadPosts?: number;
  ultimaActividad?: string;
  modulo?: { nombre: string };
  curso?: { nombre: string };
  isPinned?: boolean;
  isUnread?: boolean;
  lastMessage?: {
    autor: string;
    contenido: string;
    fecha: string;
  };
}

interface CreateForumData {
  titulo: string;
  descripcion: string;
  moduloId: number;
}

export default function TeacherForumsPage() {
  // Estados para el diseño tipo chat
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [forums, setForums] = useState<ChatForum[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingModules, setLoadingModules] = useState(false);
  const [creating, setCreating] = useState(false);

  // Estados para UI tipo chat
  const [activeCategory, setActiveCategory] = useState<'all' | 'active' | 'pinned' | 'archived'>('all');
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('detailed');

  // Form states
  const [forumTitle, setForumTitle] = useState("");
  const [forumDescription, setForumDescription] = useState("");

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingForum, setEditingForum] = useState<ChatForum | null>(null);

  // Messages
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Cargar datos iniciales
  useEffect(() => {
    loadTeacherCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse && selectedCourse !== "all" && selectedCourse !== "") {
      const courseId = parseInt(selectedCourse);
      if (!isNaN(courseId)) {
        loadModules(courseId);
        setSelectedModule("all");
      }
    } else {
      setModules([]);
      setSelectedModule("all");
    }
    loadForumsForCurrentSelection();
  }, [selectedCourse]);

  useEffect(() => {
    loadForumsForCurrentSelection();
  }, [selectedModule]);

  // Funciones de carga de datos (simplificadas)
  const loadTeacherCourses = async () => {
    try {
      setLoadingCourses(true);
      const coursesData = await cursoService.obtenerCursosAsignados();
      const coursesMapped = coursesData.map((curso) => ({
        id: curso.cursoId!,
        nombre: curso.nombre,
        nrc: curso.nrc.toString()
      }));
      setCourses(coursesMapped);
    } catch (error) {
      console.error('Error loading courses:', error);
      setError("Error al cargar cursos");
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadModules = async (courseId: number) => {
    try {
      setLoadingModules(true);
      const modulesData = await cursoService.obtenerModulosPorCurso(courseId);
      setModules(modulesData || []);
    } catch (error) {
      console.error('Error loading modules:', error);
      setModules([]);
    } finally {
      setLoadingModules(false);
    }
  };

  const loadForumsForCurrentSelection = async () => {
    if (!selectedCourse || selectedCourse === "") return;
    
    try {
      setLoading(true);
      // Simular carga de foros con datos tipo chat
      const mockForums: ChatForum[] = [
        {
          foroId: 1,
          titulo: "Discusión General - Química Orgánica",
          descripcion: "Espacio para dudas y discusiones generales del módulo",
          moduloId: 1,
          fechaCreacion: new Date().toISOString(),
          activo: true,
          cantidadHilos: 12,
          cantidadPosts: 45,
          ultimaActividad: "hace 2 horas",
          isPinned: true,
          isUnread: true,
          lastMessage: {
            autor: "Prof. García",
            contenido: "Recuerden revisar el material de enlaces químicos antes de la próxima clase",
            fecha: "14:30"
          },
          modulo: { nombre: "Química Orgánica" },
          curso: { nombre: "Química General" }
        },
        {
          foroId: 2,
          titulo: "Dudas sobre Laboratorio",
          descripcion: "Preguntas sobre prácticas de laboratorio",
          moduloId: 1,
          fechaCreacion: new Date().toISOString(),
          activo: true,
          cantidadHilos: 8,
          cantidadPosts: 23,
          ultimaActividad: "hace 5 horas",
          isPinned: false,
          isUnread: false,
          lastMessage: {
            autor: "Ana Rodríguez",
            contenido: "¿Alguien puede ayudarme con el protocolo de titulación?",
            fecha: "09:15"
          },
          modulo: { nombre: "Química Orgánica" },
          curso: { nombre: "Química General" }
        }
      ];
      setForums(mockForums);
    } catch (error) {
      console.error('Error loading forums:', error);
      setError("Error al cargar foros");
    } finally {
      setLoading(false);
    }
  };

  // Función para crear foro
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
        titulo: forumTitle.trim(),
        descripcion: forumDescription.trim(),
        moduloId: parseInt(selectedModule)
      };

      // Simular creación exitosa
      setSuccess("Foro creado exitosamente");
      setShowCreateDialog(false);
      resetForm();
      await loadForumsForCurrentSelection();
    } catch (error) {
      console.error('Error creating forum:', error);
      setError("Error al crear foro");
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setForumTitle("");
    setForumDescription("");
    setEditingForum(null);
  };

  // Filtrar foros según categoría y búsqueda
  const filteredForums = forums.filter(forum => {
    const matchesSearch = forum.titulo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = 
      activeCategory === 'all' || 
      (activeCategory === 'active' && forum.activo) ||
      (activeCategory === 'pinned' && forum.isPinned) ||
      (activeCategory === 'archived' && !forum.activo);
    
    return matchesSearch && matchesCategory;
  });

  // Función para obtener el tiempo relativo
  const getRelativeTime = (activity: string) => {
    return activity || "Sin actividad";
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar role="teacher" />
      
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        {/* Header tipo Discord/Slack */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Hash className="w-6 h-6 text-gray-500" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Foros de Discusión
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedCourse ? `${forums.length} canales disponibles` : 'Selecciona un curso para comenzar'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'compact' ? 'detailed' : 'compact')}
              >
                {viewMode === 'compact' ? 'Vista Detallada' : 'Vista Compacta'}
              </Button>
              
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={resetForm} 
                    disabled={!selectedModule || selectedModule === "all"}
                    className="bg-unab-navy hover:bg-unab-navy-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Canal
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center">
                      <Hash className="w-5 h-5 mr-2" />
                      Crear Nuevo Canal de Foro
                    </DialogTitle>
                    <DialogDescription>
                      Los canales son donde tu equipo se comunica. Son mejores cuando se organizan por tema.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="titulo">Nombre del canal</Label>
                      <Input
                        id="titulo"
                        value={forumTitle}
                        onChange={(e) => setForumTitle(e.target.value)}
                        placeholder="ej. dudas-generales"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="descripcion">Descripción (opcional)</Label>
                      <Textarea
                        id="descripcion"
                        value={forumDescription}
                        onChange={(e) => setForumDescription(e.target.value)}
                        placeholder="¿De qué trata este canal?"
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label>Módulo</Label>
                      <Select value={selectedModule} onValueChange={setSelectedModule}>
                        <SelectTrigger className="mt-1">
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
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateForum} disabled={creating}>
                      {creating ? "Creando..." : "Crear Canal"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar de filtros tipo Discord */}
          <div className="w-64 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Selector de curso */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Curso</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="mt-2">
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

            {/* Selector de módulo */}
            {selectedCourse && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Módulo</Label>
                <Select value={selectedModule} onValueChange={setSelectedModule} disabled={loadingModules}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={loadingModules ? "Cargando..." : "Todos los módulos"} />
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
            )}

            {/* Categorías tipo Discord */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="space-y-1">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeCategory === 'all' 
                      ? 'bg-unab-navy-100 text-unab-navy-700 dark:bg-unab-navy-900 dark:text-unab-navy-300' 
                      : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Todos los canales
                </button>
                <button
                  onClick={() => setActiveCategory('active')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeCategory === 'active' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                      : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  <Zap className="w-4 h-4 inline mr-2" />
                  Activos
                </button>
                <button
                  onClick={() => setActiveCategory('pinned')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeCategory === 'pinned' 
                      ? 'bg-unab-navy-100 text-unab-navy-700 dark:bg-unab-navy-900 dark:text-unab-navy-300' 
                      : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  <Pin className="w-4 h-4 inline mr-2" />
                  Fijados
                </button>
              </div>
            </div>

            {/* Búsqueda */}
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Buscar canales..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-700"
                />
              </div>
            </div>
          </div>

          {/* Lista de foros tipo chat */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Messages area */}
            {error && (
              <Alert variant="destructive" className="m-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="m-4">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Cargando canales...</p>
                </div>
              </div>
            ) : !selectedCourse ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-md">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Bienvenido a los Foros
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Selecciona un curso de la barra lateral para ver los canales de discusión disponibles.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {filteredForums.length === 0 ? (
                    <div className="text-center py-12">
                      <Hash className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                        No hay canales disponibles
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        {searchTerm ? 'No se encontraron canales que coincidan con tu búsqueda.' : 'Crea el primer canal para comenzar las discusiones.'}
                      </p>
                      {!searchTerm && selectedModule && selectedModule !== "all" && (
                        <Button onClick={() => setShowCreateDialog(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Crear Primer Canal
                        </Button>
                      )}
                    </div>
                  ) : (
                    filteredForums.map((forum) => (
                      <div
                        key={forum.foroId}
                        className={`group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 ${
                          forum.isUnread ? 'border-l-4 border-l-blue-500' : ''
                        }`}
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <Hash className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                  {forum.titulo}
                                </h3>
                                {forum.isPinned && (
                                  <Pin className="w-4 h-4 text-unab-red flex-shrink-0" />
                                )}
                                {forum.isUnread && (
                                  <div className="w-2 h-2 bg-unab-red rounded-full flex-shrink-0"></div>
                                )}
                              </div>
                              
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                {forum.descripcion}
                              </p>
                              
                              {/* Último mensaje */}
                              {forum.lastMessage && viewMode === 'detailed' && (
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3 mb-3">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      {forum.lastMessage.autor}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {forum.lastMessage.fecha}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                    {forum.lastMessage.contenido}
                                  </p>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <div className="flex items-center space-x-1">
                                    <MessageCircle className="w-4 h-4" />
                                    <span>{forum.cantidadHilos || 0}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Users className="w-4 h-4" />
                                    <span>{forum.cantidadPosts || 0}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{getRelativeTime(forum.ultimaActividad || "")}</span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <Button asChild size="sm" variant="outline">
                                    <Link href={`/modulo/${forum.moduloId}/foros/${forum.foroId}`}>
                                      <MessageSquare className="w-4 h-4 mr-2" />
                                      Abrir
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            </div>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Editar canal
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Pin className="w-4 h-4 mr-2" />
                                  {forum.isPinned ? 'Desfijar' : 'Fijar'} canal
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Eliminar canal
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
