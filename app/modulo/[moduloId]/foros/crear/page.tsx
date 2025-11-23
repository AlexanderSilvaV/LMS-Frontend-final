'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { foroService } from '@/app/lib/services/foro-service';
import { ForoCreacionDTO } from '@/app/lib/types/foro-types';
import { validateForoTitle, validateForoDescription } from '@/app/lib/utils/foro-utils';

export default function CrearForoPage() {
  const params = useParams();
  const router = useRouter();
  const moduloId = parseInt(params.moduloId as string);

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const titleError = validateForoTitle(formData.titulo);
    if (titleError) newErrors.titulo = titleError;

    const descriptionError = validateForoDescription(formData.descripcion);
    if (descriptionError) newErrors.descripcion = descriptionError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const dto: ForoCreacionDTO = {
        moduloId,
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim() || undefined
      };

      const response = await foroService.crearForo(dto);
      
      if (response.operacionExitosa) {
        router.push(`/modulo/${moduloId}/foros`);
      } else {
        setErrors({ general: response.mensaje });
      }
    } catch (error) {
      setErrors({ 
        general: error instanceof Error ? error.message : 'Error al crear el foro' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Crear Nuevo Foro</h1>
      </div>

      {/* Formulario */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="titulo">Título del Foro *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => handleInputChange('titulo', e.target.value)}
              placeholder="Ingresa el título del foro"
              className={errors.titulo ? 'border-red-500' : ''}
              maxLength={120}
            />
            {errors.titulo && (
              <p className="text-sm text-red-600">{errors.titulo}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.titulo.length}/120 caracteres
            </p>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción (Opcional)</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              placeholder="Describe el propósito y las reglas del foro"
              rows={4}
              className={errors.descripcion ? 'border-red-500' : ''}
              maxLength={2000}
            />
            {errors.descripcion && (
              <p className="text-sm text-red-600">{errors.descripcion}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.descripcion.length}/2,000 caracteres
            </p>
          </div>

          {/* Error general */}
          {errors.general && (
            <div className="p-4 border border-red-200 bg-red-50 rounded">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isSubmitting || !formData.titulo.trim()}
            >
              {isSubmitting ? 'Creando...' : 'Crear Foro'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
