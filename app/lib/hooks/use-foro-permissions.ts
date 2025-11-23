'use client';

import { useState, useEffect } from 'react';

export type RoleType = 'Administrador' | 'Docente' | 'Alumno';

interface User {
  id: string;
  role: RoleType;
  nombre: string;
}

export function useForoPermissions() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Simular obtención de datos del usuario del token o localStorage
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // En un caso real, decodificarías el JWT o harías una llamada a la API
        // Por ahora, simulamos un usuario docente
        setUser({
          id: 'user-123',
          role: 'Docente', // Esto debería venir del token decodificado
          nombre: 'Usuario de Prueba'
        });
      } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
      }
    }
  }, []);

  const isAdmin = user?.role === 'Administrador';
  const isTeacher = user?.role === 'Docente';
  const isStudent = user?.role === 'Alumno';

  return {
    // Permisos de foro
    canCreateForo: isAdmin || isTeacher,
    canEditForo: isAdmin || isTeacher,
    canDeleteForo: isAdmin || isTeacher,
    canChangeForoStatus: isAdmin || isTeacher,
    canUpdateForoPolicies: isAdmin || isTeacher,

    // Permisos de hilo
    canCreateHilo: (allowStudentThreads: boolean) => {
      if (isAdmin || isTeacher) return true;
      if (isStudent && allowStudentThreads) return true;
      return false;
    },
    canPinHilo: isAdmin || isTeacher,
    canCloseHilo: isAdmin || isTeacher,

    // Permisos de post
    canCreatePost: true, // Todos pueden crear posts si el hilo no está cerrado
    canEditPost: (autorId: string) => isAdmin || isTeacher || user?.id === autorId,
    canDeletePost: (autorId: string) => isAdmin || isTeacher || user?.id === autorId,

    // Verificaciones de acceso
    canViewPosts: (requireInitialPostToView: boolean, userHasPosted: boolean) => {
      if (isAdmin || isTeacher) return true;
      if (!requireInitialPostToView) return true;
      return userHasPosted;
    },

    // Información del usuario
    userId: user?.id,
    userRole: user?.role as RoleType,
    isAdmin,
    isTeacher,
    isStudent,
  };
}
