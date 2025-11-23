"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  BookOpen, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Calendar,
  Timer,
  RotateCcw
} from 'lucide-react';
import { format, differenceInMinutes, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { EvaluacionEstudianteDTO } from '@/DTOs/EvaluacionDTOs';
import { evaluacionService } from '@/app/lib/evaluacion-service';
import { toast } from '@/components/ui/use-toast';
import Link from 'next/link';

export default function EvaluacionesStudentPage() {
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionEstudianteDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEvaluaciones();
  }, []);

  const cargarEvaluaciones = async () => {
    try {
      setLoading(true);
      const evaluacionesData = await evaluacionService.obtenerEvaluacionesEstudiante();
      setEvaluaciones(evaluacionesData);
    } catch (error) {
      console.error('Error al cargar evaluaciones:', error);
      toast({
        title: "Error",
        description: "Error al cargar las evaluaciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getEstadoEvaluacion = (evaluacion: EvaluacionEstudianteDTO) => {
    const ahora = new Date();
    const fechaInicio = evaluacion.fechaInicio ? new Date(evaluacion.fechaInicio) : null;
    const fechaFin = evaluacion.fechaFin ? new Date(evaluacion.fechaFin) : null;

    if (!evaluacion.activa) {
      return { 
        estado: 'Inactiva', 
        badge: <Badge variant="secondary">Inactiva</Badge>,
        puedeRealizar: false 
      };
    }

    if (fechaInicio && isBefore(ahora, fechaInicio)) {
      return { 
        estado: 'Programada', 
        badge: <Badge variant="outline">Programada</Badge>,
        puedeRealizar: false 
      };
    }

    if (fechaFin && isAfter(ahora, fechaFin)) {
      return { 
        estado: 'Finalizada', 
        badge: <Badge variant="destructive">Finalizada</Badge>,
        puedeRealizar: false 
      };
    }

    if (evaluacion.intentosRealizados >= evaluacion.intentosMaximos) {
      return { 
        estado: 'Completada', 
        badge: <Badge className="bg-green-500">Completada</Badge>,
        puedeRealizar: false 
      };
    }

    if (evaluacion.ultimoIntento?.estado === 'En Progreso') {
      return { 
        estado: 'En Progreso', 
        badge: <Badge className="bg-blue-500">En Progreso</Badge>,
        puedeRealizar: true 
      };
    }

    return { 
      estado: 'Disponible', 
      badge: <Badge className="bg-green-500">Disponible</Badge>,
      puedeRealizar: true 
    };
  };

  const getTiempoRestante = (evaluacion: EvaluacionEstudianteDTO) => {
    if (!evaluacion.fechaFin) return null;
    
    const ahora = new Date();
    const fechaFin = new Date(evaluacion.fechaFin);
    const minutosRestantes = differenceInMinutes(fechaFin, ahora);
    
    if (minutosRestantes <= 0) return null;
    
    const horas = Math.floor(minutosRestantes / 60);
    const minutos = minutosRestantes % 60;
    
    if (horas > 0) {
      return `${horas}h ${minutos}m restantes`;
    }
    return `${minutos}m restantes`;
  };

  const getProgreso = (evaluacion: EvaluacionEstudianteDTO) => {
    return (evaluacion.intentosRealizados / evaluacion.intentosMaximos) * 100;
  };

  const getCalificacionColor = (calificacion: number): string => {
    if (calificacion >= 90) return 'text-green-600';
    if (calificacion >= 70) return 'text-blue-600';
    if (calificacion >= 50) return 'text-yellow-600';
    return 'text-red-600';
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
      <div>
        <h1 className="text-3xl font-bold">Mis Evaluaciones</h1>
        <p className="text-muted-foreground">
          Visualiza y realiza las evaluaciones asignadas a tus cursos
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {evaluaciones.map((evaluacion) => {
          const estadoInfo = getEstadoEvaluacion(evaluacion);
          const tiempoRestante = getTiempoRestante(evaluacion);
          const progreso = getProgreso(evaluacion);

          return (
            <Card key={evaluacion.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{evaluacion.titulo}</CardTitle>
                    <CardDescription>{evaluacion.descripcion}</CardDescription>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      <span>{evaluacion.curso.nombre} - {evaluacion.curso.nrc}</span>
                    </div>
                    {evaluacion.modulo && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>📖 {evaluacion.modulo.nombre}</span>
                      </div>
                    )}
                  </div>
                  {estadoInfo.badge}
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Información de tiempo */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{evaluacion.tiempoLimiteMins} min</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RotateCcw className="h-4 w-4 text-muted-foreground" />
                      <span>{evaluacion.intentosMaximos} intento(s)</span>
                    </div>
                  </div>

                  {/* Fechas */}
                  {evaluacion.fechaInicio && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Desde: {format(new Date(evaluacion.fechaInicio), 'dd/MM/yyyy HH:mm', { locale: es })}</span>
                    </div>
                  )}
                  {evaluacion.fechaFin && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Hasta: {format(new Date(evaluacion.fechaFin), 'dd/MM/yyyy HH:mm', { locale: es })}</span>
                    </div>
                  )}

                  {/* Tiempo restante */}
                  {tiempoRestante && (
                    <div className="flex items-center gap-2 text-sm font-medium text-orange-600">
                      <Timer className="h-4 w-4" />
                      <span>{tiempoRestante}</span>
                    </div>
                  )}

                  {/* Progreso de intentos */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Intentos realizados</span>
                      <span>{evaluacion.intentosRealizados}/{evaluacion.intentosMaximos}</span>
                    </div>
                    <Progress value={progreso} className="h-2" />
                  </div>

                  {/* Último intento y calificación */}
                  {evaluacion.ultimoIntento && (
                    <div className="p-3 bg-muted rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Último intento:</span>
                        <Badge variant="outline">{evaluacion.ultimoIntento.estado}</Badge>
                      </div>
                      {evaluacion.ultimoIntento.calificacion !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Calificación:</span>
                          <span className={`font-bold ${getCalificacionColor(evaluacion.ultimoIntento.calificacion)}`}>
                            {evaluacion.ultimoIntento.calificacion.toFixed(1)}%
                          </span>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(evaluacion.ultimoIntento.fechaInicio), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex gap-2">
                {estadoInfo.puedeRealizar ? (
                  <Link href={`/student/evaluaciones/${evaluacion.id}`} className="flex-1">
                    <Button className="w-full">
                      {evaluacion.ultimoIntento?.estado === 'En Progreso' ? (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Continuar
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Iniciar {evaluacion.intentosRealizados > 0 ? 'Nuevo Intento' : 'Evaluación'}
                        </>
                      )}
                    </Button>
                  </Link>
                ) : evaluacion.ultimoIntento?.calificacion !== undefined ? (
                  <Link href={`/student/evaluaciones/${evaluacion.id}/resultado`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Ver Resultado
                    </Button>
                  </Link>
                ) : (
                  <Button disabled className="w-full">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    No Disponible
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {evaluaciones.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium">No hay evaluaciones disponibles</h3>
          <p className="text-muted-foreground">
            Cuando tus profesores publiquen evaluaciones, aparecerán aquí.
          </p>
        </div>
      )}
    </div>
  );
}
