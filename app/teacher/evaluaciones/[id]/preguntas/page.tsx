"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import {
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Save,
  X,
  Eye,
  BarChart3,
  CheckCircle2,
  Circle,
  GripVertical,
  Clock,
  Target,
  Users,
  BookOpen,
  Sparkles,
  FileQuestion,
  Settings
} from 'lucide-react';
import { EvaluacionDTO, PreguntaDTO, PreguntaCreacionDTO, OpcionCreacionDTO } from '@/DTOs/EvaluacionDTOs';
import { evaluacionService } from '@/app/lib/evaluacion-service';
import Link from 'next/link';

export default function PreguntasEvaluacionPage() {
  const params = useParams();
  const router = useRouter();
  const evaluacionId = parseInt(params.id as string);

  const [evaluacion, setEvaluacion] = useState<EvaluacionDTO | null>(null);
  const [preguntas, setPreguntas] = useState<PreguntaDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPregunta, setEditingPregunta] = useState<PreguntaDTO | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState("questions");

  // Estado del formulario de pregunta
  const [formData, setFormData] = useState<PreguntaCreacionDTO>({
    texto: '',
    orden: 1,
    puntos: 1,
    opciones: [
      { texto: '', esCorrecta: false, orden: 1 },
      { texto: '', esCorrecta: false, orden: 2 },
    ]
  });

  useEffect(() => {
    cargarEvaluacion();
  }, [evaluacionId]);

  const cargarEvaluacion = async () => {
    try {
      setLoading(true);
      const evaluacionData = await evaluacionService.obtenerEvaluacion(evaluacionId);
      setEvaluacion(evaluacionData);
      setPreguntas(evaluacionData.preguntas || []);

      // Establecer el orden de la siguiente pregunta
      const siguienteOrden = (evaluacionData.preguntas?.length || 0) + 1;
      setFormData(prev => ({ ...prev, orden: siguienteOrden }));
    } catch (error) {
      console.error('Error al cargar evaluación:', error);
      toast({
        title: "Error",
        description: "Error al cargar la evaluación",
        variant: "destructive",
      });
      router.push('/teacher/evaluaciones');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    const siguienteOrden = preguntas.length + 1;
    setFormData({
      texto: '',
      orden: siguienteOrden,
      puntos: 1,
      opciones: [
        { texto: '', esCorrecta: false, orden: 1 },
        { texto: '', esCorrecta: false, orden: 2 },
      ]
    });
    setEditingPregunta(null);
  };

  const agregarOpcion = () => {
    const nuevaOpcion: OpcionCreacionDTO = {
      texto: '',
      esCorrecta: false,
      orden: formData.opciones.length + 1
    };
    setFormData({
      ...formData,
      opciones: [...formData.opciones, nuevaOpcion]
    });
  };

  const eliminarOpcion = (index: number) => {
    if (formData.opciones.length <= 2) {
      toast({
        title: "Error",
        description: "Debe haber al menos 2 opciones",
        variant: "destructive",
      });
      return;
    }

    const nuevasOpciones = formData.opciones.filter((_, i) => i !== index)
      .map((opcion, i) => ({ ...opcion, orden: i + 1 }));

    setFormData({
      ...formData,
      opciones: nuevasOpciones
    });
  };

  const actualizarOpcion = (index: number, campo: keyof OpcionCreacionDTO, valor: any) => {
    const nuevasOpciones = [...formData.opciones];
    nuevasOpciones[index] = { ...nuevasOpciones[index], [campo]: valor };
    setFormData({
      ...formData,
      opciones: nuevasOpciones
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.texto.trim()) {
      toast({
        title: "Error",
        description: "El texto de la pregunta es obligatorio",
        variant: "destructive",
      });
      return;
    }

    // Validar que haya al menos una opción correcta
    const tieneOpcionCorrecta = formData.opciones.some(opcion => opcion.esCorrecta && opcion.texto.trim());
    if (!tieneOpcionCorrecta) {
      toast({
        title: "Error",
        description: "Debe haber al menos una opción correcta",
        variant: "destructive",
      });
      return;
    }

    // Validar que todas las opciones tengan texto
    const opcionesVacias = formData.opciones.some(opcion => !opcion.texto.trim());
    if (opcionesVacias) {
      toast({
        title: "Error",
        description: "Todas las opciones deben tener texto",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingPregunta) {
        // Actualizar pregunta existente - funcionalidad pendiente
        toast({
          title: "Información",
          description: "La edición de preguntas se implementará próximamente",
          variant: "default",
        });
      } else {
        // Crear nueva pregunta - funcionalidad pendiente
        toast({
          title: "Información",
          description: "La creación de preguntas se implementará próximamente",
          variant: "default",
        });
      }

      await cargarEvaluacion();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error al guardar pregunta:', error);
      toast({
        title: "Error",
        description: "Error al guardar la pregunta",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (pregunta: PreguntaDTO) => {
    setEditingPregunta(pregunta);
    setFormData({
      texto: pregunta.texto,
      orden: pregunta.orden,
      puntos: pregunta.puntos,
      opciones: pregunta.opciones.map(opcion => ({
        texto: opcion.texto,
        esCorrecta: opcion.esCorrecta,
        orden: opcion.orden
      }))
    });
    setDialogOpen(true);
  };

  const handleDelete = async (preguntaId: number) => {
    try {
      // Nota: Este endpoint debe implementarse en el backend
      toast({
        title: "Información",
        description: "La eliminación de preguntas se implementará próximamente",
        variant: "default",
      });
    } catch (error) {
      console.error('Error al eliminar pregunta:', error);
      toast({
        title: "Error",
        description: "Error al eliminar la pregunta",
        variant: "destructive",
      });
    }
  };

  // Calcular estadísticas
  const estadisticas = {
    totalPreguntas: preguntas.length,
    totalPuntos: preguntas.reduce((sum, p) => sum + p.puntos, 0),
    promedioPuntos: preguntas.length > 0 ? Math.round(preguntas.reduce((sum, p) => sum + p.puntos, 0) / preguntas.length * 10) / 10 : 0,
    opcionesPromedio: preguntas.length > 0 ? Math.round(preguntas.reduce((sum, p) => sum + p.opciones.length, 0) / preguntas.length * 10) / 10 : 0
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-unab-gray-50 via-white to-unab-gray-100 dark:from-unab-navy-dark dark:via-unab-navy dark:to-unab-navy-dark">
        <Card className="w-full max-w-md bg-white dark:bg-unab-gray-800 border-unab-gray-200 dark:border-unab-gray-700">
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-unab-navy mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-unab-gray-900 dark:text-white">Cargando evaluación...</h3>
            <p className="text-unab-gray-600 dark:text-unab-gray-400 mt-2">
              Por favor espera un momento
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!evaluacion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-unab-gray-50 via-white to-unab-gray-100 dark:from-unab-navy-dark dark:via-unab-navy dark:to-unab-navy-dark">
        <Card className="w-full max-w-md bg-white dark:bg-unab-gray-800 border-unab-gray-200 dark:border-unab-gray-700">
          <CardContent className="text-center py-12">
            <FileQuestion className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-unab-gray-900 dark:text-white">Evaluación no encontrada</h3>
            <p className="text-muted-foreground dark:text-unab-gray-400 mb-6">
              La evaluación que buscas no existe o ha sido eliminada.
            </p>
            <Link href="/teacher/evaluaciones">
              <Button className="bg-unab-navy hover:bg-unab-navy-dark text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Evaluaciones
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-unab-gray-50 via-white to-unab-gray-100 dark:from-unab-navy-dark dark:via-unab-navy dark:to-unab-navy-dark">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header con gradiente institucional */}
        <div className="bg-gradient-to-r from-unab-navy via-unab-navy-light to-unab-navy dark:from-unab-navy-dark dark:via-unab-navy dark:to-unab-navy-dark rounded-2xl p-8 mb-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/teacher/evaluaciones">
                <Button variant="secondary" size="sm" className="bg-white/10 hover:bg-white/20 border-white/20 text-white hover:text-white dark:bg-white/20 dark:hover:bg-white/30 dark:text-white dark:hover:text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold mb-2">{evaluacion.titulo}</h1>
                <p className="text-unab-gray-200 dark:text-unab-gray-100 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Gestiona las preguntas de tu evaluación
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
                className="bg-white/10 hover:bg-white/20 border-white/20 text-white hover:text-white dark:bg-white/20 dark:hover:bg-white/30 dark:text-white dark:hover:text-white"
              >
                <Eye className="h-4 w-4 mr-2" />
                {previewMode ? 'Editar' : 'Vista Previa'}
              </Button>
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 dark:bg-white/5 rounded-lg p-4 backdrop-blur-sm border border-white/20 dark:border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <FileQuestion className="h-4 w-4" />
                <span className="text-sm font-medium">Preguntas</span>
              </div>
              <p className="text-2xl font-bold text-white dark:text-white">{estadisticas.totalPreguntas}</p>
            </div>
            <div className="bg-white/10 dark:bg-white/5 rounded-lg p-4 backdrop-blur-sm border border-white/20 dark:border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4" />
                <span className="text-sm font-medium">Puntos Total</span>
              </div>
              <p className="text-2xl font-bold text-white dark:text-white">{estadisticas.totalPuntos}</p>
            </div>
            <div className="bg-white/10 dark:bg-white/5 rounded-lg p-4 backdrop-blur-sm border border-white/20 dark:border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm font-medium">Promedio</span>
              </div>
              <p className="text-2xl font-bold text-white dark:text-white">{estadisticas.promedioPuntos} pts</p>
            </div>
            <div className="bg-white/10 dark:bg-white/5 rounded-lg p-4 backdrop-blur-sm border border-white/20 dark:border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <Settings className="h-4 w-4 text-unab-red dark:text-unab-red-light" />
                <span className="text-sm font-medium">Opciones</span>
              </div>
              <p className="text-2xl font-bold text-white dark:text-white">{estadisticas.opcionesPromedio}</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-unab-gray-800 shadow-sm border-unab-gray-200 dark:border-unab-gray-700">
            <TabsTrigger value="questions" className="flex items-center gap-2 data-[state=active]:bg-unab-navy data-[state=active]:text-white">
              <FileQuestion className="h-4 w-4" />
              Preguntas
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2 data-[state=active]:bg-unab-navy data-[state=active]:text-white">
              <Eye className="h-4 w-4" />
              Vista Previa
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2 data-[state=active]:bg-unab-navy data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4" />
              Estadísticas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="space-y-6">
            {/* Barra de acciones */}
            <Card className="shadow-sm bg-white dark:bg-unab-gray-800 border-unab-gray-200 dark:border-unab-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="px-3 py-1 border-unab-gray-300 dark:border-unab-gray-600 text-unab-gray-700 dark:text-unab-gray-300">
                      {preguntas.length} pregunta{preguntas.length !== 1 ? 's' : ''}
                    </Badge>
                    <Badge variant="secondary" className="px-3 py-1 bg-unab-navy/10 dark:bg-unab-navy/20 text-white dark:text-unab-navy-light border-unab-navy/20 dark:border-unab-navy/30">
                      {estadisticas.totalPuntos} puntos total
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1 border-unab-gray-300 dark:border-unab-gray-600 text-unab-gray-700 dark:text-unab-gray-300">
                      {evaluacion.intentosMaximos} intento{evaluacion.intentosMaximos !== 1 ? 's' : ''} máximo
                    </Badge>
                  </div>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={resetForm} className="bg-gradient-to-r from-unab-navy to-unab-navy-light hover:from-unab-navy-dark hover:to-unab-navy text-white dark:from-unab-navy-dark dark:to-unab-navy dark:hover:from-unab-navy dark:hover:to-unab-navy-dark">
                        <Plus className="h-4 w-4 mr-2" />
                        Nueva Pregunta
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-unab-gray-800 border-unab-gray-200 dark:border-unab-gray-700">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-unab-gray-900 dark:text-white">
                          <Sparkles className="h-5 w-5 text-unab-red" />
                          {editingPregunta ? 'Editar Pregunta' : 'Crear Nueva Pregunta'}
                        </DialogTitle>
                        <DialogDescription className="text-unab-gray-600 dark:text-unab-gray-400">
                          {editingPregunta ? 'Modifica la pregunta y sus opciones' : 'Crea una nueva pregunta con opciones múltiples'}
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="col-span-2">
                            <Label htmlFor="texto" className="text-sm font-medium text-unab-gray-700 dark:text-unab-gray-300">Texto de la Pregunta *</Label>
                            <Textarea
                              id="texto"
                              value={formData.texto}
                              onChange={(e) => setFormData({ ...formData, texto: e.target.value })}
                              placeholder="Escribe aquí la pregunta..."
                              rows={4}
                              className="mt-1 border-unab-gray-300 dark:border-unab-gray-600 bg-white dark:bg-unab-gray-700 text-unab-gray-900 dark:text-white"
                              required
                            />
                          </div>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="orden" className="text-sm font-medium text-unab-gray-700 dark:text-unab-gray-300">Orden</Label>
                              <Input
                                id="orden"
                                type="number"
                                min="1"
                                value={formData.orden}
                                onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) })}
                                className="mt-1 border-unab-gray-300 dark:border-unab-gray-600 bg-white dark:bg-unab-gray-700 text-unab-gray-900 dark:text-white"
                              />
                            </div>
                            <div>
                              <Label htmlFor="puntos" className="text-sm font-medium text-unab-gray-700 dark:text-unab-gray-300">Puntos</Label>
                              <Input
                                id="puntos"
                                type="number"
                                min="1"
                                max="100"
                                value={formData.puntos}
                                onChange={(e) => setFormData({ ...formData, puntos: parseInt(e.target.value) })}
                                className="mt-1 border-unab-gray-300 dark:border-unab-gray-600 bg-white dark:bg-unab-gray-700 text-unab-gray-900 dark:text-white"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <Label className="text-sm font-medium text-unab-gray-700 dark:text-unab-gray-300">Opciones de Respuesta</Label>
                            <Button type="button" variant="outline" size="sm" onClick={agregarOpcion} className="border-unab-gray-300 dark:border-unab-gray-600 text-unab-gray-700 dark:text-unab-gray-300 hover:bg-unab-gray-50 dark:hover:bg-unab-gray-700">
                              <Plus className="h-4 w-4 mr-2" />
                              Agregar Opción
                            </Button>
                          </div>
                          <div className="space-y-3">
                            {formData.opciones.map((opcion, index) => (
                              <div key={index} className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-unab-gray-700 transition-colors border-unab-gray-200 dark:border-unab-gray-600 bg-white dark:bg-unab-gray-800">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`correcta-${index}`}
                                    checked={opcion.esCorrecta}
                                    onCheckedChange={(checked) =>
                                      actualizarOpcion(index, 'esCorrecta', checked)
                                    }
                                    className="border-unab-gray-300 dark:border-unab-gray-600"
                                  />
                                  <Label htmlFor={`correcta-${index}`} className="text-sm font-medium text-unab-gray-700 dark:text-unab-gray-300">
                                    Correcta
                                  </Label>
                                </div>
                                <Input
                                  placeholder={`Opción ${index + 1}`}
                                  value={opcion.texto}
                                  onChange={(e) => actualizarOpcion(index, 'texto', e.target.value)}
                                  className="flex-1 border-unab-gray-300 dark:border-unab-gray-600 bg-white dark:bg-unab-gray-700 text-unab-gray-900 dark:text-white"
                                />
                                {formData.opciones.length > 2 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => eliminarOpcion(index)}
                                    className="text-unab-red hover:text-unab-red-dark hover:bg-unab-red/5 dark:border-unab-red/30 dark:hover:bg-unab-red/10"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-unab-gray-300 dark:border-unab-gray-600 text-unab-gray-700 dark:text-unab-gray-300 hover:bg-unab-gray-50 dark:hover:bg-unab-gray-700">
                            Cancelar
                          </Button>
                          <Button type="submit" className="bg-gradient-to-r from-unab-navy to-unab-navy-light hover:from-unab-navy-dark hover:to-unab-navy text-white dark:from-unab-navy-dark dark:to-unab-navy dark:hover:from-unab-navy dark:hover:to-unab-navy-dark">
                            <Save className="h-4 w-4 mr-2" />
                            {editingPregunta ? 'Actualizar' : 'Guardar'} Pregunta
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Lista de preguntas */}
            <div className="space-y-4">
              {preguntas.map((pregunta, index) => (
                <Card key={pregunta.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-unab-navy bg-white dark:bg-unab-gray-800 border-unab-gray-200 dark:border-unab-gray-700">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-gray-400 dark:text-unab-gray-500" />
                            <span className="text-sm font-medium text-muted-foreground dark:text-unab-gray-400">#{pregunta.orden}</span>
                          </div>
                          <CardTitle className="text-lg text-unab-gray-900 dark:text-white">{pregunta.texto}</CardTitle>
                          <Badge variant="secondary" className="bg-unab-navy/10 dark:bg-unab-navy/20 text-white dark:text-unab-navy-light border-unab-navy/20 dark:border-unab-navy/30">
                            {pregunta.puntos} pts
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(pregunta)} className="hover:bg-unab-navy/5 border-unab-gray-300 dark:border-unab-gray-600 dark:hover:bg-unab-navy/10">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="hover:bg-unab-red/5 text-unab-red border-unab-red/20 hover:text-unab-red-dark dark:border-unab-red/30 dark:hover:bg-unab-red/10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white dark:bg-unab-gray-800 border-unab-gray-200 dark:border-unab-gray-700">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-unab-gray-900 dark:text-white">¿Eliminar pregunta?</AlertDialogTitle>
                              <AlertDialogDescription className="text-unab-gray-600 dark:text-unab-gray-400">
                                Esta acción eliminará permanentemente la pregunta y todas sus opciones.
                                Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-unab-gray-300 dark:border-unab-gray-600 text-unab-gray-700 dark:text-unab-gray-300 hover:bg-unab-gray-50 dark:hover:bg-unab-gray-700">Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(pregunta.id)} className="bg-unab-red hover:bg-unab-red-dark dark:bg-unab-red-dark dark:hover:bg-unab-red">
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pregunta.opciones.map((opcion, opcionIndex) => (
                        <div key={opcionIndex} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                          opcion.esCorrecta
                            ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-600'
                            : 'bg-gray-50 border border-gray-200 dark:bg-unab-gray-700 dark:border-unab-gray-600'
                        }`}>
                          <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${
                            opcion.esCorrecta
                              ? 'bg-green-500 border-green-500 text-white dark:bg-green-600 dark:border-green-600'
                              : 'border-gray-300 dark:border-unab-gray-500'
                          }`}>
                            {opcion.esCorrecta ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <Circle className="h-3 w-3" />
                            )}
                          </div>
                          <span className={`flex-1 ${opcion.esCorrecta ? 'font-medium text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-unab-gray-300'}`}>
                            {opcion.texto}
                          </span>
                          {opcion.esCorrecta && (
                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-600">
                              Correcta
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card className="bg-white dark:bg-unab-gray-800 border-unab-gray-200 dark:border-unab-gray-700">
              <CardHeader>
                <CardTitle className="text-unab-gray-900 dark:text-white">Vista Previa de la Evaluación</CardTitle>
                <CardDescription className="text-unab-gray-600 dark:text-unab-gray-400">
                  Esta es como se verá la evaluación para los estudiantes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {preguntas.map((pregunta, index) => (
                  <div key={pregunta.id} className="border-b border-unab-gray-200 dark:border-unab-gray-600 pb-6 last:border-b-0">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-unab-navy text-white text-sm font-medium flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-unab-gray-900 dark:text-white mb-4">{pregunta.texto}</h3>
                        <div className="space-y-3">
                          {pregunta.opciones.map((opcion, opcionIndex) => (
                            <div key={opcionIndex} className="flex items-center gap-3 p-3 rounded-lg border border-unab-gray-200 dark:border-unab-gray-600 bg-white dark:bg-unab-gray-800 hover:bg-unab-gray-50 dark:hover:bg-unab-gray-700 transition-colors">
                              <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-unab-gray-300 dark:border-unab-gray-500">
                                <div className="w-3 h-3 rounded-full bg-unab-gray-300 dark:bg-unab-gray-500"></div>
                              </div>
                              <span className="text-unab-gray-700 dark:text-unab-gray-300">{opcion.texto}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 text-sm text-unab-gray-500 dark:text-unab-gray-400">
                          {pregunta.puntos} punto{pregunta.puntos !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {preguntas.length === 0 && (
                  <div className="text-center py-12">
                    <FileQuestion className="h-16 w-16 text-unab-gray-300 dark:text-unab-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-unab-gray-900 dark:text-white mb-2">No hay preguntas aún</h3>
                    <p className="text-unab-gray-600 dark:text-unab-gray-400">
                      Crea tu primera pregunta para comenzar con la evaluación
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white dark:bg-unab-gray-800 border-unab-gray-200 dark:border-unab-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-unab-navy/10 dark:bg-unab-navy/20">
                      <FileQuestion className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-unab-gray-600 dark:text-unab-gray-400">Total de Preguntas</p>
                      <p className="text-2xl font-bold text-unab-gray-900 dark:text-white">{estadisticas.totalPreguntas}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-unab-gray-800 border-unab-gray-200 dark:border-unab-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-unab-red/10 dark:bg-unab-red/20">
                      <Target className="h-6 w-6 text-unab-red" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-unab-gray-600 dark:text-unab-gray-400">Puntos Totales</p>
                      <p className="text-2xl font-bold text-unab-gray-900 dark:text-white">{estadisticas.totalPuntos}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-unab-gray-800 border-unab-gray-200 dark:border-unab-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-unab-navy/10 dark:bg-unab-navy/20">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-unab-gray-600 dark:text-unab-gray-400">Promedio por Pregunta</p>
                      <p className="text-2xl font-bold text-unab-gray-900 dark:text-white">{estadisticas.promedioPuntos} pts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-unab-gray-800 border-unab-gray-200 dark:border-unab-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-unab-red/10 dark:bg-unab-red/20">
                      <Settings className="h-6 w-6 text-unab-red" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-unab-gray-600 dark:text-unab-gray-400">Opciones Promedio</p>
                      <p className="text-2xl font-bold text-unab-gray-900 dark:text-white">{estadisticas.opcionesPromedio}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
