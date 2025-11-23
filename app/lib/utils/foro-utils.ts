import DOMPurify from 'dompurify';
import { EstadoForo } from '../types/foro-types';

export const sanitizeHtml = (html: string): string => {
  // En el cliente, usar DOMPurify directamente
  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre'],
      ALLOWED_ATTR: [],
      ALLOW_DATA_ATTR: false,
    });
  }

  // En el servidor, hacer una sanitización básica (eliminar scripts)
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

// Sanitización general para inputs de texto
export const sanitizeTextInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';

  return input
    .trim()
    // Remover caracteres de control
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    // Remover scripts básicos
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    // Limitar longitud razonable
    .substring(0, 10000);
};

// Sanitización para emails
export const sanitizeEmail = (email: string): string => {
  if (!email || typeof email !== 'string') return '';

  return email
    .trim()
    .toLowerCase()
    // Remover caracteres peligrosos
    .replace(/[<>'"&\\]/g, '')
    .substring(0, 254); // RFC 5321 limit
};

// Sanitización para nombres de usuario
export const sanitizeUsername = (username: string): string => {
  if (!username || typeof username !== 'string') return '';

  return username
    .trim()
    // Solo permitir caracteres alfanuméricos, guiones y underscores
    .replace(/[^a-zA-Z0-9\-_]/g, '')
    .substring(0, 50);
};

// Sanitización para búsquedas
export const sanitizeSearchQuery = (query: string): string => {
  if (!query || typeof query !== 'string') return '';

  return query
    .trim()
    // Remover caracteres peligrosos para SQL-like injections
    .replace(/['";\\]/g, '')
    .replace(/--/g, '')
    .substring(0, 200);
};

// Utilidades para manejo seguro de errores
export const createSafeErrorMessage = (error: unknown, fallbackMessage = 'Ha ocurrido un error inesperado'): string => {
  // No exponer detalles técnicos del error
  if (error instanceof Error) {
    // Solo mostrar mensajes de error controlados
    const message = error.message.toLowerCase();

    // Si es un error de red o conexión, dar mensaje genérico
    if (message.includes('fetch') || message.includes('network') || message.includes('connection')) {
      return 'Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.';
    }

    // Si es un error de autenticación
    if (message.includes('unauthorized') || message.includes('forbidden') || message.includes('401') || message.includes('403')) {
      return 'No tienes permisos para realizar esta acción.';
    }

    // Si es un error de validación
    if (message.includes('validation') || message.includes('invalid')) {
      return 'Los datos proporcionados no son válidos.';
    }

    // Para otros errores, usar mensaje genérico
    return fallbackMessage;
  }

  return fallbackMessage;
};

// Función para loggear errores de forma segura (sin exponer en frontend)
export const logError = (error: unknown, context?: string) => {
  const timestamp = new Date().toISOString();
  const contextInfo = context ? `[${context}]` : '';

  console.error(`${timestamp} ${contextInfo} Error:`, {
    message: error instanceof Error ? error.message : 'Unknown error',
    // No loggear stack traces en producción
    ...(process.env.NODE_ENV === 'development' && {
      stack: error instanceof Error ? error.stack : undefined
    })
  });
};

export const formatDate = (date: Date | string): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
};

export const formatRelativeTime = (date: Date | string): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    return `hace ${diffInMinutes} minutos`;
  } else if (diffInHours < 24) {
    return `hace ${Math.floor(diffInHours)} horas`;
  } else if (diffInHours < 48) {
    return 'ayer';
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `hace ${diffInDays} días`;
  }
};

export const getEstadoColor = (estado: EstadoForo): string => {
  switch (estado) {
    case 'Activo':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Cerrado':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Archivado':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const validateForoTitle = (title: string): string | null => {
  if (!title || title.trim().length === 0) {
    return 'El título es requerido';
  }
  if (title.trim().length > 120) {
    return 'El título no puede superar 120 caracteres';
  }
  return null;
};

export const validateForoDescription = (description: string): string | null => {
  if (description && description.length > 2000) {
    return 'La descripción no puede superar 2000 caracteres';
  }
  return null;
};

export const validateHiloTitle = (title: string): string | null => {
  if (!title || title.trim().length === 0) {
    return 'El título es requerido';
  }
  if (title.trim().length > 120) {
    return 'El título no puede superar 120 caracteres';
  }
  return null;
};

export const validatePostContent = (content: string): string | null => {
  if (!content || content.trim().length === 0) {
    return 'El contenido es requerido';
  }
  if (content.trim().length > 10000) {
    return 'El contenido no puede superar 10,000 caracteres';
  }
  return null;
};
