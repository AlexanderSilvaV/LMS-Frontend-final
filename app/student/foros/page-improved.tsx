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
  TrendingUp
} from 'lucide-react';
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
  curso?: string;
}

interface ForumSummary {
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
}

export default function StudentForumsPage() {
  // Estados basados en patrones exitosos
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [forums, setForums] = useState<ForumSummary[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Filter states
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "title">("recent");

  // Messages
  const [error, setError] = useState("");

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
  }, [selectedModule, showOnlyActive, sortBy]);

  const loadStudentCourses = async () => {
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
    } catch (error) {
      console.error('Error al cargar cursos:', error);
      setError("Error al cargar cursos asignados");
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadModules = async (courseId: number) => {
    try {
      setError("");
      
      console.log('Intentando cargar módulos para courseId:', courseId);
      
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
            console.error('Error en API directa:', response.status);
            modulesData = [];
          }
        } catch (apiError) {
          console.error('Error en API directa:', apiError);
          modulesData = [];
        }
      }
      
      if (Array.isArray(modulesData)) {
        // Agregar información del curso a cada módulo
        const courseName = courses.find(c => c.id === courseId)?.nombre || "";
        const modulesWithCourse: Module[] = modulesData.map((module) => ({
          ...module,
          curso: courseName
        }));
        
        setModules(modulesWithCourse);
        console.log('Módulos procesados exitosamente:', modulesWithCourse.length);
      } else {
        console.warn('La respuesta de módulos no es un array:', modulesData);
        setModules([]);
      }
    } catch (error) {
      console.error('Error al cargar módulos:', error);
      setModules([]);
      
      // Solo mostrar error si es algo crítico
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      if (!errorMessage.includes('No se encontraron')) {
        setError(`Problema al cargar módulos del curso: ${errorMessage}`);
      }
    }
  };

  const loadForums = async () => {
    try {
      setLoading(true);
      setError("");
      
      let forumsToLoad: ForumSummary[] = [];
      
      if (selectedCourse === "all") {
        // Cargar foros de todos los cursos
        for (const course of courses) {
          try {
            const modulesData = await cursoService.obtenerModulosPorCurso(course.id);
            
            if (Array.isArray(modulesData)) {
              for (const module of modulesData) {
                try {
                  const forosResponse = await foroService.listarForos({
                    moduloId: module.moduloId,
                    incluirArchivados: !showOnlyActive,
                    pagina: 1,
                    cantidadPorPagina: 50
                  });

                  if (forosResponse.operacionExitosa && forosResponse.dato) {
                    const forumsWithDetails = forosResponse.dato.items.map(forum => ({
                      ...forum,
                      cantidadHilos: 0, // Placeholder - se puede obtener después
                      cantidadPosts: 0, // Placeholder - se puede obtener después
                      modulo: { nombre: module.nombre },
                      curso: { nombre: course.nombre, nrc: course.nrc }
                    }));
                    forumsToLoad.push(...forumsWithDetails);
                  }
                } catch (error) {
                  console.error(`Error al cargar foros del módulo ${module.moduloId}:`, error);
                }
              }
            }
          } catch (error) {
            console.error(`Error al cargar módulos del curso ${course.id}:`, error);
          }
        }
      } else {
        // Cargar foros del curso seleccionado
        const courseId = parseInt(selectedCourse);
        const courseName = courses.find(c => c.id === courseId)?.nombre || "";
        const courseNrc = courses.find(c => c.id === courseId)?.nrc || "";
        
        const modulesToLoad = selectedModule === "all" ? modules : modules.filter(m => m.moduloId === parseInt(selectedModule));
        
        for (const module of modulesToLoad) {
          try {
            const forosResponse = await foroService.listarForos({
              moduloId: module.moduloId,
              incluirArchivados: !showOnlyActive,
              pagina: 1,
              cantidadPorPagina: 50
            });

            if (forosResponse.operacionExitosa && forosResponse.dato) {
              const forumsWithDetails = forosResponse.dato.items.map(forum => ({
                ...forum,
                cantidadHilos: 0, // Placeholder - se puede obtener después
                cantidadPosts: 0, // Placeholder - se puede obtener después
                modulo: { nombre: module.nombre },
                curso: { nombre: courseName, nrc: courseNrc }
              }));
              forumsToLoad.push(...forumsWithDetails);
            }
          } catch (error) {
            console.error(`Error al cargar foros del módulo ${module.moduloId}:`, error);
          }
        }
      }
      
      // Aplicar filtros y ordenamiento
      let filteredForums = forumsToLoad;
      
      if (showOnlyActive) {
        filteredForums = filteredForums.filter(forum => forum.estado === 'Activo');
      }
      
      // Ordenar foros
      switch (sortBy) {
        case "recent":
          filteredForums.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
          break;
        case "popular":
          filteredForums.sort((a, b) => (b.cantidadPosts || 0) - (a.cantidadPosts || 0));
          break;
        case "title":
          filteredForums.sort((a, b) => a.titulo.localeCompare(b.titulo));
          break;
      }
      
      setForums(filteredForums);
    } catch (error) {
      console.error('Error al cargar foros:', error);
      setError("Error al cargar foros");
    } finally {
      setLoading(false);
    }
  };

  const filteredForums = forums.filter(forum =>
    forum.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (forum.modulo?.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (forum.curso?.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getActivityBadge = (forum: ForumSummary) => {
    const totalActivity = (forum.cantidadHilos || 0) + (forum.cantidadPosts || 0);
    
    if (totalActivity === 0) {
      return <Badge variant="secondary">Sin actividad</Badge>;
    } else if (totalActivity < 5) {
      return <Badge variant="outline">Baja actividad</Badge>;
    } else if (totalActivity < 20) {
      return <Badge variant="default">Actividad moderada</Badge>;
    } else {
      return <Badge className="bg-green-600">Alta actividad</Badge>;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar role="student" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Foros de Discusión</h1>
              <p className="text-muted-foreground">
                Participa en las discusiones de tus cursos
              </p>
            </div>
            
            <Button variant="outline" onClick={loadStudentCourses} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="course-select">Curso</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
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
            
            <div>
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
            
            <div>
              <Label htmlFor="sort-select">Ordenar por</Label>
              <Select value={sortBy} onValueChange={(value: "recent" | "popular" | "title") => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Más recientes</SelectItem>
                  <SelectItem value="popular">Más populares</SelectItem>
                  <SelectItem value="title">Título (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
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
            
            <div>
              <Label htmlFor="active-filter">Filtros</Label>
              <Select value={showOnlyActive ? "active" : "all"} onValueChange={(value) => setShowOnlyActive(value === "active")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Solo activos</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {(loadingCourses || loading) && (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin" />
              <span className="ml-2">
                {loadingCourses ? "Cargando cursos..." : "Cargando foros..."}
              </span>
            </div>
          )}

          {/* Forums Grid */}
          {!loadingCourses && !loading && (
            <div className="space-y-4">
              {filteredForums.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay foros disponibles</h3>
                  <p className="text-muted-foreground">
                    {searchTerm 
                      ? "No se encontraron foros que coincidan con tu búsqueda"
                      : "No hay foros disponibles en este momento"
                    }
                  </p>
                </div>
              ) : (
                filteredForums.map((forum) => (
                  <Card key={forum.foroId} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-start gap-2">
                            {forum.isPinned && (
                              <Pin className="w-4 h-4 text-unab-red mt-1 flex-shrink-0" />
                            )}
                            <div>
                              <CardTitle className="text-lg font-semibold line-clamp-2">
                                {forum.titulo}
                              </CardTitle>
                              <CardDescription className="mt-1 line-clamp-2">
                                {forum.titulo} - Estado: {forum.estado}
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getActivityBadge(forum)}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-3">
                        {/* Module and Course Info */}
                        <div className="flex flex-wrap gap-2">
                          {forum.modulo && (
                            <Badge variant="secondary">
                              <BookOpen className="w-3 h-3 mr-1" />
                              {forum.modulo.nombre}
                            </Badge>
                          )}
                          {forum.curso && (
                            <Badge variant="outline">
                              {forum.curso.nombre} ({forum.curso.nrc})
                            </Badge>
                          )}
                        </div>
                        
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            {forum.cantidadHilos || 0} hilo{(forum.cantidadHilos || 0) !== 1 ? 's' : ''}
                          </div>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {forum.cantidadPosts || 0} respuesta{(forum.cantidadPosts || 0) !== 1 ? 's' : ''}
                          </div>
                        </div>
                        
                        {/* Date */}
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="w-4 h-4 mr-1" />
                          Creado: {new Date(forum.fechaCreacion).toLocaleDateString()}
                        </div>
                        
                        {/* User Status */}
                        {forum.requireInitialPost && (
                          <div className="flex items-center text-sm">
                            {forum.hasUserPosted ? (
                              <Badge className="bg-green-100 text-green-800">
                                ✓ Has participado
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                Requiere participación inicial
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button asChild size="sm" className="flex-1">
                            <Link href={`/modulo/${forum.moduloId}/foros/${forum.foroId}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Foro
                            </Link>
                          </Button>
                          {(forum.cantidadHilos || 0) > 0 && (
                            <Button asChild size="sm" variant="outline" className="flex-1">
                              <Link href={`/modulo/${forum.moduloId}/foros/${forum.foroId}`}>
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Hilos ({forum.cantidadHilos})
                              </Link>
                            </Button>
                          )}
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
