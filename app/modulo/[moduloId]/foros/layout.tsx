'use client';

import { Sidebar } from "@/components/sidebar"
import { useEffect, useState } from "react";

export default function ModuloForosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [userRole, setUserRole] = useState<'student' | 'teacher' | null>(null);

  useEffect(() => {
    // Detectar el rol del usuario desde localStorage
    const role = localStorage.getItem('userRole');
    if (role === 'Docente') {
      setUserRole('teacher');
    } else if (role === 'Alumno') {
      setUserRole('student');
    } else {
      // Fallback a student si no se puede determinar
      setUserRole('student');
    }
  }, []);

  if (!userRole) {
    return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar role={userRole} />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
