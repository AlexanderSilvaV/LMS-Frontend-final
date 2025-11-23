const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7041';

export interface CursoDTO {
  nrc: number;          // Identificador principal del curso (clave primaria)
  nombre: string;
  descripcion?: string;
  activo: boolean;
  // Alias para compatibilidad con código existente
  cursoId?: number;     // Se mapeará a nrc
}

export interface ModuloDTO {
  moduloId: number;
  nombre: string;
  cursoId: number;
  descripcion?: string;
}

export interface ResultadoOperacion<T> {
  operacionExitosa: boolean;
  dato: T;
  mensaje: string;
  codigo: number;
}

class CursoService {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ResultadoOperacion<T>> {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No hay token de autenticación disponible');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Error HTTP en ${endpoint}:`, { status: response.status, statusText: response.statusText, errorText });
        
        // Retornar resultado de error en lugar de lanzar excepción
        return {
          operacionExitosa: false,
          mensaje: `Error ${response.status}: ${response.statusText}`,
          dato: null as T
        } as ResultadoOperacion<T>;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.warn(`Error de red en ${endpoint}:`, error instanceof Error ? error.message : 'Error desconocido');
      
      // Retornar resultado de error en lugar de lanzar excepción
      return {
        operacionExitosa: false,
        mensaje: 'Error de conexión. Verifique su conexión a internet.',
        dato: null as T
      } as ResultadoOperacion<T>;
    }
  }  async obtenerCursosAsignados(): Promise<CursoDTO[]> {
    try {
      const resultado = await this.request<CursoDTO[]>('/api/cursos/asignados');
      
      if (!resultado.operacionExitosa) {
        console.warn('Error al obtener cursos asignados:', resultado.mensaje);
        return []; // Retornar array vacío en lugar de lanzar error
      }
      
      // Mapear nrc a cursoId para compatibilidad con código existente
      const cursos = (resultado.dato || []).map(curso => ({
        ...curso,
        cursoId: curso.nrc // Alias para compatibilidad
      }));
      
      return cursos;
    } catch (error) {
      console.warn('Error al cargar cursos:', error instanceof Error ? error.message : 'Error desconocido');
      return []; // Retornar array vacío para mejor UX
    }
  }

  async obtenerModulosPorCurso(nrc: number): Promise<ModuloDTO[]> {
    console.log('obtenerModulosPorCurso - nrc recibido:', nrc);
    
    if (!nrc || nrc === undefined || isNaN(nrc)) {
      console.warn('NRC inválido para obtener módulos:', nrc);
      return []; // Retornar array vacío en lugar de lanzar error
    }
    
    try {
      const resultado = await this.request<ModuloDTO[]>(`/api/modulos/curso/${nrc}`);
      console.log('Respuesta del backend para módulos:', resultado);
      
      if (!resultado) {
        console.warn('Respuesta nula del backend para módulos');
        return [];
      }
      
      if (!resultado.operacionExitosa) {
        const mensaje = resultado.mensaje || 'Error desconocido al obtener módulos';
        const codigo = resultado.codigo || 'Sin código';
        console.warn('Error del backend al obtener módulos:', { mensaje, codigo, nrc });
        // Retornar array vacío en lugar de lanzar error para mejor UX
        return [];
      }
      
      const modulos = resultado.dato || [];
      console.log('Módulos obtenidos exitosamente:', modulos.length);
      return modulos;
    } catch (error) {
      console.warn('Error en obtenerModulosPorCurso:', error instanceof Error ? error.message : 'Error desconocido', { nrc });
      
      // En lugar de lanzar errores, retornar array vacío para mejor UX
      // Esto permite que la aplicación continúe funcionando
      return [];
    }
  }
}

export const cursoService = new CursoService();
