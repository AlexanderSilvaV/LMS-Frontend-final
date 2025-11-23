import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { ForoListItemDTO } from '@/app/lib/types/foro-types';
import { ForoStatusBadge } from './foro-status-badge';
import { formatDate } from '@/app/lib/utils/foro-utils';

interface ForoCardProps {
  foro: ForoListItemDTO;
  canEdit: boolean;
  onStatusChange?: (foroId: number, nuevoEstado: string) => void;
  onDelete?: (foroId: number) => void;
}

export function ForoCard({ foro, canEdit, onStatusChange, onDelete }: ForoCardProps) {
  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Link 
              href={`/modulo/${foro.moduloId}/foros/${foro.foroId}`}
              className="text-lg font-semibold hover:text-unab-navy dark:hover:text-unab-navy-light transition-colors"
            >
              {foro.titulo}
            </Link>
            <ForoStatusBadge estado={foro.estado} />
          </div>
          <p className="text-muted-foreground text-sm">
            Creado: {formatDate(foro.fechaCreacion)}
          </p>
        </div>
        
        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <Link href={`/modulo/${foro.moduloId}/foros/${foro.foroId}/editar`}>
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onStatusChange?.(foro.foroId, foro.estado === 'Activo' ? 'Cerrado' : 'Activo')}
              >
                {foro.estado === 'Activo' ? 'Cerrar' : 'Abrir'}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onStatusChange?.(foro.foroId, 'Archivado')}
              >
                Archivar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete?.(foro.foroId)}
                className="text-unab-red"
              >
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </Card>
  );
}
