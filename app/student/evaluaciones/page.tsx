"use client";

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  RotateCcw,
  Award,
  Target,
  Users,
  FileText
} from 'lucide-react';
import { format, differenceInMinutes, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { cursoService } from '@/app/lib/services/curso-service';
import { EvaluacionDTO } from '@/DTOs/EvaluacionDTOs';
import { EvaluacionEstudianteDTO } from '@/DTOs/EvaluacionDTOs';
import { evaluacionService } from '@/app/lib/evaluacion-service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

// Interfaces
interface Course {
  id: number;
  nombre: string;
  nrc: string;
}

export default function EvaluacionesEstudiantePage() {
  const [cursos, setCursos] = useState<Course[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionEstudianteDTO[]>([]);
  const [evaluacionesPorCurso, setEvaluacionesPorCurso] = useState<EvaluacionDTO[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<string>('todas');
  const [cursoSeleccionado, setCursoSeleccionado] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [loadingCursos, setLoadingCursos] = useState(false);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      // Cargar evaluaciones del estudiante y cursos en paralelo
      await Promise.all([
        cargarEvaluacionesEstudiante(),
        cargarCursos()
      ]);
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarEvaluacionesEstudiante = async () => {
    try {
      console.log('🔍 Cargando evaluaciones del estudiante');
      const evaluacionesData = await evaluacionService.obtenerEvaluacionesEstudiante();
      console.log('📊 Evaluaciones del estudiante obtenidas:', evaluacionesData);
      setEvaluaciones(evaluacionesData || []);
    } catch (error) {
      console.error('Error al cargar evaluaciones del estudiante:', error);
      setEvaluaciones([]);
    }
  };

  const cargarCursos = async () => {
    try {
      setLoadingCursos(true);
      // Usar el servicio de cursos para obtener cursos del estudiante
      const cursosData = await cursoService.obtenerCursosAsignados();

      if (!Array.isArray(cursosData)) {
        console.error('Error: cursosData no es un array:', cursosData);
        setCursos([]);
        return;
      }

      // Convertir CursoDTO[] a Course[]
      const cursosConvertidos: Course[] = cursosData.map((curso) => ({
        id: curso.cursoId!,
        nombre: curso.nombre,
        nrc: curso.nrc.toString()
      }));

      setCursos(cursosConvertidos);
      console.log('📚 Cursos del estudiante cargados:', cursosConvertidos);
    } catch (error) {
      console.error('Error al cargar cursos:', error);
      setCursos([]);
    } finally {
      setLoadingCursos(false);
    }
  };

  const cargarEvaluacionesPorCurso = async (cursoId: number) => {
    try {
      console.log('🔍 Cargando evaluaciones para curso:', cursoId);
      const evaluacionesData = await evaluacionService.obtenerEvaluacionesPorCurso(cursoId);
      console.log('📊 Evaluaciones por curso obtenidas:', evaluacionesData);
      setEvaluacionesPorCurso(evaluacionesData || []);
    } catch (error) {
      console.error('Error al cargar evaluaciones por curso:', error);
      setEvaluacionesPorCurso([]);
    }
  };

  const handleCursoChange = async (cursoIdStr: string) => {
    setCursoSeleccionado(cursoIdStr);
    // Resetear filtro cuando se cambia la selección de curso
    setFiltroEstado('todas');
    if (cursoIdStr && cursoIdStr !== 'all') {
      const cursoId = parseInt(cursoIdStr);
      await cargarEvaluacionesPorCurso(cursoId);
    } else {
      setEvaluacionesPorCurso([]);
    }
  };

  const getEstadoEvaluacion = (evaluacion: EvaluacionEstudianteDTO) => {
    const ahora = new Date();
    const fechaInicio = evaluacion.fechaInicio ? new Date(evaluacion.fechaInicio) : null;
    const fechaFin = evaluacion.fechaFin ? new Date(evaluacion.fechaFin) : null;

    // Si no puede realizarse, mostrar como no disponible
    if (!evaluacion.puedeRealizarEvaluacion) {
      if (evaluacion.yaCompletada) {
        return {
          estado: 'Sin intentos disponibles',
          badge: <Badge variant="outline" className="border border-red-400 text-red-600 bg-transparent">Sin intentos</Badge>,
          puedeRealizar: false,
          icono: RotateCcw
        };
      }
      return {
        estado: 'No disponible',
        badge: <Badge variant="outline" className="text-gray-500">No disponible</Badge>,
        puedeRealizar: false,
        icono: AlertCircle
      };
    }

    if (!evaluacion.activa) {
      return {
        estado: 'Inactiva',
        badge: <Badge variant="secondary">Inactiva</Badge>,
        puedeRealizar: false,
        icono: AlertCircle
      };
    }

    if (fechaInicio && isBefore(ahora, fechaInicio)) {
      return {
        estado: 'Programada',
        badge: <Badge variant="outline">Programada</Badge>,
        puedeRealizar: false,
        icono: Clock
      };
    }

    if (fechaFin && isAfter(ahora, fechaFin)) {
      return {
        estado: 'Finalizada',
        badge: <Badge variant="destructive">Finalizada</Badge>,
        puedeRealizar: false,
        icono: AlertCircle
      };
    }

    if (evaluacion.ultimoIntento?.estado === 'En Progreso') {
      return {
        estado: 'En Progreso',
        badge: <Badge className="bg-blue-500">En Progreso</Badge>,
        puedeRealizar: true,
        icono: Play
      };
    }

    return {
      estado: 'Disponible',
      badge: <Badge className="bg-orange-500">Disponible</Badge>,
      puedeRealizar: true,
      icono: Play
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
    if (!evaluacion.intentosMaximos || evaluacion.intentosMaximos <= 0) {
      return evaluacion.intentosRealizados > 0 ? 100 : 0;
    }
    return (evaluacion.intentosRealizados / evaluacion.intentosMaximos) * 100;
  };

  const getResumenPreguntas = (evaluacion: EvaluacionEstudianteDTO) => {
    const visibles = evaluacion.preguntasPorSesionLaboratorio && evaluacion.preguntasPorSesionLaboratorio > 0
      ? evaluacion.preguntasPorSesionLaboratorio
      : evaluacion.totalPreguntas;

    return `Preguntas: ${visibles}`;
  };

  const getResumenIntentos = (evaluacion: EvaluacionEstudianteDTO) => {
    if (!evaluacion.intentosMaximos || evaluacion.intentosMaximos <= 0) {
      return `Intentos: ${evaluacion.intentosRealizados}/∞`;
    }

    const total = Math.max(evaluacion.intentosMaximos, 0);
    const realizados = Math.min(evaluacion.intentosRealizados, total);
    return `Intentos: ${realizados}/${total}`;
  };

  const getResumenPreguntasCurso = (evaluacion: EvaluacionDTO) => {
    const totalDisponibles = evaluacion.totalPreguntas ?? evaluacion.preguntas?.length ?? 0;
    const visibles = evaluacion.preguntasPorSesionLaboratorio && evaluacion.preguntasPorSesionLaboratorio > 0
      ? evaluacion.preguntasPorSesionLaboratorio
      : totalDisponibles;

    return `Preguntas: ${visibles}`;
  };

  const getCalificacionColor = (calificacion: number): string => {
    if (calificacion >= 90) return 'text-green-600';
    if (calificacion >= 70) return 'text-blue-600';
    if (calificacion >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Funciones auxiliares para evaluaciones por curso
  const getEstadoEvaluacionCurso = (evaluacion: EvaluacionDTO) => {
    const ahora = new Date();

    if (!evaluacion.activa) {
      return {
        estado: 'finalizada',
        texto: 'Finalizada',
        color: 'bg-gray-500'
      };
    }

    if (evaluacion.fechaInicio && isBefore(ahora, new Date(evaluacion.fechaInicio))) {
      return {
        estado: 'proximamente',
        texto: 'Próximamente',
        color: 'bg-blue-500'
      };
    }

    if (evaluacion.fechaFin && isAfter(ahora, new Date(evaluacion.fechaFin))) {
      return {
        estado: 'finalizada',
        texto: 'Finalizada',
        color: 'bg-gray-500'
      };
    }

    return {
      estado: 'disponible',
      texto: 'Disponible',
      color: 'bg-green-500'
    };
  };

  const getTiempoRestanteCurso = (evaluacion: EvaluacionDTO) => {
    if (!evaluacion.fechaFin || !evaluacion.activa) return null;

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

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar role="student" />
        <div className="flex-1 lg:ml-64 flex items-center justify-center p-3 sm:p-6 lg:p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando evaluaciones...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      <Sidebar role="student" />
      <div className="flex-1 lg:ml-64 p-2 sm:p-3 lg:p-6 w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto w-full">
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 truncate">Mis Evaluaciones</h1>
                <p className="text-gray-600 text-xs sm:text-sm lg:text-base line-clamp-2">
                  Aquí puedes ver todas tus evaluaciones disponibles y acceder a tus resultados
                </p>
              </div>
              <Link href="/student/notas" className="shrink-0">
                <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto whitespace-nowrap">
                  <Award className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">Ver Resultados</span>
                  <span className="sm:hidden">Resultados</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Selector de curso */}
          {cursos.length > 0 && (
            <div className="mb-4 sm:mb-6 w-full">
              <Label htmlFor="curso-select" className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2 block">
                Seleccionar Curso (Opcional)
              </Label>
              <Select value={cursoSeleccionado} onValueChange={handleCursoChange}>
                <SelectTrigger className="w-full max-w-full sm:max-w-md">
                  <SelectValue placeholder="Ver todas las evaluaciones" />
                </SelectTrigger>
                <SelectContent className="max-w-[calc(100vw-2rem)]">
                  <SelectItem value="all">Ver todas las evaluaciones</SelectItem>
                  {cursos.map((curso) => (
                    <SelectItem key={curso.id} value={curso.id.toString()}>
                      <span className="truncate">{curso.nombre} - NRC: {curso.nrc}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Filtros */}
          {((evaluaciones.length > 0 && cursoSeleccionado === 'all') || (evaluacionesPorCurso.length > 0 && cursoSeleccionado !== 'all')) && (
            <div className="mb-4 sm:mb-6 w-full overflow-x-auto">
              <div className="flex flex-nowrap gap-2 min-w-min pb-2">
                <Button
                  variant={filtroEstado === 'todas' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-8 sm:h-9 whitespace-nowrap shrink-0"
                  onClick={() => setFiltroEstado('todas')}
                >
                  Todas ({cursoSeleccionado === 'all' ? evaluaciones.length : evaluacionesPorCurso.length})
                </Button>
                <Button
                  variant={filtroEstado === 'disponibles' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-8 sm:h-9 whitespace-nowrap shrink-0"
                  onClick={() => setFiltroEstado('disponibles')}
                >
                  Disponibles ({cursoSeleccionado === 'all' ?
                    evaluaciones.filter(e => e.puedeRealizarEvaluacion).length :
                    evaluacionesPorCurso.filter(e => e.activa && (!e.fechaInicio || !isBefore(new Date(), new Date(e.fechaInicio))) && (!e.fechaFin || !isAfter(new Date(), new Date(e.fechaFin)))).length})
                </Button>
                <Button
                  variant={filtroEstado === 'no-disponibles' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-8 sm:h-9 whitespace-nowrap shrink-0"
                  onClick={() => setFiltroEstado('no-disponibles')}
                >
                  No disponibles ({cursoSeleccionado === 'all' ?
                    evaluaciones.filter(e => !e.puedeRealizarEvaluacion).length :
                    evaluacionesPorCurso.filter(e => !e.activa || (e.fechaInicio && isBefore(new Date(), new Date(e.fechaInicio))) || (e.fechaFin && isAfter(new Date(), new Date(e.fechaFin)))).length})
                </Button>
              </div>
            </div>
          )}

          {/* Lista de evaluaciones */}
          <div>
            {(() => {
              // Determinar qué evaluaciones mostrar
              const evaluacionesAMostrar = cursoSeleccionado === 'all' ? evaluaciones : evaluacionesPorCurso;
              const esEvaluacionEstudiante = cursoSeleccionado === 'all';

              const evaluacionesFiltradas = evaluacionesAMostrar.filter(evaluacion => {
                if (esEvaluacionEstudiante) {
                  // Para evaluaciones del estudiante (EvaluacionEstudianteDTO)
                  const evalEst = evaluacion as EvaluacionEstudianteDTO;
                  switch (filtroEstado) {
                    case 'disponibles':
                      return evalEst.puedeRealizarEvaluacion;
                    case 'no-disponibles':
                      return !evalEst.puedeRealizarEvaluacion;
                    default:
                      return true;
                  }
                } else {
                  // Para evaluaciones por curso (EvaluacionDTO)
                  const evalCurso = evaluacion as EvaluacionDTO;
                  const ahora = new Date();
                  const fechaInicio = evalCurso.fechaInicio ? new Date(evalCurso.fechaInicio) : null;
                  const fechaFin = evalCurso.fechaFin ? new Date(evalCurso.fechaFin) : null;

                  switch (filtroEstado) {
                    case 'disponibles':
                      return evalCurso.activa &&
                             (!fechaInicio || !isBefore(ahora, fechaInicio)) &&
                             (!fechaFin || !isAfter(ahora, fechaFin));
                    case 'no-disponibles':
                      return !evalCurso.activa ||
                             (fechaInicio && isBefore(ahora, fechaInicio)) ||
                             (fechaFin && isAfter(ahora, fechaFin));
                    default:
                      return true;
                  }
                }
              });

              return evaluacionesFiltradas.length === 0 ? (
                <Card className="p-4 sm:p-6 lg:p-8 text-center w-full">
                  <CardContent className="pt-4 sm:pt-6">
                    <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                      {filtroEstado === 'todas' ? 'No hay evaluaciones disponibles' :
                       filtroEstado === 'disponibles' ? 'No hay evaluaciones disponibles' :
                       'No hay evaluaciones no disponibles'}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 line-clamp-3">
                      {cursoSeleccionado !== 'all' ?
                        (filtroEstado === 'todas' ? 'No se encontraron evaluaciones para este curso.' :
                         filtroEstado === 'disponibles' ? 'No hay evaluaciones disponibles en este curso.' :
                         'Todas las evaluaciones de este curso están disponibles.') :
                        (filtroEstado === 'todas' ? 'No se encontraron evaluaciones asignadas a tus cursos.' :
                         filtroEstado === 'disponibles' ? 'No tienes evaluaciones disponibles en este momento.' :
                         'Todas tus evaluaciones están disponibles.')}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 w-full">
                  {evaluacionesFiltradas.map((evaluacion) => {
                    if (esEvaluacionEstudiante) {
                      // Renderizar EvaluacionEstudianteDTO
                      const evalEst = evaluacion as EvaluacionEstudianteDTO;
                      const estadoInfo = getEstadoEvaluacion(evalEst);
                      const tiempoRestante = getTiempoRestante(evalEst);
                      const progreso = getProgreso(evalEst);
                      const EstadoIcono = estadoInfo.icono;
                      const intentosRestantesLabel = evalEst.intentosMaximos > 0
                        ? Math.max(0, evalEst.intentosMaximos - evalEst.intentosRealizados).toString()
                        : '∞';

                      return (
                        <Card key={evalEst.id} className="hover:shadow-lg transition-shadow flex flex-col overflow-hidden">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1 flex-1 min-w-0 overflow-hidden">
                                <CardTitle className="text-sm sm:text-base lg:text-lg line-clamp-2 break-words">{evalEst.titulo}</CardTitle>
                                <CardDescription className="line-clamp-2 text-xs sm:text-sm">{evalEst.descripcion}</CardDescription>
                                <div className="text-xs sm:text-sm text-gray-600 truncate">
                                  <strong className="font-medium">Curso:</strong> {evalEst.curso.nombre} ({evalEst.curso.nrc})
                                </div>
                                {evalEst.modulo && (
                                  <div className="text-xs sm:text-sm text-gray-600 truncate">
                                    <strong className="font-medium">Módulo:</strong> {evalEst.modulo.nombre}
                                  </div>
                                )}
                                <div className="text-xs sm:text-sm text-gray-600 truncate">
                                  <strong className="font-medium">Docente:</strong> {evalEst.docenteNombre}
                                </div>
                              </div>
                              <Badge className={`${estadoInfo.badge.props.className} shrink-0 whitespace-nowrap text-xs`}>
                                <EstadoIcono className="h-3 w-3 mr-1 shrink-0" />
                                <span className="hidden sm:inline">{estadoInfo.estado}</span>
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-3 flex-1 flex flex-col">
                            <div className="space-y-2 sm:space-y-3 flex-1">
                              {/* Información básica */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 shrink-0" />
                                  <span className="truncate">{evalEst.tiempoLimiteMins} min</span>
                                </div>
                                <div className="flex items-center gap-2 min-w-0">
                                  <Target className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 shrink-0" />
                                  <span className="truncate">{getResumenPreguntas(evalEst)}</span>
                                </div>
                                <div className="flex items-center gap-2 min-w-0 sm:col-span-2">
                                  <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 shrink-0" />
                                  <span className="truncate">{getResumenIntentos(evalEst)}</span>
                                </div>
                              </div>

                              {/* Resultado si tiene intentos realizados */}
                              {evalEst.intentosRealizados > 0 && evalEst.mejorPorcentaje !== undefined && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Award className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 shrink-0" />
                                      <span className="text-xs sm:text-sm font-medium text-green-800 truncate">Mejor resultado:</span>
                                    </div>
                                    <span className="text-base sm:text-lg font-bold text-green-600 shrink-0">
                                      {evalEst.mejorPorcentaje.toFixed(1)}%
                                    </span>
                                  </div>
                                  {evalEst.ultimaFechaRealizada && (
                                    <p className="text-xs text-green-700 mt-1 truncate">
                                      Última vez: {format(new Date(evalEst.ultimaFechaRealizada), 'dd/MM/yyyy HH:mm', { locale: es })}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Fechas */}
                              {(evalEst.fechaInicio || evalEst.fechaFin) && (
                                <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600 border-t pt-2 sm:pt-3">
                                  {evalEst.fechaInicio && (
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                                      <span className="truncate">
                                        <strong className="font-medium">Inicio:</strong>{' '}
                                        {format(new Date(evalEst.fechaInicio), 'dd/MM/yyyy HH:mm', { locale: es })}
                                      </span>
                                    </div>
                                  )}
                                  {evalEst.fechaFin && (
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                                      <span className="truncate">
                                        <strong className="font-medium">Fin:</strong>{' '}
                                        {format(new Date(evalEst.fechaFin), 'dd/MM/yyyy HH:mm', { locale: es })}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Tiempo restante */}
                              {tiempoRestante && (
                                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-orange-600">
                                  <Timer className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                                  <span className="truncate">{tiempoRestante}</span>
                                </div>
                              )}

                              {!evalEst.puedeRealizarEvaluacion && evalEst.yaCompletada && (
                                <div className="p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg text-xs sm:text-sm text-red-700">
                                  Ya utilizaste todos los intentos disponibles para esta evaluación.
                                </div>
                              )}

                              {/* Progreso de intentos */}
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs sm:text-sm gap-2">
                                  <span className="truncate">Intentos realizados</span>
                                  <span className="shrink-0">
                                    {evalEst.intentosRealizados}/
                                    {evalEst.intentosMaximos > 0 ? evalEst.intentosMaximos : '∞'}
                                  </span>
                                </div>
                                <div className="flex justify-between text-xs sm:text-sm text-gray-600 gap-2">
                                  <span className="truncate">Intentos restantes</span>
                                  <span className={`shrink-0 ${
                                    evalEst.intentosMaximos > 0
                                      ? (evalEst.intentosMaximos - evalEst.intentosRealizados > 0
                                        ? 'text-green-600 font-medium'
                                        : 'text-red-600 font-medium')
                                      : 'text-blue-600 font-medium'
                                  }`}>
                                    {intentosRestantesLabel}
                                  </span>
                                </div>
                                {evalEst.intentosMaximos > 0 && <Progress value={progreso} className="h-2" />}
                              </div>

                              {/* Último intento y calificación */}
                              {evalEst.ultimoIntento && (
                                <div className="p-2 sm:p-3 bg-gray-50 rounded-lg space-y-2">
                                  <div className="flex justify-between items-center gap-2">
                                    <span className="text-xs sm:text-sm font-medium truncate">Último intento:</span>
                                    <Badge variant="outline" className="shrink-0 text-xs">{evalEst.ultimoIntento.estado}</Badge>
                                  </div>
                                  {evalEst.ultimoIntento.calificacion !== undefined && (
                                    <div className="flex justify-between items-center gap-2">
                                      <span className="text-xs sm:text-sm truncate">Calificación:</span>
                                      <span className={`text-sm sm:text-base font-bold shrink-0 ${getCalificacionColor(evalEst.ultimoIntento.calificacion)}`}>
                                        {evalEst.ultimoIntento.calificacion.toFixed(1)}%
                                      </span>
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-500 truncate">
                                    {format(new Date(evalEst.ultimoIntento.fechaInicio), 'dd/MM/yyyy HH:mm', { locale: es })}
                                  </div>
                                </div>
                              )}

                              {/* Botón de acción */}
                              <div className="pt-2 sm:pt-3">
                                {evalEst.puedeRealizarEvaluacion ? (
                                  <Link href={`/student/evaluaciones/${evalEst.id}`} className="w-full block">
                                    <Button className="w-full text-sm">
                                      {evalEst.ultimoIntento?.estado === 'En Progreso' ? (
                                        <>
                                          <Play className="h-4 w-4 mr-2 shrink-0" />
                                          <span>Continuar</span>
                                        </>
                                      ) : (
                                        <>
                                          <Play className="h-4 w-4 mr-2 shrink-0" />
                                          <span className="truncate">{evalEst.intentosRealizados > 0 ? 'Nuevo Intento' : 'Realizar Evaluación'}</span>
                                        </>
                                      )}
                                    </Button>
                                  </Link>
                                ) : (
                                  <Button variant="outline" className="w-full text-sm" disabled>
                                    <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
                                    <span>No disponible</span>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    } else {
                      // Renderizar EvaluacionDTO (por curso)
                      const evalCurso = evaluacion as EvaluacionDTO;
                      const estadoInfo = getEstadoEvaluacionCurso(evalCurso);
                      const tiempoRestante = getTiempoRestanteCurso(evalCurso);

                      return (
                        <Card key={evalCurso.id} className="hover:shadow-lg transition-shadow flex flex-col overflow-hidden">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1 flex-1 min-w-0 overflow-hidden">
                                <CardTitle className="text-sm sm:text-base lg:text-lg line-clamp-2 break-words">{evalCurso.titulo}</CardTitle>
                                <CardDescription className="line-clamp-2 text-xs sm:text-sm">{evalCurso.descripcion}</CardDescription>
                              </div>
                              <Badge className={`${estadoInfo.color} shrink-0 whitespace-nowrap text-xs`}>
                                {estadoInfo.texto}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-3 flex-1 flex flex-col">
                            <div className="space-y-2 sm:space-y-3 flex-1">
                              {/* Información básica */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 shrink-0" />
                                  <span className="truncate">{evalCurso.tiempoLimiteMins} min</span>
                                </div>
                                <div className="flex items-center gap-2 min-w-0">
                                  <Target className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 shrink-0" />
                                  <span className="truncate">{getResumenPreguntasCurso(evalCurso)}</span>
                                </div>
                                <div className="flex items-center gap-2 min-w-0">
                                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 shrink-0" />
                                  <span className="truncate">{evalCurso.intentosMaximos} intento(s)</span>
                                </div>
                                <div className="flex items-center gap-2 min-w-0">
                                  <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 shrink-0" />
                                  <span className="truncate">{evalCurso.docenteNombre || 'Docente'}</span>
                                </div>
                              </div>

                              {/* Fechas */}
                              {(evalCurso.fechaInicio || evalCurso.fechaFin) && (
                                <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600 border-t pt-2 sm:pt-3">
                                  {evalCurso.fechaInicio && (
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                                      <span className="truncate">
                                        <strong className="font-medium">Inicio:</strong>{' '}
                                        {format(new Date(evalCurso.fechaInicio), 'dd/MM/yyyy HH:mm', { locale: es })}
                                      </span>
                                    </div>
                                  )}
                                  {evalCurso.fechaFin && (
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                                      <span className="truncate">
                                        <strong className="font-medium">Fin:</strong>{' '}
                                        {format(new Date(evalCurso.fechaFin), 'dd/MM/yyyy HH:mm', { locale: es })}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Tiempo restante */}
                              {tiempoRestante && (
                                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-orange-600">
                                  <Timer className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                                  <span className="truncate">{tiempoRestante}</span>
                                </div>
                              )}

                              {/* Botón de acción */}
                              <div className="pt-2 sm:pt-3">
                                {evalCurso.activa && (!evalCurso.fechaInicio || !isBefore(new Date(), new Date(evalCurso.fechaInicio))) ? (
                                  <Link href={`/student/evaluaciones/${evalCurso.id}`} className="w-full block">
                                    <Button className="w-full text-sm">
                                      <Play className="h-4 w-4 mr-2 shrink-0" />
                                      <span>Realizar Evaluación</span>
                                    </Button>
                                  </Link>
                                ) : estadoInfo.estado === 'proximamente' ? (
                                  <Button variant="secondary" className="w-full text-sm" size="sm" disabled>
                                    <Clock className="h-4 w-4 mr-2 shrink-0" />
                                    <span>Próximamente</span>
                                  </Button>
                                ) : (
                                  <Button variant="outline" className="w-full text-sm" size="sm" disabled>
                                    <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
                                    <span>Finalizada</span>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    }
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
