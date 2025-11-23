interface ApiResponse<T> {
  operacionExitosa?: boolean
  exito?: boolean
  dato?: T
  mensaje?: string
  codigo?: number
}

interface PaginatedResponse<T> {
  cursos?: T[]
  usuarios?: T[]
  modulos?: T[]
  paginacion?: {
    paginaActual: number
    cantidadPorPagina: number
    totalResultados: number
    totalPaginas: number
  }
}

class BackendService {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"
  }

  private getAuthHeaders(token?: string): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    // Si se proporciona un token explícitamente, usarlo
    if (token) {
      headers.Authorization = `Bearer ${token}`
    } else if (typeof window !== "undefined") {
      // Solo acceder a localStorage si estamos en el cliente
      const storedToken = localStorage.getItem("token")
      if (storedToken) {
        headers.Authorization = `Bearer ${storedToken}`
      }
    }

    return headers
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const responseText = await response.text()

    console.log("Response status:", response.status)
    console.log("Response text:", responseText)

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`

      try {
        const errorData = responseText ? JSON.parse(responseText) : {}
        errorMessage = errorData.mensaje || errorData.message || errorMessage
      } catch {
        errorMessage = responseText || errorMessage
      }

      throw new Error(errorMessage)
    }

    // Handle empty responses (like 204 No Content)
    if (!responseText || responseText.trim() === "") {
      console.log("Empty response, returning success message")
      return { mensaje: "Operación completada exitosamente" } as T
    }

    try {
      return JSON.parse(responseText)
    } catch (error) {
      console.error("Failed to parse JSON:", responseText)
      // If it's not JSON but the request was successful, return a success message
      if (response.status >= 200 && response.status < 300) {
        return { mensaje: "Operación completada exitosamente" } as T
      }
      throw new Error("Invalid JSON response from server")
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/test`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          message: "Conexión exitosa con el backend",
          data,
        }
      } else {
        return {
          success: false,
          message: `Error de conexión: ${response.status} ${response.statusText}`,
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Error de red: ${error instanceof Error ? error.message : "Error desconocido"}`,
      }
    }
  }

  async testEndpoints(): Promise<{ endpoint: string; status: string; message: string }[]> {
    const endpoints = [
      { path: "/api/usuarios", name: "Usuarios" },
      { path: "/api/cursos", name: "Cursos" },
      { path: "/api/modulos", name: "Módulos" },
      { path: "/api/materiales", name: "Materiales" },
    ]

    const results = []

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint.path}`, {
          method: "GET",
          headers: this.getAuthHeaders(),
        })

        results.push({
          endpoint: endpoint.name,
          status: response.ok ? "OK" : "ERROR",
          message: response.ok ? `${response.status} OK` : `${response.status} ${response.statusText}`,
        })
      } catch (error) {
        results.push({
          endpoint: endpoint.name,
          status: "ERROR",
          message: error instanceof Error ? error.message : "Error desconocido",
        })
      }
    }

    return results
  }

  async getDashboardStats(): Promise<{
    totalUsers: number
    totalCourses: number
    totalModules: number
    totalMaterials: number
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/dashboard/stats`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        return data.dato || data
      } else {
        // Devolver datos de prueba si el endpoint no está disponible
        return {
          totalUsers: 0,
          totalCourses: 0,
          totalModules: 0,
          totalMaterials: 0,
        }
      }
    } catch (error) {
      // Devolver datos de prueba en caso de error
      return {
        totalUsers: 0,
        totalCourses: 0,
        totalModules: 0,
        totalMaterials: 0,
      }
    }
  }

  // Course operations
  async getCourses(
    params: {
      paginaActual?: number
      cantidadPorPagina?: number
      nombre?: string
      activo?: boolean
    },
    token: string,
  ): Promise<PaginatedResponse<any>> {
    try {
      console.log("Fetching courses with params:", params)
      console.log("Using backend URL:", this.baseUrl)

      // Use POST method to search courses (as per your backend API)
      const response = await fetch(`${this.baseUrl}/api/cursos/buscar`, {
        method: "POST",
        headers: this.getAuthHeaders(token),
        body: JSON.stringify({
          pagina: params.paginaActual || 1,
          cantidadPorPagina: params.cantidadPorPagina || 10,
          nombre: params.nombre || null,
          activo: params.activo,
          nrc: null,
        }),
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error response:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await this.handleResponse<any>(response)
      console.log("Raw backend response:", data)

      // Handle the ResultadoOperacion format from your C# backend
      if (data.exito !== undefined) {
        if (data.exito && data.dato) {
          // Your backend returns: { exito: true, dato: { cursos: [], paginacion: {} }, mensaje: "", codigo: 200 }
          if (data.dato.cursos && data.dato.paginacion) {
            return {
              cursos: data.dato.cursos,
              paginacion: data.dato.paginacion,
            }
          } else if (Array.isArray(data.dato)) {
            return {
              cursos: data.dato,
              paginacion: {
                paginaActual: params.paginaActual || 1,
                cantidadPorPagina: params.cantidadPorPagina || 10,
                totalResultados: data.dato.length,
                totalPaginas: Math.ceil(data.dato.length / (params.cantidadPorPagina || 10)),
              },
            }
          } else {
            return data.dato
          }
        } else {
          throw new Error(data.mensaje || "Error fetching courses")
        }
      } else if (data.cursos !== undefined) {
        // Direct format: { cursos: [], paginacion: {} }
        return {
          cursos: data.cursos,
          paginacion: data.paginacion || {
            paginaActual: params.paginaActual || 1,
            cantidadPorPagina: params.cantidadPorPagina || 10,
            totalResultados: data.cursos.length,
            totalPaginas: Math.ceil(data.cursos.length / (params.cantidadPorPagina || 10)),
          },
        }
      } else if (Array.isArray(data)) {
        // Array format: []
        return {
          cursos: data,
          paginacion: {
            paginaActual: params.paginaActual || 1,
            cantidadPorPagina: params.cantidadPorPagina || 10,
            totalResultados: data.length,
            totalPaginas: Math.ceil(data.length / (params.cantidadPorPagina || 10)),
          },
        }
      } else {
        console.error("Unexpected response format:", data)
        throw new Error("Unexpected response format from backend")
      }
    } catch (error) {
      console.error("Error fetching courses:", error)
      throw error
    }
  }

  async createCourse(body: any, token: string): Promise<any> {
    try {
      console.log("Creating course with body:", body)

      const response = await fetch(`${this.baseUrl}/api/cursos`, {
        method: "POST",
        headers: this.getAuthHeaders(token),
        body: JSON.stringify({
          nrc: body.nrc,
          nombre: body.nombre,
          descripcion: body.descripcion,
          activo: body.activo || true,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error creating course:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await this.handleResponse<any>(response)
      console.log("Course creation response:", data)

      // Handle ResultadoOperacion format
      if (data.exito !== undefined) {
        if (data.exito) {
          return data.dato || data
        } else {
          throw new Error(data.mensaje || "Error creating course")
        }
      }

      return data
    } catch (error) {
      console.error("Error creating course:", error)
      throw error
    }
  }

  async getCourse(nrc: number, token: string): Promise<any> {
    try {
      // Use the frontend API route which handles the backend communication
      const response = await fetch(`/api/courses/${nrc}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ mensaje: "Error de conexión" }))
        console.error("Error response:", errorData)
        throw new Error(errorData.mensaje || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("Course data received:", data)

      return data // The frontend API already handles the format
    } catch (error) {
      console.error("Error fetching course:", error)
      throw error
    }
  }

  // User operations
  async getUsers(
    params: {
      paginaActual?: number
      cantidadPorPagina?: number
      nombre?: string
      email?: string
      rol?: string
    },
    token: string,
  ): Promise<any> {
    try {
      console.log("🔍 [BACKEND-SERVICE] Getting users with params:", params)
      console.log("🔗 [BACKEND-SERVICE] Backend URL:", this.baseUrl)

      const searchParams = new URLSearchParams()

      if (params.paginaActual) searchParams.append("PaginaActual", params.paginaActual.toString())
      if (params.cantidadPorPagina) searchParams.append("CantidadPorPagina", params.cantidadPorPagina.toString())
      if (params.nombre) searchParams.append("Nombre", params.nombre)
      if (params.email) searchParams.append("Email", params.email)
      if (params.rol) searchParams.append("Rol", params.rol)

      const url = `${this.baseUrl}/api/usuarios?${searchParams.toString()}`
      console.log("🔄 [BACKEND-SERVICE] Full URL:", url)

      const headers = this.getAuthHeaders(token)
      console.log("📋 [BACKEND-SERVICE] Headers:", headers)

      const response = await fetch(url, {
        method: "GET",
        headers: headers,
      })

      console.log("📡 [BACKEND-SERVICE] Response status:", response.status)
      console.log("📡 [BACKEND-SERVICE] Response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ [BACKEND-SERVICE] Error response:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const responseText = await response.text()
      console.log("📄 [BACKEND-SERVICE] Raw response:", responseText)

      if (!responseText || responseText.trim() === "") {
        console.log("⚠️ [BACKEND-SERVICE] Empty response")
        return {
          usuarios: [],
          paginacion: {
            paginaActual: params.paginaActual || 1,
            cantidadPorPagina: params.cantidadPorPagina || 10,
            totalResultados: 0,
            totalPaginas: 0,
          },
        }
      }

      let data
      try {
        data = JSON.parse(responseText)
        console.log("📚 [BACKEND-SERVICE] Parsed data:", JSON.stringify(data, null, 2))
      } catch (e) {
        console.error("❌ [BACKEND-SERVICE] JSON parse error:", e)
        throw new Error("Error al procesar la respuesta del servidor")
      }

      // Handle different response formats
      if (data.exito !== undefined || data.operacionExitosa !== undefined) {
        const isSuccess = data.exito || data.operacionExitosa
        console.log("🎯 [BACKEND-SERVICE] Success flag:", isSuccess)

        if (isSuccess && data.dato) {
          console.log("✅ [BACKEND-SERVICE] Success with data:", data.dato)

          if (Array.isArray(data.dato)) {
            // Format: { exito: true, dato: [] }
            return {
              usuarios: data.dato,
              paginacion: {
                paginaActual: params.paginaActual || 1,
                cantidadPorPagina: params.cantidadPorPagina || 10,
                totalResultados: data.dato.length,
                totalPaginas: Math.ceil(data.dato.length / (params.cantidadPorPagina || 10)),
              },
            }
          } else if (data.dato.usuarios) {
            // Format: { exito: true, dato: { usuarios: [], paginacion: {} } }
            return {
              usuarios: data.dato.usuarios || data.dato,
              paginacion: data.dato.paginacion || {
                paginaActual: params.paginaActual || 1,
                cantidadPorPagina: params.cantidadPorPagina || 10,
                totalResultados: (data.dato.usuarios || data.dato).length,
                totalPaginas: Math.ceil((data.dato.usuarios || data.dato).length / (params.cantidadPorPagina || 10)),
              },
            }
          } else {
            // Format: { exito: true, dato: {...} } - single object or other format
            return data.dato
          }
        } else {
          console.error("❌ [BACKEND-SERVICE] Backend returned error:", data.mensaje)
          throw new Error(data.mensaje || "Error fetching users")
        }
      } else if (data.usuarios !== undefined || data.Usuarios !== undefined) {
        // Format: { usuarios: [], paginacion: {} } or capitalized { Usuarios: [], Paginacion: {} }
        console.log("📋 [BACKEND-SERVICE] Direct usuarios format (normalized)")
        return {
          usuarios: data.usuarios || data.Usuarios,
          paginacion:
            data.paginacion || data.Paginacion || {
              paginaActual: params.paginaActual || 1,
              cantidadPorPagina: params.cantidadPorPagina || 10,
              totalResultados: (data.usuarios || data.Usuarios || []).length,
              totalPaginas: Math.ceil((data.usuarios || data.Usuarios || []).length / (params.cantidadPorPagina || 10)),
            },
        }
      } else if (Array.isArray(data)) {
        // Format: []
        console.log("📋 [BACKEND-SERVICE] Array format")
        return {
          usuarios: data,
          paginacion: {
            paginaActual: params.paginaActual || 1,
            cantidadPorPagina: params.cantidadPorPagina || 10,
            totalResultados: data.length,
            totalPaginas: Math.ceil(data.length / (params.cantidadPorPagina || 10)),
          },
        }
      } else {
        console.error("❌ [BACKEND-SERVICE] Unexpected response format:", data)
        throw new Error("Formato de respuesta inesperado del servidor")
      }
    } catch (error) {
      console.error("❌ [BACKEND-SERVICE] Error fetching users:", error)
      throw error
    }
  }

  async getProfile(token: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/Profile/me`, {
        method: "GET",
        headers: this.getAuthHeaders(token),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error fetching profile:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await this.handleResponse<any>(response)
      
      // Handle backend response format (ResultadoOperacion)
      if (data.operacionExitosa !== undefined || data.exito !== undefined) {
        const success = data.operacionExitosa ?? data.exito
        if (success) {
          return data.dato || data
        }
        throw new Error(data.mensaje || "Error fetching profile")
      }

      return data
    } catch (error) {
      console.error("Error in getProfile:", error)
      throw error
    }
  }

  async getUserById(id: string, token: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/usuarios/${id}`, {
        method: "GET",
        headers: this.getAuthHeaders(token),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error fetching user by id:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await this.handleResponse<any>(response)
      return data
    } catch (error) {
      console.error("Error in getUserById:", error)
      throw error
    }
  }

  // Change a user's password (admin-initiated). Note: backend must expose a matching endpoint.
  async changeUserPassword(userId: string, newPassword: string, token?: string): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/usuarios/${userId}/change-password`
      console.log("🔒 [BACKEND-SERVICE] Changing password for user:", userId)

      const response = await fetch(url, {
        method: "POST",
        headers: this.getAuthHeaders(token),
        body: JSON.stringify({ NuevaContraseña: newPassword }),
      })

      if (!response.ok) {
        const errorText = (await response.text()).trim()
        // Provide a friendlier message when backend doesn't expose this endpoint
        if (response.status === 404) {
          const msg =
            errorText ||
            `Endpoint not found: ${this.baseUrl}/api/usuarios/${userId}/change-password (404). ` +
              "El backend puede no exponer un endpoint de cambio de contraseña por administrador."
          console.error("❌ [BACKEND-SERVICE] changeUserPassword 404:", msg)
          throw new Error(msg)
        }

        const msg = errorText || response.statusText || `HTTP ${response.status}`
        console.error("❌ [BACKEND-SERVICE] changeUserPassword error:", msg)
        throw new Error(msg)
      }

      const data = await this.handleResponse<any>(response)
      return data
    } catch (error) {
      console.error("❌ [BACKEND-SERVICE] Error changing user password:", error)
      throw error
    }
  }

  async createUser(body: any, token: string): Promise<any> {
    try {
      console.log("Creating user with body:", body)

      // Normalizar el campo de contraseña: aceptar varias variantes desde el formulario
      const password = body.Contraseña ?? body.contraseña ?? body.password ?? body.Password ?? ""

      if (!password) {
        throw new Error("La contraseña es requerida para crear un usuario")
      }

      const payload = {
        nombre: body.nombre,
        correo: body.correo,
        Contraseña: password,
        rol: body.rol,
        rut: body.rut,
      }

      const response = await fetch(`${this.baseUrl}/api/usuarios`, {
        method: "POST",
        headers: this.getAuthHeaders(token),
        body: JSON.stringify(payload),
      })

      console.log("Create user response status:", response.status)
      console.log("Create user response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error creating user:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await this.handleResponse<any>(response)
      console.log("User creation response:", data)

      // Handle different response formats
      if (data.operacionExitosa !== undefined) {
        if (data.operacionExitosa) {
          return { mensaje: data.mensaje || "Usuario creado correctamente" }
        } else {
          throw new Error(data.mensaje || "Error creating user")
        }
      } else if (data.exito !== undefined) {
        if (data.exito) {
          return { mensaje: data.mensaje || "Usuario creado correctamente" }
        } else {
          throw new Error(data.mensaje || "Error creating user")
        }
      } else if (data.mensaje) {
        // If we have a message, assume success
        return { mensaje: data.mensaje }
      } else {
        // If we get here and the response was successful, assume it worked
        return { mensaje: "Usuario creado correctamente" }
      }
    } catch (error) {
      console.error("Error creating user:", error)
      throw error
    }
  }

  async updateUser(id: string, body: any, token: string): Promise<any> {
    try {
      console.log("Updating user with body:", body)

      const response = await fetch(`${this.baseUrl}/api/usuarios/${id}`, {
        method: "PUT",
        headers: this.getAuthHeaders(token),
        body: JSON.stringify({
          nombre: body.nombre,
          correo: body.correo,
          rol: body.rol,
        }),
      })

      console.log("Update user response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error updating user:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await this.handleResponse<any>(response)
      console.log("User update response:", data)

      // Handle different response formats
      if (data.operacionExitosa !== undefined) {
        if (data.operacionExitosa) {
          return { mensaje: data.mensaje || "Usuario actualizado correctamente" }
        } else {
          throw new Error(data.mensaje || "Error updating user")
        }
      } else if (data.exito !== undefined) {
        if (data.exito) {
          return { mensaje: data.mensaje || "Usuario actualizado correctamente" }
        } else {
          throw new Error(data.mensaje || "Error updating user")
        }
      } else if (data.mensaje) {
        return { mensaje: data.mensaje }
      } else {
        return { mensaje: "Usuario actualizado correctamente" }
      }
    } catch (error) {
      console.error("Error updating user:", error)
      throw error
    }
  }

  // Update the authenticated user's own profile (name/email)
  async updateMyProfile(body: any, token?: string): Promise<any> {
    try {
      // If we're running in the browser, forward the request to the Next.js API
      // route which will attach the Authorization header and avoid CORS issues.
      const isClient = typeof window !== "undefined"
      const url = isClient ? "/api/profile/info" : `${this.baseUrl}/api/Profile/me/info`

      const actualToken = token || (isClient ? localStorage.getItem("token") : undefined)
      
      // Debug: log token info (first 20 chars only for security)
      if (isClient && actualToken) {
        console.log("[updateMyProfile] Using token:", actualToken.substring(0, 20) + "...")
        try {
          // Decode JWT payload to check claims
          const payload = JSON.parse(atob(actualToken.split('.')[1]))
          console.log("[updateMyProfile] Token claims:", { sub: payload.sub, email: payload.email, exp: payload.exp })
        } catch (e) {
          console.warn("[updateMyProfile] Could not decode token:", e)
        }
      }

      const headers = isClient
        ? { "Content-Type": "application/json", Authorization: actualToken ? `Bearer ${actualToken}` : undefined }
        : this.getAuthHeaders(token)

      const response = await fetch(url, {
        method: "PUT",
        // @ts-ignore -- headers may contain undefined Authorization when server-side without token
        headers,
        body: JSON.stringify({ Nombre: body.nombre, Correo: body.correo }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error updating my profile:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await this.handleResponse<any>(response)
      return data
    } catch (error) {
      console.error("Error in updateMyProfile:", error)
      throw error
    }
  }

  // Update the authenticated user's profile description
  async updateMyDescription(body: any, token?: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/Profile/me`, {
        method: "PUT",
        headers: this.getAuthHeaders(token),
        body: JSON.stringify({ Descripcion: body.descripcion }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error updating my description:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await this.handleResponse<any>(response)
      return data
    } catch (error) {
      console.error("Error in updateMyDescription:", error)
      throw error
    }
  }

  async deleteUser(id: string, token: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/usuarios/${id}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(token),
      })

      console.log("Delete user response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error deleting user:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await this.handleResponse<any>(response)
      console.log("User delete response:", data)

      return { mensaje: "Usuario eliminado correctamente" }
    } catch (error) {
      console.error("Error deleting user:", error)
      throw error
    }
  }

  async updateCourse(nrc: number, body: any, token: string): Promise<any> {
    try {
      // Use the frontend API route
      const response = await fetch(`/api/courses/${nrc}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ mensaje: "Error de conexión" }))
        throw new Error(errorData.mensaje || `HTTP ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error updating course:", error)
      throw error
    }
  }

  async deleteCourse(nrc: number, token: string): Promise<any> {
    try {
      // Use the frontend API route
      const response = await fetch(`/api/courses/${nrc}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ mensaje: "Error de conexión" }))
        throw new Error(errorData.mensaje || `HTTP ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error deleting course:", error)
      throw error
    }
  }

  // Course-User assignment operations
  async assignUserToCourse(usuarioId: string, cursoNrc: number, token: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/cursousuario/asignar`, {
        method: "POST",
        headers: this.getAuthHeaders(token),
        body: JSON.stringify({
          usuarioId,
          cursoNrc,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await this.handleResponse<any>(response)
      return data
    } catch (error) {
      console.error("Error assigning user to course:", error)
      throw error
    }
  }

  async removeUserFromCourse(usuarioId: string, cursoNrc: number, token: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/cursousuario/desasignar`, {
        method: "DELETE",
        headers: this.getAuthHeaders(token),
        body: JSON.stringify({
          usuarioId,
          cursoNrc,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return { mensaje: "Usuario desasignado del curso correctamente" }
    } catch (error) {
      console.error("Error removing user from course:", error)
      throw error
    }
  }

  async getCourseUsers(cursoNrc: number, token: string): Promise<any[]> {
    try {
      // Use the frontend API route
      const response = await fetch(`/api/course-users/course/${cursoNrc}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.exito && data.dato) {
        return Array.isArray(data.dato) ? data.dato : [data.dato]
      } else if (Array.isArray(data)) {
        return data
      } else {
        return []
      }
    } catch (error) {
      console.error("Error fetching course users:", error)
      return []
    }
  }

  async getUserCourses(usuarioId: string, token: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/cursousuario/usuario/${usuarioId}`, {
        method: "GET",
        headers: this.getAuthHeaders(token),
      })

      if (!response.ok) {
        // Don't throw here to avoid breaking pages that load profile/stats when this endpoint
        // is temporarily unavailable or returns 4xx/5xx. Log and return empty list so the UI
        // can continue rendering.
        const errorText = await response.text().catch(() => null)
        console.warn(`⚠️ [BACKEND-SERVICE] getUserCourses: HTTP ${response.status} - ${errorText}`)
        return []
      }

      const data = await this.handleResponse<any>(response)

      if (data.exito && data.dato) {
        return Array.isArray(data.dato) ? data.dato : [data.dato]
      } else if (Array.isArray(data)) {
        return data
      } else {
        return []
      }
    } catch (error) {
      console.error("Error fetching user courses:", error)
      // Return empty array instead of throwing so callers can render gracefully
      return []
    }
  }

  /**
   * Decide how to handle a material for preview/download/open in the UI.
   * Returns an action and a URL the frontend can use.
   * - action: 'download' -> fetch binary via download proxy
   * - action: 'redirect' -> open the external URL directly
   * - action: 'open' -> open URL (same as redirect, kept for semantic clarity)
   */
  getMaterialAction(material: any): { action: "download" | "redirect" | "open"; url: string | null } {
    try {
      if (!material) return { action: "download", url: null }

      const ruta: string | undefined = material.ruta || material.Ruta || material.url || material.link
      const id = material.id || material.materialId || material.materialID || material.idMaterial

      // If tiene contenido embebido (base64), use download proxy which will decode
      if (material.contenido) {
        return { action: "download", url: id ? `/api/materiales/${id}/download` : null }
      }

      if (ruta) {
        const trimmed = ruta.trim()
        const isAbsolute = /^https?:\/\//i.test(trimmed)
        const lower = trimmed.toLowerCase()

        // Common video hosts or file extensions
        const looksLikeVideo = /youtube\.com|youtu\.be|vimeo\.com|\.mp4$|\.webm$/.test(lower)
        const looksLikePdf = /\.pdf$/.test(lower)

        // Check if it's an S3 URL (which may be expired)
        const isS3Url = /s3.*\.amazonaws\.com/.test(lower)

        if (isAbsolute) {
          // For S3 URLs, use download endpoint to get fresh signed URL
          if (isS3Url && id) {
            return { action: "download", url: `/api/materials/${id}/download` }
          }
          if (looksLikeVideo) return { action: "redirect", url: trimmed }
          if (looksLikePdf) return { action: "redirect", url: trimmed }
          // External non-media URL: open in new tab
          return { action: "redirect", url: trimmed }
        } else {
          // Relative path on backend: use our download proxy which will stream or redirect as needed
          if (id) return { action: "download", url: `/api/materiales/${id}/download` }
          // Fallback: build absolute URL to backend
          const backendUrl = this.baseUrl.replace(/\/$/, "")
          return { action: looksLikePdf ? "download" : "redirect", url: `${backendUrl}/${trimmed.replace(/^\//, "")}` }
        }
      }

      // Default: attempt download via proxy if we have an id
      if (id) return { action: "download", url: `/api/materiales/${id}/download` }

      return { action: "download", url: null }
    } catch (err) {
      console.error("Error determining material action:", err)
      return { action: "download", url: null }
    }
  }

  // Modificar el método getAssignedCourses para usar el ID del usuario
  async getAssignedCourses(token: string): Promise<any[]> {
    try {
      console.log("🔍 [BACKEND-SERVICE] Fetching assigned courses...")
      console.log("🔗 [BACKEND-SERVICE] Using backend URL:", this.baseUrl)

      // Endpoint correcto para obtener cursos asignados del usuario autenticado
      const endpoint = `${this.baseUrl}/api/cursos/asignados`
      console.log("🔄 [BACKEND-SERVICE] Using endpoint:", endpoint)

      const response = await fetch(endpoint, {
        method: "GET",
        headers: this.getAuthHeaders(token),
      })

      console.log("📡 [BACKEND-SERVICE] Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ [BACKEND-SERVICE] Error response:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const responseText = await response.text()
      console.log("📄 [BACKEND-SERVICE] Response text:", responseText)

      if (!responseText || responseText.trim() === "") {
        console.log("⚠️ [BACKEND-SERVICE] Empty response, returning empty array")
        return []
      }

      let data
      try {
        data = JSON.parse(responseText)
        console.log("📚 [BACKEND-SERVICE] Parsed response data:", data)
      } catch (e) {
        console.error("❌ [BACKEND-SERVICE] Error parsing JSON:", e)
        throw new Error("Error al procesar la respuesta del servidor")
      }

      // Procesar la respuesta según el formato del backend
      let coursesData: any[] = []

      if (data.exito !== undefined) {
        if (data.exito && data.dato) {
          // Formato: { exito: true, dato: [...] }
          coursesData = Array.isArray(data.dato) ? data.dato : [data.dato]
        } else {
          throw new Error(data.mensaje || "Error fetching assigned courses")
        }
      } else if (Array.isArray(data)) {
        // Formato: []
        coursesData = data
      } else {
        console.warn("⚠️ [BACKEND-SERVICE] Unexpected response format:", data)
        coursesData = []
      }

      // Extraer solo la información del curso de cada asignación
      const courses = coursesData.map((asignacion: any) => {
        // Si la respuesta ya tiene el curso extraído
        if (!asignacion.curso && asignacion.nrc) {
          return asignacion
        }

        // Si la respuesta tiene el curso anidado
        return {
          nrc: asignacion.curso?.nrc || asignacion.cursoId || asignacion.cursoNrc,
          nombre: asignacion.curso?.nombre || "Curso sin nombre",
          descripcion: asignacion.curso?.descripcion || "Sin descripción",
          activo: asignacion.curso?.activo !== undefined ? asignacion.curso.activo : true,
          fechaCreacion: asignacion.curso?.fechaCreacion || asignacion.fechaAsignacion,
          fechaAsignacion: asignacion.fechaAsignacion,
          progreso: asignacion.progreso || 0,
          rolEnCurso: asignacion.rolEnCurso,
        }
      })

      // Para cada curso, obtener cantidad de módulos y cantidad de estudiantes inscritos
      for (const curso of courses) {
        try {
          // Obtener módulos del curso
          const modResp = await fetch(`${this.baseUrl}/api/modulos/curso/${curso.nrc}`, {
            method: "GET",
            headers: this.getAuthHeaders(token),
          })

          if (modResp.ok) {
            const modBody = await modResp.json().catch(() => null)
            let modulos: any[] = []
            if (modBody) {
              if (modBody.dato && Array.isArray(modBody.dato)) modulos = modBody.dato
              else if (Array.isArray(modBody)) modulos = modBody
              else if (modBody.modulos && Array.isArray(modBody.modulos)) modulos = modBody.modulos
            }
            curso.materialesCount = modulos.length
          } else {
            curso.materialesCount = 0
          }
        } catch (err) {
          console.error(`❌ [BACKEND-SERVICE] Error fetching modules for course ${curso.nrc}:`, err)
          curso.materialesCount = 0
        }

        try {
          // Obtener usuarios asignados al curso
          const usersResp = await fetch(`${this.baseUrl}/api/curso-usuarios/curso/${curso.nrc}`, {
            method: "GET",
            headers: this.getAuthHeaders(token),
          })

          if (usersResp.ok) {
            const usersBody = await usersResp.json().catch(() => null)
            let asignados: any[] = []
            if (usersBody) {
              if (usersBody.dato && Array.isArray(usersBody.dato)) asignados = usersBody.dato
              else if (Array.isArray(usersBody)) asignados = usersBody
            }
            curso.estudiantesInscritos = asignados.length
          } else {
            curso.estudiantesInscritos = 0
          }
        } catch (err) {
          console.error(`❌ [BACKEND-SERVICE] Error fetching assigned users for course ${curso.nrc}:`, err)
          curso.estudiantesInscritos = 0
        }
      }

      console.log("✅ [BACKEND-SERVICE] Processed courses:", courses.length)
      return courses
    } catch (error) {
      console.error("❌ [BACKEND-SERVICE] Error fetching assigned courses:", error)
      throw error
    }
  }

  // Métodos para manejo de avatar
  async uploadAvatar(file: File, token?: string): Promise<any> {
    try {
      const formData = new FormData()
      formData.append("archivo", file)

      const response = await fetch(`/api/profile/photo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token || this.getStoredToken()}`,
        },
        body: formData,
      })

      return await this.handleResponse(response)
    } catch (error) {
      console.error("Error uploading avatar:", error)
      throw error
    }
  }

  async deleteAvatar(token?: string): Promise<any> {
    try {
      const response = await fetch(`/api/profile/photo`, {
        method: "DELETE",
        headers: this.getAuthHeaders(token),
      })

      return await this.handleResponse(response)
    } catch (error) {
      console.error("Error deleting avatar:", error)
      throw error
    }
  }

  async getAvatarUrl(token?: string): Promise<string | null> {
    try {
      const response = await fetch(`/api/profile/photo`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token || this.getStoredToken()}`,
        },
      })

      if (response.ok) {
        // Retornar la URL del endpoint para uso en img src
        return `/api/profile/photo`
      }
      
      return null
    } catch (error) {
      console.error("Error getting avatar:", error)
      return null
    }
  }

  private getStoredToken(): string {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || ""
    }
    return ""
  }

  // Método auxiliar para decodificar el token JWT
  private getUserInfoFromToken(token: string): any {
    try {
      // Decodificar el token JWT (formato: header.payload.signature)
      const base64Url = token.split(".")[1]
      if (!base64Url) return null

      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      )

      return JSON.parse(jsonPayload)
    } catch (error) {
      console.error("Error decoding token:", error)
      return null
    }
  }
}

export const backendService = new BackendService()
