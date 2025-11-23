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
  Search, 
  MessageSquare, 
  Users, 
  Clock, 
  Edit, 
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
  Zap,
  Settings,
  Filter,
  Volume2,
  Bell,
  Star,
  Archive,
  MoreVertical,
  Lock,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cursoService } from '@/app/lib/services/curso-service';
import { foroService } from '@/app/lib/services/foro-service';
import { hiloService } from '@/app/lib/services/hilo-service';
import { postService } from '@/app/lib/services/post-service';
import { usuarioService, type UsuarioDTO } from '@/app/lib/usuario-service';
import { moduleService, type Module as ModuleType } from '@/app/lib/module-service';
import { ForoListadoDTO, ForoListItemDTO, ForoCreacionDTO, ForoEdicionDTO, HiloCreacionDTO, HiloDTO, HiloListItemDTO, PostCreacionDTO, PostDTO, PostEdicionDTO } from '@/app/lib/types/foro-types';
import Link from 'next/link';

// Interfaces para el diseño tipo chat
interface Course {
  id: number;
  nombre: string;
  nrc: string;
}

// Usar el tipo Module del module-service
type Module = ModuleType;

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

export default function StudentForumsPage() {
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

  // Estados para UI tipo chat
  const [activeCategory, setActiveCategory] = useState<'all' | 'pinned'>('all');

  // Estado para vista de foro expandido
  const [expandedForumId, setExpandedForumId] = useState<string | null>(null);
  const [selectedForum, setSelectedForum] = useState<ChatForum | null>(null);

  // Estados para hilos y posts
  const [hilos, setHilos] = useState<HiloListItemDTO[]>([]);
  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [selectedHilo, setSelectedHilo] = useState<HiloListItemDTO | null>(null);
  const [loadingHilos, setLoadingHilos] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Estado para información de autores de posts
  const [autoresPosts, setAutoresPosts] = useState<Record<string, UsuarioDTO>>({});

  // Estado para información de autores de hilos
  const [autoresHilos, setAutoresHilos] = useState<Record<string, UsuarioDTO>>({});

  // Estados para crear/editar posts (estudiantes SÍ pueden crear posts)
  const [showCreatePostDialog, setShowCreatePostDialog] = useState(false);
  const [showEditPostDialog, setShowEditPostDialog] = useState(false);
  const [editingPost, setEditingPost] = useState<PostDTO | null>(null);
  const [postContent, setPostContent] = useState("");
  const [creating, setCreating] = useState(false);

  // Messages
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Cargar datos iniciales
  useEffect(() => {
    loadStudentCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse && selectedCourse !== "all") {
      loadModules(parseInt(selectedCourse));
    } else {
      setModules([]);
      setSelectedModule("");
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedCourse && selectedModule) {
      loadForumsForCurrentSelection();
    } else {
      setForums([]);
    }
  }, [selectedCourse, selectedModule]);

  // Nuevo useEffect para cargar foros cuando se cargan los módulos
  useEffect(() => {
    if (modules.length > 0 && !selectedModule) {
      setSelectedModule("all");
    }
  }, [modules]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExpandedForumId(null);
        setSelectedForum(null);
        setSelectedHilo(null);
        setPosts([]);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const clearMessages = () => {
    setSuccess("");
    setError("");
  };

  const loadStudentCourses = async () => {
    try {
      setLoadingCourses(true);
      clearMessages();
      
      const coursesData = await cursoService.obtenerCursosAsignados();
      console.log('Cursos obtenidos:', coursesData);
      
      if (Array.isArray(coursesData)) {
        // Mapear a la interfaz Course esperada
        const mappedCourses = coursesData.map(curso => ({
          id: curso.nrc,
          nombre: curso.nombre,
          nrc: curso.nrc.toString()
        }));
        setCourses(mappedCourses);
      } else {
        console.warn('Los datos de cursos no son un array:', coursesData);
        setCourses([]);
      }
    } catch (error: any) {
      console.error('Error al cargar cursos:', error);
      setError(error.message || 'Error al cargar los cursos');
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadModules = async (courseId: number) => {
    try {
      setLoadingModules(true);
      clearMessages();
      const modulesData = await moduleService.getModulesByCourse(courseId);
      setModules(modulesData || []);
    } catch (error: any) {
      console.error('Error al cargar módulos:', error);
      setError(error.message || 'Error al cargar los módulos');
      setModules([]);
    } finally {
      setLoadingModules(false);
    }
  };

  const loadForumsForCurrentSelection = async () => {
    try {
      setLoading(true);
      clearMessages();
      
      let forumsData: ForoListItemDTO[] = [];
      
      if (selectedModule === "all") {
        // Cargar foros de todos los módulos del curso - necesitamos iterar por módulos
        if (selectedCourse !== "all" && modules.length > 0) {
          for (const module of modules) {
            const moduleForumsResponse = await foroService.listarForos({
              moduloId: module.moduloId
            });
            if (moduleForumsResponse.operacionExitosa && moduleForumsResponse.dato.items) {
              forumsData.push(...moduleForumsResponse.dato.items);
            }
          }
        }
      } else {
        // Cargar foros del módulo específico
        const forumsResponse = await foroService.listarForos({
          moduloId: parseInt(selectedModule)
        });
        if (forumsResponse.operacionExitosa && forumsResponse.dato.items) {
          forumsData = forumsResponse.dato.items;
        }
      }
      
      // Transformar a ChatForum
      const chatForums: ChatForum[] = forumsData.map(foro => ({
        foroId: foro.foroId,
        titulo: foro.titulo,
        descripcion: '', // No está disponible en ForoListItemDTO
        moduloId: foro.moduloId,
        fechaCreacion: foro.fechaCreacion.toString(),
        activo: foro.estado === 'Activo',
        cantidadHilos: 0, // No está disponible en ForoListItemDTO
        cantidadPosts: 0, // No está disponible en ForoListItemDTO
        ultimaActividad: undefined,
        modulo: undefined,
        curso: undefined,
        isPinned: false, // No está disponible en ForoListItemDTO
        isUnread: false,
      }));
      
      setForums(chatForums);
    } catch (error: any) {
      console.error('Error al cargar foros:', error);
      setError(error.message || 'Error al cargar los foros');
      setForums([]);
    } finally {
      setLoading(false);
    }
  };

  const loadHilos = async (foroId: number) => {
    try {
      setLoadingHilos(true);
      clearMessages();
      
      const hilosResponse = await hiloService.listarHilos(foroId, {});
      console.log('Hilos obtenidos:', hilosResponse);
      
      if (hilosResponse.operacionExitosa && hilosResponse.dato && Array.isArray(hilosResponse.dato.items)) {
        setHilos(hilosResponse.dato.items);

        // Obtener información de los autores únicos de los hilos
        const autorIdsHilos = [...new Set(hilosResponse.dato.items.map(hilo => hilo.autorId))];
        const autoresHilosInfo: Record<string, UsuarioDTO> = {};

        for (const autorId of autorIdsHilos) {
          try {
            console.log('🔍 [loadHilos] Loading author info for hilo:', autorId);
            const autorInfo = await usuarioService.obtenerUsuarioPorId(autorId);
            console.log('[loadHilos] Author info loaded for hilo:', autorInfo);
            autoresHilosInfo[autorId] = autorInfo;
          } catch (error) {
            console.warn(`❌ [loadHilos] Error loading author info for hilo ${autorId}:`, error);
            // Si no se puede obtener la info del autor, usar valores por defecto
            autoresHilosInfo[autorId] = {
              id: autorId,
              nombre: `Usuario ${autorId}`,
              correo: '',
              rol: 'Usuario'
            };
          }
        }

        setAutoresHilos(autoresHilosInfo);
      } else {
        console.warn('Los datos de hilos no tienen la estructura esperada:', hilosResponse);
        setHilos([]);
      }
    } catch (error: any) {
      console.error('Error al cargar hilos:', error);
      setError(error.message || 'Error al cargar los hilos');
      setHilos([]);
    } finally {
      setLoadingHilos(false);
    }
  };

  const loadPosts = async (hiloId: number) => {
    try {
      setLoadingPosts(true);
      clearMessages();

      const postsResponse = await postService.listarPosts(hiloId, {});
      console.log('Posts obtenidos:', postsResponse);

      if (postsResponse.operacionExitosa && postsResponse.dato && Array.isArray(postsResponse.dato.items)) {
        setPosts(postsResponse.dato.items);

        // Obtener información de los autores únicos
        const autorIds = [...new Set(postsResponse.dato.items.map(post => post.autorId))];
        const autoresInfo: Record<string, UsuarioDTO> = {};

        for (const autorId of autorIds) {
          try {
            const autorInfo = await usuarioService.obtenerUsuarioPorId(autorId);
            autoresInfo[autorId] = autorInfo;
          } catch (error) {
            console.warn(`Error loading author info for ${autorId}:`, error);
            // Si no se puede obtener la info del autor, usar valores por defecto
            autoresInfo[autorId] = {
              id: autorId,
              nombre: `Usuario ${autorId}`,
              correo: '',
              rol: 'Usuario'
            };
          }
        }

        setAutoresPosts(autoresInfo);
      } else {
        console.warn('Los datos de posts no tienen la estructura esperada:', postsResponse);
        setPosts([]);
      }
    } catch (error: any) {
      console.error('Error al cargar posts:', error);
      setError(error.message || 'Error al cargar los posts');
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Estudiantes SÍ pueden crear posts
  const handleCreatePost = async () => {
    if (!selectedHilo || !postContent.trim()) {
      setError("El contenido del post es requerido");
      return;
    }
    
    try {
      setCreating(true);
      clearMessages();
      
      const postData: PostCreacionDTO = {
        contenido: postContent.trim(),
        hiloId: selectedHilo.hiloId
      };
      
      console.log('Creando post:', postData);
      await postService.crearPost(postData);
      
      setSuccess("Post creado correctamente");
      setPostContent("");
      setShowCreatePostDialog(false);
      
      // Recargar posts
      await loadPosts(selectedHilo.hiloId);
      
      toast({
        title: "Éxito",
        description: "Post creado correctamente",
      });
    } catch (error: any) {
      console.error('Error al crear post:', error);
      const errorMessage = error.message || 'Error al crear el post';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  // Estudiantes SÍ pueden editar sus propios posts
  const handleEditPost = async () => {
    if (!editingPost || !postContent.trim()) {
      setError("El contenido del post es requerido");
      return;
    }
    
    try {
      setCreating(true);
      clearMessages();
      
      const postData: PostEdicionDTO = {
        contenido: postContent.trim()
      };
      
      console.log('Editando post:', editingPost.postId, postData);
      await postService.editarPost(editingPost.postId, postData);
      
      setSuccess("Post actualizado correctamente");
      setPostContent("");
      setEditingPost(null);
      setShowEditPostDialog(false);
      
      // Recargar posts
      if (selectedHilo) {
        await loadPosts(selectedHilo.hiloId);
      }
      
      toast({
        title: "Éxito",
        description: "Post actualizado correctamente",
      });
    } catch (error: any) {
      console.error('Error al editar post:', error);
      const errorMessage = error.message || 'Error al editar el post';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };



  const filteredForums = forums.filter(forum => 
    forum.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    forum.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedForums = activeCategory === 'pinned' 
    ? filteredForums.filter(f => f.isPinned)
    : filteredForums;

  const resetPostForm = () => {
    setPostContent("");
    setEditingPost(null);
    clearMessages();
  };

  const handleForumClick = (forum: ChatForum) => {
    if (expandedForumId === forum.foroId.toString()) {
      // Si ya está expandido, colapsar
      setExpandedForumId(null);
      setSelectedForum(null);
      setSelectedHilo(null);
      setHilos([]);
      setPosts([]);
    } else {
      // Expandir nuevo foro
      setExpandedForumId(forum.foroId.toString());
      setSelectedForum(forum);
      setSelectedHilo(null);
      setPosts([]);
      loadHilos(forum.foroId);
    }
  };

  const handleHiloClick = (hilo: HiloListItemDTO) => {
    if (selectedHilo?.hiloId === hilo.hiloId) {
      // Si ya está seleccionado, deseleccionar
      setSelectedHilo(null);
      setPosts([]);
    } else {
      // Seleccionar nuevo hilo
      setSelectedHilo(hilo);
      loadPosts(hilo.hiloId);
    }
  };

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
                  {selectedCourse ? `${forums.length} canales disponibles` : 'Selecciona un curso para comenzar'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Panel izquierdo - Lista de canales estilo Discord */}
          <div className="w-80 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Filtros y controles */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="space-y-4">
                {/* Selector de curso */}
                <div>
                  <Label htmlFor="course-select" className="text-sm font-medium">
                    Curso
                  </Label>
                  <Select 
                    value={selectedCourse} 
                    onValueChange={setSelectedCourse}
                    disabled={loadingCourses}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={loadingCourses ? "Cargando..." : "Selecciona un curso"} />
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
                <div>
                  <Label htmlFor="module-select" className="text-sm font-medium">
                    Módulo
                  </Label>
                  <Select 
                    value={selectedModule} 
                    onValueChange={setSelectedModule}
                    disabled={!selectedCourse || selectedCourse === "all" || loadingModules}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={loadingModules ? "Cargando..." : "Selecciona un módulo"} />
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

                {/* Barra de búsqueda */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar canales..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filtros de categoría */}
                <div className="flex space-x-2">
                  <Button
                    variant={activeCategory === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveCategory('all')}
                    className="flex-1"
                  >
                    Todos
                  </Button>
                  <Button
                    variant={activeCategory === 'pinned' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveCategory('pinned')}
                    className="flex-1"
                  >
                    <Pin className="w-3 h-3 mr-1" />
                    Fijados
                  </Button>
                </div>
              </div>
            </div>

            {/* Lista de canales */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : displayedForums.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {selectedCourse ? 'No hay canales disponibles' : 'Selecciona un curso para ver los canales'}
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {displayedForums.map((forum) => (
                    <div key={forum.foroId}>
                      {/* Canal principal */}
                      <div
                        onClick={() => handleForumClick(forum)}
                        className={`group flex items-center p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          expandedForumId === forum.foroId.toString()
                            ? 'bg-unab-navy/10 dark:bg-unab-navy/20 text-unab-navy dark:text-unab-navy-light'
                            : 'hover:bg-unab-gray-100 dark:hover:bg-unab-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          <div className="mr-2">
                            {expandedForumId === forum.foroId.toString() ? 
                              <ChevronDown className="w-4 h-4" /> : 
                              <ChevronRight className="w-4 h-4" />
                            }
                          </div>
                          <Hash className="w-4 h-4 mr-2 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                              <span className="font-medium truncate">
                                {forum.titulo}
                              </span>
                              {forum.isPinned && (
                                <Pin className="w-3 h-3 ml-1 text-amber-500" />
                              )}
                              {forum.isUnread && (
                                <div className="w-2 h-2 bg-unab-red rounded-full ml-2"></div>
                              )}
                            </div>
                            {forum.descripcion && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {forum.descripcion}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Sin estadísticas - solo para profesores */}
                      </div>

                      {/* Hilos expandidos */}
                      {expandedForumId === forum.foroId.toString() && (
                        <div className="ml-6 mt-1 space-y-1">
                          {loadingHilos ? (
                            <div className="flex items-center justify-center py-4">
                              <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                            </div>
                          ) : (
                            <>
                              {/* Lista de hilos - sin botón de crear para estudiantes */}
                              {hilos.map((hilo) => (
                                <div
                                  key={hilo.hiloId}
                                  onClick={() => handleHiloClick(hilo)}
                                  className={`group flex items-center p-2 rounded cursor-pointer transition-colors ${
                                    selectedHilo?.hiloId === hilo.hiloId
                                      ? 'bg-unab-navy-50 dark:bg-unab-navy-900/20 text-unab-navy-700 dark:text-unab-navy-300'
                                      : 'hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400'
                                  }`}
                                >
                                  <Hash className="w-3 h-3 mr-2 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center">
                                      <span className="text-sm truncate">
                                        {hilo.titulo}
                                      </span>
                                      {hilo.pinned && (
                                        <Pin className="w-3 h-3 ml-1 text-amber-500" />
                                      )}
                                      {hilo.cerrado && (
                                        <Lock className="w-3 h-3 ml-1 text-red-500" />
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-1 mt-1 text-xs text-gray-500">
                                      <img
                                        src={usuarioService.obtenerUrlFotoPerfil(autoresHilos[hilo.autorId]?.fotoPerfil)}
                                        alt={`Foto de ${autoresHilos[hilo.autorId]?.nombre || 'Usuario'}`}
                                        className="w-3 h-3 rounded-full object-cover flex-shrink-0"
                                      />
                                      <span>{autoresHilos[hilo.autorId]?.nombre || `Usuario ${hilo.autorId}`}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Panel derecho - Chat de posts */}
          <div className="flex-1 flex flex-col">
            {selectedHilo ? (
              <>
                {/* Header del hilo */}
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Hash className="w-5 h-5 text-gray-500" />
                      <div>
                        <h2 className="font-semibold text-gray-900 dark:text-white">
                          {selectedHilo.titulo}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          en {selectedForum?.titulo}
                        </p>
                      </div>
                      {selectedHilo.pinned && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                          <Pin className="w-3 h-3 mr-1" />
                          Fijado
                        </Badge>
                      )}
                      {selectedHilo.cerrado && (
                        <Badge variant="destructive">
                          <Lock className="w-3 h-3 mr-1" />
                          Cerrado
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Dialog open={showCreatePostDialog} onOpenChange={setShowCreatePostDialog}>
                        <DialogTrigger asChild>
                          <Button
                            onClick={resetPostForm}
                            disabled={selectedHilo.cerrado}
                            className="bg-unab-navy hover:bg-unab-navy-700"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Nuevo Post
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle className="flex items-center">
                              <Send className="w-5 h-5 mr-2" />
                              Crear Nuevo Post
                            </DialogTitle>
                            <DialogDescription>
                              Escribe tu mensaje en el hilo "{selectedHilo.titulo}".
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="postContent">Contenido</Label>
                              <Textarea
                                id="postContent"
                                placeholder="Escribe tu mensaje aquí..."
                                value={postContent}
                                onChange={(e) => setPostContent(e.target.value)}
                                rows={6}
                                className="mt-1"
                              />
                            </div>
                          </div>
                          
                          {error && (
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>{error}</AlertDescription>
                            </Alert>
                          )}
                          
                          {success && (
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>{success}</AlertDescription>
                            </Alert>
                          )}
                          
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowCreatePostDialog(false)}>
                              Cancelar
                            </Button>
                            <Button onClick={handleCreatePost} disabled={creating}>
                              {creating ? "Enviando..." : "Enviar Post"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>

                {/* Lista de posts */}
                <div className="flex-1 overflow-y-auto p-6">
                  {loadingPosts ? (
                    <div className="flex items-center justify-center h-32">
                      <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                      <p className="text-lg font-medium mb-2">No hay posts aún</p>
                      <p className="text-sm">Sé el primero en escribir en este hilo</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {posts.map((post) => (
                        <div key={post.postId} className="group">
                          <div className="flex space-x-3">
                            <div className="flex-shrink-0">
                              <img
                                src={usuarioService.obtenerUrlFotoPerfil(autoresPosts[post.autorId]?.fotoPerfil)}
                                alt={`Foto de ${autoresPosts[post.autorId]?.nombre || 'Usuario'}`}
                                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {autoresPosts[post.autorId]?.nombre || post.autorId || 'Usuario'}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {new Date(post.fechaCreacion).toLocaleString()}
                                </span>
                                {post.editedAt && (
                                  <span className="text-xs text-gray-400 dark:text-gray-500">
                                    (editado)
                                  </span>
                                )}
                              </div>
                              <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {post.contenido}
                              </div>
                              
                              {/* Acciones del post - solo para posts propios */}
                              <div className="mt-2 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingPost(post);
                                    setPostContent(post.contenido);
                                    setShowEditPostDialog(true);
                                  }}
                                  className="text-xs"
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  Editar
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : selectedForum ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <h3 className="text-lg font-medium mb-2">Selecciona un hilo</h3>
                  <p className="text-sm">Elige un hilo de la lista para ver los posts</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <Hash className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <h3 className="text-lg font-medium mb-2">Bienvenido a los Foros</h3>
                  <p className="text-sm">Selecciona un canal para comenzar a participar</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Diálogo de edición de post */}
        <Dialog open={showEditPostDialog} onOpenChange={setShowEditPostDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Edit className="w-5 h-5 mr-2" />
                Editar Post
              </DialogTitle>
              <DialogDescription>
                Modifica el contenido de tu post.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="editPostContent">Contenido</Label>
                <Textarea
                  id="editPostContent"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  rows={6}
                  className="mt-1"
                />
              </div>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditPostDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditPost} disabled={creating}>
                {creating ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
