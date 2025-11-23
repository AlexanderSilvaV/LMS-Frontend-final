import { EstadoForo } from '@/app/lib/types/foro-types';
import { getEstadoColor } from '@/app/lib/utils/foro-utils';
import { Badge } from '@/components/ui/badge';

interface ForoStatusBadgeProps {
  estado: EstadoForo;
  className?: string;
}

export function ForoStatusBadge({ estado, className }: ForoStatusBadgeProps) {
  return (
    <Badge 
      variant="outline" 
      className={`${getEstadoColor(estado)} ${className}`}
    >
      {estado}
    </Badge>
  );
}
