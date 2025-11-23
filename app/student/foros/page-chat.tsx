"use client";

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  MessageSquare, 
  Users, 
  Clock, 
  RefreshCw, 
  BookOpen,
  AlertCircle,
  Eye,
  Pin,
  TrendingUp,
  Hash,
  Bell,
  Star,
  MessageCircle,
  User,
  Activity,
  Calendar
} from 'lucide-react';
import { cursoService } from '@/app/lib/services/curso-service';
import { foroService } from '@/app/lib/services/foro-service';
import { moduleService, type Module as ModuleType } from '@/app/lib/module-service';
import { ForoListadoDTO, ForoListItemDTO } from '@/app/lib/types/foro-types';
import Link from 'next/link';

// Interfaces para chat de estudiantes
interface Course {
  id: number;
  nombre: string;
  nrc: string;
}

// Usar el tipo Module del module-service
type Module = ModuleType;

interface StudentChatForum {
  foroId: number;
  titulo: string;
  moduloId: number;
  fechaCreacion: Date;
  estado: string;
  modulo?: { nombre: string };
  curso?: { nombre: string; nrc: string };
  cantidadHilos?: number;
  cantidadPosts?: number;
  ultimaActividad?: string;
  requireInitialPost?: boolean;
  hasUserPosted?: boolean;
  isPinned?: boolean;
  isUnread?: boolean;
  lastMessage?: {
    autor: string;
    contenido: string;
    fecha: string;
  };
}

export default function StudentForumsPageChat() {
  // Estados principales
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [forums, setForums] = useState<StudentChatForum[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Estados para UI tipo chat
  const [activeCategory, setActiveCategory] = useState<'all' | 'unread' | 'pinned' | 'participated'>('all');
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('detailed');

  // Error state
  const [error, setError] = useState("");

  // Cargar datos iniciales
  useEffect(() => {
    loadStudentCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse !== "all") {
      loadModules(parseInt(selectedCourse));
      setSelectedModule("all");
    } else {
      setModules([]);
      setSelectedModule("all");
    }
    loadForums();
  }, [selectedCourse]);

  useEffect(() => {
    loadForums();
  }, [selectedModule]);

  // Función para cargar cursos del estudiante
  const loadStudentCourses = async () => {
    try {
      setLoadingCourses(true);
      setError("");
      
      const cursosData = await cursoService.obtenerCursosAsignados();
      
      if (!Array.isArray(cursosData)) {
        console.warn('Error: cursosData no es un array:', cursosData);
        setError("Error al cargar cursos");
        return;
      }

      const cursosConvertidos: Course[] = cursosData.map((curso) => ({
        id: curso.nrc,
        nombre: curso.nombre,
        nrc: curso.nrc.toString()
      }));
      
      setCourses(cursosConvertidos);
    } catch (error) {
      console.warn('Error al cargar cursos:', error);
      setError("Error al cargar cursos asignados");
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadModules = async (courseId: number) => {
    try {
      setError("");
      
      let modulesData: Module[] = [];
      try {
        modulesData = await moduleService.getModulesByCourse(courseId);
      } catch (serviceError) {
        console.warn('Error en servicio de módulos, usando fallback');
        modulesData = [];
      }
      
      if (Array.isArray(modulesData)) {
        // Los módulos del moduleService ya tienen toda la información necesaria
        setModules(modulesData.sort((a, b) => a.indice - b.indice));
      } else {
        setModules([]);
      }
    } catch (error) {
      console.warn('Error al cargar módulos:', error);
      setModules([]);
    }
  };

  const loadForums = async () => {
    if (!selectedCourse || selectedCourse === "all" || modules.length === 0) {
      setForums([]);
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      // Cargar foros para todos los módulos del curso seleccionado
      const allForums: StudentChatForum[] = [];
      
      for (const module of modules) {
        try {
          const foroListadoDTO: ForoListadoDTO = {
            moduloId: module.moduloId,
            estado: 'Activo',
            incluirArchivados: false,
            pagina: 1,
            cantidadPorPagina: 50
          };

          const response = await foroService.listarForos(foroListadoDTO);
          
          if (response.operacionExitosa && response.dato) {
            const forosDelModulo: StudentChatForum[] = response.dato.items.map((foro: ForoListItemDTO) => {
              const cursoActual = courses.find(c => c.id === parseInt(selectedCourse));
              
              return {
                foroId: foro.foroId,
                titulo: foro.titulo,
                moduloId: foro.moduloId,
                fechaCreacion: new Date(foro.fechaCreacion),
                estado: foro.estado,
                modulo: { nombre: module.nombre },
                curso: cursoActual ? { 
                  nombre: cursoActual.nombre, 
                  nrc: cursoActual.nrc 
                } : { nombre: "Curso", nrc: "0000" },
                cantidadHilos: 0, // Estos datos requerirían endpoints adicionales
                cantidadPosts: 0,
                ultimaActividad: "Desconocida",
                hasUserPosted: false,
                isPinned: false,
                isUnread: false,
                lastMessage: undefined
              };
            });
            
            allForums.push(...forosDelModulo);
          }
        } catch (moduleError) {
          console.warn(`Error cargando foros para módulo ${module.moduloId}:`, moduleError);
        }
      }
      
      setForums(allForums);
    } catch (error) {
      console.warn('Error loading forums:', error);
      setError("Error al cargar foros");
      setForums([]);
    } finally {
      setLoading(false);
    }
  };

  const getRelativeTime = (time?: string) => {
    return time || 'hace tiempo';
  };

  // Filtrar foros según categoría y búsqueda
  const filteredForums = forums.filter(forum => {
    const matchesSearch = forum.titulo.toLowerCase().includes(searchTerm.toLowerCase());
    
    switch (activeCategory) {
      case 'unread':
        return matchesSearch && forum.isUnread;
      case 'pinned':
        return matchesSearch && forum.isPinned;
      case 'participated':
        return matchesSearch && forum.hasUserPosted;
      default:
        return matchesSearch;
    }
  });

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar role="student" />
      
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
                  {selectedCourse !== "all" ? `${forums.length} canales disponibles` : 'Selecciona un curso para comenzar'}
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
              
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4 mr-2" />
                Notificaciones
              </Button>
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
                  <SelectItem value="all">Todos los cursos</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.nombre} ({course.nrc})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selector de módulo */}
            {selectedCourse !== "all" && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Módulo</Label>
                <Select value={selectedModule} onValueChange={setSelectedModule}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Todos los módulos" />
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
                  onClick={() => setActiveCategory('unread')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeCategory === 'unread' 
                      ? 'bg-unab-navy-100 text-unab-navy-700 dark:bg-unab-navy-900 dark:text-unab-navy-300' 
                      : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  <Bell className="w-4 h-4 inline mr-2" />
                  No leídos
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
                
                <button
                  onClick={() => setActiveCategory('participated')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeCategory === 'participated' 
                      ? 'bg-unab-navy-100 text-unab-navy-700 dark:bg-unab-navy-900 dark:text-unab-navy-300' 
                      : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  <User className="w-4 h-4 inline mr-2" />
                  Participé
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

          {/* Área principal de canales */}
          <div className="flex-1 flex flex-col">
            {error && (
              <Alert className="m-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Cargando canales...</p>
                </div>
              </div>
            ) : selectedCourse === "all" ? (
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
                      <p className="text-gray-500 dark:text-gray-400">
                        {searchTerm ? 'No se encontraron canales que coincidan con tu búsqueda.' : 'No hay canales en esta categoría.'}
                      </p>
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
                                {!forum.hasUserPosted && forum.requireInitialPost && (
                                  <Badge variant="outline" className="text-xs">
                                    Requiere participación
                                  </Badge>
                                )}
                              </div>
                              
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
                                    <span>{getRelativeTime(forum.ultimaActividad)}</span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <Button asChild size="sm" variant="outline">
                                    <Link href={`/modulo/${forum.moduloId}/foros/${forum.foroId}`}>
                                      <MessageSquare className="w-4 h-4 mr-2" />
                                      Abrir
                                    </Link>
                                  </Button>
                                  {(forum.cantidadHilos || 0) > 0 && (
                                    <Button asChild size="sm" variant="outline">
                                      <Link href={`/modulo/${forum.moduloId}/foros/${forum.foroId}`}>
                                        <TrendingUp className="w-4 h-4 mr-2" />
                                        Hilos ({forum.cantidadHilos})
                                      </Link>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
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
