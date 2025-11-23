"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Users, Award, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { EvaluacionDTO } from '@/DTOs/EvaluacionDTOs';
import { evaluacionService } from '@/app/lib/evaluacion-service';
import Link from 'next/link';
import { toast } from '@/components/ui/use-toast';

interface RespuestaEstudiante {
  usuarioId?: string;
  UsuarioId?: string;
  usuarioRut?: string;
  UsuarioRut?: string;
  nombreCompleto?: string;
  NombreCompleto?: string;
  nota?: number;
  Nota?: number;
  porcentaje?: number;
  Porcentaje?: number;
  intentos?: number;
  Intentos?: number;
  fechaRealizacion?: string;
  FechaRealizacion?: string;
  completada?: boolean;
  Completada?: boolean;
}

export default function ResultadosEvaluacionPage() {
  const params = useParams();
  const router = useRouter();
  const evaluacionId = parseInt(params.id as string);

  const [evaluacion, setEvaluacion] = useState<EvaluacionDTO | null>(null);
  const [respuestasEstudiantes, setRespuestasEstudiantes] = useState<RespuestaEstudiante[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, [evaluacionId]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [evaluacionData, respuestasData] = await Promise.all([
        evaluacionService.obtenerEvaluacion(evaluacionId),
        evaluacionService.obtenerEstadisticasEvaluacion(evaluacionId)
      ]);

      setEvaluacion(evaluacionData);
      setRespuestasEstudiantes(respuestasData || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast({
        title: "Error",
        description: "Error al cargar los resultados de los alumnos",
        variant: "destructive",
      });
      router.push('/teacher/evaluaciones');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (respuesta: RespuestaEstudiante) => {
    const completada = respuesta.completada ?? respuesta.Completada ?? false;
    if (completada) {
      return <Badge variant="default" className="bg-green-500">Completado</Badge>;
    } else {
      return <Badge variant="outline">Pendiente</Badge>;
    }
  };

  const estudiantesCompletaron = respuestasEstudiantes.filter(r => (r.completada ?? r.Completada ?? false)).length;
  const promedioGeneral = estudiantesCompletaron > 0
    ? respuestasEstudiantes
        .filter(r => (r.completada ?? r.Completada ?? false))
        .reduce((sum, r) => sum + (r.nota ?? r.Nota ?? 0), 0) / estudiantesCompletaron
    : 0;

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar role="teacher" />
        <main className="flex-1 p-6 lg:ml-64 pt-16 lg:pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!evaluacion) {
    return (
      <div className="flex h-screen">
        <Sidebar role="teacher" />
        <main className="flex-1 p-6 lg:ml-64 pt-16 lg:pt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Evaluación no encontrada</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar role="teacher" />
      <main className="flex-1 p-6 lg:ml-64 pt-16 lg:pt-6">
        <div className="mb-6">
          <Link href="/teacher/evaluaciones">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Evaluaciones
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Resultados: {evaluacion.titulo}</h1>
              <p className="text-muted-foreground">{evaluacion.descripcion}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{respuestasEstudiantes.length} alumnos</span>
                </div>
                <div className="flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  <span>{estudiantesCompletaron} completaron</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>Promedio: {promedioGeneral.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lista de Alumnos y Resultados
            </CardTitle>
            <CardDescription>
              Resultados detallados de todos los alumnos inscritos en esta evaluación
            </CardDescription>
          </CardHeader>
          <CardContent>
            {respuestasEstudiantes.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay alumnos inscritos en esta evaluación</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>RUT</TableHead>
                      <TableHead>Alumno</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Calificación</TableHead>
                      <TableHead>Porcentaje</TableHead>
                      <TableHead>Intentos</TableHead>
                      <TableHead>Fecha de Realización</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {respuestasEstudiantes.map((respuesta, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {respuesta.usuarioRut ?? respuesta.UsuarioRut ?? 'N/A'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {respuesta.nombreCompleto ?? respuesta.NombreCompleto ?? 'N/A'}
                        </TableCell>
                        <TableCell>
                          {getEstadoBadge(respuesta)}
                        </TableCell>
                        <TableCell>
                          {(respuesta.completada ?? respuesta.Completada ?? false) ? (
                            <span className="font-semibold text-primary">
                              {((respuesta.nota ?? respuesta.Nota ?? 0) as number).toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Pendiente</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {(respuesta.completada ?? respuesta.Completada ?? false) ? (
                            <span>
                              {respuesta.porcentaje ?? respuesta.Porcentaje ?? 0}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{respuesta.intentos ?? respuesta.Intentos ?? 0}</TableCell>
                        <TableCell>
                          {(() => {
                            const fecha = respuesta.fechaRealizacion ?? respuesta.FechaRealizacion;
                            return fecha ? (
                              format(new Date(fecha), 'dd/MM/yyyy HH:mm', { locale: es })
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            );
                          })()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}