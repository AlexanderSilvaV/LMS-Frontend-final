// Tipos base para evaluaciones
export interface EvaluacionDTO {
  id: number;
  titulo: string;
  descripcion?: string;
  cursoId: number;
  cursoNombre?: string;
  docenteId?: string;
  docenteNombre?: string;
  fechaCreacion: string;
  fechaInicio?: string;
  fechaFin?: string;
  /**
   * Tiempo límite en minutos. Para laboratorios 3DLAB debe ser 0 (sin límite).
   */
  tiempoLimiteMins: number;
  activa: boolean;
  intentosMaximos: number;
  esLaboratorio3DLab: boolean;
  preguntasMinimasLaboratorio: number;
  preguntasPorSesionLaboratorio: number;
  totalPreguntas?: number;
  preguntas?: PreguntaDTO[];
  curso?: {
    id: number;
    nombre: string;
    nrc: string;
  };
}

export interface EvaluacionCreacionDTO {
  titulo: string;
  descripcion?: string;
  cursoId: number;
  fechaInicio?: string;
  fechaFin?: string;
  /**
   * Tiempo límite en minutos. Para laboratorios 3DLAB debe ser 0 (sin límite).
   */
  tiempoLimiteMins: number;
  intentosMaximos: number;
  esLaboratorio3DLab: boolean;
  preguntasMinimasLaboratorio: number;
  preguntasPorSesionLaboratorio: number;
  preguntas: PreguntaCreacionDTO[];
}

export interface EvaluacionEdicionDTO {
  titulo: string;
  descripcion?: string;
  fechaInicio?: string;
  fechaFin?: string;
  /**
   * Tiempo límite en minutos. Para laboratorios 3DLAB debe ser 0 (sin límite).
   */
  tiempoLimiteMins: number;
  activa: boolean;
  intentosMaximos: number;
  esLaboratorio3DLab: boolean;
  preguntasMinimasLaboratorio: number;
  preguntasPorSesionLaboratorio: number;
}

// Tipos para preguntas
export interface PreguntaDTO {
  id: number;
  texto: string;
  orden: number;
  puntos: number;
  evaluacionId: number;
  opciones: OpcionDTO[];
}

export interface PreguntaCreacionDTO {
  texto: string;
  orden: number;
  puntos: number;
  opciones: OpcionCreacionDTO[];
}

// Tipos para opciones
export interface OpcionDTO {
  id: number;
  texto: string;
  esCorrecta: boolean;
  orden: number;
  preguntaId: number;
}

export interface OpcionCreacionDTO {
  texto: string;
  esCorrecta: boolean;
  orden: number;
}

// Tipos para respuestas de estudiantes - SIMPLIFICADOS según backend
export interface RespuestaUsuarioDTO {
  evaluacionId: number;
  preguntaId: number;
  opcionId: number;
}

// Tipos para la vista del estudiante - ACTUALIZADOS según backend
export interface EvaluacionEstudianteDTO {
  id: number;
  titulo: string;
  descripcion?: string;
  cursoId: number;
  cursoNombre: string;
  docenteNombre: string;
  fechaCreacion: string;
  fechaInicio?: string;
  fechaFin?: string;
  /**
   * Tiempo límite en minutos. Para laboratorios 3DLAB debe ser 0 (sin límite).
   */
  tiempoLimiteMins: number;
  activa: boolean;
  intentosMaximos: number;
  totalPreguntas: number;
  intentosRealizados: number;
  puedeRealizarEvaluacion: boolean;
  yaCompletada: boolean;
  esLaboratorio3DLab?: boolean;
  preguntasMinimasLaboratorio?: number;
  preguntasPorSesionLaboratorio?: number;
  ultimaFechaRealizada?: string;
  mejorPorcentaje?: number;
  estaEnTiempo: boolean; // true si la evaluación está en tiempo (no vencida). Para laboratorios 3DLAB siempre true.
  // Propiedades adicionales para compatibilidad con el frontend existente
  curso: {
    nombre: string;
    nrc: string;
  };
  modulo?: {
    nombre: string;
  };
  ultimoIntento?: {
    fechaInicio: string;
    fechaFin?: string;
    calificacion?: number;
    estado: 'En Progreso' | 'Completado' | 'Tiempo Agotado';
  };
}

export interface EvaluacionParaRealizarDTO {
  id: number;
  titulo: string;
  descripcion?: string;
  tiempoLimiteMins: number;
  numeroIntento: number;
  fechaInicio: string;
  preguntas: PreguntaEstudianteDTO[];
}

export interface PreguntaEstudianteDTO {
  id: number;
  texto: string;
  orden: number;
  puntos: number;
  opciones: OpcionEstudianteDTO[];
}

export interface OpcionEstudianteDTO {
  id: number;
  texto: string;
  orden: number;
  // Nota: No incluye esCorrecta para que el estudiante no vea la respuesta
}

export interface IniciarEvaluacionDTO {
  evaluacionId: number;
  fechaInicio: string;
  tiempoLimiteMins: number;
  numeroIntento: number;
  token: string; // Token de sesión de evaluación
}

export interface EstadoEvaluacionDTO {
  evaluacionId: number;
  numeroIntento: number;
  fechaInicio: string;
  fechaLimite: string;
  tiempoRestanteMins: number;
  tiempoAgotado: boolean;
  preguntasRespondidas: number;
  totalPreguntas: number;
}

export interface HistorialEvaluacionDTO {
  evaluacionId: number;
  titulo: string;
  cursoNombre: string;
  numeroIntento: number;
  fechaRealizada: string;
  puntajeObtenido: number;
  puntajeMaximo: number;
  porcentaje: number;
  completada: boolean;
  estado: string; // "Completada", "En Progreso", "Tiempo Agotado"
}

// Respuestas del usuario - ACTUALIZADAS según backend
export interface RespuestaUsuarioDTO {
  evaluacionId: number;
  preguntaId: number;
  opcionId: number;
}

export interface SubmitRespuestasDTO {
  evaluacionId: number;
  respuestas: RespuestaUsuarioDTO[];
}

export interface SubmitEvaluacionDTO {
  evaluacionId: number;
  respuestas: RespuestaUsuarioDTO[];
}

export interface RespuestaCreacionDTO {
  evaluacionId: number;
  preguntaId: number;
  opcionId: number;
}

// Resultado de evaluación - ACTUALIZADO según backend
export interface ResultadoEvaluacionDTO {
  evaluacionId: number;
  usuarioId: string;
  usuarioNombre: string;
  puntajeObtenido: number;
  puntajeMaximo: number;
  puntosTotales: number; // Alias para puntajeMaximo para compatibilidad
  porcentaje: number;
  fechaCompletado: string;
  fechaInicio: string; // Agregado para compatibilidad
  fechaFin: string; // Agregado para compatibilidad
  numeroIntento: number;
  detalleRespuestas: DetalleRespuestaDTO[];
  respuestas: DetalleRespuestaDTO[]; // Alias para detalleRespuestas para compatibilidad
}

export interface DetalleRespuestaDTO {
  preguntaId: number;
  preguntaTexto: string;
  opcionSeleccionadaId: number;
  opcionSeleccionadaTexto: string;
  esCorrecta: boolean;
  puntosObtenidos: number;
  retroalimentacion?: string | null;
  feedback?: string | null;
  comentario?: string | null;
}
