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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/use-toast';
import { 
  Plus, 
  Search, 
  Clock, 
  Users, 
  Edit, 
  Trash2, 
  Copy, 
  BarChart3, 
  FileText, 
  RefreshCw, 
  BookOpen,
  AlertCircle,
  Eye,
  Play,
  Pause,
  MoreHorizontal,
  Calendar
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { EvaluacionDTO, EvaluacionCreacionDTO, EvaluacionEdicionDTO, PreguntaCreacionDTO, OpcionCreacionDTO } from '@/DTOs/EvaluacionDTOs';
import { evaluacionService } from '@/app/lib/evaluacion-service';
import { cursoService } from '@/app/lib/services/curso-service';
import Link from 'next/link';

// Interfaces basadas en los patrones exitosos
interface Course {
  id: number;
  nombre: string;
  nrc: string;
}

interface Evaluation {
  id: number;
  titulo: string;
  descripcion?: string;
  cursoId: number;
  docenteId?: string; // Cambiado de string a string | undefined
  docenteNombre?: string;
  fechaCreacion: string;
  fechaInicio?: string;
  fechaFin?: string;
  tiempoLimiteMins: number;
  activa: boolean;
  intentosMaximos: number;
  preguntas?: any[];
  curso?: {
    id: number;
    nombre: string;
    nrc: string;
  };
}

interface CreateEvaluationData {
  titulo: string;
  descripcion?: string;
  cursoId: number;
  fechaInicio?: string;
  fechaFin?: string;
  tiempoLimiteMins: number;
  intentosMaximos: number;
  preguntas: PreguntaCreacionDTO[];
}

export default function TeacherEvaluationsPage() {
  // Estados basados en patrones exitosos (materials/modules pages)
  const [courses, setCourses] = useState<Course[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form states
  const [evaluationTitle, setEvaluationTitle] = useState("");
  const [evaluationDescription, setEvaluationDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timeLimit, setTimeLimit] = useState(60);
  const [maxAttempts, setMaxAttempts] = useState(1);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<Evaluation | null>(null);

  // Messages
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadTeacherCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse && selectedCourse !== "all") {
      loadEvaluations(parseInt(selectedCourse));
    } else if (selectedCourse === "all") {
      loadAllEvaluations();
    } else {
      setEvaluations([]);
    }
  }, [selectedCourse]);

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
        id: curso.cursoId!, // Usar cursoId que ahora está mapeado desde nrc
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

  const loadEvaluations = async (courseId: number) => {
    try {
      setLoading(true);
      setError("");
      
      const evaluationsData = await evaluacionService.obtenerEvaluacionesPorCurso(courseId);
      
      if (!Array.isArray(evaluationsData)) {
        console.error('Error: evaluationsData no es un array:', evaluationsData);
        setError("Error al cargar evaluaciones");
        return;
      }

      // Agregar información del curso a cada evaluación
      const courseName = courses.find(c => c.id === courseId)?.nombre || "";
      const courseNrc = courses.find(c => c.id === courseId)?.nrc || "";
      const evaluationsWithCourse: Evaluation[] = evaluationsData.map((evaluation) => ({
        ...evaluation,
        curso: {
          id: courseId,
          nombre: courseName,
          nrc: courseNrc
        }
      }));
      
      setEvaluations(evaluationsWithCourse);
    } catch (error) {
      console.error('Error al cargar evaluaciones:', error);
      setError("Error al cargar evaluaciones del curso");
    } finally {
      setLoading(false);
    }
  };

  const loadAllEvaluations = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Cargar evaluaciones de todos los cursos
      const allEvaluations: Evaluation[] = [];
      
      for (const course of courses) {
        try {
          const evaluationsData = await evaluacionService.obtenerEvaluacionesPorCurso(course.id);
          
          if (Array.isArray(evaluationsData)) {
            const evaluationsWithCourse = evaluationsData.map(evaluation => ({
              ...evaluation,
              curso: {
                id: course.id,
                nombre: course.nombre,
                nrc: course.nrc
              }
            }));
            allEvaluations.push(...evaluationsWithCourse);
          }
        } catch (error) {
          console.error(`Error al cargar evaluaciones del curso ${course.id}:`, error);
        }
      }
      
      setEvaluations(allEvaluations);
    } catch (error) {
      console.error('Error al cargar todas las evaluaciones:', error);
      setError("Error al cargar evaluaciones");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvaluation = async () => {
    if (!evaluationTitle.trim()) {
      setError("El título es obligatorio");
      return;
    }

    if (!selectedCourse || selectedCourse === "all") {
      setError("Debe seleccionar un curso específico");
      return;
    }

    try {
      setCreating(true);
      setError("");

      const evaluationData: CreateEvaluationData = {
        titulo: evaluationTitle,
        descripcion: evaluationDescription,
        cursoId: parseInt(selectedCourse),
        fechaInicio: startDate || undefined,
        fechaFin: endDate || undefined,
        tiempoLimiteMins: timeLimit,
        intentosMaximos: maxAttempts,
        // Agregar pregunta básica si no hay preguntas
        preguntas: [
          {
            texto: "Pregunta de ejemplo - Editar después",
            orden: 1,
            puntos: 10,
            opciones: [
              {
                texto: "Opción A",
                esCorrecta: true,
                orden: 1
              },
              {
                texto: "Opción B", 
                esCorrecta: false,
                orden: 2
              }
            ]
          }
        ]
      };

      const response = await evaluacionService.crearEvaluacion(evaluationData);

      if (response) {
        setSuccess("Evaluación creada exitosamente");
        setShowCreateDialog(false);
        resetForm();
        
        // Recargar evaluaciones
        if (selectedCourse !== "all") {
          await loadEvaluations(parseInt(selectedCourse));
        } else {
          await loadAllEvaluations();
        }
        
        toast({
          title: "Éxito",
          description: "Evaluación creada correctamente",
        });
      }
    } catch (error) {
      console.error('Error al crear evaluación:', error);
      setError("Error al crear evaluación");
      toast({
        title: "Error",
        description: "Error al crear evaluación",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleEditEvaluation = async (evaluation: Evaluation) => {
    try {
      setCreating(true);
      setError("");

      const edicionData: EvaluacionEdicionDTO = {
        titulo: evaluationTitle,
        descripcion: evaluationDescription,
        fechaInicio: startDate || undefined,
        fechaFin: endDate || undefined,
        tiempoLimiteMins: timeLimit,
        intentosMaximos: maxAttempts,
        activa: evaluation.activa
      };

      const response = await evaluacionService.actualizarEvaluacion(evaluation.id, edicionData);

      if (response) {
        setSuccess("Evaluación actualizada exitosamente");
        setEditingEvaluation(null);
        resetForm();
        
        // Recargar evaluaciones
        if (selectedCourse !== "all") {
          await loadEvaluations(parseInt(selectedCourse));
        } else {
          await loadAllEvaluations();
        }
        
        toast({
          title: "Éxito",
          description: "Evaluación actualizada correctamente",
        });
      }
    } catch (error) {
      console.error('Error al actualizar evaluación:', error);
      setError("Error al actualizar evaluación");
      toast({
        title: "Error",
        description: "Error al actualizar evaluación",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteEvaluation = async (evaluationId: number) => {
    try {
      setLoading(true);
      setError("");

      await evaluacionService.eliminarEvaluacion(evaluationId);
      setSuccess("Evaluación eliminada exitosamente");
      
      // Recargar evaluaciones
      if (selectedCourse !== "all") {
        await loadEvaluations(parseInt(selectedCourse));
      } else {
        await loadAllEvaluations();
      }
      
      toast({
        title: "Éxito",
        description: "Evaluación eliminada correctamente",
      });
    } catch (error) {
      console.error('Error al eliminar evaluación:', error);
      setError("Error al eliminar evaluación");
      toast({
        title: "Error",
        description: "Error al eliminar evaluación",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateEvaluation = async (evaluation: Evaluation) => {
    try {
      setCreating(true);
      setError("");

      const duplicateData: CreateEvaluationData = {
        titulo: `${evaluation.titulo} (Copia)`,
        descripcion: evaluation.descripcion,
        cursoId: evaluation.cursoId,
        tiempoLimiteMins: evaluation.tiempoLimiteMins,
        intentosMaximos: evaluation.intentosMaximos,
        preguntas: evaluation.preguntas || [
          {
            texto: "Pregunta de ejemplo - Editar después",
            orden: 1,
            puntos: 10,
            opciones: [
              {
                texto: "Opción A",
                esCorrecta: true,
                orden: 1
              },
              {
                texto: "Opción B", 
                esCorrecta: false,
                orden: 2
              }
            ]
          }
        ]
      };

      await evaluacionService.crearEvaluacion(duplicateData);
      setSuccess("Evaluación duplicada exitosamente");
      
      // Recargar evaluaciones
      if (selectedCourse !== "all") {
        await loadEvaluations(parseInt(selectedCourse));
      } else {
        await loadAllEvaluations();
      }
      
      toast({
        title: "Éxito",
        description: "Evaluación duplicada correctamente",
      });
    } catch (error) {
      console.error('Error al duplicar evaluación:', error);
      setError("Error al duplicar evaluación");
      toast({
        title: "Error",
        description: "Error al duplicar evaluación",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setEvaluationTitle("");
    setEvaluationDescription("");
    setStartDate("");
    setEndDate("");
    setTimeLimit(60);
    setMaxAttempts(1);
    setEditingEvaluation(null);
  };

  const openEditDialog = (evaluation: Evaluation) => {
    setEditingEvaluation(evaluation);
    setEvaluationTitle(evaluation.titulo);
    setEvaluationDescription(evaluation.descripcion || "");
    setStartDate(evaluation.fechaInicio ? evaluation.fechaInicio.split('T')[0] : "");
    setEndDate(evaluation.fechaFin ? evaluation.fechaFin.split('T')[0] : "");
    setTimeLimit(evaluation.tiempoLimiteMins);
    setMaxAttempts(evaluation.intentosMaximos);
    setShowCreateDialog(true);
  };

  const filteredEvaluations = evaluations.filter(evaluation =>
    evaluation.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (evaluation.descripcion && evaluation.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (evaluation: Evaluation) => {
    const now = new Date();
    const startDate = evaluation.fechaInicio ? new Date(evaluation.fechaInicio) : null;
    const endDate = evaluation.fechaFin ? new Date(evaluation.fechaFin) : null;

    if (!evaluation.activa) {
      return <Badge variant="secondary">Inactiva</Badge>;
    }

    if (startDate && startDate > now) {
      return <Badge variant="outline">Programada</Badge>;
    }

    if (endDate && endDate < now) {
      return <Badge variant="destructive">Finalizada</Badge>;
    }

    return <Badge variant="default">Activa</Badge>;
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar role="teacher" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Gestión de Evaluaciones</h1>
              <p className="text-muted-foreground">
                Administra las evaluaciones y exámenes de tus cursos
              </p>
            </div>
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Evaluación
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingEvaluation ? 'Editar Evaluación' : 'Crear Nueva Evaluación'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingEvaluation 
                      ? 'Modifica los datos de la evaluación'
                      : 'Completa la información para crear una nueva evaluación'
                    }
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="titulo">Título</Label>
                    <Input
                      id="titulo"
                      value={evaluationTitle}
                      onChange={(e) => setEvaluationTitle(e.target.value)}
                      placeholder="Título de la evaluación"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      value={evaluationDescription}
                      onChange={(e) => setEvaluationDescription(e.target.value)}
                      placeholder="Descripción de la evaluación"
                      rows={3}
                    />
                  </div>
                  
                  {!editingEvaluation && (
                    <div className="col-span-2">
                      <Label htmlFor="curso">Curso</Label>
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
                  )}
                  
                  <div>
                    <Label htmlFor="fechaInicio">Fecha de Inicio</Label>
                    <Input
                      id="fechaInicio"
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="fechaFin">Fecha de Fin</Label>
                    <Input
                      id="fechaFin"
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tiempoLimite">Tiempo Límite (minutos)</Label>
                    <Input
                      id="tiempoLimite"
                      type="number"
                      min="1"
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(parseInt(e.target.value) || 60)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="intentosMaximos">Intentos Máximos</Label>
                    <Input
                      id="intentosMaximos"
                      type="number"
                      min="1"
                      value={maxAttempts}
                      onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 1)}
                    />
                  </div>
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
                    onClick={editingEvaluation ? () => handleEditEvaluation(editingEvaluation) : handleCreateEvaluation}
                    disabled={creating}
                  >
                    {creating ? "Procesando..." : (editingEvaluation ? "Actualizar" : "Crear")}
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
                  <SelectItem value="all">Todos los cursos</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.nombre} ({course.nrc})
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
                  placeholder="Buscar evaluaciones..."
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

          {/* Evaluations Grid */}
          {!loadingCourses && !loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvaluations.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay evaluaciones</h3>
                  <p className="text-muted-foreground mb-4">
                    {selectedCourse 
                      ? "No se encontraron evaluaciones para los criterios seleccionados"
                      : "Selecciona un curso para ver las evaluaciones"
                    }
                  </p>
                  {selectedCourse && selectedCourse !== "all" && (
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Primera Evaluación
                    </Button>
                  )}
                </div>
              ) : (
                filteredEvaluations.map((evaluation) => (
                  <Card key={evaluation.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold line-clamp-2">
                            {evaluation.titulo}
                          </CardTitle>
                          <CardDescription className="mt-1 line-clamp-2">
                            {evaluation.descripcion}
                          </CardDescription>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => openEditDialog(evaluation)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateEvaluation(evaluation)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                if (confirm("¿Está seguro de que desea eliminar esta evaluación?")) {
                                  handleDeleteEvaluation(evaluation.id);
                                }
                              }}
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
                        {/* Status and Course Info */}
                        <div className="flex flex-wrap gap-2">
                          {getStatusBadge(evaluation)}
                          {evaluation.curso && (
                            <Badge variant="outline">
                              <BookOpen className="w-3 h-3 mr-1" />
                              {evaluation.curso.nombre}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Time and Attempts Info */}
                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {evaluation.tiempoLimiteMins} min
                          </div>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {evaluation.intentosMaximos} intento{evaluation.intentosMaximos > 1 ? 's' : ''}
                          </div>
                        </div>
                        
                        {/* Dates */}
                        {(evaluation.fechaInicio || evaluation.fechaFin) && (
                          <div className="space-y-1 text-sm text-muted-foreground">
                            {evaluation.fechaInicio && (
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                Inicio: {format(new Date(evaluation.fechaInicio), "dd/MM/yyyy HH:mm", { locale: es })}
                              </div>
                            )}
                            {evaluation.fechaFin && (
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                Fin: {format(new Date(evaluation.fechaFin), "dd/MM/yyyy HH:mm", { locale: es })}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Creation Date */}
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="w-4 h-4 mr-1" />
                          Creada: {format(new Date(evaluation.fechaCreacion), "dd/MM/yyyy", { locale: es })}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button asChild size="sm" className="flex-1">
                            <Link href={`/teacher/evaluaciones/${evaluation.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Detalles
                            </Link>
                          </Button>
                          <Button asChild size="sm" variant="outline" className="flex-1">
                            <Link href={`/teacher/evaluaciones/${evaluation.id}/resultados`}>
                              <BarChart3 className="w-4 h-4 mr-2" />
                              Resultados
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
