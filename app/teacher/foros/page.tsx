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
import { moduleService, type Module as ModuleType } from '@/app/lib/module-service';
import { usuarioService, type UsuarioDTO } from '@/app/lib/usuario-service';
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
  const [activeCategory, setActiveCategory] = useState<'all' | 'pinned'>('all');

  // Form states
  const [forumTitle, setForumTitle] = useState("");
  const [forumDescription, setForumDescription] = useState("");

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingForum, setEditingForum] = useState<ChatForum | null>(null);

  // Edit form states
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

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

  // Estados para crear/editar hilos
  const [showCreateHiloDialog, setShowCreateHiloDialog] = useState(false);
  const [showEditHiloDialog, setShowEditHiloDialog] = useState(false);
  const [editingHilo, setEditingHilo] = useState<HiloListItemDTO | null>(null);
  const [hiloTitle, setHiloTitle] = useState("");

  // Estados para crear/editar posts
  const [showCreatePostDialog, setShowCreatePostDialog] = useState(false);
  const [showEditPostDialog, setShowEditPostDialog] = useState(false);
  const [editingPost, setEditingPost] = useState<PostDTO | null>(null);
  const [postContent, setPostContent] = useState("");

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
      setForums([]);
    }
  }, [selectedCourse]);

  useEffect(() => {
    // Solo cargar foros si hay un curso seleccionado y los módulos ya están cargados
    if (selectedCourse && selectedCourse !== "" && selectedCourse !== "all") {
      if (selectedModule === "all" && modules.length === 0) {
        // Si se selecciona "todos los módulos" pero aún no hay módulos cargados, esperar
        return;
      }
      loadForumsForCurrentSelection();
    }
  }, [selectedModule, modules]);

  // Nuevo useEffect para cargar foros cuando se cargan los módulos
  useEffect(() => {
    if (modules.length > 0 && selectedModule === "all") {
      loadForumsForCurrentSelection();
    }
  }, [modules]);

  // Efecto para manejar la tecla Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (expandedForumId) {
          setExpandedForumId(null);
          setSelectedForum(null);
          setSelectedHilo(null);
          setPosts([]);
          setHilos([]);
        } else if (showEditDialog) {
          setShowEditDialog(false);
        } else if (showCreateDialog) {
          setShowCreateDialog(false);
        }
      }
    };

    if (expandedForumId || showEditDialog || showCreateDialog) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [expandedForumId, showEditDialog, showCreateDialog]);

  // Funciones de carga de datos (simplificadas)
  const loadTeacherCourses = async () => {
    try {
      setLoadingCourses(true);
      // Usar la función que existe en el servicio y mapear la estructura
      const coursesData = await cursoService.obtenerCursosAsignados();
      const mappedCourses = coursesData.map(curso => ({
        id: curso.nrc, // Usar nrc como id
        nombre: curso.nombre,
        nrc: curso.nrc.toString()
      }));
      setCourses(mappedCourses || []);
    } catch (error) {
      console.warn('Error loading courses:', error);
      setError("Error al cargar cursos");
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadModules = async (courseId: number) => {
    try {
      setLoadingModules(true);
      const modulesData = await moduleService.getModulesByCourse(courseId);
      setModules(modulesData.sort((a, b) => a.indice - b.indice));
    } catch (error) {
      console.warn('Error loading modules:', error);
      setModules([]);
    } finally {
      setLoadingModules(false);
    }
  };

  const loadForumsForCurrentSelection = async () => {
    if (!selectedCourse || selectedCourse === "") return;
    
    try {
      setLoading(true);
      setError("");
      
      let allForums: ChatForum[] = [];

      if (selectedModule === "all" || selectedModule === "") {
        // Cargar foros de todos los módulos del curso
        for (const module of modules) {
          try {
            const foroListadoDTO: ForoListadoDTO = {
              moduloId: module.moduloId,
              incluirArchivados: false,
              pagina: 1,
              cantidadPorPagina: 50
            };

            const response = await foroService.listarForos(foroListadoDTO);
            
            if (response.operacionExitosa && response.dato) {
              const forosDelModulo: ChatForum[] = response.dato.items.map((foro: ForoListItemDTO) => {
                const cursoActual = courses.find(c => c.id === parseInt(selectedCourse));
                
                return {
                  foroId: foro.foroId,
                  titulo: foro.titulo,
                  descripcion: "",
                  moduloId: foro.moduloId,
                  fechaCreacion: new Date(foro.fechaCreacion).toISOString(),
                  activo: foro.estado === 'Activo',
                  cantidadHilos: 0,
                  cantidadPosts: 0,
                  ultimaActividad: "Desconocida",
                  modulo: { nombre: module.nombre },
                  curso: cursoActual ? { nombre: cursoActual.nombre } : undefined,
                  isPinned: false,
                  isUnread: false,
                  lastMessage: undefined
                };
              });
              
              allForums.push(...forosDelModulo);
            }
          } catch (moduleError) {
            console.warn(`Error cargando foros del módulo ${module.moduloId}:`, moduleError);
          }
        }
      } else {
        // Cargar foros del módulo específico
        const moduloId = parseInt(selectedModule);
        if (isNaN(moduloId)) {
          setError("ID de módulo inválido");
          return;
        }

        const foroListadoDTO: ForoListadoDTO = {
          moduloId: moduloId,
          incluirArchivados: false,
          pagina: 1,
          cantidadPorPagina: 50
        };

        const response = await foroService.listarForos(foroListadoDTO);
        
        if (response.operacionExitosa && response.dato) {
          allForums = response.dato.items.map((foro: ForoListItemDTO) => {
            const moduloActual = modules.find(m => m.moduloId === foro.moduloId);
            const cursoActual = courses.find(c => c.id === parseInt(selectedCourse));
            
            return {
              foroId: foro.foroId,
              titulo: foro.titulo,
              descripcion: "",
              moduloId: foro.moduloId,
              fechaCreacion: new Date(foro.fechaCreacion).toISOString(),
              activo: foro.estado === 'Activo',
              cantidadHilos: 0,
              cantidadPosts: 0,
              ultimaActividad: "Desconocida",
              modulo: moduloActual ? { nombre: moduloActual.nombre } : undefined,
              curso: cursoActual ? { nombre: cursoActual.nombre } : undefined,
              isPinned: false,
              isUnread: false,
              lastMessage: undefined
            };
          });
        } else {
          setError(response.mensaje || "Error al cargar foros");
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

      const foroCreacionDTO = {
        moduloId: parseInt(selectedModule),
        titulo: forumTitle.trim(),
        descripcion: forumDescription.trim() || undefined
      };

      const response = await foroService.crearForo(foroCreacionDTO);
      
      if (response.operacionExitosa) {
        setSuccess("Foro creado exitosamente");
        setShowCreateDialog(false);
        resetForm();
        await loadForumsForCurrentSelection();
      } else {
        setError(response.mensaje || "Error al crear el foro");
      }
    } catch (error) {
      console.warn('Error creating forum:', error);
      setError("Error al crear foro");
    } finally {
      setCreating(false);
    }
  };

  // Función para editar foro
  const handleEditForum = async () => {
    if (!editingForum || !editTitle.trim()) {
      setError("El título es obligatorio");
      return;
    }

    try {
      setCreating(true);
      setError("");

      const foroEdicionDTO = {
        titulo: editTitle.trim(),
        descripcion: editDescription.trim() || undefined
      };

      const response = await foroService.editarForo(editingForum.foroId, foroEdicionDTO);
      
      if (response.operacionExitosa) {
        setSuccess("Foro editado exitosamente");
        setShowEditDialog(false);
        setEditingForum(null);
        setEditTitle("");
        setEditDescription("");
        await loadForumsForCurrentSelection();
        
        // Actualizar el foro seleccionado si está abierto
        if (selectedForum && selectedForum.foroId === editingForum.foroId) {
          setSelectedForum({
            ...selectedForum,
            titulo: editTitle.trim(),
            descripcion: editDescription.trim() || ""
          });
        }
      } else {
        setError(response.mensaje || "Error al editar el foro");
      }
    } catch (error) {
      console.warn('Error editing forum:', error);
      setError("Error al editar foro");
    } finally {
      setCreating(false);
    }
  };

  // Función para fijar/desfijar foro (simulada por ahora)
  const handleTogglePin = async (forum: ChatForum) => {
    try {
      setError("");
      
      // Como el backend no tiene endpoint específico para pin/unpin,
      // lo simulamos actualizando el estado local
      const updatedForums = forums.map(f => 
        f.foroId === forum.foroId 
          ? { ...f, isPinned: !f.isPinned }
          : f
      );
      setForums(updatedForums);
      
      // Actualizar el foro seleccionado si está abierto
      if (selectedForum && selectedForum.foroId === forum.foroId) {
        setSelectedForum({
          ...selectedForum,
          isPinned: !selectedForum.isPinned
        });
      }
      
      setSuccess(`Foro ${forum.isPinned ? 'desfijado' : 'fijado'} exitosamente`);
    } catch (error) {
      console.warn('Error toggling pin:', error);
      setError("Error al fijar/desfijar foro");
    }
  };

  // Función para eliminar foro
  const handleDeleteForum = async (forum: ChatForum) => {
    if (!confirm(`¿Está seguro de que desea eliminar el foro "${forum.titulo}"?`)) {
      return;
    }

    try {
      setError("");
      
      const response = await foroService.eliminarForo(forum.foroId);
      
      if (response.operacionExitosa) {
        setSuccess("Foro eliminado exitosamente");
        await loadForumsForCurrentSelection();
      } else {
        setError(response.mensaje || "Error al eliminar el foro");
      }
    } catch (error) {
      console.warn('Error deleting forum:', error);
      setError("Error al eliminar foro");
    }
  };

  // Función para abrir el diálogo de edición
  const openEditDialog = (forum: ChatForum) => {
    setEditingForum(forum);
    setEditTitle(forum.titulo);
    setEditDescription(forum.descripcion || "");
    setShowEditDialog(true);
  };

  // Función para expandir/colapsar la vista del foro
  const toggleForumExpansion = (forum: ChatForum) => {
    console.log('Toggling foro:', forum.titulo);
    
    if (expandedForumId === forum.foroId.toString()) {
      // Si ya está expandido, colapsarlo
      setExpandedForumId(null);
      setSelectedForum(null);
      setSelectedHilo(null);
      setPosts([]);
      setHilos([]);
    } else {
      // Expandir este foro
      setExpandedForumId(forum.foroId.toString());
      setSelectedForum(forum);
      setSelectedHilo(null);
      setPosts([]);
      loadHilos(forum.foroId);
    }
  };

  // ==========================================
  // FUNCIONES PARA HILOS
  // ==========================================

  const loadHilos = async (foroId: number) => {
    try {
      setLoadingHilos(true);
      setError("");

      const response = await hiloService.listarHilos(foroId, {
        cantidadPorPagina: 50,
        pagina: 1
      });

      if (response.operacionExitosa && response.dato) {
        setHilos(response.dato.items);

        // Obtener información de los autores únicos de los hilos
        const autorIdsHilos = [...new Set(response.dato.items.map(hilo => hilo.autorId))];
        const autoresHilosInfo: Record<string, UsuarioDTO> = {};

        for (const autorId of autorIdsHilos) {
          try {
            console.log('🔍 [loadHilos] Loading author info for hilo:', autorId);
            const autorInfo = await usuarioService.obtenerUsuarioPorId(autorId);
            console.log('✅ [loadHilos] Author info loaded for hilo:', autorInfo);
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
        setError(response.mensaje || "Error al cargar hilos");
        setHilos([]);
      }
    } catch (error) {
      console.warn('Error loading hilos:', error);
      setError("Error al cargar hilos");
      setHilos([]);
    } finally {
      setLoadingHilos(false);
    }
  };

  const handleCreateHilo = async () => {
    if (!hiloTitle.trim() || !selectedForum) {
      setError("El título del hilo es obligatorio");
      return;
    }

    try {
      setLoadingHilos(true);
      setError("");

      const hiloCreacionDTO: HiloCreacionDTO = {
        foroId: selectedForum.foroId,
        titulo: hiloTitle.trim()
      };

      const response = await hiloService.crearHilo(hiloCreacionDTO);

      if (response.operacionExitosa) {
        setSuccess("Hilo creado exitosamente");
        setShowCreateHiloDialog(false);
        setHiloTitle("");
        await loadHilos(selectedForum.foroId);
      } else {
        setError(response.mensaje || "Error al crear el hilo");
      }
    } catch (error) {
      console.warn('Error creating hilo:', error);
      setError("Error al crear hilo");
    } finally {
      setLoadingHilos(false);
    }
  };

  const handleTogglePinHilo = async (hilo: HiloListItemDTO) => {
    try {
      setError("");

      if (hilo.pinned) {
        await hiloService.quitarFijado(hilo.hiloId);
        setSuccess("Hilo desfijado exitosamente");
      } else {
        await hiloService.fijarHilo(hilo.hiloId, { pinnedOrder: 1 });
        setSuccess("Hilo fijado exitosamente");
      }

      if (selectedForum) {
        await loadHilos(selectedForum.foroId);
      }
    } catch (error) {
      console.warn('Error toggling pin hilo:', error);
      setError("Error al fijar/desfijar hilo");
    }
  };

  const handleToggleCerrarHilo = async (hilo: HiloListItemDTO) => {
    try {
      setError("");

      await hiloService.cerrarHilo(hilo.hiloId, { cerrado: !hilo.cerrado });
      setSuccess(`Hilo ${hilo.cerrado ? 'abierto' : 'cerrado'} exitosamente`);

      if (selectedForum) {
        await loadHilos(selectedForum.foroId);
      }
    } catch (error) {
      console.warn('Error toggling cerrar hilo:', error);
      setError("Error al abrir/cerrar hilo");
    }
  };

  // ==========================================
  // FUNCIONES PARA POSTS
  // ==========================================

  const loadPosts = async (hiloId: number) => {
    console.log('🔍 [loadPosts] Starting loadPosts with hiloId:', hiloId);
    console.log('🔍 [loadPosts] hiloId type:', typeof hiloId);
    console.log('🔍 [loadPosts] hiloId is NaN:', isNaN(hiloId));
    
    if (!hiloId || hiloId <= 0 || isNaN(hiloId)) {
      console.error('❌ [loadPosts] Invalid hiloId:', hiloId);
      setError("ID de hilo inválido");
      setLoadingPosts(false);
      return;
    }
    
    try {
      setLoadingPosts(true);
      setError("");

      const requestBody = {
        cantidadPorPagina: 50,
        pagina: 1
      };
      
      console.log('📡 [loadPosts] Calling postService.listarPosts with:', { hiloId, requestBody });
      console.log('🌐 [loadPosts] API_BASE_URL:', process.env.NEXT_PUBLIC_API_URL);
      
      const response = await postService.listarPosts(hiloId, {
        cantidadPorPagina: 50,
        pagina: 1
      });

      console.log('📊 [loadPosts] Response received:', response);

      if (response.operacionExitosa && response.dato) {
        setPosts(response.dato.items);

        // Obtener información de los autores únicos
        const autorIds = [...new Set(response.dato.items.map(post => post.autorId))];
        const autoresInfo: Record<string, UsuarioDTO> = {};

        for (const autorId of autorIds) {
          try {
            console.log('🔍 [loadPosts] Loading author info for:', autorId);
            const autorInfo = await usuarioService.obtenerUsuarioPorId(autorId);
            console.log('✅ [loadPosts] Author info loaded:', autorInfo);
            autoresInfo[autorId] = autorInfo;
          } catch (error) {
            console.warn(`❌ [loadPosts] Error loading author info for ${autorId}:`, error);
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
        setError(response.mensaje || "Error al cargar posts");
        setPosts([]);
      }
    } catch (error) {
      console.warn('Error loading posts:', error);
      setError("Error al cargar posts");
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() || !selectedHilo) {
      setError("El contenido del post es obligatorio");
      return;
    }

    try {
      setLoadingPosts(true);
      setError("");

      const postCreacionDTO: PostCreacionDTO = {
        hiloId: selectedHilo.hiloId,
        contenido: postContent.trim()
      };

      const response = await postService.crearPost(postCreacionDTO);

      if (response.operacionExitosa) {
        setSuccess("Post creado exitosamente");
        setShowCreatePostDialog(false);
        setPostContent("");
        await loadPosts(selectedHilo.hiloId);
      } else {
        setError(response.mensaje || "Error al crear el post");
      }
    } catch (error) {
      console.warn('Error creating post:', error);
      setError("Error al crear post");
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleEditPost = async () => {
    if (!postContent.trim() || !editingPost) {
      setError("El contenido del post es obligatorio");
      return;
    }

    try {
      setLoadingPosts(true);
      setError("");

      const postEdicionDTO: PostEdicionDTO = {
        contenido: postContent.trim()
      };

      const response = await postService.editarPost(editingPost.postId, postEdicionDTO);

      if (response.operacionExitosa) {
        setSuccess("Post editado exitosamente");
        setShowEditPostDialog(false);
        setEditingPost(null);
        setPostContent("");
        if (selectedHilo) {
          await loadPosts(selectedHilo.hiloId);
        }
      } else {
        setError(response.mensaje || "Error al editar el post");
      }
    } catch (error) {
      console.warn('Error editing post:', error);
      setError("Error al editar post");
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleDeletePost = async (post: PostDTO) => {
    if (!confirm(`¿Está seguro de que desea eliminar este post?`)) {
      return;
    }

    try {
      setError("");

      const response = await postService.eliminarPost(post.postId);

      if (response.operacionExitosa) {
        setSuccess("Post eliminado exitosamente");
        if (selectedHilo) {
          await loadPosts(selectedHilo.hiloId);
        }
      } else {
        setError(response.mensaje || "Error al eliminar el post");
      }
    } catch (error) {
      console.warn('Error deleting post:', error);
      setError("Error al eliminar post");
    }
  };

  // Funciones auxiliares
  const openEditPostDialog = (post: PostDTO) => {
    setEditingPost(post);
    setPostContent(post.contenido);
    setShowEditPostDialog(true);
  };

  const selectHilo = (hilo: HiloListItemDTO) => {
    setSelectedHilo(hilo);
    loadPosts(hilo.hiloId);
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
      (activeCategory === 'pinned' && forum.isPinned);
    
    return matchesSearch && matchesCategory;
  });

  // Función para obtener el tiempo relativo
  const getRelativeTime = (activity?: string) => {
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
              
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={resetForm} 
                    disabled={!selectedModule || selectedModule === "all"}
                    className="bg-gradient-to-r from-unab-navy to-unab-navy-light hover:from-unab-navy-dark hover:to-unab-navy text-white dark:from-unab-navy-dark dark:to-unab-navy dark:hover:from-unab-navy dark:hover:to-unab-navy-dark"
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
                    <Button onClick={handleCreateForum} disabled={creating} className="bg-gradient-to-r from-unab-navy to-unab-navy-light hover:from-unab-navy-dark hover:to-unab-navy text-white dark:from-unab-navy-dark dark:to-unab-navy dark:hover:from-unab-navy dark:hover:to-unab-navy-dark">
                      {creating ? "Creando..." : "Crear Canal"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Diálogo de edición */}
              <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center">
                      <Edit className="w-5 h-5 mr-2" />
                      Editar Canal de Foro
                    </DialogTitle>
                    <DialogDescription>
                      Modifica la información del canal seleccionado.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="editTitle">Título del Canal</Label>
                      <Input
                        id="editTitle"
                        placeholder="ej. anuncios-generales"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="editDescription">Descripción (opcional)</Label>
                      <Textarea
                        id="editDescription"
                        placeholder="¿De qué se trata este canal?"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleEditForum} disabled={creating}>
                      {creating ? "Guardando..." : "Guardar Cambios"}
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
                      ? 'bg-unab-navy/10 text-unab-navy dark:bg-unab-navy/20 dark:text-unab-navy-light' 
                      : 'text-gray-600 hover:bg-unab-gray-100 dark:text-gray-400 dark:hover:bg-unab-gray-700'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Todos los canales
                </button>
                <button
                  onClick={() => setActiveCategory('pinned')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeCategory === 'pinned' 
                      ? 'bg-unab-red/10 text-unab-red dark:bg-unab-red/20 dark:text-unab-red-light' 
                      : 'text-gray-600 hover:bg-unab-gray-100 dark:text-gray-400 dark:hover:bg-unab-gray-700'
                  }`}
                >
                  <Pin className="w-4 h-4 inline mr-2" />
                  Fijados
                </button>
              </div>
            </div>
          </div>

          {/* Lista de foros tipo chat */}
          <div className="flex-1 flex flex-col overflow-hidden">{/* Messages area */}
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
                      <div key={forum.foroId}>
                        {/* Card del foro */}
                        <div
                          className={`group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 ${
                            forum.isUnread ? 'border-l-4 border-l-blue-500' : ''
                          } ${expandedForumId === forum.foroId.toString() ? 'border-blue-500 dark:border-blue-400' : ''}`}
                        >
                          <div className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Hash className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                  <button 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      toggleForumExpansion(forum);
                                    }}
                                    className="font-semibold text-gray-900 dark:text-white truncate hover:text-unab-navy dark:hover:text-unab-navy-400 transition-colors text-left"
                                  >
                                    {forum.titulo}
                                  </button>
                                  {forum.isPinned && (
                                    <Pin className="w-4 h-4 text-unab-red flex-shrink-0" />
                                  )}
                                  {forum.isUnread && (
                                    <div className="w-2 h-2 bg-unab-red rounded-full flex-shrink-0"></div>
                                  )}
                                  {expandedForumId === forum.foroId.toString() && (
                                    <ChevronDown className="w-4 h-4 text-unab-navy flex-shrink-0" />
                                  )}
                                  {expandedForumId !== forum.foroId.toString() && (
                                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  )}
                                </div>
                                
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                  {forum.descripcion}
                                </p>
                                
                                {/* Último mensaje */}
                                {forum.lastMessage && (
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
                                    {/* Sin estadísticas - solo canales disponibles en header */}
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleForumExpansion(forum);
                                      }}
                                    >
                                      <MessageSquare className="w-4 h-4 mr-2" />
                                      {expandedForumId === forum.foroId.toString() ? 'Cerrar' : 'Abrir'}
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
                                  <DropdownMenuItem onClick={() => openEditDialog(forum)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Editar canal
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleTogglePin(forum)}>
                                    <Pin className="w-4 h-4 mr-2" />
                                    {forum.isPinned ? 'Desfijar' : 'Fijar'} canal
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => handleDeleteForum(forum)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Eliminar canal
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>

                        {/* Contenido expandido del foro */}
                        {expandedForumId === forum.foroId.toString() && selectedForum && (
                          <div className="mt-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="flex h-96">
                              {/* Panel izquierdo - Lista de hilos */}
                              <div className="w-1/3 border-r border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900">
                                <div className="p-4 border-b border-gray-200 dark:border-gray-600">
                                  <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Hilos</h3>
                                    <Button 
                                      size="sm" 
                                      onClick={() => setShowCreateHiloDialog(true)}
                                      className="text-xs"
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Nuevo
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="overflow-y-auto h-80">
                                  {loadingHilos ? (
                                    <div className="flex items-center justify-center h-20">
                                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                    </div>
                                  ) : hilos.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500 text-sm">
                                      No hay hilos en este foro
                                    </div>
                                  ) : (
                                    hilos.map((hilo) => (
                                      <div
                                        key={hilo.hiloId}
                                        className={`p-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                                          selectedHilo?.hiloId === hilo.hiloId ? 'bg-unab-navy/5 dark:bg-unab-navy/10 border-l-2 border-l-unab-navy' : ''
                                        }`}
                                        onClick={() => {
                                          setSelectedHilo(hilo);
                                          loadPosts(hilo.hiloId);
                                        }}
                                      >
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2">
                                              <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                              <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {hilo.titulo}
                                              </h4>
                                              {hilo.pinned && (
                                                <Pin className="w-3 h-3 text-unab-red flex-shrink-0" />
                                              )}
                                              {hilo.cerrado && (
                                                <Lock className="w-3 h-3 text-red-500 flex-shrink-0" />
                                              )}
                                            </div>
                                            <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                                              <img
                                                src={usuarioService.obtenerUrlFotoPerfil(autoresHilos[hilo.autorId]?.fotoPerfil)}
                                                alt={`Foto de ${autoresHilos[hilo.autorId]?.nombre || 'Usuario'}`}
                                                className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                                              />
                                              <span>{autoresHilos[hilo.autorId]?.nombre || `Usuario ${hilo.autorId}`}</span>
                                              <span>•</span>
                                              <span>{getRelativeTime(hilo.fechaCreacion.toString())}</span>
                                            </div>
                                          </div>
                                          
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0">
                                                <MoreVertical className="w-3 h-3" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40">
                                              <DropdownMenuItem onClick={() => handleTogglePinHilo(hilo)}>
                                                <Pin className="w-4 h-4 mr-2" />
                                                {hilo.pinned ? 'Desfijar' : 'Fijar'}
                                              </DropdownMenuItem>
                                              <DropdownMenuItem onClick={() => handleToggleCerrarHilo(hilo)}>
                                                <Lock className="w-4 h-4 mr-2" />
                                                {hilo.cerrado ? 'Abrir' : 'Cerrar'}
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>

                              {/* Panel derecho - Posts del hilo seleccionado */}
                              <div className="flex-1 flex flex-col">
                                {selectedHilo ? (
                                  <>
                                    {/* Header del hilo */}
                                    <div className="p-4 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <h3 className="font-semibold text-gray-900 dark:text-white">{selectedHilo.titulo}</h3>
                                          <p className="text-sm text-gray-500">{posts.length} mensajes</p>
                                        </div>
                                        <Button 
                                          size="sm" 
                                          onClick={() => setShowCreatePostDialog(true)}
                                          disabled={selectedHilo.cerrado}
                                        >
                                          <Send className="w-4 h-4 mr-2" />
                                          Responder
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Lista de posts */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                      {loadingPosts ? (
                                        <div className="flex items-center justify-center h-20">
                                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                        </div>
                                      ) : posts.length === 0 ? (
                                        <div className="text-center text-gray-500 text-sm">
                                          No hay mensajes en este hilo
                                        </div>
                                      ) : (
                                        posts.map((post) => (
                                          <div
                                            key={post.postId}
                                            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 group"
                                          >
                                            <div className="flex items-start space-x-3">
                                              <div className="flex-shrink-0">
                                                <img
                                                  src={usuarioService.obtenerUrlFotoPerfil(autoresPosts[post.autorId]?.fotoPerfil)}
                                                  alt={`Foto de ${autoresPosts[post.autorId]?.nombre || 'Usuario'}`}
                                                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                                                />
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2 mb-2">
                                                  <span className="font-medium text-gray-900 dark:text-white">
                                                    {autoresPosts[post.autorId]?.nombre || `Usuario ${post.autorId}`}
                                                  </span>
                                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {getRelativeTime(post.fechaCreacion.toString())}
                                                  </span>
                                                </div>
                                                
                                                <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                                  {post.contenido}
                                                </div>
                                              </div>
                                              
                                              <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0">
                                                    <MoreVertical className="w-3 h-3" />
                                                  </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                  <DropdownMenuItem onClick={() => {
                                                    setEditingPost(post);
                                                    setPostContent(post.contenido);
                                                    setShowEditPostDialog(true);
                                                  }}>
                                                    <Edit className="w-4 h-4 mr-2" />
                                                    Editar
                                                  </DropdownMenuItem>
                                                  <DropdownMenuItem 
                                                    className="text-red-600"
                                                    onClick={() => handleDeletePost(post)}
                                                  >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Eliminar
                                                  </DropdownMenuItem>
                                                </DropdownMenuContent>
                                              </DropdownMenu>
                                            </div>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex-1 flex items-center justify-center text-gray-500">
                                    Selecciona un hilo para ver los mensajes
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Diálogos para hilos y posts */}
        
        {/* Diálogo crear hilo */}
        <Dialog open={showCreateHiloDialog} onOpenChange={setShowCreateHiloDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Crear Nuevo Hilo
              </DialogTitle>
              <DialogDescription>
                Los hilos organizan las conversaciones dentro del foro.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="hiloTitle">Título del Hilo</Label>
                <Input
                  id="hiloTitle"
                  placeholder="ej. Pregunta sobre el tema 1"
                  value={hiloTitle}
                  onChange={(e) => setHiloTitle(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateHiloDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateHilo} disabled={loadingHilos}>
                {loadingHilos ? "Creando..." : "Crear Hilo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo crear post */}
        <Dialog open={showCreatePostDialog} onOpenChange={setShowCreatePostDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Send className="w-5 h-5 mr-2" />
                Crear Nuevo Post
              </DialogTitle>
              <DialogDescription>
                Agrega tu mensaje al hilo "{selectedHilo?.titulo}"
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="postContent">Contenido del Post</Label>
                <Textarea
                  id="postContent"
                  placeholder="Escribe tu mensaje aquí..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="mt-1 min-h-[120px]"
                  rows={6}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreatePostDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreatePost} disabled={loadingPosts}>
                {loadingPosts ? "Enviando..." : "Enviar Post"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo editar post */}
        <Dialog open={showEditPostDialog} onOpenChange={setShowEditPostDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Edit className="w-5 h-5 mr-2" />
                Editar Post
              </DialogTitle>
              <DialogDescription>
                Modifica el contenido de tu mensaje.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="editPostContent">Contenido del Post</Label>
                <Textarea
                  id="editPostContent"
                  placeholder="Escribe tu mensaje aquí..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="mt-1 min-h-[120px]"
                  rows={6}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditPostDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditPost} disabled={loadingPosts}>
                {loadingPosts ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
