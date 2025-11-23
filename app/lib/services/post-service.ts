import {
  PostCreacionDTO,
  PostDTO,
  PostEdicionDTO,
  PostListadoDTO,
  ApiResponse,
  Page
} from '../types/foro-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7041';

class PostService {
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
  // OPERACIONES DE POST
  // ==========================================

  async crearPost(dto: PostCreacionDTO): Promise<ApiResponse<PostDTO>> {
    return this.request<PostDTO>('/api/posts', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async editarPost(postId: number, dto: PostEdicionDTO): Promise<ApiResponse<PostDTO>> {
    return this.request<PostDTO>(`/api/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }

  async eliminarPost(postId: number): Promise<ApiResponse<PostDTO>> {
    return this.request<PostDTO>(`/api/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  async listarPosts(hiloId: number, filtros: PostListadoDTO): Promise<ApiResponse<Page<PostDTO>>> {
    return this.request<Page<PostDTO>>(`/api/posts/${hiloId}/listar`, {
      method: 'POST',
      body: JSON.stringify({
        cantidadPorPagina: filtros.cantidadPorPagina ?? 20,
        pagina: filtros.pagina ?? 1,
      }),
    });
  }
}

export const postService = new PostService();
