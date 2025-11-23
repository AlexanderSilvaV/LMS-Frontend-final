'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { PostComponent } from '@/components/foros/post-component';
import { PostEditor } from '@/components/foros/post-editor';
import { postService } from '@/app/lib/services/post-service';
import { useForoPermissions } from '@/app/lib/hooks/use-foro-permissions';
import { 
  PostDTO, 
  PostListadoDTO, 
  Page 
} from '@/app/lib/types/foro-types';

export default function HiloDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { canCreatePost, canEditPost, canDeletePost, userId } = useForoPermissions();
  
  const hiloId = parseInt(params.hiloId as string);

  const [posts, setPosts] = useState<Page<PostDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hiloInfo, setHiloInfo] = useState<{ titulo: string; cerrado: boolean } | null>(null);

  const cargarPosts = async () => {
    try {
      const filtros: PostListadoDTO = {
        pagina: currentPage,
        cantidadPorPagina: 20,
      };

      const response = await postService.listarPosts(hiloId, filtros);
      if (response.operacionExitosa) {
        setPosts(response.dato);
        // En un caso real, también cargarías información del hilo
        setHiloInfo({ titulo: 'Hilo de Discusión', cerrado: false });
      } else {
        setError(response.mensaje);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPosts();
  }, [hiloId, currentPage]);

  const handleCreatePost = async (contenido: string) => {
    try {
      const response = await postService.crearPost({
        hiloId,
        contenido: contenido.trim()
      });

      if (response.operacionExitosa) {
        cargarPosts(); // Recargar posts
      } else {
        setError(response.mensaje);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear post');
    }
  };

  const handleEditPost = async (postId: number, contenido: string) => {
    try {
      const response = await postService.editarPost(postId, {
        contenido: contenido.trim()
      });

      if (response.operacionExitosa) {
        cargarPosts(); // Recargar posts
      } else {
        setError(response.mensaje);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al editar post');
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este post?')) {
      return;
    }

    try {
      const response = await postService.eliminarPost(postId);
      if (response.operacionExitosa) {
        cargarPosts(); // Recargar posts
      } else {
        setError(response.mensaje);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar post');
    }
  };

  const canUserCreatePost = canCreatePost && hiloInfo && !hiloInfo.cerrado;

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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {hiloInfo?.titulo || 'Cargando...'}
          </h1>
          {hiloInfo?.cerrado && (
            <p className="text-muted-foreground mt-1">
              🔒 Este hilo está cerrado - No se pueden agregar nuevos posts
            </p>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <p className="text-red-600">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => setError(null)}
          >
            Cerrar
          </Button>
        </Card>
      )}

      {/* Crear post */}
      {canUserCreatePost && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Agregar Respuesta</h3>
          <PostEditor
            placeholder="Escribe tu respuesta..."
            onSave={handleCreatePost}
            submitLabel="Publicar Respuesta"
          />
        </Card>
      )}

      {/* Lista de posts */}
      <div className="space-y-4">
        {posts?.items.map((post) => (
          <PostComponent
            key={post.postId}
            post={post}
            canEdit={canEditPost(post.autorId) || canDeletePost(post.autorId)}
            onEdit={handleEditPost}
            onDelete={handleDeletePost}
          />
        ))}
      </div>

      {/* Paginación */}
      {posts && posts.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Anterior
          </Button>
          <span className="py-2 px-4">
            Página {currentPage} de {posts.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage === posts.totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}

      {/* Estado vacío */}
      {posts && posts.items.length === 0 && (
        <Card className="p-8 text-center">
          <h3 className="text-lg font-medium mb-2">No hay posts</h3>
          <p className="text-muted-foreground mb-4">
            Sé el primero en participar en esta discusión
          </p>
          {canUserCreatePost && (
            <div className="mt-4">
              <PostEditor
                placeholder="Escribe el primer post..."
                onSave={handleCreatePost}
                submitLabel="Crear Primer Post"
              />
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
