import Link from 'next/link';
import { Pin, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { HiloListItemDTO } from '@/app/lib/types/foro-types';
import { formatRelativeTime } from '@/app/lib/utils/foro-utils';
import { cn } from '@/lib/utils';

interface HiloListItemProps {
  hilo: HiloListItemDTO;
  canModerate: boolean;
  onPin?: (hiloId: number, order: number) => void;
  onUnpin?: (hiloId: number) => void;
  onClose?: (hiloId: number, cerrado: boolean) => void;
}

export function HiloListItem({ 
  hilo, 
  canModerate, 
  onPin, 
  onUnpin, 
  onClose 
}: HiloListItemProps) {
  return (
    <div className={cn(
      "flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors",
      hilo.pinned && "bg-unab-navy/5 border-unab-navy/20"
    )}>
      <div className="flex items-center gap-3 flex-1">
        {hilo.pinned && <Pin className="h-4 w-4 text-unab-navy" />}
        {hilo.cerrado && <Lock className="h-4 w-4 text-unab-red" />}
        
        <div className="flex-1">
          <Link 
            href={`/modulo/${hilo.foroId}/foros/${hilo.foroId}/hilos/${hilo.hiloId}`}
            className="font-medium hover:text-unab-navy dark:hover:text-unab-navy-light transition-colors block"
          >
            {hilo.titulo}
          </Link>
          <div className="text-sm text-muted-foreground mt-1">
            Por {hilo.autorId} • {formatRelativeTime(hilo.lastActivityAt)}
          </div>
        </div>
      </div>
      
      {canModerate && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {hilo.pinned ? (
              <DropdownMenuItem onClick={() => onUnpin?.(hilo.hiloId)}>
                Quitar fijado
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onPin?.(hilo.hiloId, 1)}>
                Fijar hilo
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              onClick={() => onClose?.(hilo.hiloId, !hilo.cerrado)}
            >
              {hilo.cerrado ? 'Abrir hilo' : 'Cerrar hilo'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
