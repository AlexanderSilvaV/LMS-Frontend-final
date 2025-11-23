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
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Clock, 
  Calendar,
  Play,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  BookOpen,
  Target,
  Timer,
  Award,
  BarChart3,
  TrendingUp,
  FileText
} from 'lucide-react';
import { cursoService } from '@/app/lib/services/curso-service';
import { evaluacionService } from '@/app/lib/evaluacion-service';
import { format, differenceInMinutes, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
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

interface EvaluationSummary {
  evaluacionId: number;
  titulo: string;
  descripcion?: string;
  moduloId: number;
  fechaInicio: Date;
  fechaFin: Date;
  duracionMinutos: number;
  intentosPermitidos: number;
  intentosRealizados: number;
  calificacionObtenida?: number;
  calificacionMaxima: number;
  estado: 'Pendiente' | 'En Progreso' | 'Completada' | 'Expirada';
  tiempoRestante?: number;
  modulo?: { nombre: string };
  curso?: { nombre: string; nrc: string };
  puedeReintentar: boolean;
  fechaUltimoIntento?: Date;
  progreso: number;
}

export default function StudentEvaluationsPage() {
  // Estados basados en patrones exitosos
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationSummary[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [sortBy, setSortBy] = useState<"fecha" | "calificacion" | "titulo">("fecha");

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
    loadEvaluations();
  }, [selectedCourse]);

  useEffect(() => {
    loadEvaluations();
  }, [selectedModule, selectedStatus, sortBy]);

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
    } catch (error) {
      console.error('Error al cargar módulos:', error);
      setError("Error al cargar módulos del curso");
    }
  };

  const loadEvaluations = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Simular datos de evaluaciones (adaptar cuando el servicio esté disponible)
      const mockEvaluations: EvaluationSummary[] = [];
      
      if (selectedCourse === "all") {
        // Cargar evaluaciones de todos los cursos
        for (const course of courses) {
          try {
            const modulesData = await cursoService.obtenerModulosPorCurso(course.id);
            
            if (Array.isArray(modulesData)) {
              for (const module of modulesData) {
                // Aquí se harían las llamadas reales al servicio de evaluaciones
                // Por ahora simulamos algunos datos
                const mockModuleEvaluations: EvaluationSummary[] = [
                  {
                    evaluacionId: Math.floor(Math.random() * 1000),
                    titulo: `Evaluación ${module.nombre}`,
                    descripcion: `Evaluación del módulo ${module.nombre}`,
                    moduloId: module.moduloId,
                    fechaInicio: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    duracionMinutos: 60,
                    intentosPermitidos: 3,
                    intentosRealizados: Math.floor(Math.random() * 2),
                    calificacionObtenida: Math.random() > 0.5 ? Math.floor(Math.random() * 100) : undefined,
                    calificacionMaxima: 100,
                    estado: Math.random() > 0.3 ? 'Pendiente' : 'Completada' as any,
                    modulo: { nombre: module.nombre },
                    curso: { nombre: course.nombre, nrc: course.nrc },
                    puedeReintentar: Math.random() > 0.5,
                    progreso: Math.floor(Math.random() * 100)
                  }
                ];
                mockEvaluations.push(...mockModuleEvaluations);
              }
            }
          } catch (error) {
            console.error(`Error al cargar evaluaciones del curso ${course.id}:`, error);
          }
        }
      } else {
        // Cargar evaluaciones del curso seleccionado
        const courseId = parseInt(selectedCourse);
        const courseName = courses.find(c => c.id === courseId)?.nombre || "";
        const courseNrc = courses.find(c => c.id === courseId)?.nrc || "";
        
        const modulesToLoad = selectedModule === "all" ? modules : modules.filter(m => m.moduloId === parseInt(selectedModule));
        
        for (const module of modulesToLoad) {
          // Aquí se harían las llamadas reales al servicio de evaluaciones
          const mockModuleEvaluations: EvaluationSummary[] = [
            {
              evaluacionId: Math.floor(Math.random() * 1000),
              titulo: `Evaluación ${module.nombre}`,
              descripcion: `Evaluación del módulo ${module.nombre}`,
              moduloId: module.moduloId,
              fechaInicio: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              duracionMinutos: 60,
              intentosPermitidos: 3,
              intentosRealizados: Math.floor(Math.random() * 2),
              calificacionObtenida: Math.random() > 0.5 ? Math.floor(Math.random() * 100) : undefined,
              calificacionMaxima: 100,
              estado: Math.random() > 0.3 ? 'Pendiente' : 'Completada' as any,
              modulo: { nombre: module.nombre },
              curso: { nombre: courseName, nrc: courseNrc },
              puedeReintentar: Math.random() > 0.5,
              progreso: Math.floor(Math.random() * 100)
            }
          ];
          mockEvaluations.push(...mockModuleEvaluations);
        }
      }
      
      // Aplicar filtros
      let filteredEvaluations = mockEvaluations;
      
      if (selectedStatus !== "all") {
        filteredEvaluations = filteredEvaluations.filter(evaluation => evaluation.estado === selectedStatus);
      }
      
      // Ordenar evaluaciones
      switch (sortBy) {
        case "fecha":
          filteredEvaluations.sort((a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime());
          break;
        case "calificacion":
          filteredEvaluations.sort((a, b) => (b.calificacionObtenida || 0) - (a.calificacionObtenida || 0));
          break;
        case "titulo":
          filteredEvaluations.sort((a, b) => a.titulo.localeCompare(b.titulo));
          break;
      }
      
      setEvaluations(filteredEvaluations);
    } catch (error) {
      console.error('Error al cargar evaluaciones:', error);
      setError("Error al cargar evaluaciones");
    } finally {
      setLoading(false);
    }
  };

  const filteredEvaluations = evaluations.filter(evaluation =>
    evaluation.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (evaluation.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (evaluation.modulo?.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (evaluation.curso?.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (evaluation: EvaluationSummary) => {
    switch (evaluation.estado) {
      case "Completada":
        return <Badge className="bg-green-600">Completada</Badge>;
      case "En Progreso":
        return <Badge className="bg-blue-600">En Progreso</Badge>;
      case "Pendiente":
        return <Badge variant="outline">Pendiente</Badge>;
      case "Expirada":
        return <Badge variant="destructive">Expirada</Badge>;
      default:
        return <Badge variant="secondary">{evaluation.estado}</Badge>;
    }
  };

  const getProgressColor = (calificacion: number) => {
    if (calificacion >= 90) return "bg-green-600";
    if (calificacion >= 70) return "bg-blue-600";
    if (calificacion >= 60) return "bg-yellow-600";
    return "bg-red-600";
  };

  return (
    <div className="flex h-screen bg-unab-gray-50 dark:bg-unab-navy-dark">
      <Sidebar role="student" />
      
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Evaluaciones</h1>
                <p className="text-unab-gray-600 dark:text-white">
                  Gestiona y completa tus evaluaciones
                </p>
              </div>
              
              <Button variant="outline" onClick={loadStudentCourses} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Evaluaciones</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredEvaluations.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completadas</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {filteredEvaluations.filter(e => e.estado === 'Completada').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {filteredEvaluations.filter(e => e.estado === 'Pendiente').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Promedio</CardTitle>
                <Award className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {filteredEvaluations.filter(e => e.calificacionObtenida).length > 0
                    ? Math.round(
                        filteredEvaluations
                          .filter(e => e.calificacionObtenida)
                          .reduce((acc, e) => acc + (e.calificacionObtenida || 0), 0) /
                        filteredEvaluations.filter(e => e.calificacionObtenida).length
                      )
                    : 0}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
              <Label htmlFor="status-select">Estado</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="Pendiente">Pendientes</SelectItem>
                  <SelectItem value="En Progreso">En Progreso</SelectItem>
                  <SelectItem value="Completada">Completadas</SelectItem>
                  <SelectItem value="Expirada">Expiradas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="sort-select">Ordenar por</Label>
              <Select value={sortBy} onValueChange={(value: "fecha" | "calificacion" | "titulo") => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fecha">Fecha</SelectItem>
                  <SelectItem value="calificacion">Calificación</SelectItem>
                  <SelectItem value="titulo">Título</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar evaluaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
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
                {loadingCourses ? "Cargando cursos..." : "Cargando evaluaciones..."}
              </span>
            </div>
          )}

          {/* Evaluations Grid */}
          {!loadingCourses && !loading && (
            <div className="space-y-4">
              {filteredEvaluations.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay evaluaciones disponibles</h3>
                  <p className="text-muted-foreground">
                    {searchTerm 
                      ? "No se encontraron evaluaciones que coincidan con tu búsqueda"
                      : "No hay evaluaciones disponibles en este momento"
                    }
                  </p>
                </div>
              ) : (
                filteredEvaluations.map((evaluation) => (
                  <Card key={evaluation.evaluacionId} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold line-clamp-2">
                            {evaluation.titulo}
                          </CardTitle>
                          <CardDescription className="mt-1 line-clamp-2">
                            {evaluation.descripcion || `Evaluación del módulo ${evaluation.modulo?.nombre}`}
                          </CardDescription>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getStatusBadge(evaluation)}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-4">
                        {/* Module and Course Info */}
                        <div className="flex flex-wrap gap-2">
                          {evaluation.modulo && (
                            <Badge variant="secondary">
                              <BookOpen className="w-3 h-3 mr-1" />
                              {evaluation.modulo.nombre}
                            </Badge>
                          )}
                          {evaluation.curso && (
                            <Badge variant="outline">
                              {evaluation.curso.nombre} ({evaluation.curso.nrc})
                            </Badge>
                          )}
                        </div>
                        
                        {/* Progress and Score */}
                        {evaluation.calificacionObtenida !== undefined && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Calificación obtenida</span>
                              <span className="font-semibold">
                                {evaluation.calificacionObtenida}/{evaluation.calificacionMaxima}
                              </span>
                            </div>
                            <Progress 
                              value={(evaluation.calificacionObtenida / evaluation.calificacionMaxima) * 100} 
                              className="h-2"
                            />
                          </div>
                        )}
                        
                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center text-muted-foreground">
                            <Timer className="w-4 h-4 mr-1" />
                            {evaluation.duracionMinutos} min
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <BarChart3 className="w-4 h-4 mr-1" />
                            {evaluation.intentosRealizados}/{evaluation.intentosPermitidos} intentos
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <Calendar className="w-4 h-4 mr-1" />
                            Inicio: {format(evaluation.fechaInicio, 'dd/MM/yyyy', { locale: es })}
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <Clock className="w-4 h-4 mr-1" />
                            Fin: {format(evaluation.fechaFin, 'dd/MM/yyyy', { locale: es })}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          {evaluation.estado === 'Pendiente' && (
                            <Button asChild size="sm" className="flex-1">
                              <Link href={`/student/evaluaciones/${evaluation.evaluacionId}`}>
                                <Play className="w-4 h-4 mr-2" />
                                Iniciar Evaluación
                              </Link>
                            </Button>
                          )}
                          
                          {evaluation.estado === 'En Progreso' && (
                            <Button asChild size="sm" variant="outline" className="flex-1">
                              <Link href={`/student/evaluaciones/${evaluation.evaluacionId}/continuar`}>
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Continuar
                              </Link>
                            </Button>
                          )}
                          
                          {evaluation.estado === 'Completada' && (
                            <>
                              <Button asChild size="sm" variant="outline" className="flex-1">
                                <Link href={`/student/evaluaciones/${evaluation.evaluacionId}/resultados`}>
                                  <FileText className="w-4 h-4 mr-2" />
                                  Ver Resultados
                                </Link>
                              </Button>
                              
                              {evaluation.puedeReintentar && evaluation.intentosRealizados < evaluation.intentosPermitidos && (
                                <Button asChild size="sm" variant="outline" className="flex-1">
                                  <Link href={`/student/evaluaciones/${evaluation.evaluacionId}/reintentar`}>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Reintentar
                                  </Link>
                                </Button>
                              )}
                            </>
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
        </main>
      </div>
    </div>
  );
}
