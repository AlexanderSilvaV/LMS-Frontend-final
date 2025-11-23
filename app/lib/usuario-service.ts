import { apiClient } from './api-client';

export interface UsuarioDTO {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
  fotoPerfil?: string;
  fechaCreacion?: string;
  activo?: boolean;
}

class UsuarioService {
  async obtenerUsuarioPorId(id: string): Promise<UsuarioDTO> {
    console.log('🔍 [UsuarioService] Calling obtenerUsuarioPorId for ID:', id);
    console.log('🔍 [UsuarioService] API URL:', `/api/usuarios/${id}/public`);
    try {
      const result = await apiClient.get<UsuarioDTO>(`/api/usuarios/${id}/public`);
      console.log('✅ [UsuarioService] Response received:', result);
      return result;
    } catch (error) {
      console.error('❌ [UsuarioService] Error calling API:', error);
      throw error;
    }
  }

  obtenerUrlFotoPerfil(fotoPerfil?: string): string {
    // Si hay una URL de foto de perfil (S3 presigned URL), usarla directamente
    if (fotoPerfil && (fotoPerfil.startsWith('http://') || fotoPerfil.startsWith('https://'))) {
      return fotoPerfil;
    }
    // Si no hay foto de perfil, devolver placeholder
    return '/placeholder-user.jpg';
  }
}

export const usuarioService = new UsuarioService();