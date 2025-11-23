import { apiClient } from './api-client';
import { NotaDTO, NotaCreacionDTO, NotasEstudianteDTO, NotasCursoDTO } from './types/nota-types';

export class NotaService {
  // Endpoints para Estudiantes
  async obtenerMisNotas(): Promise<NotasEstudianteDTO[]> {
    return apiClient.get<NotasEstudianteDTO[]>('/api/notas/mis-notas');
  }

  async obtenerNotaEvaluacion(evaluacionId: number): Promise<NotaDTO[]> {
    return apiClient.get<NotaDTO[]>(`/api/notas/evaluacion/${evaluacionId}`);
  }

  // Endpoints para Docentes
  async obtenerNotasCurso(cursoId: number): Promise<NotasCursoDTO[]> {
    return apiClient.get<NotasCursoDTO[]>(`/api/notas/curso/${cursoId}/estudiantes`);
  }

  async obtenerNotasEstudiante(estudianteId: string): Promise<NotasEstudianteDTO[]> {
    return apiClient.get<NotasEstudianteDTO[]>(`/api/notas/estudiante/${estudianteId}`);
  }

  async crearActualizarNota(nota: NotaCreacionDTO): Promise<NotaDTO> {
    return apiClient.post<NotaDTO>('/api/notas', {
      ...nota,
      esLaboratorio: nota.esLaboratorio ?? false,
    });
  }
}

export const notaService = new NotaService();