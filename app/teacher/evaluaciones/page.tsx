"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { Sidebar } from '@/components/sidebar';
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
import { Plus, Edit, Trash2, Clock, Users, FileText, Download, Loader2, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { EvaluacionDTO, EvaluacionCreacionDTO, EvaluacionEdicionDTO, PreguntaCreacionDTO, OpcionCreacionDTO } from '@/DTOs/EvaluacionDTOs';
import { evaluacionService } from '@/app/lib/evaluacion-service';
import { cursoService } from '@/app/lib/services/curso-service';
import Link from 'next/link';

type PreguntaFormulario = PreguntaCreacionDTO & {
  categoria?: string | null;
  retroalimentacion?: string | null;
};

type EvaluacionFormData = Omit<EvaluacionCreacionDTO, "preguntas"> & {
  preguntas: PreguntaFormulario[];
};

interface Curso {
  id: number;
  nombre: string;
  nrc: string;
}

export default function EvaluacionesPage() {
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionDTO[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [modulos, setModulos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingModulos, setLoadingModulos] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvaluacion, setEditingEvaluacion] = useState<EvaluacionDTO | null>(null);
  const [cursoSeleccionado, setCursoSeleccionado] = useState<string>('');
  const [moduloSeleccionado, setModuloSeleccionado] = useState<string>('');

  const OPCION_LETRAS = ["A", "B", "C", "D"] as const;
  const [evaluacionImportando, setEvaluacionImportando] = useState(false);

  // Estado del formulario
  const evaluacionImportFileRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<EvaluacionFormData>({
    titulo: '',
    descripcion: '',
    cursoId: 0,
    fechaInicio: '',
    fechaFin: '',
    tiempoLimiteMins: 60,
    intentosMaximos: 1,
  esLaboratorio3DLab: false,
  preguntasMinimasLaboratorio: 1,
  preguntasPorSesionLaboratorio: 0,
    preguntas: []
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  // Efecto para cargar módulos cuando se selecciona un curso en el formulario
  useEffect(() => {
    const fetchModulos = async () => {
      if (formData.cursoId && formData.cursoId > 0) {
        try {
          setLoadingModulos(true);
          const modulosData = await cursoService.obtenerModulosPorCurso(formData.cursoId);
          setModulos(modulosData);
        } catch (error) {
          console.error('Error al cargar módulos:', error);
          toast({
            title: "Error",
            description: "No se pudieron cargar los módulos",
            variant: "destructive",
          });
          setModulos([]);
        } finally {
          setLoadingModulos(false);
        }
      } else {
        setModulos([]);
        setModuloSeleccionado('');
      }
    };

    fetchModulos();
  }, [formData.cursoId]);

  const esLaboratorioSeleccionado = formData.esLaboratorio3DLab ?? false;

  useEffect(() => {
    setFormData((prev) => {
      const esLab = prev.esLaboratorio3DLab ?? false;
      const configuradas = prev.preguntasPorSesionLaboratorio ?? 0;

      if (esLab && configuradas <= 0) {
        return {
          ...prev,
          preguntasPorSesionLaboratorio: 1,
        };
      }

      if (!esLab && configuradas < 0) {
        return {
          ...prev,
          preguntasPorSesionLaboratorio: 0,
        };
      }

      return prev;
    });
  }, [esLaboratorioSeleccionado]);

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
      console.log('🔍 Cargando evaluaciones para curso:', cursoId);
      let evaluacionesData: any[] = [];
      try {
        evaluacionesData = await evaluacionService.obtenerEvaluacionesPorCurso(cursoId);
        console.log('📊 Evaluaciones obtenidas del servicio:', evaluacionesData);
      } catch (error) {
        console.warn('⚠️ Servicio de evaluaciones no disponible, usando datos mock:', error);
        // Usar datos mock mientras el servicio no esté disponible
        evaluacionesData = [];
      }
      
      // Asegurar que tenemos un array
      if (!evaluacionesData) {
        console.warn('⚠️ evaluacionesData es null/undefined, usando array vacío');
        evaluacionesData = [];
      }
      
      if (!Array.isArray(evaluacionesData)) {
        console.warn('⚠️ evaluacionesData no es un array, convirtiendo a array:', evaluacionesData);
        evaluacionesData = [];
      }
      
      console.log('📋 Estableciendo evaluaciones en el estado:', evaluacionesData);
      setEvaluaciones(evaluacionesData);
      console.log('Estado de evaluaciones actualizado');
    } catch (error) {
      console.error('❌ Error al cargar evaluaciones:', error);
      // En caso de error, establecer array vacío
      setEvaluaciones([]);
      toast({
        title: "Error",
        description: "Error al cargar las evaluaciones",
        variant: "destructive",
      });
    }
  };

  const manejarImportacionPreguntasExcel = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setEvaluacionImportando(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      if (!worksheet) {
        toast({ title: 'Error', description: 'El archivo Excel no contiene hojas válidas.', variant: 'destructive' });
        return;
      }

      const filas = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

      if (filas.length === 0) {
        toast({ title: 'Sin datos', description: 'La plantilla no contiene filas para importar.' });
        return;
      }

      const errores: string[] = [];
      const nuevasPreguntas: PreguntaFormulario[] = [];

      const obtenerValor = (fila: Record<string, unknown>, key: string) => {
        const entrada = Object.entries(fila).find(([columna]) => columna.trim().toLowerCase() === key.toLowerCase());
        return entrada ? String(entrada[1] ?? '').trim() : '';
      };

      filas.forEach((fila, index) => {
        const numeroFila = index + 2; // considerando encabezado en la fila 1
        const enunciado = obtenerValor(fila, 'Enunciado');
        const categoria = obtenerValor(fila, 'Categoria');
        const puntosTexto = obtenerValor(fila, 'Puntos');
        const opcionA = obtenerValor(fila, 'OpcionA');
        const opcionB = obtenerValor(fila, 'OpcionB');
        const opcionC = obtenerValor(fila, 'OpcionC');
        const opcionD = obtenerValor(fila, 'OpcionD');
        const respuestaCorrecta = obtenerValor(fila, 'RespuestaCorrecta').toUpperCase();
        const retroalimentacion = obtenerValor(fila, 'Retroalimentacion');

        const erroresFila: string[] = [];

        if (!enunciado) {
          erroresFila.push(`Fila ${numeroFila}: El enunciado es obligatorio.`);
        }

        const puntos = parseInt(puntosTexto, 10);
        if (Number.isNaN(puntos) || puntos < 1 || puntos > 100) {
          erroresFila.push(`Fila ${numeroFila}: Los puntos deben ser un número entre 1 y 100.`);
        }

        const opcionesTexto: Record<(typeof OPCION_LETRAS)[number], string> = {
          A: opcionA,
          B: opcionB,
          C: opcionC,
          D: opcionD,
        };
        if (!opcionA || !opcionB) {
          erroresFila.push(`Fila ${numeroFila}: Debe completar al menos las opciones A y B.`);
        }

        if (!['A', 'B', 'C', 'D'].includes(respuestaCorrecta)) {
          erroresFila.push(`Fila ${numeroFila}: La respuesta correcta debe ser A, B, C o D.`);
        } else {
          const letraCorrecta = respuestaCorrecta as (typeof OPCION_LETRAS)[number];
          if (!opcionesTexto[letraCorrecta]) {
            erroresFila.push(`Fila ${numeroFila}: La opción ${respuestaCorrecta} marcada como correcta está vacía.`);
          }
        }

        if (retroalimentacion && retroalimentacion.length > 2000) {
          erroresFila.push(`Fila ${numeroFila}: La retroalimentación no puede superar los 2000 caracteres.`);
        }

        if (erroresFila.length > 0) {
          errores.push(...erroresFila);
          return;
        }

  const opcionesFiltradas = OPCION_LETRAS.reduce<OpcionCreacionDTO[]>((lista, letra) => {
          const texto = opcionesTexto[letra];
          if (!texto) return lista;
          return [
            ...lista,
            {
              texto,
              esCorrecta: respuestaCorrecta === letra,
              orden: lista.length + 1,
            },
          ];
        }, []);

        if (opcionesFiltradas.length < 2) {
          errores.push(`Fila ${numeroFila}: No se generaron suficientes opciones válidas.`);
          return;
        }

        nuevasPreguntas.push({
          texto: enunciado,
          puntos: puntos,
          orden: 0, // se recalculará al insertar
          categoria: categoria || '',
          retroalimentacion: retroalimentacion || '',
          opciones: opcionesFiltradas,
        });
      });

      if (errores.length > 0) {
        toast({
          title: 'Errores en la importación',
          description: `${errores.length} fila(s) contienen errores. Corrige el archivo e inténtalo nuevamente.`,
          variant: 'destructive',
        });
        console.warn('Errores de importación de preguntas:', errores);
      }

      if (nuevasPreguntas.length === 0) {
        if (errores.length === 0) {
          toast({ title: 'Sin preguntas válidas', description: 'No se encontraron preguntas para importar.' });
        }
        return;
      }

      setFormData((prev) => {
        const preguntasExistentes = [...prev.preguntas, ...nuevasPreguntas];
        const preguntasOrdenadas = preguntasExistentes.map((pregunta, index) => ({
          ...pregunta,
          orden: index + 1,
        }));

        return {
          ...prev,
          preguntas: preguntasOrdenadas,
        };
      });

      toast({
        title: 'Preguntas importadas',
        description: `${nuevasPreguntas.length} pregunta(s) agregadas desde Excel.`,
      });
    } catch (error) {
      console.error('Error al importar preguntas para la evaluación:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo procesar el archivo',
        variant: 'destructive',
      });
    } finally {
      setEvaluacionImportando(false);
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
      // Default to currently selected course in the page if available
      cursoId: cursoSeleccionado ? parseInt(cursoSeleccionado) : 0,
      fechaInicio: '',
      fechaFin: '',
      tiempoLimiteMins: 60,
      intentosMaximos: 1,
  esLaboratorio3DLab: false,
  preguntasMinimasLaboratorio: 1,
  preguntasPorSesionLaboratorio: 0,
      preguntas: []
    });
    setEditingEvaluacion(null);
  };

  // Funciones para manejar preguntas
  const agregarPregunta = () => {
    const nuevaPregunta: PreguntaFormulario = {
      texto: '',
      orden: formData.preguntas.length + 1,
      puntos: 1,
      categoria: '',
      retroalimentacion: '',
      opciones: OPCION_LETRAS.map((_, index) => ({
        texto: '',
        esCorrecta: index === 0,
        orden: index + 1,
      })),
    };

    setFormData((prev) => ({
      ...prev,
      preguntas: [...prev.preguntas, nuevaPregunta],
    }));
  };

  const eliminarPregunta = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      preguntas: prev.preguntas
        .filter((_, i) => i !== index)
        .map((pregunta, idx) => ({ ...pregunta, orden: idx + 1 })),
    }));
  };

  const actualizarPregunta = (index: number, campo: keyof PreguntaFormulario, valor: any) => {
    setFormData(prev => ({
      ...prev,
      preguntas: prev.preguntas.map((pregunta, i) => 
        i === index ? { ...pregunta, [campo]: valor } : pregunta
      )
    }));
  };

  const agregarOpcion = (preguntaIndex: number) => {
    setFormData((prev) => {
      const preguntas = [...prev.preguntas];
      const pregunta = preguntas[preguntaIndex];
      if (!pregunta) return prev;

      if (pregunta.opciones.length >= OPCION_LETRAS.length) {
        toast({
          title: 'Límite de opciones',
          description: 'Las plantillas admiten un máximo de cuatro opciones (A-D).',
        });
        return prev;
      }

      const nuevaOpcion: OpcionCreacionDTO = {
        texto: '',
        esCorrecta: false,
        orden: pregunta.opciones.length + 1,
      };

      preguntas[preguntaIndex] = {
        ...pregunta,
        opciones: [...pregunta.opciones, nuevaOpcion],
      };

      return {
        ...prev,
        preguntas,
      };
    });
  };

  const eliminarOpcion = (preguntaIndex: number, opcionIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      preguntas: prev.preguntas.map((pregunta, i) =>
        i === preguntaIndex
          ? {
              ...pregunta,
              opciones: pregunta.opciones
                .filter((_, j) => j !== opcionIndex)
                .map((opcion, idx) => ({ ...opcion, orden: idx + 1 })),
            }
          : pregunta,
      ),
    }));
  };

  const actualizarOpcion = (preguntaIndex: number, opcionIndex: number, campo: keyof OpcionCreacionDTO, valor: any) => {
    setFormData(prev => ({
      ...prev,
      preguntas: prev.preguntas.map((pregunta, i) => 
        i === preguntaIndex 
          ? { 
              ...pregunta, 
              opciones: pregunta.opciones.map((opcion, j) => 
                j === opcionIndex ? { ...opcion, [campo]: valor } : opcion
              )
            }
          : pregunta
      )
    }));
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

    if (!formData.cursoId || formData.cursoId === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar un curso",
        variant: "destructive",
      });
      return;
    }

    if (formData.preguntas.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos una pregunta",
        variant: "destructive",
      });
      return;
    }

    const esLaboratorio = formData.esLaboratorio3DLab ?? false;
    const minimoBase = esLaboratorio ? 4 : 1;
    const minimoConfigurado = formData.preguntasMinimasLaboratorio ?? minimoBase;
    const minimoRequerido = Math.max(minimoBase, minimoConfigurado);
    const preguntasPorSesionConfiguradas = formData.preguntasPorSesionLaboratorio ?? 0;
    const preguntasPorSesionNormalizadas = esLaboratorio
      ? Math.max(1, preguntasPorSesionConfiguradas)
      : Math.max(0, preguntasPorSesionConfiguradas);

    if (formData.preguntas.length < minimoRequerido) {
      toast({
        title: "Configuración inválida",
        description: `Necesitas al menos ${minimoRequerido} preguntas disponibles para esta ${esLaboratorio ? 'experiencia 3DLAB' : 'evaluación'}.`,
        variant: "destructive",
      });
      return;
    }

    if (preguntasPorSesionNormalizadas <= 0 && esLaboratorio) {
      toast({
        title: "Configuración inválida",
        description: "Las experiencias 3DLAB requieren al menos una pregunta por sesión.",
        variant: "destructive",
      });
      return;
    }

    if (preguntasPorSesionNormalizadas > 0 && preguntasPorSesionNormalizadas > formData.preguntas.length) {
      toast({
        title: "Configuración inválida",
        description: `No puedes mostrar ${preguntasPorSesionNormalizadas} preguntas por intento si solo tienes ${formData.preguntas.length} disponibles.`,
        variant: "destructive",
      });
      return;
    }

    // Validar que todas las preguntas tengan texto y al menos una opción correcta
    for (let i = 0; i < formData.preguntas.length; i++) {
      const pregunta = formData.preguntas[i];
      
      if (!pregunta.texto.trim()) {
        toast({
          title: "Error",
          description: `La pregunta ${i + 1} debe tener texto`,
          variant: "destructive",
        });
        return;
      }

      if (pregunta.opciones.length < 2) {
        toast({
          title: "Error",
          description: `La pregunta ${i + 1} debe tener al menos 2 opciones`,
          variant: "destructive",
        });
        return;
      }

      if (pregunta.opciones.length > OPCION_LETRAS.length) {
        toast({
          title: "Error",
          description: `La pregunta ${i + 1} solo puede tener hasta ${OPCION_LETRAS.length} opciones (A-D)`,
          variant: "destructive",
        });
        return;
      }

      const tieneOpcionCorrecta = pregunta.opciones.some(opcion => opcion.esCorrecta);
      if (!tieneOpcionCorrecta) {
        toast({
          title: "Error",
          description: `La pregunta ${i + 1} debe tener al menos una opción correcta`,
          variant: "destructive",
        });
        return;
      }

      const opcionesVacias = pregunta.opciones.some(opcion => !opcion.texto.trim());
      if (opcionesVacias) {
        toast({
          title: "Error",
          description: `Todas las opciones de la pregunta ${i + 1} deben tener texto`,
          variant: "destructive",
        });
        return;
      }

      if (pregunta.retroalimentacion && pregunta.retroalimentacion.length > 2000) {
        toast({
          title: "Error",
          description: `La retroalimentación de la pregunta ${i + 1} supera el límite de 2000 caracteres`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      console.log('🚀 INICIANDO ENVÍO DE FORMULARIO');
      const preguntasPreparadas = formData.preguntas.map((pregunta, index) => ({
        texto: pregunta.texto,
        orden: index + 1,
        puntos: pregunta.puntos,
        opciones: pregunta.opciones.map((opcion, opcionIndex) => ({
          texto: opcion.texto,
          esCorrecta: opcion.esCorrecta,
          orden: opcionIndex + 1,
        })),
      }));

      const dataToSubmit: EvaluacionCreacionDTO = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        cursoId: formData.cursoId,
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        tiempoLimiteMins: formData.tiempoLimiteMins,
        intentosMaximos: formData.intentosMaximos,
        esLaboratorio3DLab: esLaboratorio,
  preguntasMinimasLaboratorio: minimoRequerido,
  preguntasPorSesionLaboratorio: preguntasPorSesionNormalizadas,
        preguntas: preguntasPreparadas,
      };
      console.log('📝 Datos a enviar:', dataToSubmit);
      console.log('👤 Editando evaluación:', editingEvaluacion ? 'SÍ' : 'NO');

      if (editingEvaluacion) {
        console.log('✏️ ACTUALIZANDO evaluación existente');
        const edicionData: EvaluacionEdicionDTO = {
          titulo: dataToSubmit.titulo,
          descripcion: dataToSubmit.descripcion,
          fechaInicio: dataToSubmit.fechaInicio,
          fechaFin: dataToSubmit.fechaFin,
          tiempoLimiteMins: dataToSubmit.tiempoLimiteMins,
          intentosMaximos: dataToSubmit.intentosMaximos,
          esLaboratorio3DLab: esLaboratorio,
          preguntasMinimasLaboratorio: minimoRequerido,
          preguntasPorSesionLaboratorio: preguntasPorSesionNormalizadas,
          activa: true
        };
        await evaluacionService.actualizarEvaluacion(editingEvaluacion.id, edicionData);
        console.log('Evaluación actualizada');
        toast({
          title: "Éxito",
          description: "Evaluación actualizada correctamente",
        });
      } else {
        console.log('➕ CREANDO nueva evaluación');
        const resultado = await evaluacionService.crearEvaluacion(dataToSubmit);
        console.log('Evaluación creada, resultado:', resultado);
        toast({
          title: "Éxito",
          description: "Evaluación creada correctamente",
        });
      }

      // Recargar las evaluaciones del curso
      console.log('🔄 Recargando evaluaciones del curso:', cursoSeleccionado);
      if (cursoSeleccionado) {
        // Pequeño delay para asegurar que la base de datos se actualizó
        setTimeout(async () => {
          await cargarEvaluacionesPorCurso(parseInt(cursoSeleccionado));
          console.log('Evaluaciones recargadas');
        }, 500);
      }
      
      console.log('🚪 Cerrando modal y reseteando formulario');
      setDialogOpen(false);
      resetForm();
      console.log('🎉 PROCESO COMPLETADO EXITOSAMENTE');
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
    const esLaboratorio = evaluacion.esLaboratorio3DLab ?? false;
    const minimoBase = esLaboratorio ? 4 : 1;
    const minimoConfigurado = evaluacion.preguntasMinimasLaboratorio ?? minimoBase;
    const preguntasMinimas = Math.max(minimoBase, minimoConfigurado);
    const preguntasPorSesionConfiguradas = evaluacion.preguntasPorSesionLaboratorio ?? 0;
    const preguntasPorSesion = esLaboratorio
      ? Math.max(1, preguntasPorSesionConfiguradas)
      : Math.max(0, preguntasPorSesionConfiguradas);

    setEditingEvaluacion(evaluacion);
    setFormData({
      titulo: evaluacion.titulo,
      descripcion: evaluacion.descripcion || '',
      cursoId: evaluacion.cursoId,
      fechaInicio: evaluacion.fechaInicio ? evaluacion.fechaInicio.split('T')[0] : '',
      fechaFin: evaluacion.fechaFin ? evaluacion.fechaFin.split('T')[0] : '',
      tiempoLimiteMins: evaluacion.tiempoLimiteMins,
      intentosMaximos: evaluacion.intentosMaximos,
      esLaboratorio3DLab: esLaboratorio,
      preguntasMinimasLaboratorio: preguntasMinimas,
      preguntasPorSesionLaboratorio: preguntasPorSesion,
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

  const handleDownloadExcel = async (evaluacionId: number, evaluacionTitulo: string) => {
    try {
      console.log('🔍 [Excel Download] Starting download for evaluation:', evaluacionId, evaluacionTitulo);
      console.log('📚 [Excel Download] Selected course:', cursoSeleccionado);
      console.log('📚 [Excel Download] Available courses:', cursos);

      if (!cursoSeleccionado) {
        console.log('❌ [Excel Download] No course selected');
        toast({
          title: "Error",
          description: "Debe seleccionar un curso primero",
          variant: "destructive",
        });
        return;
      }

      if (cursos.length === 0) {
        console.log('❌ [Excel Download] No courses available');
        toast({
          title: "Error",
          description: "No hay cursos disponibles",
          variant: "destructive",
        });
        return;
      }

      const cursoId = parseInt(cursoSeleccionado);
      console.log('🔢 [Excel Download] Parsed course ID:', cursoId);

      // Verificar que el curso existe en la lista
      const cursoExiste = cursos.find(c => c.id === cursoId);
      if (!cursoExiste) {
        console.log('❌ [Excel Download] Selected course not found in courses list');
        toast({
          title: "Error",
          description: "El curso seleccionado no es válido",
          variant: "destructive",
        });
        return;
      }

      // Obtener resultados de la evaluación específica usando el endpoint correcto
      console.log('📡 [Excel Download] Fetching evaluation results...');
      const resultadosEvaluacion = await evaluacionService.obtenerEstadisticasEvaluacion(evaluacionId);
      console.log('📊 [Excel Download] Evaluation results received:', resultadosEvaluacion);

      if (!resultadosEvaluacion || !Array.isArray(resultadosEvaluacion) || resultadosEvaluacion.length === 0) {
        console.log('⚠️ [Excel Download] No results found for this evaluation');
        toast({
          title: "Advertencia",
          description: "No hay resultados para esta evaluación",
          variant: "destructive",
        });
        return;
      }

      // Preparar datos para Excel
      const datosExcel = resultadosEvaluacion.map((resultado: any, index: number) => {
        console.log(`👤 [Excel Download] Processing student ${index + 1}:`, resultado.nombreCompleto || resultado.NombreCompleto);

        return {
          'RUT': resultado.usuarioRut || resultado.UsuarioRut || 'N/A',
          'Nombre': resultado.nombreCompleto || resultado.NombreCompleto || 'N/A',
          'Calificación': resultado.nota !== null && resultado.nota !== undefined ? resultado.nota : (resultado.Nota !== null && resultado.Nota !== undefined ? resultado.Nota : 'Pendiente'),
          'Porcentaje': resultado.porcentaje !== null && resultado.porcentaje !== undefined ? `${resultado.porcentaje}%` : (resultado.Porcentaje !== null && resultado.Porcentaje !== undefined ? `${resultado.Porcentaje}%` : 'N/A'),
          'Número de Intentos': resultado.intentos || resultado.Intentos || 0,
          'Fecha de Realización': resultado.fechaRealizacion ? format(new Date(resultado.fechaRealizacion), 'dd/MM/yyyy HH:mm', { locale: es }) : (resultado.FechaRealizacion ? format(new Date(resultado.FechaRealizacion), 'dd/MM/yyyy HH:mm', { locale: es }) : 'N/A'),
          'Estado': resultado.completada || resultado.Completada ? 'Completada' : 'Pendiente',
          'Correo': resultado.correo || resultado.Correo || 'N/A'
        };
      });

      console.log('📋 [Excel Download] Final Excel data:', datosExcel);
      console.log('📊 [Excel Download] Excel data length:', datosExcel.length);

      if (datosExcel.length === 0) {
        toast({
          title: "Error",
          description: "No se pudieron procesar los datos para el Excel",
          variant: "destructive",
        });
        return;
      }

      // Crear libro de Excel
      const ws = XLSX.utils.json_to_sheet(datosExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Resultados Evaluación');

      // Generar nombre del archivo con el título de la evaluación
      const tituloLimpio = evaluacionTitulo.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
      const fechaActual = format(new Date(), 'yyyy-MM-dd_HH-mm', { locale: es });
      const nombreArchivo = `resultados_${tituloLimpio}_${fechaActual}.xlsx`;

      // Descargar archivo
      XLSX.writeFile(wb, nombreArchivo);

      console.log('✅ [Excel Download] Excel file created successfully:', nombreArchivo);
      toast({
        title: "Éxito",
        description: "Archivo Excel descargado correctamente",
      });
    } catch (error) {
      console.error('❌ [Excel Download] Error:', error);
      toast({
        title: "Error",
        description: "Error al generar el archivo Excel",
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
    <div className="flex h-screen bg-unab-gray-50 dark:bg-unab-navy-dark overflow-x-hidden">
      <Sidebar role="teacher" />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64 w-full">
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 xl:p-8">
          <div className="space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2 truncate">Evaluaciones</h1>
                <p className="text-xs sm:text-sm lg:text-base text-unab-gray-600 dark:text-white line-clamp-2">
                  Gestiona las evaluaciones de tus cursos
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" asChild className="w-full sm:w-auto text-sm whitespace-nowrap">
                  <a href="/api/evaluaciones/plantilla" download className="flex items-center justify-center">
                    <Download className="h-4 w-4 mr-2 shrink-0" />
                    <span className="truncate">Plantilla Excel</span>
                  </a>
                </Button>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetForm} className="w-full sm:w-auto text-sm whitespace-nowrap">
                      <Plus className="h-4 w-4 mr-2 shrink-0" />
                      <span className="truncate">Nueva Evaluación</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
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
                          <Label htmlFor="curso">Curso *</Label>
                          <Select
                            value={formData.cursoId?.toString() || ''}
                            onValueChange={(value) => setFormData({ ...formData, cursoId: parseInt(value) })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un curso" />
                            </SelectTrigger>
                            <SelectContent>
                              {cursos.map((curso) => (
                                <SelectItem key={curso.id} value={curso.id.toString()}>
                                  {curso.nombre} (NRC: {curso.nrc})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="modulo">Módulo (opcional)</Label>
                          <Select
                            value={moduloSeleccionado}
                            onValueChange={setModuloSeleccionado}
                            disabled={loadingModulos || modulos.length === 0}
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  loadingModulos
                                    ? "Cargando módulos..."
                                    : modulos.length === 0
                                      ? "Sin módulos disponibles"
                                      : "Selecciona un módulo"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {modulos.map((modulo) => (
                                <SelectItem key={modulo.moduloId} value={modulo.moduloId.toString()}>
                                  {modulo.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                        <div className="col-span-2 grid gap-4 md:grid-cols-2">
                          <div>
                            <Label htmlFor="preguntasMinimas">Preguntas mínimas requeridas</Label>
                            <Input
                              id="preguntasMinimas"
                              type="number"
                              min={formData.esLaboratorio3DLab ? 4 : 1}
                              value={formData.preguntasMinimasLaboratorio}
                              onChange={(e) => {
                                const minimoBase = formData.esLaboratorio3DLab ? 4 : 1;
                                const valor = Number.parseInt(e.target.value, 10);
                                setFormData((prev) => ({
                                  ...prev,
                                  preguntasMinimasLaboratorio: Number.isNaN(valor)
                                    ? minimoBase
                                    : Math.max(minimoBase, valor),
                                }));
                              }}
                              placeholder={formData.esLaboratorio3DLab ? 'Ej: 12' : 'Ej: 1'}
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formData.esLaboratorio3DLab
                                ? '3DLAB recomienda al menos 12 preguntas para garantizar la aleatoriedad.'
                                : 'Define cuántas preguntas deben cargarse antes de habilitar la evaluación.'}
                            </p>
                          </div>
                          <div>
                            <Label htmlFor="preguntasPorSesion">Preguntas por sesión</Label>
                            <Input
                              id="preguntasPorSesion"
                              type="number"
                              min={formData.esLaboratorio3DLab ? 1 : 0}
                              value={formData.preguntasPorSesionLaboratorio}
                              onChange={(e) => {
                                const valor = Number.parseInt(e.target.value, 10);
                                setFormData((prev) => {
                                  const totalPreguntas = prev.preguntas.length;
                                  const esLab = prev.esLaboratorio3DLab ?? false;
                                  const minimo = esLab ? 1 : 0;
                                  const base = Number.isNaN(valor) ? minimo : Math.max(minimo, valor);
                                  const clamped = base > 0 && totalPreguntas > 0
                                    ? Math.min(base, totalPreguntas)
                                    : base;
                                  return {
                                    ...prev,
                                    preguntasPorSesionLaboratorio: clamped,
                                  };
                                });
                              }}
                              placeholder={formData.esLaboratorio3DLab ? 'Ej: 4' : 'Ej: 0 (todas)'}
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formData.esLaboratorio3DLab
                                ? 'Esta es la cantidad de preguntas que verá cada intento en 3DLAB.'
                                : 'Indica cuántas preguntas mostrará cada intento (usa 0 para todas).'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">Preguntas</h3>
                          <div className="flex items-center gap-2">
                            <input
                              ref={evaluacionImportFileRef}
                              type="file"
                              accept=".xlsx,.xls"
                              className="hidden"
                              onChange={manejarImportacionPreguntasExcel}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => evaluacionImportFileRef.current?.click()}
                              disabled={evaluacionImportando}
                            >
                              {evaluacionImportando ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="mr-2 h-4 w-4" />
                              )}
                              Importar preguntas (Excel)
                            </Button>
                            <Button type="button" onClick={agregarPregunta} size="sm">
                              <Plus className="h-4 w-4 mr-2" />
                              Agregar Pregunta
                            </Button>
                          </div>
                        </div>

                        {formData.preguntas.map((pregunta, preguntaIndex) => (
                          <div key={preguntaIndex} className="border rounded-lg p-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <h4 className="font-medium">Pregunta {preguntaIndex + 1}</h4>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => eliminarPregunta(preguntaIndex)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="col-span-2">
                                <Label>Texto de la pregunta *</Label>
                                <Textarea
                                  value={pregunta.texto}
                                  onChange={(e) => actualizarPregunta(preguntaIndex, 'texto', e.target.value)}
                                  placeholder="Escribe la pregunta aquí..."
                                  rows={2}
                                />
                              </div>
                              <div>
                                <Label>Categoría (opcional)</Label>
                                <Input
                                  value={pregunta.categoria ?? ''}
                                  onChange={(e) => actualizarPregunta(preguntaIndex, 'categoria', e.target.value)}
                                  placeholder="Ej: Álgebra"
                                />
                              </div>
                              <div>
                                <Label>Puntos</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={pregunta.puntos}
                                  onChange={(e) => actualizarPregunta(preguntaIndex, 'puntos', parseInt(e.target.value))}
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <Label>Opciones de respuesta</Label>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => agregarOpcion(preguntaIndex)}
                                  disabled={pregunta.opciones.length >= OPCION_LETRAS.length}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Opción
                                </Button>
                              </div>

                              {pregunta.opciones.map((opcion, opcionIndex) => (
                                <div key={opcionIndex} className="flex items-center gap-2 p-2 border rounded">
                                  <input
                                    type="radio"
                                    name={`pregunta-${preguntaIndex}`}
                                    checked={opcion.esCorrecta}
                                    onChange={() => {
                                      pregunta.opciones.forEach((_, i) => {
                                        actualizarOpcion(preguntaIndex, i, 'esCorrecta', i === opcionIndex)
                                      })
                                    }}
                                  />
                                  <span className="w-6 text-sm font-semibold">
                                    {(OPCION_LETRAS[opcionIndex] ?? String.fromCharCode(65 + opcionIndex))}.
                                  </span>
                                  <Input
                                    value={opcion.texto}
                                    onChange={(e) => actualizarOpcion(preguntaIndex, opcionIndex, 'texto', e.target.value)}
                                    placeholder={`Opción ${OPCION_LETRAS[opcionIndex] ?? opcionIndex + 1}`}
                                    className="flex-1"
                                  />
                                  {pregunta.opciones.length > 2 && (
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => eliminarOpcion(preguntaIndex, opcionIndex)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>

                            <div>
                              <Label>Retroalimentación (opcional)</Label>
                              <Textarea
                                value={pregunta.retroalimentacion ?? ''}
                                onChange={(e) => actualizarPregunta(preguntaIndex, 'retroalimentacion', e.target.value)}
                                placeholder="Comentario que verá el estudiante tras responder"
                                rows={2}
                              />
                            </div>
                          </div>
                        ))}

                        {formData.preguntas.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No hay preguntas agregadas</p>
                            <p className="text-sm">Agrega manualmente o importa desde Excel</p>
                            <div className="mt-4 flex items-center justify-center gap-2">
                              <Button type="button" onClick={agregarPregunta} size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Crear pregunta
                              </Button>
                            </div>
                          </div>
                        )}
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
            </div>

            {/* Selector de curso */}
      {cursos.length > 0 && (
        <div className="w-full max-w-full sm:max-w-md">
          <Label htmlFor="curso" className="text-xs sm:text-sm">Curso</Label>
          <Select value={cursoSeleccionado} onValueChange={handleCursoChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona un curso" />
            </SelectTrigger>
            <SelectContent className="max-w-[calc(100vw-2rem)]">
              {cursos.map((curso) => (
                <SelectItem key={curso.id} value={curso.id.toString()}>
                  <span className="truncate">{curso.nombre} - {curso.nrc}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Lista de evaluaciones */}
      <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 w-full">
        {evaluaciones && evaluaciones.length > 0 ? evaluaciones.map((evaluacion) => {
          const esLaboratorio = evaluacion.esLaboratorio3DLab ?? false;
          const preguntasMinimas = evaluacion.preguntasMinimasLaboratorio ?? 0;
          const preguntasPorSesion = evaluacion.preguntasPorSesionLaboratorio ?? 0;
          const usaTodasLasPreguntas = !esLaboratorio && preguntasPorSesion === 0;
          const mostrarResumen = preguntasMinimas > 0 || preguntasPorSesion > 0 || usaTodasLasPreguntas;
          const resumenClase = esLaboratorio
            ? "text-xs font-medium text-sky-600 dark:text-sky-300"
            : "text-xs text-muted-foreground";

          return (
            <Card key={evaluacion.id} className="hover:shadow-md transition-shadow flex flex-col overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1 min-w-0 overflow-hidden">
                    <CardTitle className="text-sm sm:text-base lg:text-lg line-clamp-2 break-words">{evaluacion.titulo}</CardTitle>
                    {evaluacion.descripcion && (
                      <CardDescription className="line-clamp-2 text-xs sm:text-sm">{evaluacion.descripcion}</CardDescription>
                    )}
                    {esLaboratorio && (
                      <Badge variant="outline" className="border-sky-500 text-sky-600 bg-sky-50 dark:border-sky-400 dark:text-sky-200 text-xs whitespace-nowrap">
                        Laboratorio 3DLAB
                      </Badge>
                    )}
                  </div>
                  <div className="shrink-0">{getEstadoBadge(evaluacion)}</div>
                </div>
              </CardHeader>
              <CardContent className="pt-3 flex-1 flex flex-col">
                <div className="space-y-2 text-xs sm:text-sm text-muted-foreground flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                    <span className="truncate">{evaluacion.tiempoLimiteMins} minutos</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                    <span className="truncate">{evaluacion.intentosMaximos} intento(s)</span>
                  </div>
                  {mostrarResumen && (
                    <div className={`${resumenClase} space-y-1`}>
                      {preguntasMinimas > 0 && (
                        <span className="block break-words">
                          {esLaboratorio
                            ? `Requiere al menos ${preguntasMinimas} preguntas disponibles en 3DLAB`
                            : `Requiere al menos ${preguntasMinimas} preguntas cargadas`}
                        </span>
                      )}
                      {preguntasPorSesion > 0 && (
                        <span className="block break-words">
                          {esLaboratorio
                            ? `Presenta ${preguntasPorSesion} pregunta(s) por sesión`
                            : `Mostrará ${preguntasPorSesion} pregunta(s) por intento`}
                        </span>
                      )}
                      {usaTodasLasPreguntas && (
                        <span className="block break-words">
                          Mostrará todas las preguntas disponibles en cada intento
                        </span>
                      )}
                    </div>
                  )}
                  {evaluacion.fechaInicio && (
                    <div className="text-xs truncate">
                      <strong className="font-medium">Inicio:</strong> {format(new Date(evaluacion.fechaInicio), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </div>
                  )}
                  {evaluacion.fechaFin && (
                    <div className="text-xs truncate">
                      <strong className="font-medium">Fin:</strong> {format(new Date(evaluacion.fechaFin), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-3 pt-3">
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(evaluacion)} className="flex-1 sm:flex-none">
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                    <span className="ml-1 sm:hidden text-xs">Editar</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                        <span className="ml-1 sm:hidden text-xs">Eliminar</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-[95vw] sm:max-w-lg">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-base sm:text-lg">¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                          Esta acción no se puede deshacer. Esto eliminará permanentemente la evaluación{' '}
                          <span className="font-semibold break-words">"{evaluacion.titulo}"</span> y todos los datos asociados.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(evaluacion.id)} className="w-full sm:w-auto">
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <Button variant="outline" size="sm" onClick={() => handleDownloadExcel(evaluacion.id, evaluacion.titulo)} className="flex-1 sm:flex-none text-xs whitespace-nowrap">
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 shrink-0" />
                    <span className="truncate">Excel</span>
                  </Button>
                  <Link href={`/teacher/evaluaciones/${evaluacion.id}/resultados`} className="flex-1 sm:flex-none">
                    <Button variant="outline" size="sm" className="w-full text-xs whitespace-nowrap">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 shrink-0" />
                      <span className="truncate">Alumnos</span>
                    </Button>
                  </Link>
                  <Link href={`/teacher/evaluaciones/${evaluacion.id}/preguntas`} className="flex-1 sm:flex-none">
                    <Button variant="default" size="sm" className="w-full text-xs whitespace-nowrap">
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 shrink-0" />
                      <span className="truncate">Preguntas</span>
                    </Button>
                  </Link>
                </div>
              </CardFooter>
            </Card>
          );
        }) : (
          <div className="col-span-full text-center py-8 sm:py-12 px-4">
            <p className="text-sm sm:text-base text-muted-foreground">No hay evaluaciones disponibles</p>
          </div>
        )}
      </div>

      {evaluaciones && evaluaciones.length === 0 && !loading && (
        <div className="text-center py-8 sm:py-12 px-4">
          <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium mb-2">No hay evaluaciones</h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 line-clamp-2">
            Comienza creando tu primera evaluación para este curso.
          </p>
          <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto text-sm">
            <Plus className="h-4 w-4 mr-2 shrink-0" />
            <span>Crear Primera Evaluación</span>
          </Button>
        </div>
      )}
          </div>
        </main>
      </div>
    </div>
  );
}
