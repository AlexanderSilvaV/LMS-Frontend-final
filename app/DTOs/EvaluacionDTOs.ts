export interface EvaluacionEstudianteDTO {
  id: number;
  titulo: string;
  descripcion: string;
  cursoId: number;
  cursoNombre: string;
  docenteNombre: string;
  fechaCreacion: string;
  fechaInicio?: string;
  fechaFin?: string;
  tiempoLimiteMins: number;
  activa: boolean;
  intentosMaximos: number;
  totalPreguntas: number;
  intentosRealizados: number;
  puedeRealizarEvaluacion: boolean;
  yaCompletada: boolean;
  ultimaFechaRealizada?: string;
  mejorPorcentaje?: number;
  estaEnTiempo: boolean;
  curso: {
    nombre: string;
    nrc: string;
  };
  ultimoIntento?: {
    estado: string;
    calificacion?: number;
  };
}

export interface ResultadoEvaluacionDTO {
  evaluacionId: number;
  usuarioId: string;
  usuarioNombre: string;
  puntajeObtenido: number;
  puntajeMaximo: number;
  porcentaje: number;
  fechaCompletado: string;
  numeroIntento: number;
  detalleRespuestas: DetalleRespuestaDTO[];
  fechaInicio?: string;
  fechaFin?: string;
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
