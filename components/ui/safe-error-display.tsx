import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface SafeErrorDisplayProps {
  error: string | null;
  className?: string;
}

export function SafeErrorDisplay({ error, className = '' }: SafeErrorDisplayProps) {
  if (!error) return null;

  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        {error}
      </AlertDescription>
    </Alert>
  );
}