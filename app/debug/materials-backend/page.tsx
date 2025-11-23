"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Link, Video, FileText } from "lucide-react"

export default function MaterialsBackendDebug() {
  const [moduleId, setModuleId] = useState("")
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Test data
  const [testMaterial, setTestMaterial] = useState({
    nombre: "Material de Prueba",
    tipo: "Enlace",
    ruta: "https://example.com",
    moduloId: 0,
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const testGetMaterials = async () => {
    if (!moduleId) {
      setError("Ingresa un ID de módulo")
      return
    }

    try {
      setLoading(true)
      setError("")

      const token = localStorage.getItem("token")
      const response = await fetch(`/api/materials/modulo/${moduleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("Response status:", response.status)
      const data = await response.json()
      console.log("Response data:", data)

      if (response.ok) {
        setMaterials(data.materiales || [])
        setSuccess(`${data.materiales?.length || 0} materiales encontrados`)
      } else {
        setError(data.error || "Error al obtener materiales")
      }
    } catch (error) {
      console.error("Error:", error)
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const testCreateMaterial = async () => {
    if (!testMaterial.moduloId) {
      setError("Configura el ID del módulo en el material de prueba")
      return
    }

    try {
      setLoading(true)
      setError("")

      const token = localStorage.getItem("token")
      const response = await fetch("/api/materials", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testMaterial),
      })

      console.log("Create response status:", response.status)
      const data = await response.json()
      console.log("Create response data:", data)

      if (response.ok) {
        setSuccess("Material creado exitosamente")
      } else {
        setError(data.error || "Error al crear material")
      }
    } catch (error) {
      console.error("Error:", error)
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const testUploadFile = async () => {
    if (!selectedFile || !moduleId) {
      setError("Selecciona un archivo y un módulo")
      return
    }

    try {
      setLoading(true)
      setError("")

      const formData = new FormData()
      formData.append("archivo", selectedFile)

      const token = localStorage.getItem("token")
      const response = await fetch(`/api/materials/modulo/${moduleId}/archivo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      console.log("Upload response status:", response.status)
      const data = await response.json()
      console.log("Upload response data:", data)

      if (response.ok) {
        setSuccess("Archivo subido exitosamente")
      } else {
        setError(data.error || "Error al subir archivo")
      }
    } catch (error) {
      console.error("Error:", error)
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const getMaterialIcon = (tipo: string) => {
    switch (tipo) {
      case "Archivo":
        return <FileText className="h-4 w-4" />
      case "Enlace":
        return <Link className="h-4 w-4" />
      case "Video":
        return <Video className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Debug: Materials Backend</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 border-green-200 bg-green-50 text-green-800">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Test Get Materials */}
        <Card>
          <CardHeader>
            <CardTitle>1. Obtener Materiales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">ID del Módulo:</label>
              <Input type="number" value={moduleId} onChange={(e) => setModuleId(e.target.value)} placeholder="Ej: 1" />
            </div>
            <Button onClick={testGetMaterials} disabled={loading} className="w-full">
              Obtener Materiales
            </Button>
            <div className="text-sm text-gray-600">Materiales encontrados: {materials.length}</div>
          </CardContent>
        </Card>

        {/* Test Create Material */}
        <Card>
          <CardHeader>
            <CardTitle>2. Crear Material</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nombre:</label>
              <Input
                value={testMaterial.nombre}
                onChange={(e) => setTestMaterial({ ...testMaterial, nombre: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tipo:</label>
              <Select
                value={testMaterial.tipo}
                onValueChange={(value) => setTestMaterial({ ...testMaterial, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Enlace">Enlace</SelectItem>
                  <SelectItem value="Video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">URL:</label>
              <Input
                value={testMaterial.ruta}
                onChange={(e) => setTestMaterial({ ...testMaterial, ruta: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">ID del Módulo:</label>
              <Input
                type="number"
                value={testMaterial.moduloId}
                onChange={(e) => setTestMaterial({ ...testMaterial, moduloId: Number.parseInt(e.target.value) || 0 })}
              />
            </div>
            <Button onClick={testCreateMaterial} disabled={loading} className="w-full">
              Crear Material
            </Button>
          </CardContent>
        </Card>

        {/* Test Upload File */}
        <Card>
          <CardHeader>
            <CardTitle>3. Subir Archivo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Archivo:</label>
              <Input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">ID del Módulo:</label>
              <Input type="number" value={moduleId} onChange={(e) => setModuleId(e.target.value)} placeholder="Ej: 1" />
            </div>
            <Button onClick={testUploadFile} disabled={loading} className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Subir Archivo
            </Button>
          </CardContent>
        </Card>

        {/* Materials List */}
        <Card>
          <CardHeader>
            <CardTitle>4. Materiales Obtenidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {materials.map((material, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {getMaterialIcon(material.tipo)}
                    <span className="font-medium">{material.nombre}</span>
                    <Badge variant="outline">{material.tipo}</Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>ID: {material.materialId}</div>
                    <div>Módulo: {material.moduloId}</div>
                    <div className="truncate">URL: {material.ruta}</div>
                  </div>
                </div>
              ))}
              {materials.length === 0 && (
                <div className="text-center text-gray-500 py-4">No hay materiales para mostrar</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
