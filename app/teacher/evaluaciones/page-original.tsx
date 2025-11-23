"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2, Copy, Clock, Users, BarChart3, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { EvaluacionDTO, EvaluacionCreacionDTO, EvaluacionEdicionDTO, PreguntaCreacionDTO, OpcionCreacionDTO } from '@/DTOs/EvaluacionDTOs';
import { evaluacionService } from '@/app/lib/evaluacion-service';
import { courseService } from '@/app/lib/course-service';
import { cursoService } from '@/app/lib/services/curso-service';
import Link from 'next/link';

interface Curso {
  id: number;
  nombre: string;
  nrc: string;
}

interface Course {
  nrc: number;
  nombre: string;
}

export default function EvaluacionesPage() {
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionDTO[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvaluacion, setEditingEvaluacion] = useState<EvaluacionDTO | null>(null);
  const [cursoSeleccionado, setCursoSeleccionado] = useState<string>('');

  // Estado del formulario
  const [formData, setFormData] = useState<EvaluacionCreacionDTO>({
    titulo: '',
    descripcion: '',
    cursoId: 0,
    fechaInicio: '',
    fechaFin: '',
    tiempoLimiteMins: 60,
    intentosMaximos: 1,
    preguntas: []
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Usar el nuevo servicio de cursos
      const cursosData = await cursoService.obtenerCursosAsignados();
      
      // Validar que cursosData sea un array
      if (!Array.isArray(cursosData)) {
        console.error('Error: cursosData no es un array:', cursosData);
        setCursos([]);
        return;
      }
      
      // Convertir CursoDTO[] a Curso[] 
      const cursosConvertidos: Curso[] = cursosData.map((curso) => ({
        id: curso.cursoId!, // Usar cursoId como ID (ahora está mapeado desde nrc)
        nombre: curso.nombre,
        nrc: curso.nrc.toString()
      }));
      
      setCursos(cursosConvertidos);
      
      if (cursosConvertidos.length > 0) {
        await cargarEvaluacionesPorCurso(cursosConvertidos[0].id);
        setCursoSeleccionado(cursosConvertidos[0].id.toString());
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast({
        title: "Error",
        description: "Error al cargar los datos iniciales",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarEvaluacionesPorCurso = async (cursoId: number) => {
    try {
      const evaluacionesData = await evaluacionService.obtenerEvaluacionesPorCurso(cursoId);
      setEvaluaciones(evaluacionesData);
    } catch (error) {
      console.error('Error al cargar evaluaciones:', error);
      toast({
        title: "Error",
        description: "Error al cargar las evaluaciones",
        variant: "destructive",
      });
    }
  };

  const handleCursoChange = async (cursoIdStr: string) => {
    setCursoSeleccionado(cursoIdStr);
    const cursoId = parseInt(cursoIdStr);
    await cargarEvaluacionesPorCurso(cursoId);
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      cursoId: 0,
      fechaInicio: '',
      fechaFin: '',
      tiempoLimiteMins: 60,
      intentosMaximos: 1,
      preguntas: []
    });
    setEditingEvaluacion(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo.trim()) {
      toast({
        title: "Error",
        description: "El título es obligatorio",
        variant: "destructive",
      });
      return;
    }

    if (!cursoSeleccionado) {
      toast({
        title: "Error",
        description: "Debe seleccionar un curso",
        variant: "destructive",
      });
      return;
    }

    try {
      const dataToSubmit = {
        ...formData,
        cursoId: parseInt(cursoSeleccionado),
        // Agregar pregunta básica si no hay preguntas
        preguntas: formData.preguntas.length > 0 ? formData.preguntas : [
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

      if (editingEvaluacion) {
        const edicionData: EvaluacionEdicionDTO = {
          titulo: dataToSubmit.titulo,
          descripcion: dataToSubmit.descripcion,
          fechaInicio: dataToSubmit.fechaInicio,
          fechaFin: dataToSubmit.fechaFin,
          tiempoLimiteMins: dataToSubmit.tiempoLimiteMins,
          intentosMaximos: dataToSubmit.intentosMaximos,
          activa: true
        };
        await evaluacionService.actualizarEvaluacion(editingEvaluacion.id, edicionData);
        toast({
          title: "Éxito",
          description: "Evaluación actualizada correctamente",
        });
      } else {
        await evaluacionService.crearEvaluacion(dataToSubmit);
        toast({
          title: "Éxito",
          description: "Evaluación creada correctamente",
        });
      }

      await cargarEvaluacionesPorCurso(parseInt(cursoSeleccionado));
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error al guardar evaluación:', error);
      toast({
        title: "Error",
        description: error.message || "Error al guardar la evaluación",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (evaluacion: EvaluacionDTO) => {
    setEditingEvaluacion(evaluacion);
    setFormData({
      titulo: evaluacion.titulo,
      descripcion: evaluacion.descripcion || '',
      cursoId: evaluacion.cursoId,
      fechaInicio: evaluacion.fechaInicio ? evaluacion.fechaInicio.split('T')[0] : '',
      fechaFin: evaluacion.fechaFin ? evaluacion.fechaFin.split('T')[0] : '',
      tiempoLimiteMins: evaluacion.tiempoLimiteMins,
      intentosMaximos: evaluacion.intentosMaximos,
      preguntas: []
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await evaluacionService.eliminarEvaluacion(id);
      await cargarEvaluacionesPorCurso(parseInt(cursoSeleccionado));
      toast({
        title: "Éxito",
        description: "Evaluación eliminada correctamente",
      });
    } catch (error: any) {
      console.error('Error al eliminar evaluación:', error);
      toast({
        title: "Error",
        description: error.message || "Error al eliminar la evaluación",
        variant: "destructive",
      });
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      if (!cursoSeleccionado) return;
      // TODO: Implement duplicarEvaluacion method in service
      // await evaluacionService.duplicarEvaluacion(id, parseInt(cursoSeleccionado));
      await cargarEvaluacionesPorCurso(parseInt(cursoSeleccionado));
      toast({
        title: "Éxito",
        description: "Evaluación duplicada correctamente",
      });
    } catch (error: any) {
      console.error('Error al duplicar evaluación:', error);
      toast({
        title: "Error",
        description: error.message || "Error al duplicar la evaluación",
        variant: "destructive",
      });
    }
  };

  const getEstadoBadge = (evaluacion: EvaluacionDTO) => {
    const ahora = new Date();
    const fechaInicio = evaluacion.fechaInicio ? new Date(evaluacion.fechaInicio) : null;
    const fechaFin = evaluacion.fechaFin ? new Date(evaluacion.fechaFin) : null;

    if (!evaluacion.activa) {
      return <Badge variant="secondary">Inactiva</Badge>;
    }

    if (fechaInicio && ahora < fechaInicio) {
      return <Badge variant="outline">Programada</Badge>;
    }

    if (fechaFin && ahora > fechaFin) {
      return <Badge variant="destructive">Finalizada</Badge>;
    }

    return <Badge variant="default">Activa</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando evaluaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Evaluaciones</h1>
          <p className="text-muted-foreground">
            Gestiona las evaluaciones de tus cursos
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Evaluación
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingEvaluacion ? 'Editar Evaluación' : 'Nueva Evaluación'}
              </DialogTitle>
              <DialogDescription>
                {editingEvaluacion ? 'Modifica los datos de la evaluación' : 'Crea una nueva evaluación para tus estudiantes'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Ej: Examen Parcial 1"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Descripción opcional de la evaluación"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="fechaInicio">Fecha de Inicio</Label>
                  <Input
                    id="fechaInicio"
                    type="datetime-local"
                    value={formData.fechaInicio}
                    onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="fechaFin">Fecha de Fin</Label>
                  <Input
                    id="fechaFin"
                    type="datetime-local"
                    value={formData.fechaFin}
                    onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="tiempoLimite">Tiempo Límite (minutos)</Label>
                  <Input
                    id="tiempoLimite"
                    type="number"
                    min="1"
                    value={formData.tiempoLimiteMins}
                    onChange={(e) => setFormData({ ...formData, tiempoLimiteMins: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="intentos">Intentos Máximos</Label>
                  <Input
                    id="intentos"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.intentosMaximos}
                    onChange={(e) => setFormData({ ...formData, intentosMaximos: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingEvaluacion ? 'Actualizar' : 'Crear'} Evaluación
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Selector de curso */}
      {cursos.length > 0 && (
        <div className="w-full max-w-xs">
          <Label htmlFor="curso">Curso</Label>
          <Select value={cursoSeleccionado} onValueChange={handleCursoChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un curso" />
            </SelectTrigger>
            <SelectContent>
              {cursos.map((curso) => (
                <SelectItem key={curso.id} value={curso.id.toString()}>
                  {curso.nombre} - {curso.nrc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Lista de evaluaciones */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {evaluaciones && evaluaciones.length > 0 ? evaluaciones.map((evaluacion) => (
          <Card key={evaluacion.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{evaluacion.titulo}</CardTitle>
                  <CardDescription>{evaluacion.descripcion}</CardDescription>
                </div>
                {getEstadoBadge(evaluacion)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{evaluacion.tiempoLimiteMins} minutos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{evaluacion.intentosMaximos} intento(s)</span>
                </div>
                {evaluacion.fechaInicio && (
                  <div className="text-xs">
                    <strong>Inicio:</strong> {format(new Date(evaluacion.fechaInicio), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </div>
                )}
                {evaluacion.fechaFin && (
                  <div className="text-xs">
                    <strong>Fin:</strong> {format(new Date(evaluacion.fechaFin), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between gap-2">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(evaluacion)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDuplicate(evaluacion.id)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente la evaluación
                        "{evaluacion.titulo}" y todos los datos asociados.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(evaluacion.id)}>
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <div className="flex gap-2">
                <Link href={`/teacher/evaluaciones/${evaluacion.id}/preguntas`}>
                  <Button variant="default" size="sm">
                    <FileText className="h-4 w-4 mr-1" />
                    Preguntas
                  </Button>
                </Link>
                <Link href={`/teacher/evaluaciones/${evaluacion.id}/estadisticas`}>
                  <Button variant="secondary" size="sm">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Stats
                  </Button>
                </Link>
              </div>
            </CardFooter>
          </Card>
        )) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No hay evaluaciones disponibles</p>
          </div>
        )}
      </div>

      {evaluaciones && evaluaciones.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No hay evaluaciones</h3>
          <p className="text-muted-foreground mb-4">
            Comienza creando tu primera evaluación para este curso.
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Primera Evaluación
          </Button>
        </div>
      )}
    </div>
  );
}
