interface Material {
  materialId: number
  nombre: string
  tipo: string
  ruta: string
  moduloId: number
}

interface CreateMaterialData {
  nombre: string
  tipo: "Enlace" | "Video" | "Archivo"
  contenido: string
  moduloId: number
}

interface EditMaterialRequest {
  nombre: string
  ruta?: string
}

class MaterialService {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("token")
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    return headers
  }

  private getFileUploadHeaders(): HeadersInit {
    const token = localStorage.getItem("token")
    const headers: HeadersInit = {}

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    return headers
  }

  async getMaterials(): Promise<Material[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/materiales`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error al obtener materiales: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      return data.dato || data || []
    } catch (error: any) {
      console.error("Error fetching materials:", error)
      throw new Error(error.message || "Failed to fetch materials")
    }
  }

  async getMaterialsByModule(moduloId: number): Promise<Material[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/materiales/modulo/${moduloId}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error al obtener materiales: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      return data.dato || data || []
    } catch (error: any) {
      console.error("Error fetching materials by module:", error)
      throw new Error(error.message || "Failed to fetch materials by module")
    }
  }

  async createMaterial(materialData: CreateMaterialData): Promise<Material> {
    try {
      // Mapear el tipo correctamente según el enum del backend
      let tipoMaterial: number
      switch (materialData.tipo) {
        case "Archivo":
          tipoMaterial = 0
          break
        case "Enlace":
          tipoMaterial = 1
          break
        case "Video":
          tipoMaterial = 2
          break
        default:
          tipoMaterial = 1 // Default a Enlace
      }

      const requestBody = {
        nombre: materialData.nombre.trim(),
        tipo: tipoMaterial, // Enviar como número según el enum
        ruta: materialData.contenido.trim(),
        moduloId: materialData.moduloId,
      }

      console.log("Creating material with data:", requestBody)

      const response = await fetch(`${this.baseUrl}/api/materiales`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error response:", errorText)
        throw new Error(`Error al crear material: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      return data.dato || data
    } catch (error: any) {
      console.error("Error creating material:", error)
      throw new Error(error.message || "Failed to create material")
    }
  }

  async uploadFile(moduloId: number, file: File): Promise<Material> {
    try {
      const formData = new FormData()
      formData.append("archivo", file)

      const response = await fetch(`${this.baseUrl}/api/materiales/modulo/${moduloId}/archivo`, {
        method: "POST",
        headers: this.getFileUploadHeaders(),
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error al subir archivo: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      return data.dato || data
    } catch (error: any) {
      console.error("Error uploading file:", error)
      throw new Error(error.message || "Failed to upload file")
    }
  }

  async updateMaterial(materialId: number, materialData: EditMaterialRequest): Promise<Material> {
    try {
      const response = await fetch(`${this.baseUrl}/api/materiales/${materialId}`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(materialData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error al actualizar material: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      return data.dato || data
    } catch (error: any) {
      console.error("Error updating material:", error)
      throw new Error(error.message || "Failed to update material")
    }
  }

  async deleteMaterial(materialId: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/materiales/${materialId}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error al eliminar material: ${response.status} - ${errorText}`)
      }
    } catch (error: any) {
      console.error("Error deleting material:", error)
      throw new Error(error.message || "Failed to delete material")
    }
  }

  async replaceFile(materialId: number, file: File): Promise<Material> {
    try {
      const formData = new FormData()
      formData.append("nuevoArchivo", file)

      const response = await fetch(`${this.baseUrl}/api/materiales/${materialId}/reemplazar-archivo`, {
        method: "POST",
        headers: this.getFileUploadHeaders(),
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error al reemplazar archivo: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      return data.dato || data
    } catch (error: any) {
      console.error("Error replacing file:", error)
      throw new Error(error.message || "Failed to replace file")
    }
  }
}

export const materialService = new MaterialService()
export type { Material, CreateMaterialData, EditMaterialRequest }
