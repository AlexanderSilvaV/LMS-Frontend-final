"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import {
  Clock,
  ArrowLeft,
  ArrowRight,
  Send,
  AlertTriangle,
  CheckCircle2,
  Circle,
  TrendingUp,
  Award,
  RotateCcw,
  XCircle
} from 'lucide-react';
import { format, differenceInSeconds } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  EvaluacionDTO,
  EvaluacionEstudianteDTO,
  ResultadoEvaluacionDTO,
  SubmitEvaluacionDTO,
  RespuestaUsuarioDTO,
  EvaluacionParaRealizarDTO
} from '@/DTOs/EvaluacionDTOs';
import { evaluacionService } from '@/app/lib/evaluacion-service';
import { ensureEvaluacionSession } from '@/app/lib/attempt-util';
import { toast } from '@/components/ui/use-toast';
import Link from 'next/link';

type ExtendedCSSStyleDeclaration = CSSStyleDeclaration & {
  webkitUserSelect?: string;
  msUserSelect?: string;
};

export default function RealizarEvaluacionPage() {
  const params = useParams();
  const router = useRouter();
  const evaluacionId = parseInt(params.id as string);

  const [evaluacion, setEvaluacion] = useState<EvaluacionDTO | null>(null);
  const [evaluacionEstudiante, setEvaluacionEstudiante] = useState<EvaluacionEstudianteDTO | null>(null);
  const [resultado, setResultado] = useState<ResultadoEvaluacionDTO | null>(null);
  const [evaluacionEnCurso, setEvaluacionEnCurso] = useState<EvaluacionParaRealizarDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [iniciando, setIniciando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorLimiteIntentos, setErrorLimiteIntentos] = useState(false);

  const [evaluacionIniciada, setEvaluacionIniciada] = useState(false);
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<number, number>>({});
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [numeroIntento, setNumeroIntento] = useState(1);
  const [reanudandoEvaluacion, setReanudandoEvaluacion] = useState(false);

  const sincronizarEvaluacionEnCurso = useCallback((payload: EvaluacionParaRealizarDTO | null) => {
    if (!payload) return;

    const preguntasAdaptadas = (payload.preguntas ?? []).map(pregunta => ({
      id: pregunta.id,
      texto: pregunta.texto,
      orden: pregunta.orden,
      puntos: pregunta.puntos,
      evaluacionId,
      opciones: (pregunta.opciones ?? []).map(opcion => ({
        id: opcion.id,
        texto: opcion.texto,
        esCorrecta: false,
        orden: opcion.orden,
        preguntaId: pregunta.id
      }))
    }));

    setEvaluacion(prev => prev ? ({
      ...prev,
      tiempoLimiteMins: payload.tiempoLimiteMins ?? prev.tiempoLimiteMins,
      preguntas: preguntasAdaptadas,
      totalPreguntas: preguntasAdaptadas.length
    }) : prev);

    setEvaluacionEstudiante(prev => prev ? ({
      ...prev,
      totalPreguntas: payload.preguntas?.length ?? prev.totalPreguntas
    }) : prev);

    setEvaluacionEnCurso(payload);
  }, [evaluacionId]);

  const obtenerMensajeError = useCallback((error: unknown, fallback: string) => {
    if (error instanceof Error) {
      return error.message || fallback;
    }

    if (typeof error === 'string') {
      return error || fallback;
    }

    if (error && typeof error === 'object') {
      const posibleMensaje = (error as { message?: unknown; mensaje?: unknown });
      if (typeof posibleMensaje.message === 'string' && posibleMensaje.message.trim().length > 0) {
        return posibleMensaje.message;
      }
      if (typeof posibleMensaje.mensaje === 'string' && posibleMensaje.mensaje.trim().length > 0) {
        return posibleMensaje.mensaje;
      }
    }

    return fallback;
  }, []);

  // Funciones para persistir el progreso en localStorage
  const guardarProgreso = useCallback((pregunta: number, respuestasUsuario: Record<number, number>) => {
    if (!evaluacionId) return;
    try {
      const progresoKey = `evaluacion_progreso_${evaluacionId}`;
      const progreso = {
        preguntaActual: pregunta,
        respuestas: respuestasUsuario,
        timestamp: Date.now()
      };
      localStorage.setItem(progresoKey, JSON.stringify(progreso));
    } catch (error) {
      console.error('Error al guardar progreso:', error);
    }
  }, [evaluacionId]);

  const cargarProgreso = useCallback((): { preguntaActual: number; respuestas: Record<number, number> } | null => {
    if (!evaluacionId) return null;
    try {
      const progresoKey = `evaluacion_progreso_${evaluacionId}`;
      const progresoStr = localStorage.getItem(progresoKey);
      if (!progresoStr) return null;

      const progreso = JSON.parse(progresoStr);
      // Verificar si el progreso no es muy antiguo (menos de 24 horas)
      const edad = Date.now() - progreso.timestamp;
      if (edad > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(progresoKey);
        return null;
      }
      return {
        preguntaActual: progreso.preguntaActual || 0,
        respuestas: progreso.respuestas || {}
      };
    } catch (error) {
      console.error('Error al cargar progreso:', error);
      // Limpiar datos corruptos
      try {
        localStorage.removeItem(`evaluacion_progreso_${evaluacionId}`);
      } catch (e) {
        console.error('Error al limpiar progreso corrupto:', e);
      }
      return null;
    }
  }, [evaluacionId]);

  const limpiarProgreso = useCallback(() => {
    if (!evaluacionId) return;
    try {
      const progresoKey = `evaluacion_progreso_${evaluacionId}`;
      localStorage.removeItem(progresoKey);
    } catch (error) {
      console.error('Error al limpiar progreso:', error);
    }
  }, [evaluacionId]);

  // Guardar progreso automáticamente cuando cambie
  useEffect(() => {
    if (evaluacionIniciada && !reanudandoEvaluacion) {
      guardarProgreso(preguntaActual, respuestas);
    }
  }, [evaluacionIniciada, guardarProgreso, preguntaActual, respuestas, reanudandoEvaluacion]);

  // Bloquear click derecho durante la evaluación para prevenir copiar/pegar
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (evaluacionIniciada) {
        e.preventDefault();
        toast({
          title: "Acción no permitida",
          description: "No se permite el menú contextual durante la evaluación",
          variant: "destructive",
        });
        return false;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (evaluacionIniciada) {
        // Bloquear Ctrl+C, Ctrl+V, Ctrl+X, F12 (dev tools)
        if (
          (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x')) ||
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && e.key === 'I') || // Ctrl+Shift+I
          (e.ctrlKey && e.shiftKey && e.key === 'J') || // Ctrl+Shift+J
          (e.ctrlKey && e.key === 'u') // Ctrl+U (view source)
        ) {
          e.preventDefault();
          toast({
            title: "Acción no permitida",
            description: "Copiar, pegar y herramientas de desarrollo están bloqueadas durante la evaluación",
            variant: "destructive",
          });
          return false;
        }
      }
    };

    if (evaluacionIniciada) {
      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('keydown', handleKeyDown);

      // Prevenir selección de texto
      const bodyStyle = document.body.style as ExtendedCSSStyleDeclaration;
      bodyStyle.userSelect = 'none';
      if (bodyStyle.webkitUserSelect !== undefined) {
        bodyStyle.webkitUserSelect = 'none';
      }
      if (bodyStyle.msUserSelect !== undefined) {
        bodyStyle.msUserSelect = 'none';
      }
    }

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);

      // Restaurar selección de texto
      const bodyStyle = document.body.style as ExtendedCSSStyleDeclaration;
      bodyStyle.userSelect = '';
      if (bodyStyle.webkitUserSelect !== undefined) {
        bodyStyle.webkitUserSelect = '';
      }
      if (bodyStyle.msUserSelect !== undefined) {
        bodyStyle.msUserSelect = '';
      }
    };
  }, [evaluacionIniciada]);

  // Detectar cuando se pierde la conexión y permitir reanudar
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (evaluacionIniciada && tiempoRestante > 0) {
        // Mostrar mensaje de confirmación personalizado
        const mensaje = '¿Estás seguro de que quieres salir? Tu evaluación está en progreso y perderás todo el progreso no guardado. Si cierras la pestaña accidentalmente, podrás reanudar la evaluación mientras tengas tiempo restante.';
        e.preventDefault();
        e.returnValue = mensaje;
        return e.returnValue;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && evaluacionIniciada && tiempoRestante > 0) {
        console.log('Evaluación pausada - pestaña oculta');
      } else if (!document.hidden && evaluacionIniciada && tiempoRestante > 0) {
        console.log('Evaluación reanudada - pestaña visible');
        // Aquí podríamos agregar lógica adicional para verificar la sesión
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [evaluacionIniciada, tiempoRestante]);

  const cargarEvaluacion = useCallback(async () => {
    try {
      setLoading(true);

      // Primero obtener información básica de la evaluación (sin token)
      const evaluacionData = await evaluacionService.obtenerEvaluacion(evaluacionId);
      setEvaluacion(evaluacionData);

      // Obtener evaluaciones del estudiante para ver el estado
      const evaluacionesEstudiante = await evaluacionService.obtenerEvaluacionesEstudiante();
      const evaluacionEstudianteData = evaluacionesEstudiante.find(e => e.id === evaluacionId);

      if (evaluacionEstudianteData) {
        setEvaluacionEstudiante(evaluacionEstudianteData);
        setNumeroIntento(evaluacionEstudianteData.intentosRealizados + 1);

        // Si la evaluación ya está completada, cargar los resultados
        if (evaluacionEstudianteData.yaCompletada && evaluacionEstudianteData.ultimoIntento?.estado === 'Completado') {
          try {
            console.log('🎯 Cargando resultados de evaluación completada');
            const resultadoData = await evaluacionService.obtenerResultadosEvaluacion(
              evaluacionId,
              evaluacionEstudianteData.intentosRealizados
            );
            console.log('Resultados cargados:', resultadoData);
            setResultado(resultadoData);
          } catch (error) {
            console.error('Error al cargar resultados:', error);
            toast({
              title: "Error",
              description: "Error al cargar los resultados de la evaluación",
              variant: "destructive",
            });
          }
        }

        // IMPORTANTE: También intentar cargar resultados si hay un último intento completado
        // Esto maneja el caso donde la evaluación acaba de ser enviada y yaCompletada aún no se actualizó
        if (evaluacionEstudianteData.ultimoIntento?.estado === 'Completado' && !resultado) {
          try {
            console.log('🔄 Intentando cargar resultados del último intento completado');
            const resultadoData = await evaluacionService.obtenerResultadosEvaluacion(
              evaluacionId,
              evaluacionEstudianteData.intentosRealizados
            );
            console.log('Resultados del último intento cargados:', resultadoData);
            setResultado(resultadoData);
          } catch (error) {
            console.error('Error al cargar resultados del último intento:', error);
            // No mostrar toast aquí para evitar spam
          }
        }

        // Si hay un intento en progreso, cargar el estado
        if (evaluacionEstudianteData.ultimoIntento?.estado === 'En Progreso') {
          console.log('🔄 Detectada evaluación en progreso - reanudando...');
          setReanudandoEvaluacion(true);

          try {
            const sessionInfo = await ensureEvaluacionSession(evaluacionId);
            const evaluacionRealizar = await evaluacionService.obtenerEvaluacionParaRealizar(evaluacionId, sessionInfo.token);

            setNumeroIntento(sessionInfo.numeroIntento ?? evaluacionEstudianteData.intentosRealizados + 1);
            sincronizarEvaluacionEnCurso(evaluacionRealizar);

            const fechaInicioIntento = sessionInfo.fechaInicio
              ? new Date(sessionInfo.fechaInicio)
              : evaluacionRealizar.fechaInicio
                ? new Date(evaluacionRealizar.fechaInicio)
                : new Date(evaluacionEstudianteData.ultimoIntento.fechaInicio);

            const tiempoLimiteBase = sessionInfo.tiempoLimiteMins
              ?? evaluacionRealizar.tiempoLimiteMins
              ?? evaluacionData.tiempoLimiteMins;

            const tiempoLimiteSegundos = (tiempoLimiteBase || evaluacionData.tiempoLimiteMins) * 60;
            const tiempoTranscurrido = differenceInSeconds(new Date(), fechaInicioIntento);
            const tiempoRestanteCalculado = Math.max(0, tiempoLimiteSegundos - tiempoTranscurrido);

            if (tiempoRestanteCalculado > 0) {
              setEvaluacionIniciada(true);
              setTiempoRestante(tiempoRestanteCalculado);

              const progresoGuardado = cargarProgreso();
              if (progresoGuardado) {
                setPreguntaActual(progresoGuardado.preguntaActual);
                setRespuestas(progresoGuardado.respuestas);
                console.log(`📚 Progreso cargado - Pregunta: ${progresoGuardado.preguntaActual}, Respuestas: ${Object.keys(progresoGuardado.respuestas).length}`);
              }

              toast({
                title: "Evaluación reanudada",
                description: `Has reanudado tu evaluación. Te quedan ${Math.floor(tiempoRestanteCalculado / 60)} minutos y ${tiempoRestanteCalculado % 60} segundos.`,
                duration: 5000,
              });

              console.log(`✅ Evaluación reanudada - Tiempo restante: ${tiempoRestanteCalculado} segundos`);
            } else {
              console.log('⏰ Tiempo agotado al reanudar - finalizando evaluación');
              toast({
                title: "Tiempo agotado",
                description: "El tiempo de tu evaluación se agotó. Se enviarán las respuestas automáticamente.",
                variant: "destructive",
              });

              setTimeout(() => {
                router.push(`/student/evaluaciones/${evaluacionId}/resultado`);
              }, 3000);
            }
          } catch (err) {
            console.error('Error al reanudar evaluación:', err);
            toast({
              title: "Error",
              description: "No se pudo reanudar la evaluación en progreso. Intenta iniciar un nuevo intento.",
              variant: "destructive",
            });
          } finally {
            setReanudandoEvaluacion(false);
          }
        }
      } else {
        // Si no hay registro de esta evaluación para el estudiante, inicializar valores por defecto
        setEvaluacionEstudiante({
          id: evaluacionId,
          titulo: evaluacionData.titulo,
          descripcion: evaluacionData.descripcion,
          cursoId: evaluacionData.cursoId,
          cursoNombre: evaluacionData.curso?.nombre || '',
          docenteNombre: '', // No disponible en EvaluacionDTO básico
          fechaCreacion: evaluacionData.fechaCreacion,
          fechaInicio: evaluacionData.fechaInicio,
          fechaFin: evaluacionData.fechaFin,
          tiempoLimiteMins: evaluacionData.tiempoLimiteMins,
          activa: evaluacionData.activa,
          intentosMaximos: evaluacionData.intentosMaximos,
          totalPreguntas: 0, // No disponible en EvaluacionDTO básico
          intentosRealizados: 0,
          puedeRealizarEvaluacion: true,
          yaCompletada: false,
          estaEnTiempo: true,
          curso: evaluacionData.curso || { nombre: '', nrc: '' },
          ultimoIntento: undefined
        });
        setNumeroIntento(1);
      }
    } catch (error) {
      console.error('Error al cargar evaluación:', error);
      toast({
        title: "Error",
        description: "Error al cargar la evaluación",
        variant: "destructive",
      });
      router.push('/student/evaluaciones');
    } finally {
      setLoading(false);
    }
  }, [cargarProgreso, evaluacionId, resultado, router, sincronizarEvaluacionEnCurso]);

  useEffect(() => {
    cargarEvaluacion();
  }, [cargarEvaluacion]);

  const puedeRealizarEvaluacion = (): boolean => {
    if (!evaluacionEstudiante) return false;

    const ahora = new Date();
    const fechaInicio = evaluacionEstudiante.fechaInicio ? new Date(evaluacionEstudiante.fechaInicio) : null;
    const fechaFin = evaluacionEstudiante.fechaFin ? new Date(evaluacionEstudiante.fechaFin) : null;

    if (!evaluacionEstudiante.activa) return false;
    if (fechaInicio && ahora < fechaInicio) return false;
    if (fechaFin && ahora > fechaFin) return false;
    if (evaluacionEstudiante.intentosRealizados >= evaluacionEstudiante.intentosMaximos) return false;

    return true;
  };

  const handleIniciarEvaluacion = async () => {
    if (!puedeRealizarEvaluacion()) {
      toast({
        title: "Error",
        description: "No puedes realizar esta evaluación en este momento",
        variant: "destructive",
      });
      return;
    }

    try {
      setIniciando(true);
      setErrorLimiteIntentos(false); // Resetear el error
      limpiarProgreso();

      const sessionInfo = await ensureEvaluacionSession(evaluacionId);
      if (!sessionInfo?.token) {
        throw new Error('No se pudo obtener una sesión válida para la evaluación');
      }

      const evaluacionRealizar = await evaluacionService.obtenerEvaluacionParaRealizar(evaluacionId, sessionInfo.token);

      setNumeroIntento(sessionInfo.numeroIntento ?? (evaluacionEstudiante?.intentosRealizados ?? 0) + 1);
      sincronizarEvaluacionEnCurso(evaluacionRealizar);

      const fechaInicioIntento = sessionInfo.fechaInicio
        ? new Date(sessionInfo.fechaInicio)
        : new Date(evaluacionRealizar.fechaInicio);

      const tiempoLimiteBase = sessionInfo.tiempoLimiteMins
        ?? evaluacionRealizar.tiempoLimiteMins
        ?? evaluacion?.tiempoLimiteMins
        ?? evaluacionEstudiante?.tiempoLimiteMins
        ?? 0;

      const tiempoLimiteSegundos = tiempoLimiteBase * 60;
      const tiempoTranscurrido = differenceInSeconds(new Date(), fechaInicioIntento);
      const tiempoInicial = Math.max(0, tiempoLimiteSegundos - tiempoTranscurrido);

      setEvaluacionIniciada(true);
      setTiempoRestante(tiempoInicial);
      setPreguntaActual(0);
      setRespuestas({});

      // Guardar el token de sesión (ensureEvaluacionSession ya lo hace, pero reforzamos)
      sessionStorage.setItem('evaluacion_token', sessionInfo.token);

      setEvaluacionEstudiante(prev => prev ? ({
        ...prev,
        ultimoIntento: {
          fechaInicio: evaluacionRealizar.fechaInicio,
          estado: 'En Progreso'
        }
      }) : prev);

      toast({
        title: "Evaluación iniciada",
        description: `Tienes ${tiempoLimiteBase} minutos para completarla`,
      });
    } catch (error) {
      console.error('Error al iniciar evaluación:', error);

      const mensajeError = obtenerMensajeError(error, "Error al iniciar la evaluación");
      const codigoError = (typeof error === 'object' && error !== null && 'codigo' in error)
        ? Number((error as { codigo?: unknown }).codigo)
        : undefined;

      if (mensajeError.toLowerCase().includes('máximo de intentos') || codigoError === 400) {
        setErrorLimiteIntentos(true);
        toast({
          title: "Límite de intentos alcanzado",
          description: "Has alcanzado el número máximo de intentos permitidos para esta evaluación",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: mensajeError,
          variant: "destructive",
        });
      }
    } finally {
      setIniciando(false);
    }
  };

  const handleRespuesta = (preguntaId: number, opcionId: number) => {
    setRespuestas(prev => ({
      ...prev,
      [preguntaId]: opcionId
    }));
  };

  const handleSubmitEvaluacion = useCallback(async (automatico = false) => {
    try {
      setEnviando(true);

      const respuestasArray: RespuestaUsuarioDTO[] = Object.entries(respuestas).map(([preguntaId, opcionId]) => ({
        evaluacionId,
        preguntaId: parseInt(preguntaId),
        opcionId
      }));

      const dto: SubmitEvaluacionDTO = {
        evaluacionId,
        respuestas: respuestasArray
      };

      // Obtener el token de la sesión
    const token = sessionStorage.getItem('evaluacion_token') || '';
    await evaluacionService.submitEvaluacion(evaluacionId, dto, token);

      toast({
        title: automatico ? "Tiempo agotado" : "Evaluación enviada",
        description: automatico
          ? "La evaluación se envió automáticamente al agotarse el tiempo"
          : "Tu evaluación ha sido enviada correctamente",
      });

      // En lugar de recargar, actualizar el estado localmente
      try {
        // Obtener los resultados de la evaluación enviada
        const resultadoData = await evaluacionService.obtenerResultadosEvaluacion(
          evaluacionId,
          (evaluacionEstudiante?.intentosRealizados || 0) + 1 // El intento que acabamos de completar
        );

        // Actualizar el estado para mostrar resultados
        setResultado(resultadoData);

        // Actualizar el estado de la evaluación estudiante
        setEvaluacionEstudiante(prev => {
          if (!prev) return prev;

          const ultimoIntentoActualizado = prev.ultimoIntento
            ? {
                ...prev.ultimoIntento,
                estado: 'Completado' as const,
                fechaFin: new Date().toISOString()
              }
            : {
                fechaInicio: new Date().toISOString(),
                estado: 'Completado' as const,
                fechaFin: new Date().toISOString()
              };

          return {
            ...prev,
            yaCompletada: true,
            intentosRealizados: prev.intentosRealizados + 1,
            ultimoIntento: ultimoIntentoActualizado
          };
        });

        // Limpiar el token de sesión
        sessionStorage.removeItem('evaluacion_token');
    // Limpiar la key por-evaluación también
    try { sessionStorage.removeItem(`evaluacion_session_${evaluacionId}`); } catch {}

        // Limpiar el progreso guardado en localStorage
        limpiarProgreso();

      } catch (error) {
        console.error('Error al cargar resultados después del envío:', error);
        // Si falla la carga de resultados, recargar como fallback
        window.location.reload();
      }
    } catch (error) {
      console.error('Error al enviar evaluación:', error);
      toast({
        title: "Error",
        description: obtenerMensajeError(error, "Error al enviar la evaluación"),
        variant: "destructive",
      });
    } finally {
      setEnviando(false);
    }
  }, [evaluacionEstudiante, evaluacionId, limpiarProgreso, obtenerMensajeError, respuestas]);

  const handleSubmitAutomatico = useCallback(async () => {
    if (enviando) return;
    await handleSubmitEvaluacion(true);
  }, [enviando, handleSubmitEvaluacion]);

  // Timer para el tiempo restante
  useEffect(() => {
    if (!evaluacionIniciada || tiempoRestante <= 0) return;

    const timer = setInterval(() => {
      setTiempoRestante(prev => {
        if (prev <= 1) {
          // Tiempo agotado - enviar automáticamente
          handleSubmitAutomatico();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [evaluacionIniciada, handleSubmitAutomatico, tiempoRestante]);

  // Llamar al endpoint de abandono en el backend
  const callAbandonEndpoint = useCallback(async (signal?: AbortSignal) => {
    try {
      const token = sessionStorage.getItem('evaluacion_token') || '';
      if (!token) return;
      const url = `/api/estudiante/evaluaciones/${evaluacionId}/abandonar?token=${encodeURIComponent(token)}`;
      await fetch(url, { method: 'POST', signal, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
      // no romper la UX por errores al notificar abandono
      console.debug('Error notificando abandono:', error);
    }
  }, [evaluacionId]);

  // Registrar handlers para beforeunload y visibilitychange cuando hay una sesión activa
  useEffect(() => {
    if (!evaluacionIniciada) return;

    const onBeforeUnload = () => {
      // Intenta notificar al backend (sin bloquear el cierre). navigator.sendBeacon could be used but we keep simple fetch fallback.
      try {
        // Use navigator.sendBeacon when available for synchronous background send
        const token = sessionStorage.getItem('evaluacion_token') || '';
        if (token) {
          const url = `/api/estudiante/evaluaciones/${evaluacionId}/abandonar?token=${encodeURIComponent(token)}`;
          if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
            navigator.sendBeacon(url);
          } else {
            // Best-effort: fire and forget
            void callAbandonEndpoint();
          }
        }
      } catch {
        // ignore
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // When tab is hidden, mark as abandoned (best-effort)
        callAbandonEndpoint();
        try { sessionStorage.removeItem(`evaluacion_session_${evaluacionId}`); } catch {}
      }
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [callAbandonEndpoint, evaluacionId, evaluacionIniciada]);

  const formatTiempo = (segundos: number): string => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;

    if (horas > 0) {
      return `${horas}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
    }
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  const getColorTiempo = (segundos: number): string => {
    const tiempoLimiteTotal = (evaluacionEnCurso?.tiempoLimiteMins ?? evaluacion?.tiempoLimiteMins ?? 1) * 60;
    const porcentajeRestante = tiempoLimiteTotal > 0 ? segundos / tiempoLimiteTotal : 0;
    if (porcentajeRestante <= 0.1) return 'text-unab-red-600';
    if (porcentajeRestante <= 0.25) return 'text-orange-600';
    return 'text-green-600';
  };

  const getProgresoPorcentaje = (): number => {
    const totalPreguntas = evaluacionEnCurso?.preguntas?.length ?? evaluacion?.preguntas?.length;
    if (!totalPreguntas || totalPreguntas === 0) return 0;
    return (Object.keys(respuestas).length / totalPreguntas) * 100;
  };

  const preguntasPorSesion = evaluacionEstudiante?.preguntasPorSesionLaboratorio ?? 0;
  const totalPreguntasDisponibles = evaluacion?.totalPreguntas
    ?? evaluacion?.preguntas?.length
    ?? evaluacionEstudiante?.totalPreguntas
    ?? 0;
  const totalPreguntasEvaluacion = evaluacionEnCurso?.preguntas?.length
    ?? (preguntasPorSesion > 0 ? preguntasPorSesion : totalPreguntasDisponibles);
  const preguntasParaNavegacion = evaluacionEnCurso?.preguntas ?? evaluacion?.preguntas ?? [];
  const intentoActual = numeroIntento || ((evaluacionEstudiante?.intentosRealizados ?? 0) + 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-unab-navy mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando evaluación...</p>
        </div>
      </div>
    );
  }

  if (!evaluacion || !evaluacionEstudiante) {
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

  // Si hay resultados cargados, mostrarlos (independientemente del estado yaCompletada)
  if (resultado) {
    return <ResultadoEvaluacionComponent evaluacionEstudiante={evaluacionEstudiante} resultado={resultado} />;
  }

  if (!evaluacionIniciada) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/student/evaluaciones">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{evaluacion.titulo}</CardTitle>
            <CardDescription>{evaluacion.descripcion}</CardDescription>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{evaluacionEstudiante.curso.nombre} - {evaluacionEstudiante.curso.nrc}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Tiempo límite:</span>
                </div>
                <p className="text-sm text-muted-foreground">{evaluacion.tiempoLimiteMins} minutos</p>
              </div>
              <div className="flex items-center gap-2">
                <Circle className="h-4 w-4" />
                <span className="font-medium">Preguntas: <span className="text-sm font-normal text-muted-foreground">{totalPreguntasEvaluacion}</span></span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">Intentos:</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {intentoActual} de {evaluacionEstudiante.intentosMaximos}
                </p>
              </div>
            </div>

            {evaluacion.fechaInicio && (
              <div className="p-4 bg-unab-navy-50 rounded-lg">
                <p className="text-sm">
                  <strong>Fecha de inicio:</strong> {format(new Date(evaluacion.fechaInicio), 'dd/MM/yyyy HH:mm', { locale: es })}
                </p>
                {evaluacion.fechaFin && (
                  <p className="text-sm">
                    <strong>Fecha límite:</strong> {format(new Date(evaluacion.fechaFin), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </p>
                )}
              </div>
            )}

            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Instrucciones importantes:</h4>
                  <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                    <li>• Una vez iniciada, no podrás pausar la evaluación</li>
                    <li>• Asegúrate de tener conexión estable a internet</li>
                    <li>• Si se agota el tiempo, se enviará automáticamente</li>
                    <li>• Puedes navegar entre preguntas antes de enviar</li>
                  </ul>
                </div>
              </div>
            </div>

            {errorLimiteIntentos && (
              <div className="p-4 bg-unab-red-50 border border-unab-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-unab-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-unab-red-800">Límite de intentos alcanzado</h4>
                    <p className="mt-1 text-sm text-unab-red-700">
                      Has alcanzado el número máximo de intentos ({evaluacionEstudiante.intentosMaximos})
                      para esta evaluación. No puedes realizar más intentos.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handleIniciarEvaluacion}
                disabled={!puedeRealizarEvaluacion() || iniciando || errorLimiteIntentos}
              >
                {iniciando ? 'Iniciando...' : 'Iniciar Evaluación'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const preguntaActualData = evaluacionEnCurso?.preguntas?.[preguntaActual] ?? evaluacion.preguntas?.[preguntaActual];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Indicador de reanudación */}
      {reanudandoEvaluacion && (
        <Alert className="border-blue-200 bg-blue-50">
          <RotateCcw className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Reanudando evaluación en progreso...
          </AlertDescription>
        </Alert>
      )}

      {/* Header con tiempo y progreso */}
      <div className="bg-white border rounded-lg p-4 sticky top-0 z-10 shadow-sm">
        {/* Advertencia de restricciones */}
        <Alert className="mb-4 border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 text-sm">
            Durante la evaluación: click derecho bloqueado, copiar/pegar deshabilitado, y herramientas de desarrollo restringidas.
            Si cierras la pestaña, podrás reanudar mientras tengas tiempo restante.
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{evaluacion.titulo}</h1>
            <p className="text-sm text-muted-foreground">
              Pregunta {preguntaActual + 1} de {totalPreguntasEvaluacion}
            </p>
            <p className="text-xs text-muted-foreground">
              Intento #{intentoActual} de {evaluacionEstudiante.intentosMaximos}
            </p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${getColorTiempo(tiempoRestante)}`}>
              {formatTiempo(tiempoRestante)}
            </div>
            <p className="text-sm text-muted-foreground">tiempo restante</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progreso de respuestas</span>
            <span>{Object.keys(respuestas).length}/{totalPreguntasEvaluacion}</span>
          </div>
          <Progress value={getProgresoPorcentaje()} className="h-2" />
        </div>
      </div>

      {/* Pregunta actual */}
      {preguntaActualData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Pregunta {preguntaActualData.orden}
              </CardTitle>
              <Badge variant="secondary">{preguntaActualData.puntos} pts</Badge>
            </div>
            <CardDescription className="text-base mt-2">
              {preguntaActualData.texto}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={respuestas[preguntaActualData.id]?.toString() || ''}
              onValueChange={(value) => handleRespuesta(preguntaActualData.id, parseInt(value))}
            >
              <div className="space-y-3">
                {preguntaActualData.opciones.map((opcion) => (
                  <div key={opcion.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value={opcion.id.toString()} id={`opcion-${opcion.id}`} />
                    <Label htmlFor={`opcion-${opcion.id}`} className="flex-1 cursor-pointer">
                      {opcion.texto}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Navegación */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setPreguntaActual(prev => Math.max(0, prev - 1))}
          disabled={preguntaActual === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>

        <div className="flex gap-2">
          {preguntasParaNavegacion.map((pregunta, index) => (
            <Button
              key={index}
              variant={index === preguntaActual ? "default" : "outline"}
              size="sm"
              onClick={() => setPreguntaActual(index)}
              className={`w-10 h-10 ${
                respuestas[pregunta.id] ? 'bg-green-100 border-green-300' : ''
              }`}
            >
              {index + 1}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          {preguntaActual < totalPreguntasEvaluacion - 1 ? (
            <Button
              onClick={() => setPreguntaActual(prev => prev + 1)}
            >
              Siguiente
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Send className="h-4 w-4 mr-2" />
                  Finalizar Evaluación
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Finalizar evaluación?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Has respondido {Object.keys(respuestas).length} de {totalPreguntasEvaluacion} preguntas.
                    Una vez enviada, no podrás realizar cambios.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Revisar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleSubmitEvaluacion()}
                    disabled={enviando}
                  >
                    {enviando ? 'Enviando...' : 'Enviar Evaluación'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente integrado para mostrar resultados
function ResultadoEvaluacionComponent({
  evaluacionEstudiante,
  resultado
}: {
  evaluacionEstudiante: EvaluacionEstudianteDTO;
  resultado: ResultadoEvaluacionDTO;
}) {
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

    const inicio = resultado.fechaInicio ? new Date(resultado.fechaInicio) : null;
    const fin = resultado.fechaFin ? new Date(resultado.fechaFin) : null;

    if (!inicio || Number.isNaN(inicio.getTime()) || !fin || Number.isNaN(fin.getTime())) {
      return '0 min';
    }

    const diferenciaMs = Math.max(0, fin.getTime() - inicio.getTime());
    const minutosTotales = diferenciaMs / (1000 * 60);

    if (!Number.isFinite(minutosTotales) || minutosTotales <= 0) {
      return '0 min';
    }

    const minutos = Math.floor(minutosTotales);

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
              {resultado.detalleRespuestas.map((respuesta, index) => {
                const retroalimentacion = respuesta.retroalimentacion
                  ?? respuesta.feedback
                  ?? respuesta.comentario
                  ?? null;
                const puntosLabel = respuesta.esCorrecta
                  ? `+${respuesta.puntosObtenidos} pts`
                  : `${respuesta.puntosObtenidos} pts`;

                return (
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
                          {puntosLabel}
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
                    {!respuesta.esCorrecta && retroalimentacion && (
                      <p className="mt-2 text-sm text-red-600">
                        Retroalimentación: {retroalimentacion}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acciones */}
      <div className="flex justify-center gap-4">
        {puedeReintentarEvaluacion() && (
          <Link href={`/student/evaluaciones/${evaluacionEstudiante.id}`}>
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
