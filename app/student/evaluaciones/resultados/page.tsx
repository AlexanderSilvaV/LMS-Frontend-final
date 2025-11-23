"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Trophy,
  Calendar,
  BookOpen,
  TrendingUp,
  Award,
  Target,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { EvaluacionEstudianteDTO } from '@/DTOs/EvaluacionDTOs';
import { evaluacionService } from '@/app/lib/evaluacion-service';
import { toast } from '@/components/ui/use-toast';

export default function ResultadosEvaluacionesPage() {
  const [evaluacionesCompletadas, setEvaluacionesCompletadas] = useState<EvaluacionEstudianteDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarResultados();
  }, []);

  const cargarResultados = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Cargando evaluaciones del estudiante...');
      const evaluaciones = await evaluacionService.obtenerEvaluacionesEstudiante();
      console.log('📊 Evaluaciones obtenidas del backend:', evaluaciones);
      console.log('📊 Total de evaluaciones:', evaluaciones.length);

      // Mostrar información detallada de cada evaluación
      evaluaciones.forEach((evaluacion, index) => {
        console.log(`📝 Evaluación ${index + 1}:`, {
          id: evaluacion.id,
          titulo: evaluacion.titulo,
          yaCompletada: evaluacion.yaCompletada,
          mejorPorcentaje: evaluacion.mejorPorcentaje,
          intentosRealizados: evaluacion.intentosRealizados,
          intentosMaximos: evaluacion.intentosMaximos,
          ultimaFechaRealizada: evaluacion.ultimaFechaRealizada
        });
      });

      // Filtrar evaluaciones que han sido realizadas al menos una vez (tienen resultados)
      // TEMPORAL: Mostrar todas las evaluaciones para debugging
      const completadas = evaluaciones.filter(evaluacion => 
        true // evaluacion.intentosRealizados > 0 && evaluacion.mejorPorcentaje !== null && evaluacion.mejorPorcentaje !== undefined
      );
      console.log('Evaluaciones filtradas (TODAS para debugging):', completadas);
      console.log('Total evaluaciones que pasan el filtro:', completadas.length);

      // Ordenar por fecha de última realización (más recientes primero)
      completadas.sort((a, b) => {
        const fechaA = a.ultimaFechaRealizada ? new Date(a.ultimaFechaRealizada) : new Date(0);
        const fechaB = b.ultimaFechaRealizada ? new Date(b.ultimaFechaRealizada) : new Date(0);
        return fechaB.getTime() - fechaA.getTime();
      });

      setEvaluacionesCompletadas(completadas);
    } catch (error: any) {
      console.error('Error al cargar resultados:', error);
      setError(error.message || 'Error al cargar los resultados de evaluaciones');
      toast({
        title: "Error",
        description: "Error al cargar los resultados de evaluaciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getColorCalificacion = (porcentaje: number): string => {
    if (porcentaje >= 90) return 'text-green-600';
    if (porcentaje >= 70) return 'text-blue-600';
    if (porcentaje >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBadgeCalificacion = (porcentaje: number) => {
    if (porcentaje >= 90) return <Badge className="bg-green-500">Excelente</Badge>;
    if (porcentaje >= 70) return <Badge className="bg-blue-500">Bueno</Badge>;
    if (porcentaje >= 50) return <Badge className="bg-yellow-500">Regular</Badge>;
    return <Badge variant="destructive">Insuficiente</Badge>;
  };

  const getIconoCalificacion = (porcentaje: number) => {
    if (porcentaje >= 90) return <Award className="h-5 w-5 text-green-600" />;
    if (porcentaje >= 70) return <TrendingUp className="h-5 w-5 text-blue-600" />;
    return <Target className="h-5 w-5 text-yellow-600" />;
  };

  const calcularPromedioGeneral = (): number => {
    if (evaluacionesCompletadas.length === 0) return 0;

    const totalPorcentajes = evaluacionesCompletadas.reduce((sum, evaluacion) => {
      return sum + (evaluacion.mejorPorcentaje || 0);
    }, 0);

    return totalPorcentajes / evaluacionesCompletadas.length;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar role="student" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando resultados...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar role="student" />
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <Link href="/student/evaluaciones">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
            </div>

            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="student" />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Resultados</h1>
                <p className="text-gray-600">
                  Historial de calificaciones de todas tus evaluaciones realizadas
                </p>
              </div>
              <Link href="/student/evaluaciones">
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Volver a Evaluaciones
                </Button>
              </Link>
            </div>
          </div>

      {/* Estadísticas generales */}
      {evaluacionesCompletadas.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Evaluaciones</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{evaluacionesCompletadas.length}</div>
              <p className="text-xs text-muted-foreground">
                evaluaciones completadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio General</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getColorCalificacion(calcularPromedioGeneral())}`}>
                {calcularPromedioGeneral().toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                promedio de todas las evaluaciones
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mejor Calificación</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getColorCalificacion(Math.max(...evaluacionesCompletadas.map(e => e.mejorPorcentaje || 0)))}`}>
                {Math.max(...evaluacionesCompletadas.map(e => e.mejorPorcentaje || 0)).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                tu mejor resultado
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de evaluaciones */}
      {evaluacionesCompletadas.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay evaluaciones realizadas
              </h3>
              <p className="text-gray-500 mb-6">
                Aún no has realizado ninguna evaluación. ¡Comienza ahora!
              </p>
              <Link href="/student/evaluaciones">
                <Button>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Ver Evaluaciones Disponibles
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {evaluacionesCompletadas.map((evaluacion) => (
            <Card key={evaluacion.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{evaluacion.titulo}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      {evaluacion.curso.nombre} - {evaluacion.curso.nrc}
                    </CardDescription>
                  </div>
                  <div className="text-right space-y-2">
                    <div className={`text-3xl font-bold ${getColorCalificacion(evaluacion.mejorPorcentaje || 0)}`}>
                      {evaluacion.mejorPorcentaje?.toFixed(1)}%
                    </div>
                    {getBadgeCalificacion(evaluacion.mejorPorcentaje || 0)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Última realización
                    </div>
                    <p className="text-sm font-medium">
                      {evaluacion.ultimaFechaRealizada
                        ? format(new Date(evaluacion.ultimaFechaRealizada), 'dd/MM/yyyy HH:mm', { locale: es })
                        : 'Fecha no disponible'
                      }
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Target className="h-4 w-4" />
                      Intentos realizados
                    </div>
                    <p className="text-sm font-medium">
                      {evaluacion.intentosRealizados} de {evaluacion.intentosMaximos}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Tiempo límite
                    </div>
                    <p className="text-sm font-medium">
                      {evaluacion.tiempoLimiteMins} minutos
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4" />
                      Estado
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Completada
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getIconoCalificacion(evaluacion.mejorPorcentaje || 0)}
                      <span className="text-sm text-muted-foreground">
                        Mejor calificación obtenida
                      </span>
                    </div>
                    <Link href={`/student/evaluaciones/${evaluacion.id}`}>
                      <Button variant="outline" size="sm">
                        Ver Detalles
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Mensaje motivacional */}
      {evaluacionesCompletadas.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <Trophy className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-900 mb-2">
                {calcularPromedioGeneral() >= 80
                  ? "¡Excelente rendimiento!"
                  : calcularPromedioGeneral() >= 60
                  ? "¡Buen trabajo!"
                  : "¡Sigue practicando!"
                }
              </h3>
              <p className="text-sm text-blue-700">
                {calcularPromedioGeneral() >= 80
                  ? "Has demostrado un dominio excepcional en tus evaluaciones. ¡Sigue así!"
                  : calcularPromedioGeneral() >= 60
                  ? "Tienes un buen desempeño general. Considera repasar los temas donde tuviste dificultades."
                  : "Cada evaluación es una oportunidad de aprendizaje. ¡No te desanimes y sigue adelante!"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}
        </div>
      </div>
    </div>
  );
}