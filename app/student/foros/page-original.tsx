'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Search, Clock, Pin } from 'lucide-react';
import { formatRelativeTime } from '@/app/lib/utils/foro-utils';
import { cursoService } from '@/app/lib/services/curso-service';
import { foroService } from '@/app/lib/services/foro-service';
import type { ForoListItemDTO } from '@/app/lib/types/foro-types';

interface ForoResumen extends ForoListItemDTO {
  curso: string;
  modulo: string;
  cantidadHilos?: number;
  ultimaActividad?: Date;
  requireInitialPost?: boolean;
  hasUserPosted?: boolean;
}

export default function ForosStudentPage() {
  const router = useRouter();
  const [foros, setForos] = useState<ForoResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    cargarForos();
  }, []);

  const cargarForos = async () => {
    try {
      setLoading(true);
      
      // Obtener cursos asignados al estudiante
      const cursosData = await cursoService.obtenerCursosAsignados();
      
      // Validar que cursosData sea un array
      if (!Array.isArray(cursosData)) {
        console.error('Error: cursosData no es un array:', cursosData);
        setForos([]);
        return;
      }
      
      // Obtener foros de todos los módulos del estudiante
      const forosData: ForoResumen[] = [];
      
      for (const curso of cursosData) {
        try {
          const modulos = await cursoService.obtenerModulosPorCurso(curso.nrc);
          
          if (Array.isArray(modulos)) {
            for (const modulo of modulos) {
              try {
                // Obtener foros del módulo
                const forosResponse = await foroService.listarForos({
                  moduloId: modulo.moduloId,
                  incluirArchivados: false,
                  pagina: 1,
                  cantidadPorPagina: 50
                });
                
                if (forosResponse.operacionExitosa && Array.isArray(forosResponse.dato.items)) {
                  for (const foro of forosResponse.dato.items) {
                    forosData.push({
                      ...foro,
                      curso: curso.nombre,
                      modulo: modulo.nombre,
                      // Propiedades opcionales que pueden no estar en el backend aún
                      cantidadHilos: 0,
                      ultimaActividad: foro.fechaCreacion,
                      requireInitialPost: false,
                      hasUserPosted: false
                    });
                  }
                }
              } catch (error) {
                console.error(`Error al obtener foros del módulo ${modulo.moduloId}:`, error);
                // Continuar con el siguiente módulo
              }
            }
          } else {
            console.warn(`Módulos para curso ${curso.nrc} no es un array:`, modulos);
          }
        } catch (error) {
          console.error(`Error al obtener módulos del curso ${curso.nrc}:`, error);
        }
      }
      
      setForos(forosData);
    } catch (error) {
      console.error('Error al cargar foros:', error);
    } finally {
      setLoading(false);
    }
  };

  const forosFiltrados = foros.filter(foro =>
    foro.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    foro.curso.toLowerCase().includes(searchQuery.toLowerCase()) ||
    foro.modulo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'Activo':
        return 'bg-green-100 text-green-800';
      case 'Cerrado':
        return 'bg-unab-red-100 text-unab-red-800';
      case 'Archivado':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Foros de Discusión</h1>
        <p className="text-muted-foreground">
          Participa en las discusiones de tus cursos
        </p>
      </div>

      {/* Mensaje informativo */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-green-600" />
          <h3 className="font-medium text-green-900">Foros de Discusión Disponibles</h3>
        </div>
        <p className="text-green-800 text-sm mt-1">
          Participa en las discusiones de tus cursos. Puedes hacer preguntas, compartir ideas y colaborar con tus compañeros.
        </p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-unab-navy" />
            <div>
              <p className="text-2xl font-bold">{foros.length}</p>
              <p className="text-sm text-muted-foreground">Foros Disponibles</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Pin className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">
                {foros.filter(f => f.hasUserPosted || false).length}
              </p>
              <p className="text-sm text-muted-foreground">Participaciones</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold">
                {foros.filter(f => (f.requireInitialPost || false) && !(f.hasUserPosted || false)).length}
              </p>
              <p className="text-sm text-muted-foreground">Requieren Participación</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Búsqueda */}
      <Card className="p-4">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            placeholder="Buscar foros, cursos o módulos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Lista de foros */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Mis Foros</h2>
        
        {forosFiltrados.map((foro) => (
          <Card key={foro.foroId} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold">{foro.titulo}</h3>
                  <Badge className={getEstadoBadgeColor(foro.estado)}>
                    {foro.estado}
                  </Badge>
                  {(foro.requireInitialPost || false) && !(foro.hasUserPosted || false) && (
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      Participación Requerida
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">
                  {foro.curso} • {foro.modulo}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>{foro.cantidadHilos || 0} hilos</span>
                  </div>
                  
                  {foro.ultimaActividad && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatRelativeTime(foro.ultimaActividad)}</span>
                    </div>
                  )}
                  
                  {(foro.hasUserPosted || false) && (
                    <span className="text-green-600 text-xs">✓ Has participado</span>
                  )}
                </div>
                
                {(foro.requireInitialPost || false) && !(foro.hasUserPosted || false) && (
                  <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
                    💡 Debes hacer tu primera participación para ver las discusiones
                  </div>
                )}
              </div>
              
              <Button 
                onClick={() => router.push(`/modulo/${foro.moduloId}/foros/${foro.foroId}`)}
                disabled={foro.estado === 'Archivado'}
              >
                {foro.estado === 'Archivado' ? 'Archivado' : 'Ver Foro'}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Estado vacío */}
      {forosFiltrados.length === 0 && (
        <Card className="p-8 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {searchQuery ? 'No se encontraron foros' : 'No hay foros disponibles'}
          </h3>
          <p className="text-muted-foreground">
            {searchQuery
              ? 'Intenta con otros términos de búsqueda'
              : 'Los foros aparecerán aquí cuando tu profesor los active'
            }
          </p>
        </Card>
      )}
    </div>
  );
}
