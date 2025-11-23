import {
  ForoCreacionDTO,
  ForoDTO,
  ForoEdicionDTO,
  ForoCambioEstadoDTO,
  ForoPoliciesDTO,
  ForoListItemDTO,
  ForoListadoDTO,
  ApiResponse,
  Page
} from '../types/foro-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7041';

class ForoService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    // Adaptar respuesta del backend a nuestro formato
    if (data.operacionExitosa !== undefined) {
      return data;
    } else {
      return {
        operacionExitosa: true,
        dato: data,
        mensaje: 'Operación exitosa',
        codigo: 200
      };
    }
  }

  // ==========================================
  // OPERACIONES DE FORO
  // ==========================================

  async crearForo(dto: ForoCreacionDTO): Promise<ApiResponse<ForoDTO>> {
    return this.request<ForoDTO>('/api/foros', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async obtenerForo(foroId: number): Promise<ApiResponse<ForoDTO>> {
    return this.request<ForoDTO>(`/api/foros/${foroId}`);
  }

  async editarForo(foroId: number, dto: ForoEdicionDTO): Promise<ApiResponse<ForoDTO>> {
    return this.request<ForoDTO>(`/api/foros/${foroId}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }

  async cambiarEstadoForo(foroId: number, dto: ForoCambioEstadoDTO): Promise<ApiResponse<ForoDTO>> {
    return this.request<ForoDTO>(`/api/foros/${foroId}/estado`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  async actualizarPoliticas(foroId: number, dto: ForoPoliciesDTO): Promise<ApiResponse<ForoDTO>> {
    return this.request<ForoDTO>(`/api/foros/${foroId}/policies`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  async eliminarForo(foroId: number): Promise<ApiResponse<string>> {
    return this.request<string>(`/api/foros/${foroId}`, {
      method: 'DELETE',
    });
  }

  async listarForos(dto: ForoListadoDTO): Promise<ApiResponse<Page<ForoListItemDTO>>> {
    return this.request<Page<ForoListItemDTO>>('/api/foros/listar', {
      method: 'POST',
      body: JSON.stringify({
        moduloId: dto.moduloId,
        estado: dto.estado,
        incluirArchivados: dto.incluirArchivados ?? false,
        pagina: dto.pagina ?? 1,
        cantidadPorPagina: dto.cantidadPorPagina ?? 20,
        q: dto.q,
      }),
    });
  }
}

export const foroService = new ForoService();
