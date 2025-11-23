import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { validatePostContent, sanitizeTextInput, createSafeErrorMessage } from '@/app/lib/utils/foro-utils';

interface PostEditorProps {
  initialContent?: string;
  placeholder?: string;
  onSave: (content: string) => void;
  onCancel?: () => void;
  submitLabel?: string;
}

export function PostEditor({
  initialContent = '',
  placeholder = 'Escribe tu mensaje...',
  onSave,
  onCancel,
  submitLabel = 'Guardar'
}: PostEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const sanitizedContent = sanitizeTextInput(content);
    const validationError = validatePostContent(sanitizedContent);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(sanitizedContent.trim());
      setContent('');
      setError(null);
    } catch (error) {
      setError(createSafeErrorMessage(error, 'Error al guardar el contenido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        value={content}
        onChange={(e) => {
          const sanitizedValue = sanitizeTextInput(e.target.value);
          setContent(sanitizedValue);
          if (error) setError(null);
        }}
        placeholder={placeholder}
        rows={6}
        className={error ? 'border-red-500' : ''}
      />
      
      {error && (
        <p className="text-sm text-unab-red">{error}</p>
      )}
      
      <div className="flex items-center gap-2">
        <Button 
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
        >
          {isSubmitting ? 'Guardando...' : submitLabel}
        </Button>
        
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
      
      <div className="text-xs text-muted-foreground">
        {content.length}/10,000 caracteres
      </div>
    </div>
  );
}
