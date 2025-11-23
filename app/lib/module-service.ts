interface ModuleParams {
  cursoId?: number | null
}

interface Module {
  moduloId: number
  nombre: string
  indice: number
  esPredeterminado: boolean
  cursoId: number
}

interface ModulesResponse {
  modulos: Module[]
}

class ModuleService {
  private getAuthHeaders() {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No hay token de autenticación")
    }
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }
  }

  async getModulesByCourse(cursoId: number): Promise<Module[]> {
    try {
      const headers = this.getAuthHeaders()

      // Usar el endpoint correcto según el controlador C#: GET /api/Modulos/curso/{cursoId}
      const response = await fetch(`/api/modulos/curso/${cursoId}`, {
        method: "GET",
        headers,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error al obtener módulos: ${response.status} - ${errorText}`)
      }

      const data = await response.json()

      // Normalizar la respuesta según la estructura del backend
      let modulos: Module[] = []
      if (data.dato && Array.isArray(data.dato)) {
        modulos = data.dato
      } else if (Array.isArray(data)) {
        modulos = data
      }

      return modulos
    } catch (error) {
      throw error
    }
  }

  async createModule(moduleData: { nombre: string; indice: number; cursoId: number }): Promise<Module> {
    try {
      const headers = this.getAuthHeaders()

      // Usar el endpoint correcto según el controlador C#: POST /api/Modulos
      const response = await fetch(`/api/modulos`, {
        method: "POST",
        headers,
        body: JSON.stringify(moduleData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error al crear módulo: ${response.status} - ${errorText}`)
      }

      const data = await response.json()

      // Normalizar la respuesta según la estructura del backend
      return data.dato || data
    } catch (error) {
      throw error
    }
  }

  async updateModule(moduloId: number, moduleData: { nombre: string; indice: number }): Promise<Module> {
    try {
      const headers = this.getAuthHeaders()

      // Usar el endpoint correcto según el controlador C#: PUT /api/Modulos/{moduloId}
      const response = await fetch(`/api/modulos/${moduloId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(moduleData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error al actualizar módulo: ${response.status} - ${errorText}`)
      }

      const data = await response.json()

      // Normalizar la respuesta según la estructura del backend
      return data.dato || data
    } catch (error) {
      throw error
    }
  }

  async deleteModule(moduloId: number): Promise<void> {
    try {
      const headers = this.getAuthHeaders()

      // Usar el endpoint correcto según el controlador C#: DELETE /api/Modulos/{moduloId}
      const response = await fetch(`/api/modulos/${moduloId}`, {
        method: "DELETE",
        headers,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error al eliminar módulo: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      throw error
    }
  }
}

export const moduleService = new ModuleService()
export type { Module, ModulesResponse, ModuleParams }
