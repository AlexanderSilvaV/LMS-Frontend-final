// ======================================
// TIPOS BASE DEL SISTEMA DE FOROS
// ======================================

export type EstadoForo = 'Activo' | 'Cerrado' | 'Archivado';

// ======================================
// FORO DTOs
// ======================================

export interface ForoCreacionDTO {
  moduloId: number;
  titulo: string;
  descripcion?: string;
}

export interface ForoEdicionDTO {
  titulo?: string;
  descripcion?: string;
}

export interface ForoCambioEstadoDTO {
  nuevoEstado: EstadoForo;
}

export interface ForoPoliciesDTO {
  allowStudentThreads?: boolean;
  requireInitialPostToView?: boolean;
}

export interface ForoDTO {
  foroId: number;
  moduloId: number;
  titulo: string;
  descripcion?: string;
  estado: EstadoForo;
  allowStudentThreads: boolean;
  requireInitialPostToView: boolean;
  creadorId: string;
  fechaCreacion: Date;
}

export interface ForoListItemDTO {
  foroId: number;
  moduloId: number;
  titulo: string;
  estado: EstadoForo;
  fechaCreacion: Date;
}

export interface ForoListadoDTO {
  moduloId: number;
  estado?: EstadoForo;
  incluirArchivados?: boolean;
  pagina?: number;
  cantidadPorPagina?: number;
  q?: string;
}

// ======================================
// HILO DTOs
// ======================================

export interface HiloCreacionDTO {
  foroId: number;
  titulo: string;
}

export interface HiloPinDTO {
  pinnedOrder: number;
}

export interface HiloCerrarDTO {
  cerrado: boolean;
}

export interface HiloDTO {
  hiloId: number;
  foroId: number;
  titulo: string;
  autorId: string;
  cerrado: boolean;
  pinned: boolean;
  pinnedOrder?: number;
  lastActivityAt: Date;
  fechaCreacion: Date;
}

export interface HiloListItemDTO {
  hiloId: number;
  foroId: number;
  titulo: string;
  cerrado: boolean;
  pinned: boolean;
  pinnedOrder?: number;
  lastActivityAt: Date;
  fechaCreacion: Date;
  autorId: string;
}

export interface HiloListadoDTO {
  pinned?: boolean;
  cerrado?: boolean;
  cantidadPorPagina?: number;
  pagina?: number;
  q?: string;
}

// ======================================
// POST DTOs
// ======================================

export interface PostCreacionDTO {
  hiloId: number;
  contenido: string;
}

export interface PostEdicionDTO {
  contenido: string;
}

export interface PostDTO {
  postId: number;
  hiloId: number;
  autorId: string;
  autorNombre?: string;
  avatarUrl?: string;
  contenido: string;
  editado: boolean;
  editedAt?: Date;
  softDeleted: boolean;
  fechaCreacion: Date;
}

export interface PostListadoDTO {
  cantidadPorPagina?: number;
  pagina?: number;
}

// ======================================
// TIPOS DE RESPUESTA GENÉRICOS
// ======================================

export interface Page<T> {
  pageNumber: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  items: T[];
}

export interface ApiResponse<T> {
  operacionExitosa: boolean;
  dato: T;
  mensaje: string;
  codigo: number;
}
