'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus } from 'lucide-react';
import { HiloListItem } from '@/components/foros/hilo-list-item';
import { PostEditor } from '@/components/foros/post-editor';
import { SafeErrorDisplay } from '@/components/ui/safe-error-display';
import { foroService } from '@/app/lib/services/foro-service';
import { hiloService } from '@/app/lib/services/hilo-service';
import { useForoPermissions } from '@/app/lib/hooks/use-foro-permissions';
import { 
  ForoDTO, 
  HiloListItemDTO, 
  HiloListadoDTO, 
  Page 
} from '@/app/lib/types/foro-types';
import { sanitizeSearchQuery, createSafeErrorMessage, logError } from '@/app/lib/utils/foro-utils';

export default function ForoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { canCreateHilo, canPinHilo, userId } = useForoPermissions();
  
  const moduloId = parseInt(params.moduloId as string);
  const foroId = parseInt(params.foroId as string);

  const [foro, setForo] = useState<ForoDTO | null>(null);
  const [hilos, setHilos] = useState<Page<HiloListItemDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para crear hilo
  const [showCreateHilo, setShowCreateHilo] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const cargarForo = async () => {
    try {
      const response = await foroService.obtenerForo(foroId);
      if (response.operacionExitosa) {
        setForo(response.dato);
      } else {
        setError(response.mensaje);
      }
    } catch (err) {
      logError(err, 'cargarForo');
      setError(createSafeErrorMessage(err, 'Error al cargar el foro'));
    }
  };

  const cargarHilos = async () => {
    try {
      const filtros: HiloListadoDTO = {
        q: searchQuery || undefined,
        pagina: currentPage,
        cantidadPorPagina: 20,
      };

      const response = await hiloService.listarHilos(foroId, filtros);
      if (response.operacionExitosa) {
        setHilos(response.dato);
      } else {
        setError(response.mensaje);
      }
    } catch (err) {
      logError(err, 'cargarHilos');
      setError(createSafeErrorMessage(err, 'Error al cargar los hilos'));
    }
  };

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      await Promise.all([cargarForo(), cargarHilos()]);
      setLoading(false);
    };

    cargarDatos();
  }, [foroId, searchQuery, currentPage]);

  const handleCreateHilo = async (titulo: string) => {
    if (!foro) return;

    try {
      const response = await hiloService.crearHilo({
        foroId: foro.foroId,
        titulo: titulo.trim()
      });

      if (response.operacionExitosa) {
        setShowCreateHilo(false);
        cargarHilos(); // Recargar hilos
      } else {
        setError(response.mensaje);
      }
    } catch (err) {
      logError(err, 'handleCreateHilo');
      setError(createSafeErrorMessage(err, 'Error al crear el hilo'));
    }
  };

  const handlePin = async (hiloId: number, order: number) => {
    try {
      const response = await hiloService.fijarHilo(hiloId, { pinnedOrder: order });
      if (response.operacionExitosa) {
        cargarHilos();
      } else {
        setError(response.mensaje);
      }
    } catch (err) {
      logError(err, 'handlePin');
      setError(createSafeErrorMessage(err, 'Error al fijar el hilo'));
    }
  };

  const handleUnpin = async (hiloId: number) => {
    try {
      const response = await hiloService.quitarFijado(hiloId);
      if (response.operacionExitosa) {
        cargarHilos();
      } else {
        setError(response.mensaje);
      }
    } catch (err) {
      logError(err, 'handleUnpin');
      setError(createSafeErrorMessage(err, 'Error al quitar el fijado del hilo'));
    }
  };

  const handleClose = async (hiloId: number, cerrado: boolean) => {
    try {
      const response = await hiloService.cerrarHilo(hiloId, { cerrado });
      if (response.operacionExitosa) {
        cargarHilos();
      } else {
        setError(response.mensaje);
      }
    } catch (err) {
      logError(err, 'handleClose');
      setError(createSafeErrorMessage(err, 'Error al cambiar el estado del hilo'));
    }
  };

  const canUserCreateHilo = foro ? canCreateHilo(foro.allowStudentThreads) : false;

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

  if (!foro) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <h3 className="text-lg font-medium mb-2">Foro no encontrado</h3>
          <p className="text-muted-foreground mb-4">
            El foro que buscas no existe o no tienes permisos para verlo
          </p>
          <Button onClick={() => router.back()}>
            Volver
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{foro.titulo}</h1>
          {foro.descripcion && (
            <p className="text-muted-foreground mt-1">{foro.descripcion}</p>
          )}
        </div>
        {canUserCreateHilo && (
          <Button onClick={() => setShowCreateHilo(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Hilo
          </Button>
        )}
      </div>

      {/* Información del foro */}
      <Card className="p-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Estado: {foro.estado}</span>
          {!foro.allowStudentThreads && (
            <span>• Solo docentes pueden crear hilos</span>
          )}
          {foro.requireInitialPostToView && (
            <span>• Debes participar para ver otros posts</span>
          )}
        </div>
      </Card>

      {/* Crear hilo */}
      {showCreateHilo && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Crear Nuevo Hilo</h3>
          <PostEditor
            placeholder="Título del hilo..."
            onSave={handleCreateHilo}
            onCancel={() => setShowCreateHilo(false)}
            submitLabel="Crear Hilo"
          />
        </Card>
      )}

      {/* Búsqueda */}
      <div className="flex gap-4">
        <Input
          placeholder="Buscar hilos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(sanitizeSearchQuery(e.target.value))}
          className="max-w-md"
        />
      </div>

      {/* Error */}
      <SafeErrorDisplay error={error} />

      {/* Lista de hilos */}
      <Card>
        {hilos?.items.map((hilo) => (
          <HiloListItem
            key={hilo.hiloId}
            hilo={hilo}
            canModerate={canPinHilo}
            onPin={handlePin}
            onUnpin={handleUnpin}
            onClose={handleClose}
          />
        ))}
      </Card>

      {/* Paginación */}
      {hilos && hilos.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Anterior
          </Button>
          <span className="py-2 px-4">
            Página {currentPage} de {hilos.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage === hilos.totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}

      {/* Estado vacío */}
      {hilos && hilos.items.length === 0 && (
        <Card className="p-8 text-center">
          <h3 className="text-lg font-medium mb-2">No hay hilos</h3>
          <p className="text-muted-foreground mb-4">
            Sé el primero en iniciar una conversación
          </p>
          {canUserCreateHilo && (
            <Button onClick={() => setShowCreateHilo(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primer hilo
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
