"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Users, BookOpen, TrendingUp, Clock, Download } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { EvaluacionDTO } from '@/DTOs/EvaluacionDTOs';
import { evaluacionService } from '@/app/lib/evaluacion-service';
import Link from 'next/link';
import { toast } from '@/components/ui/use-toast';

interface EstadisticasEvaluacion {
  totalEstudiantes: number;
  estudiantesCompletaron: number;
  promedioGeneral: number;
  mejorCalificacion: number;
  peorCalificacion: number;
  tiempoPromedioMinutos: number;
  distribuccionCalificaciones: {
    rango: string;
    cantidad: number;
    porcentaje: number;
  }[];
  preguntasMasDificiles: {
    pregunta: string;
    porcentajeAciertos: number;
    numeroRespuestas: number;
  }[];
}

interface RespuestaEstudiante {
  nombreEstudiante: string;
  email: string;
  calificacion: number;
  puntosTotales: number;
  puntosObtenidos: number;
  intentos: number;
  ultimoIntento: string;
  tiempoEmpleadoMinutos: number;
  estado: 'Completado' | 'En Progreso' | 'No Iniciado';
}

export default function EstadisticasEvaluacionPage() {
  const params = useParams();
  const router = useRouter();
  const evaluacionId = parseInt(params.id as string);

  const [evaluacion, setEvaluacion] = useState<EvaluacionDTO | null>(null);
  const [estadisticas, setEstadisticas] = useState<EstadisticasEvaluacion | null>(null);
  const [respuestasEstudiantes, setRespuestasEstudiantes] = useState<RespuestaEstudiante[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, [evaluacionId]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [evaluacionData, estadisticasData, respuestasData] = await Promise.all([
        evaluacionService.obtenerEvaluacion(evaluacionId),
        evaluacionService.obtenerEstadisticasEvaluacion(evaluacionId),
        evaluacionService.obtenerRespuestasEstudiantes(evaluacionId)
      ]);

      setEvaluacion(evaluacionData);
      setEstadisticas(estadisticasData);
      setRespuestasEstudiantes(respuestasData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast({
        title: "Error",
        description: "Error al cargar las estadísticas",
        variant: "destructive",
      });
      router.push('/teacher/evaluaciones');
    } finally {
      setLoading(false);
    }
  };

  const exportarResultados = async () => {
    try {
      // Implementar exportación a CSV/Excel
      const csvContent = generarCSV();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `resultados_${evaluacion?.titulo}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Éxito",
        description: "Resultados exportados correctamente",
      });
    } catch (error) {
      console.error('Error al exportar:', error);
      toast({
        title: "Error",
        description: "Error al exportar los resultados",
        variant: "destructive",
      });
    }
  };

  const generarCSV = (): string => {
    const headers = [
      'Estudiante',
      'Email',
      'Calificación',
      'Puntos Obtenidos',
      'Puntos Totales',
      'Intentos',
      'Último Intento',
      'Tiempo (min)',
      'Estado'
    ];

    const rows = respuestasEstudiantes.map(resp => [
      resp.nombreEstudiante,
      resp.email,
      resp.calificacion.toFixed(1),
      resp.puntosObtenidos.toString(),
      resp.puntosTotales.toString(),
      resp.intentos.toString(),
      resp.ultimoIntento,
      resp.tiempoEmpleadoMinutos.toString(),
      resp.estado
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const getCalificacionColor = (calificacion: number): string => {
    if (calificacion >= 90) return 'text-green-600';
    if (calificacion >= 70) return 'text-blue-600';
    if (calificacion >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCalificacionBadge = (calificacion: number) => {
    if (calificacion >= 90) return <Badge className="bg-green-500">Excelente</Badge>;
    if (calificacion >= 70) return <Badge className="bg-blue-500">Bueno</Badge>;
    if (calificacion >= 50) return <Badge className="bg-yellow-500">Regular</Badge>;
    return <Badge variant="destructive">Insuficiente</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (!evaluacion || !estadisticas) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium">Datos no encontrados</h3>
        <Link href="/teacher/evaluaciones">
          <Button className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Evaluaciones
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/teacher/evaluaciones">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{evaluacion.titulo}</h1>
          <p className="text-muted-foreground">
            Estadísticas y resultados de la evaluación
          </p>
        </div>
        <Button onClick={exportarResultados}>
          <Download className="h-4 w-4 mr-2" />
          Exportar Resultados
        </Button>
      </div>

      {/* Resumen general */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estudiantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.estudiantesCompletaron}/{estadisticas.totalEstudiantes}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((estadisticas.estudiantesCompletaron / estadisticas.totalEstudiantes) * 100)}% completado
            </p>
            <Progress 
              value={(estadisticas.estudiantesCompletaron / estadisticas.totalEstudiantes) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio General</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getCalificacionColor(estadisticas.promedioGeneral)}`}>
              {estadisticas.promedioGeneral.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Rango: {estadisticas.peorCalificacion.toFixed(1)}% - {estadisticas.mejorCalificacion.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.tiempoPromedioMinutos}</div>
            <p className="text-xs text-muted-foreground">
              minutos promedio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preguntas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{evaluacion.preguntas?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {evaluacion.preguntas?.reduce((total, p) => total + p.puntos, 0) || 0} puntos totales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribución de calificaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Calificaciones</CardTitle>
          <CardDescription>
            Número de estudiantes por rango de calificación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {estadisticas.distribuccionCalificaciones.map((dist, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-20 text-sm font-medium">{dist.rango}</span>
                  <Progress value={dist.porcentaje} className="w-40" />
                </div>
                <div className="text-sm text-muted-foreground">
                  {dist.cantidad} estudiantes ({dist.porcentaje.toFixed(1)}%)
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preguntas más difíciles */}
      {estadisticas.preguntasMasDificiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preguntas Más Difíciles</CardTitle>
            <CardDescription>
              Preguntas con menor porcentaje de aciertos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {estadisticas.preguntasMasDificiles.map((pregunta, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{pregunta.pregunta}</p>
                    <p className="text-sm text-muted-foreground">
                      {pregunta.numeroRespuestas} respuestas
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getCalificacionColor(pregunta.porcentajeAciertos)}`}>
                      {pregunta.porcentajeAciertos.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">aciertos</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados por estudiante */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados por Estudiante</CardTitle>
          <CardDescription>
            Detalle de calificaciones y estado de cada estudiante
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Calificación</TableHead>
                  <TableHead className="text-center">Puntos</TableHead>
                  <TableHead className="text-center">Intentos</TableHead>
                  <TableHead className="text-center">Tiempo</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {respuestasEstudiantes.map((estudiante, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{estudiante.nombreEstudiante}</TableCell>
                    <TableCell className="text-muted-foreground">{estudiante.email}</TableCell>
                    <TableCell className="text-center">
                      <div className={`font-bold ${getCalificacionColor(estudiante.calificacion)}`}>
                        {estudiante.calificacion.toFixed(1)}%
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {estudiante.puntosObtenidos}/{estudiante.puntosTotales}
                    </TableCell>
                    <TableCell className="text-center">{estudiante.intentos}</TableCell>
                    <TableCell className="text-center">{estudiante.tiempoEmpleadoMinutos} min</TableCell>
                    <TableCell className="text-center">
                      {getCalificacionBadge(estudiante.calificacion)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {respuestasEstudiantes.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium">No hay datos disponibles</h3>
          <p className="text-muted-foreground">
            Los estudiantes aún no han comenzado esta evaluación.
          </p>
        </div>
      )}
    </div>
  );
}
