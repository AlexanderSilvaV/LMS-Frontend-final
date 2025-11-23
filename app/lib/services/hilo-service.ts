import {
  HiloCreacionDTO,
  HiloDTO,
  HiloPinDTO,
  HiloCerrarDTO,
  HiloListItemDTO,
  HiloListadoDTO,
  ApiResponse,
  Page
} from '../types/foro-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7041';

class HiloService {
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
  // OPERACIONES DE HILO
  // ==========================================

  async crearHilo(dto: HiloCreacionDTO): Promise<ApiResponse<HiloDTO>> {
    return this.request<HiloDTO>('/api/hilos', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async fijarHilo(hiloId: number, dto: HiloPinDTO): Promise<ApiResponse<HiloDTO>> {
    return this.request<HiloDTO>(`/api/hilos/${hiloId}/pin`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  async quitarFijado(hiloId: number): Promise<ApiResponse<HiloDTO>> {
    return this.request<HiloDTO>(`/api/hilos/${hiloId}/unpin`, {
      method: 'PATCH',
    });
  }

  async cerrarHilo(hiloId: number, dto: HiloCerrarDTO): Promise<ApiResponse<HiloDTO>> {
    return this.request<HiloDTO>(`/api/hilos/${hiloId}/cerrar`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  async listarHilos(foroId: number, filtros: HiloListadoDTO): Promise<ApiResponse<Page<HiloListItemDTO>>> {
    return this.request<Page<HiloListItemDTO>>(`/api/hilos/${foroId}/listar`, {
      method: 'POST',
      body: JSON.stringify({
        pinned: filtros.pinned,
        cerrado: filtros.cerrado,
        cantidadPorPagina: filtros.cantidadPorPagina ?? 20,
        pagina: filtros.pagina ?? 1,
        q: filtros.q,
      }),
    });
  }
}

export const hiloService = new HiloService();
