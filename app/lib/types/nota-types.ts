export interface NotaDTO {
  id: number;
  calificacion: number; // 1.0 - 7.0
  usuarioId: string;
  usuarioNombre?: string;
  evaluacionId: number;
  evaluacionTitulo?: string;
  fechaCalificacion: string;
  observaciones?: string;
  numeroIntento: number;
  esNotaFinal: boolean;
  esLaboratorio: boolean;
}

export interface NotaCreacionDTO {
  calificacion: number; // 1.0 - 7.0
  usuarioId: string;
  evaluacionId: number;
  observaciones?: string;
  numeroIntento: number;
  esNotaFinal: boolean;
  esLaboratorio: boolean;
}

export interface NotasEstudianteDTO {
  evaluacionId: number;
  evaluacionTitulo: string;
  cursoNombre: string;
  docenteNombre: string;
  notas: NotaDTO[];
  mejorNota?: number;
  notaFinal?: number;
  esLaboratorio?: boolean;
  esLaboratorio3DLab?: boolean;
}

export interface NotasCursoDTO {
  estudianteId: string;
  estudianteNombre: string;
  estudianteRut: string;
  notas: {
    evaluacionId: number;
    evaluacionTitulo: string;
    calificacion: number;
    numeroIntento: number;
    esNotaFinal: boolean;
    fechaCalificacion: string;
    esLaboratorio: boolean;
  }[];
}