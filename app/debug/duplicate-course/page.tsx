"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { courseService } from "@/app/lib/course-service"

export default function TestDuplicateCourse() {
  const [formData, setFormData] = useState({
    nrcOriginal: 0,
    nuevoNrc: 0,
    nuevoNombre: "",
    nuevaDescripcion: "",
    activo: true
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await courseService.duplicateCourse({
        nrcOriginal: formData.nrcOriginal,
        nuevoNrc: formData.nuevoNrc,
        nuevoNombre: formData.nuevoNombre,
        nuevaDescripcion: formData.nuevaDescripcion,
        activo: formData.activo
      })

      toast({
        title: "Éxito",
        description: "Curso duplicado exitosamente",
      })

      console.log("Curso duplicado:", result)

      // Reset form
      setFormData({
        nrcOriginal: 0,
        nuevoNrc: 0,
        nuevoNombre: "",
        nuevaDescripcion: "",
        activo: true
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al duplicar curso",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Prueba de Duplicación de Cursos</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nrcOriginal">NRC Original *</Label>
              <Input
                id="nrcOriginal"
                type="number"
                value={formData.nrcOriginal || ""}
                onChange={(e) => setFormData({ ...formData, nrcOriginal: parseInt(e.target.value) || 0 })}
                required
                min="1"
                placeholder="NRC del curso a duplicar"
              />
            </div>

            <div>
              <Label htmlFor="nuevoNrc">Nuevo NRC *</Label>
              <Input
                id="nuevoNrc"
                type="number"
                value={formData.nuevoNrc || ""}
                onChange={(e) => setFormData({ ...formData, nuevoNrc: parseInt(e.target.value) || 0 })}
                required
                min="1"
                placeholder="NRC para el nuevo curso"
              />
            </div>

            <div>
              <Label htmlFor="nuevoNombre">Nuevo Nombre *</Label>
              <Input
                id="nuevoNombre"
                value={formData.nuevoNombre}
                onChange={(e) => setFormData({ ...formData, nuevoNombre: e.target.value })}
                required
                maxLength={70}
                placeholder="Nombre del nuevo curso"
              />
            </div>

            <div>
              <Label htmlFor="nuevaDescripcion">Nueva Descripción</Label>
              <Textarea
                id="nuevaDescripcion"
                value={formData.nuevaDescripcion}
                onChange={(e) => setFormData({ ...formData, nuevaDescripcion: e.target.value })}
                maxLength={250}
                placeholder="Descripción del nuevo curso (opcional)"
                rows={3}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Duplicando..." : "Duplicar Curso"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
