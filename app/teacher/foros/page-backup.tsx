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
  MoreHorizontal,
  Filter,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  TrendingUp,
  Calendar,
  Activity
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
  const [loadingModules, setLoadingModules] = useState(false);
  const [creating, setCreating] = useState(false);

  // UI/UX Enhancement states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'activity'>('recent');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFilters, setShowFilters] = useState(false);

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
    setForums([]);
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedCourse && selectedCourse !== "" && modules.length > 0) {
      if (selectedModule === "all") {
        loadAllForums();
      } else if (selectedModule && selectedModule !== "") {
        loadForums(parseInt(selectedModule));
      }
    } else {
      setForums([]);
    }
  }, [selectedModule, selectedCourse, modules]);

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
      setLoadingModules(true);
      setError("");
      
      console.log('Intentando cargar módulos para courseId:', courseId);
      
      // Intentar cargar los módulos del servicio
      let modulesData: any[] = [];
      try {
        modulesData = await cursoService.obtenerModulosPorCurso(courseId);
        console.log('Módulos obtenidos del servicio:', modulesData);
        } catch (serviceError) {
          console.warn('Error en servicio de módulos, intentando API directa:', serviceError);
          
          // Fallback: intentar llamada directa a la API
          try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/modulos/curso/${courseId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            
            if (response.ok) {
              const data = await response.json();
              modulesData = data.dato || data || [];
              console.log('Módulos obtenidos de API directa:', modulesData);
            } else {
              const errorText = await response.text();
              console.error('Error en API directa:', response.status, errorText);
              modulesData = [];
            }
          } catch (apiError) {
            console.error('Error en API directa:', apiError);
            modulesData = [];
          }
        }      if (Array.isArray(modulesData) && modulesData.length > 0) {
        console.log('Módulos cargados exitosamente:', modulesData.length);
        setModules(modulesData);
        setSelectedModule("all");
      } else {
        console.log('No se encontraron módulos para el curso:', courseId);
        setModules([]);
        setSelectedModule("");
        // No mostrar error si simplemente no hay módulos
      }
    } catch (error) {
      console.error('Error general al cargar módulos:', error);
      setModules([]);
      setSelectedModule("");
      
      // Solo mostrar error si es algo crítico
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      if (!errorMessage.includes('No se encontraron')) {
        setError(`Problema al cargar módulos: ${errorMessage}`);
      }
    } finally {
      setLoadingModules(false);
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
          descripcion: '', // Placeholder ya que no está en ForoListItemDTO
          moduloId: forum.moduloId,
          fechaCreacion: forum.fechaCreacion.toString(),
          activo: forum.estado === 'Activo',
          cantidadHilos: 0, // Placeholder - se puede obtener después
          cantidadPosts: 0, // Placeholder - se puede obtener después
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
              descripcion: '', // Placeholder ya que no está en ForoListItemDTO
              moduloId: forum.moduloId,
              fechaCreacion: forum.fechaCreacion.toString(),
              activo: forum.estado === 'Activo',
              cantidadHilos: 0, // Placeholder - se puede obtener después
              cantidadPosts: 0, // Placeholder - se puede obtener después
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

    if (!selectedModule || selectedModule === "all" || selectedModule === "") {
      setError("Debe seleccionar un módulo específico para crear el foro");
      return;
    }

    if (!selectedCourse || selectedCourse === "") {
      setError("Debe seleccionar un curso");
      return;
    }

    try {
      setCreating(true);
      setError("");

      const forumData: CreateForumData = {
        titulo: forumTitle.trim(),
        descripcion: forumDescription.trim() || "", // Asegurar que no sea null/undefined
        moduloId: parseInt(selectedModule)
      };

      const response = await foroService.crearForo(forumData);

      if (response.operacionExitosa) {
        setSuccess("Foro creado exitosamente");
        setShowCreateDialog(false);
        resetForm();
        
        // Recargar foros - mantener la vista actual
        const currentModuleSelection = selectedModule;
        if (currentModuleSelection === "all") {
          await loadAllForums();
        } else {
          await loadForums(parseInt(selectedModule));
        }
        
        setTimeout(() => setSuccess(""), 3000);
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
    // Validaciones básicas
    if (!forumTitle.trim()) {
      setError("El título es obligatorio");
      return;
    }

    try {
      setCreating(true);
      setError("");

      const response = await foroService.editarForo(forum.foroId, {
        titulo: forumTitle.trim(),
        descripcion: forumDescription?.trim() || "" // Asegurar que no sea undefined/null
      });

      if (response.operacionExitosa) {
        setSuccess("Foro actualizado exitosamente");
        setEditingForum(null);
        setShowCreateDialog(false);
        resetForm();
        
        // Recargar foros
        if (selectedModule !== "all") {
          await loadForums(parseInt(selectedModule));
        } else {
          await loadAllForums();
        }
        
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.mensaje || "Error al actualizar foro");
      }
    } catch (error) {
      console.error('Error al actualizar foro:', error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      setError(`Error al actualizar foro: ${errorMessage}`);
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
    setForumTitle(forum.titulo || "");
    setForumDescription(forum.descripcion || "");
    setShowCreateDialog(true);
  };

  // Filtrado simple que sabemos que funciona
  const filteredForums = forums.filter(forum => 
    forum.titulo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-unab-gray-50 dark:bg-unab-navy-dark">
      <Sidebar role="teacher" />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {/* Contenido del archivo */}
        </main>
      </div>
    </div>
  );
}
