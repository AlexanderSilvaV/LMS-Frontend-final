"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp,
  RotateCcw,
  Award,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  EvaluacionEstudianteDTO,
  ResultadoEvaluacionDTO
} from '@/DTOs/EvaluacionDTOs';
import { evaluacionService } from '@/app/lib/evaluacion-service';
import { toast } from '@/components/ui/use-toast';
import Link from 'next/link';

export default function ResultadoEvaluacionPage() {
  const params = useParams();
  const router = useRouter();
  const evaluacionId = parseInt(params.id as string);

  const [evaluacionEstudiante, setEvaluacionEstudiante] = useState<EvaluacionEstudianteDTO | null>(null);
  const [resultado, setResultado] = useState<ResultadoEvaluacionDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarResultado();
  }, [evaluacionId]);

  const cargarResultado = async () => {
    try {
      setLoading(true);
      console.log('🔍 Cargando evaluación con ID:', evaluacionId);

      const evaluacionData = await evaluacionService.obtenerEvaluacionEstudiante(evaluacionId);
      console.log('📊 Datos de evaluación obtenidos:', evaluacionData);
      console.log('📊 Título:', evaluacionData.titulo);
      console.log('📊 Intentos realizados:', evaluacionData.intentosRealizados);
      console.log('📊 Último intento:', evaluacionData.ultimoIntento);
      console.log('📊 Es fallback:', evaluacionData.titulo === 'Evaluación' && evaluacionData.descripcion === 'Información no disponible');

      setEvaluacionEstudiante(evaluacionData);

      // Verificar si la evaluación tiene información básica (no es fallback)
      if (evaluacionData.titulo === 'Evaluación' && evaluacionData.descripcion === 'Información no disponible') {
        console.log('Evaluación de fallback detectada, mostrando página con información limitada');
        toast({
          title: "Información limitada",
          description: "No se pudo cargar toda la información de la evaluación. Algunos datos pueden no estar disponibles.",
          variant: "default",
        });
        // No redirigir, permitir que la página se muestre con información limitada
        setEvaluacionEstudiante(evaluacionData);
        return;
      }

      // Verificar si hay un último intento completado
      if (evaluacionData.ultimoIntento && evaluacionData.ultimoIntento.estado === 'Completado') {
        console.log('Último intento encontrado:', evaluacionData.ultimoIntento);
        console.log('Intentos realizados:', evaluacionData.intentosRealizados);
        
        // Intentar obtener el resultado del último intento realizado
        try {
          console.log('🎯 Intentando obtener resultado del intento:', evaluacionData.intentosRealizados);
          const resultadoData = await evaluacionService.obtenerResultadosEvaluacion(
            evaluacionId, 
            evaluacionData.intentosRealizados
          );
          console.log('Resultado obtenido:', resultadoData);
          console.log('Puntaje obtenido:', resultadoData.puntajeObtenido);
          console.log('Puntaje máximo:', resultadoData.puntajeMaximo);
          console.log('Porcentaje:', resultadoData.porcentaje);
          console.log('Número de respuestas:', resultadoData.detalleRespuestas?.length || 0);
          setResultado(resultadoData);
        } catch (error) {
          console.error('Error al obtener resultado del último intento:', error);
          
          // Si falla, intentar con el intento anterior si existe
          if (evaluacionData.intentosRealizados > 1) {
            console.log('Intentando con intento anterior...');
            try {
              const resultadoData = await evaluacionService.obtenerResultadosEvaluacion(
                evaluacionId, 
                evaluacionData.intentosRealizados - 1
              );
              console.log('Resultado del intento anterior obtenido:', resultadoData);
              setResultado(resultadoData);
            } catch (secondError) {
              console.error('Error al obtener resultado del intento anterior:', secondError);
              toast({
                title: "Error",
                description: "No se pudieron cargar los resultados de la evaluación",
                variant: "destructive",
              });
            }
          } else {
            toast({
              title: "Error",
              description: "Error al cargar los resultados",
              variant: "destructive",
            });
          }
        }
      } else {
        console.log('No hay último intento completado');
        toast({
          title: "Sin resultados",
          description: "No hay evaluaciones completadas para mostrar resultados",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error al cargar resultado:', error);
      toast({
        title: "Error",
        description: "Error al cargar los resultados",
        variant: "destructive",
      });
      router.push('/student/evaluaciones');
    } finally {
      setLoading(false);
    }
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

  const getIconoCalificacion = (calificacion: number) => {
    if (calificacion >= 90) return <Award className="h-8 w-8 text-green-600" />;
    if (calificacion >= 70) return <TrendingUp className="h-8 w-8 text-blue-600" />;
    return <Clock className="h-8 w-8 text-yellow-600" />;
  };

  const calcularTiempoEmpleado = (): string => {
    if (!resultado) return '0 min';
    
    const inicio = new Date(resultado.fechaInicio);
    const fin = new Date(resultado.fechaFin);
    const minutos = Math.floor((fin.getTime() - inicio.getTime()) / (1000 * 60));
    
    if (minutos >= 60) {
      const horas = Math.floor(minutos / 60);
      const mins = minutos % 60;
      return `${horas}h ${mins}m`;
    }
    return `${minutos} min`;
  };

  const puedeReintentarEvaluacion = (): boolean => {
    if (!evaluacionEstudiante) return false;
    
    const ahora = new Date();
    const fechaFin = evaluacionEstudiante.fechaFin ? new Date(evaluacionEstudiante.fechaFin) : null;
    
    return (
      evaluacionEstudiante.activa &&
      evaluacionEstudiante.intentosRealizados < evaluacionEstudiante.intentosMaximos &&
      (!fechaFin || ahora <= fechaFin)
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando resultados...</p>
        </div>
      </div>
    );
  }

  if (!evaluacionEstudiante) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium">Evaluación no encontrada</h3>
        <Link href="/student/evaluaciones">
          <Button className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Evaluaciones
          </Button>
        </Link>
      </div>
    );
  }

  const calificacion = resultado?.porcentaje || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/student/evaluaciones">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{evaluacionEstudiante.titulo}</h1>
          <p className="text-muted-foreground">
            Resultados de tu evaluación
          </p>
        </div>
      </div>

      {/* Mostrar advertencia si la información está limitada */}
      {evaluacionEstudiante.titulo === 'Evaluación' && evaluacionEstudiante.descripcion === 'Información no disponible' && (
        <Alert className="border-yellow-500 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Información limitada:</strong> No se pudo cargar toda la información de la evaluación.
            Algunos datos pueden no estar disponibles o ser incorrectos.
          </AlertDescription>
        </Alert>
      )}

      {/* Resumen de calificación */}
      <Card className="border-2">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {resultado ? getIconoCalificacion(calificacion) : <Clock className="h-8 w-8 text-gray-400" />}
          </div>
          <CardTitle className="text-2xl">
            {resultado ? 'Resultado Final' : 'Sin Resultados'}
          </CardTitle>
          <CardDescription>
            {resultado
              ? `${evaluacionEstudiante.curso.nombre} - ${evaluacionEstudiante.curso.nrc}`
              : 'Esta evaluación no ha sido completada aún'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {resultado ? (
            <>
              <div className="space-y-2">
                <div className={`text-6xl font-bold ${getCalificacionColor(calificacion)}`}>
                  {calificacion.toFixed(1)}%
                </div>
                {getCalificacionBadge(calificacion)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-muted-foreground">
                    {resultado.puntajeObtenido}
                  </div>
                  <p className="text-sm text-muted-foreground">Puntos obtenidos</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-muted-foreground">
                    {resultado.puntajeMaximo}
                  </div>
                  <p className="text-sm text-muted-foreground">Puntos totales</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-muted-foreground">
                    {calcularTiempoEmpleado()}
                  </div>
                  <p className="text-sm text-muted-foreground">Tiempo empleado</p>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-2" />
                <p>No hay resultados disponibles para esta evaluación.</p>
                <p className="text-sm">El estudiante aún no ha completado esta evaluación.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información del intento */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información del Intento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Intento número:</span>
              <span className="font-medium">{resultado?.numeroIntento || evaluacionEstudiante.intentosRealizados}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Intentos permitidos:</span>
              <span className="font-medium">{evaluacionEstudiante.intentosMaximos}</span>
            </div>
            {resultado && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha de realización:</span>
                  <span className="font-medium">
                    {format(new Date(resultado.fechaCompletado), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado:</span>
                  <Badge>Completado</Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Progreso de Respuestas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {resultado && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Respuestas correctas</span>
                    <span>
                      {resultado.detalleRespuestas.filter(r => r.esCorrecta).length} de {resultado.detalleRespuestas.length}
                    </span>
                  </div>
                  <Progress 
                    value={(resultado.detalleRespuestas.filter(r => r.esCorrecta).length / resultado.detalleRespuestas.length) * 100} 
                    className="h-3"
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Porcentaje de aciertos: {((resultado.detalleRespuestas.filter(r => r.esCorrecta).length / resultado.detalleRespuestas.length) * 100).toFixed(1)}%
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detalle de respuestas */}
      {resultado && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detalle de Respuestas</CardTitle>
            <CardDescription>
              Revisa tus respuestas pregunta por pregunta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {resultado.detalleRespuestas.map((respuesta, index) => (
                <div 
                  key={respuesta.preguntaId} 
                  className={`p-4 rounded-lg border ${
                    respuesta.esCorrecta ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {respuesta.esCorrecta ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className="font-medium">Pregunta {index + 1}</span>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${
                        respuesta.esCorrecta ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {respuesta.esCorrecta ? '+' : '0'}{respuesta.puntosObtenidos} pts
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-sm">
                    <span className={
                      respuesta.esCorrecta ? 'text-green-700' : 'text-red-700'
                    }>
                      {respuesta.esCorrecta ? 'Respuesta correcta' : 'Respuesta incorrecta'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acciones */}
      <div className="flex justify-center gap-4">
        {puedeReintentarEvaluacion() && (
          <Link href={`/student/evaluaciones/${evaluacionId}`}>
            <Button>
              <RotateCcw className="h-4 w-4 mr-2" />
              Intentar Nuevamente
            </Button>
          </Link>
        )}
        <Link href="/student/evaluaciones">
          <Button variant="outline">
            Ver Todas las Evaluaciones
          </Button>
        </Link>
      </div>

      {/* Mensaje de ánimo */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-lg font-medium text-blue-900">
              {calificacion >= 90 
                ? "¡Excelente trabajo! Has demostrado un dominio excepcional del tema." 
                : calificacion >= 70 
                ? "¡Buen trabajo! Tienes un conocimiento sólido del tema."
                : calificacion >= 50
                ? "Has aprobado. Considera revisar los temas para mejorar tu comprensión."
                : "Te recomendamos estudiar más el tema y aprovechar los intentos disponibles."
              }
            </p>
            {puedeReintentarEvaluacion() && calificacion < 70 && (
              <p className="mt-2 text-sm text-blue-700">
                Tienes {evaluacionEstudiante.intentosMaximos - evaluacionEstudiante.intentosRealizados} intento(s) adicionales disponibles.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
