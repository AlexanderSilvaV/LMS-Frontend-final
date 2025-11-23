"use client";

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, BookOpen, Award, TrendingUp, AlertCircle, BarChart3, List, FlaskConical } from 'lucide-react';
import Link from 'next/link';
import { NotasEstudianteDTO } from '@/app/lib/types/nota-types';
import { notaService } from '@/app/lib/nota-service';
import { toast } from '@/components/ui/use-toast';

export default function NotasEstudiantePage() {
  const [notas, setNotas] = useState<NotasEstudianteDTO[]>([]);
  const [notasAgrupadas, setNotasAgrupadas] = useState<Record<string, NotasEstudianteDTO[]>>({});
  const [estadisticasCursos, setEstadisticasCursos] = useState<Record<string, {
    promedio: number;
    mejorNota: number;
    evaluacionesCompletadas: number;
    totalEvaluaciones: number;
  }>>({});
  const [vistaActual, setVistaActual] = useState<'detallada' | 'resumen'>('detallada');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarNotas();
  }, []);

  const cargarNotas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notaService.obtenerMisNotas();

      const evaluacionesConLaboratorio = data.map((evaluacion) => {
        const notasNormalizadas = evaluacion.notas.map((nota) => ({
          ...nota,
          esLaboratorio: Boolean(nota.esLaboratorio),
        }));

        return {
          ...evaluacion,
          notas: notasNormalizadas,
          esLaboratorio: notasNormalizadas.some((nota) => nota.esLaboratorio),
          mejorNota: typeof evaluacion.mejorNota === 'number' ? evaluacion.mejorNota : evaluacion.mejorNota ? Number(evaluacion.mejorNota) : undefined,
          notaFinal: typeof evaluacion.notaFinal === 'number' ? evaluacion.notaFinal : evaluacion.notaFinal ? Number(evaluacion.notaFinal) : undefined,
        };
      });

      setNotas(evaluacionesConLaboratorio);
      
      // Agrupar notas por curso
      const agrupadas: Record<string, NotasEstudianteDTO[]> = {};
      const estadisticas: Record<string, {
        promedio: number;
        mejorNota: number;
        evaluacionesCompletadas: number;
        totalEvaluaciones: number;
      }> = {};
      
      evaluacionesConLaboratorio.forEach((evaluacion) => {
        if (!agrupadas[evaluacion.cursoNombre]) {
          agrupadas[evaluacion.cursoNombre] = [];
          estadisticas[evaluacion.cursoNombre] = {
            promedio: 0,
            mejorNota: 0,
            evaluacionesCompletadas: 0,
            totalEvaluaciones: 0
          };
        }
        agrupadas[evaluacion.cursoNombre].push(evaluacion);
        estadisticas[evaluacion.cursoNombre].totalEvaluaciones++;
        
        if (typeof evaluacion.notaFinal === 'number') {
          estadisticas[evaluacion.cursoNombre].evaluacionesCompletadas++;
          estadisticas[evaluacion.cursoNombre].mejorNota = Math.max(
            estadisticas[evaluacion.cursoNombre].mejorNota,
            evaluacion.notaFinal
          );
        }
      });
      
      // Calcular promedios
      Object.keys(estadisticas).forEach(cursoNombre => {
        const evaluacionesCompletadas = agrupadas[cursoNombre].filter(e => typeof e.notaFinal === 'number');
        if (evaluacionesCompletadas.length > 0) {
          estadisticas[cursoNombre].promedio = evaluacionesCompletadas.reduce(
            (sum, e) => sum + (e.notaFinal ?? 0), 0
          ) / evaluacionesCompletadas.length;
        }
      });
      
      setNotasAgrupadas(agrupadas);
      setEstadisticasCursos(estadisticas);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar notas');
      toast({
        title: "Error",
        description: "No se pudieron cargar las notas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar role="student" />
        <main className="flex-1 p-6 lg:ml-64 pt-16 lg:pt-6">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Cargando notas...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen">
        <Sidebar role="student" />
        <main className="flex-1 p-6 lg:ml-64 pt-16 lg:pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={cargarNotas} className="mt-4">
            Reintentar
          </Button>
        </main>
      </div>
    );
  }

  const totalCursos = Object.keys(estadisticasCursos).length;
  const totalEvaluaciones = Object.values(estadisticasCursos).reduce((sum, curso) => sum + curso.totalEvaluaciones, 0);
  const promedioGeneral = totalCursos > 0
    ? Object.values(estadisticasCursos).reduce((sum, curso) => sum + curso.promedio, 0) / totalCursos
    : 0;
  const totalLabs = notas.filter((evaluacion) => evaluacion.esLaboratorio3DLab).length;
  const labsCompletados = notas.filter((evaluacion) => evaluacion.esLaboratorio3DLab && typeof evaluacion.notaFinal === 'number').length;

  return (
    <div className="flex h-screen">
      <Sidebar role="student" />
      <main className="flex-1 p-6 lg:ml-64 pt-16 lg:pt-6">
        <div className="mb-6">
          <Link href="/student/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Mis Notas</h1>
              <p className="text-muted-foreground">Visualiza todas tus calificaciones</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={vistaActual === 'resumen' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVistaActual('resumen')}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Resumen
              </Button>
              <Button
                variant={vistaActual === 'detallada' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVistaActual('detallada')}
              >
                <List className="mr-2 h-4 w-4" />
                Detallada
              </Button>
            </div>
          </div>
          
          {/* Estadísticas generales */}
          {Object.keys(estadisticasCursos).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Cursos</p>
                      <p className="text-2xl font-bold">{totalCursos}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Evaluaciones</p>
                      <p className="text-2xl font-bold">{totalEvaluaciones}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Promedio General</p>
                      <p className="text-2xl font-bold text-green-600">
                        {promedioGeneral.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Laboratorios 3DLAB</p>
                      <p className="text-2xl font-bold">{labsCompletados}/{totalLabs}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {Object.keys(notasAgrupadas).length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay notas disponibles</h3>
              <p className="text-muted-foreground text-center">
                Aún no tienes calificaciones registradas.
              </p>
            </CardContent>
          </Card>
        ) : vistaActual === 'resumen' ? (
          <div className="space-y-6">
            {Object.entries(estadisticasCursos).map(([cursoNombre, stats]) => (
              <Card key={cursoNombre}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{cursoNombre}</span>
                    <Badge variant="outline" className="text-sm">
                      {stats.totalEvaluaciones} evaluaciones
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-1">
                        {stats.promedio.toFixed(1)}
                      </div>
                      <p className="text-sm text-muted-foreground">Promedio del curso</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-1">
                        {stats.mejorNota.toFixed(1)}
                      </div>
                      <p className="text-sm text-muted-foreground">Mejor nota</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(notasAgrupadas).map(([cursoNombre, evaluaciones]) => (
              <div key={cursoNombre}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold">{cursoNombre}</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Promedio: {estadisticasCursos[cursoNombre]?.promedio.toFixed(1) || 'N/A'}</span>
                  </div>
                </div>
                <div className="grid gap-6">
                  {evaluaciones.map((evaluacion) => (
                    <Card key={evaluacion.evaluacionId}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl">{evaluacion.evaluacionTitulo}</CardTitle>
                          </div>
                          <div className="text-right">
                            {evaluacion.notaFinal && (
                              <Badge variant="default" className="text-lg px-3 py-1">
                                <Award className="mr-1 h-4 w-4" />
                                Final: {evaluacion.notaFinal.toFixed(1)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {evaluacion.notas.map((nota) => (
                            <div key={nota.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">Intento {nota.numeroIntento}</p>
                                  {nota.esLaboratorio && (
                                    <Badge variant="outline" className="border-orange-200 text-orange-600 bg-orange-50 dark:border-orange-800 dark:text-orange-300 dark:bg-orange-900/20">
                                      Laboratorio 3DLAB
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(nota.fechaCalificacion).toLocaleDateString('es-ES')}
                                </p>
                                {nota.observaciones && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {nota.observaciones}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-primary">
                                  {nota.calificacion.toFixed(1)}
                                </p>
                                {nota.esNotaFinal && (
                                  <Badge variant="secondary">Nota Final</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                          {evaluacion.mejorNota && evaluacion.mejorNota !== evaluacion.notaFinal && (
                            <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <div>
                                <p className="font-medium text-green-700 dark:text-green-300">
                                  <TrendingUp className="inline mr-1 h-4 w-4" />
                                  Mejor Nota
                                </p>
                              </div>
                              <p className="text-xl font-bold text-green-700 dark:text-green-300">
                                {evaluacion.mejorNota.toFixed(1)}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}