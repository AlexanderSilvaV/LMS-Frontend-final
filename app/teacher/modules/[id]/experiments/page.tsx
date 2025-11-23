"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Plus, Beaker, Clock, Users, Target, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { ExperimentService, type Experiment } from "@/app/lib/experiment-service"
import { moduleService, type Module } from "@/app/lib/module-service"

export default function ModuleExperimentsPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number.parseInt(params.id as string)

  const [module, setModule] = useState<Module | null>(null)
  const [assignedExperiments, setAssignedExperiments] = useState<Experiment[]>([])
  const [availableExperiments, setAvailableExperiments] = useState<Experiment[]>([])
  const [loading, setLoading] = useState(true)
  const [showAssignDialog, setShowAssignDialog] = useState(false)

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)

      // Como moduleService no tiene getModules(), creamos un módulo básico
      // o necesitamos el courseId para usar getModulesByCourse
      setModule({
        moduloId: id,
        nombre: `Módulo ${id}`,
        indice: 1,
        esPredeterminado: false,
        cursoId: 1 // Valor temporal - se necesitaría el courseId real
      })

      // Cargar todos los experimentos y filtrar por módulo
      const allExperiments = await ExperimentService.getExperiments()
      const moduleExperiments = allExperiments.filter((exp: Experiment) => exp.moduloId === id)
      setAssignedExperiments(moduleExperiments)

      // Cargar todos los experimentos para mostrar los disponibles
      const available = allExperiments.filter((exp: Experiment) => !exp.moduloId || exp.moduloId !== id)
      setAvailableExperiments(available)
    } catch (error) {
      console.error("Error loading module experiments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignExperiment = async (experimentId: string) => {
    try {
      await ExperimentService.addExperimentToModule(experimentId, id)

      // Actualizar las listas localmente
      const experiment = availableExperiments.find((exp) => exp.id === experimentId)
      if (experiment) {
        setAssignedExperiments([...assignedExperiments, { ...experiment, moduloId: id }])
        setAvailableExperiments(availableExperiments.filter((exp) => exp.id !== experimentId))
      }

      setShowAssignDialog(false)
    } catch (error) {
      console.error("Error assigning experiment:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar role="teacher" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando experimentos del módulo...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!module) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar role="teacher" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Módulo no encontrado</h2>
            <Button onClick={() => router.back()}>Volver</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar role="teacher" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <Link href="/teacher/modules">
                  <Button variant="ghost" size="sm" className="mr-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver a Módulos
                  </Button>
                </Link>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Experimentos - {module.nombre}</h1>
                  <p className="text-gray-600">Gestiona los experimentos asignados a este módulo</p>
                </div>

                <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Asignar Experimento
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Asignar Experimento al Módulo</DialogTitle>
                      <DialogDescription>Selecciona un experimento para asignar a {module.nombre}</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      {availableExperiments.length > 0 ? (
                        <div className="space-y-2">
                          {availableExperiments.map((experiment) => (
                            <div
                              key={experiment.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div>
                                <h4 className="font-medium">{experiment.nombre}</h4>
                                <p className="text-sm text-gray-600">{experiment.descripcion}</p>
                                <div className="flex space-x-2 mt-1">
                                  <Badge variant="outline">{experiment.tipo}</Badge>
                                  <Badge variant="outline">{experiment.dificultad}</Badge>
                                </div>
                              </div>
                              <Button size="sm" onClick={() => handleAssignExperiment(experiment.id)}>
                                Asignar
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            No hay experimentos disponibles para asignar. Todos los experimentos ya están asignados a
                            módulos.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Experimentos Asignados */}
            <div className="space-y-6">
              {assignedExperiments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {assignedExperiments.map((experiment) => (
                    <Card key={experiment.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-2">{experiment.nombre}</CardTitle>
                            <CardDescription className="text-sm mb-3 text-unab-gray-600 dark:text-white">{experiment.descripcion}</CardDescription>
                          </div>
                          <Beaker className="h-6 w-6 text-purple-600 flex-shrink-0" />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{experiment.tipo}</Badge>
                          <Badge variant="outline">{experiment.dificultad}</Badge>
                          <Badge className="bg-green-100 text-green-800">Asignado</Badge>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-2" />
                            Duración: {experiment.duracionEstimada} minutos
                          </div>

                          <div className="flex items-center text-sm text-gray-600">
                            <Target className="h-4 w-4 mr-2" />
                            {experiment.objetivos.length} objetivos de aprendizaje
                          </div>

                          <div className="space-y-2">
                            <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">Materiales:</h5>
                            <div className="text-xs text-gray-600">
                              {experiment.materiales.slice(0, 3).map((material, index) => (
                                <span key={index} className="inline-block bg-gray-100 rounded px-2 py-1 mr-1 mb-1">
                                  {material}
                                </span>
                              ))}
                              {experiment.materiales.length > 3 && (
                                <span className="text-gray-500">+{experiment.materiales.length - 3} más</span>
                              )}
                            </div>
                          </div>

                          <div className="flex space-x-2 mt-4">
                            <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                              <Users className="h-4 w-4 mr-1" />
                              Ver Resultados
                            </Button>
                            <Button size="sm" className="flex-1">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Gestionar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Beaker className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No hay experimentos asignados</h3>
                  <p className="text-gray-600 mb-4">
                    Este módulo aún no tiene experimentos asignados. Comienza agregando experimentos para enriquecer el
                    contenido.
                  </p>
                  <Button onClick={() => setShowAssignDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Asignar Primer Experimento
                  </Button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
