'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search } from 'lucide-react';
import { ForoCard } from '@/components/foros/foro-card';
import { foroService } from '@/app/lib/services/foro-service';
import { useForoPermissions } from '@/app/lib/hooks/use-foro-permissions';
import { 
  ForoListItemDTO, 
  ForoListadoDTO, 
  Page, 
  EstadoForo 
} from '@/app/lib/types/foro-types';

export default function ForosPage() {
  const params = useParams();
  const router = useRouter();
  const { canCreateForo, canEditForo } = useForoPermissions();
  
  const moduloId = parseInt(params.moduloId as string);

  const [foros, setForos] = useState<Page<ForoListItemDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoForo | 'todos'>('todos');
  const [incluirArchivados, setIncluirArchivados] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const cargarForos = async () => {
    try {
      setLoading(true);
      const filtros: ForoListadoDTO = {
        moduloId,
        estado: estadoFilter === 'todos' ? undefined : estadoFilter,
        incluirArchivados,
        q: searchQuery || undefined,
        pagina: currentPage,
        cantidadPorPagina: 20,
      };

      const response = await foroService.listarForos(filtros);
      if (response.operacionExitosa) {
        setForos(response.dato);
      } else {
        setError(response.mensaje);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar foros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarForos();
  }, [moduloId, estadoFilter, incluirArchivados, searchQuery, currentPage]);

  const handleStatusChange = async (foroId: number, nuevoEstado: string) => {
    try {
      const response = await foroService.cambiarEstadoForo(foroId, { 
        nuevoEstado: nuevoEstado as EstadoForo 
      });
      if (response.operacionExitosa) {
        cargarForos(); // Recargar la lista
      } else {
        setError(response.mensaje);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado');
    }
  };

  const handleDelete = async (foroId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este foro?')) {
      return;
    }

    try {
      const response = await foroService.eliminarForo(foroId);
      if (response.operacionExitosa) {
        cargarForos(); // Recargar la lista
      } else {
        setError(response.mensaje);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar foro');
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Foros del Módulo</h1>
        {canCreateForo && (
          <Button onClick={() => router.push(`/modulo/${moduloId}/foros/crear`)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Foro
          </Button>
        )}
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Buscar foros..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select
            value={estadoFilter}
            onValueChange={(value) => setEstadoFilter(value as EstadoForo | 'todos')}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="Activo">Activos</SelectItem>
              <SelectItem value="Cerrado">Cerrados</SelectItem>
              <SelectItem value="Archivado">Archivados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <p className="text-red-600">{error}</p>
        </Card>
      )}

      {/* Lista de Foros */}
      <div className="space-y-4">
        {foros?.items.map((foro) => (
          <ForoCard
            key={foro.foroId}
            foro={foro}
            canEdit={canEditForo}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Paginación */}
      {foros && foros.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Anterior
          </Button>
          <span className="py-2 px-4">
            Página {currentPage} de {foros.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage === foros.totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}

      {/* Estado vacío */}
      {foros && foros.items.length === 0 && (
        <Card className="p-8 text-center">
          <h3 className="text-lg font-medium mb-2">No hay foros</h3>
          <p className="text-muted-foreground mb-4">
            No se encontraron foros para este módulo
          </p>
          {canCreateForo && (
            <Button onClick={() => router.push(`/modulo/${moduloId}/foros/crear`)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primer foro
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
