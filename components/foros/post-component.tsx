import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { PostDTO } from '@/app/lib/types/foro-types';
import { formatDate, sanitizeHtml } from '@/app/lib/utils/foro-utils';
import { PostEditor } from './post-editor';

interface PostComponentProps {
  post: PostDTO;
  canEdit: boolean;
  onEdit?: (postId: number, content: string) => void;
  onDelete?: (postId: number) => void;
}

export function PostComponent({ post, canEdit, onEdit, onDelete }: PostComponentProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  const handleSave = (content: string) => {
    onEdit?.(post.postId, content);
    setIsEditing(false);
  };

  if (post.softDeleted) {
    return (
      <Card className="p-6 bg-gray-50">
        <div className="text-muted-foreground italic">
          [Post eliminado]
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            {post.avatarUrl && (
              <AvatarImage
                src={post.avatarUrl}
                alt={post.autorNombre || post.autorId}
              />
            )}
            <AvatarFallback>
              {(post.autorNombre || post.autorId).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{post.autorNombre || post.autorId}</p>
            <p className="text-sm text-muted-foreground">
              {formatDate(post.fechaCreacion)}
              {post.editado && post.editedAt && (
                <span className="ml-2 text-xs">
                  (editado: {formatDate(post.editedAt)})
                </span>
              )}
            </p>
          </div>
        </div>
        
        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete?.(post.postId)} 
                className="text-unab-red"
              >
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      {isEditing ? (
        <PostEditor 
          initialContent={post.contenido}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div className="prose max-w-none">
          <div 
            dangerouslySetInnerHTML={{ 
              __html: sanitizeHtml(post.contenido.replace(/\n/g, '<br>')) 
            }} 
          />
        </div>
      )}
    </Card>
  );
}
