export interface AssignedCourse {
  nrc: number
  nombre: string
  descripcion: string
  activo: boolean
  rolEnCurso?: string
  fechaAsignacion?: string
  progreso?: number
}

export interface AssignedCoursesResponse {
  operacionExitosa: boolean
  mensaje: string
  codigo: number
  dato: AssignedCourse[]
}

export class StudentCoursesService {
  private static getAuthHeaders() {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No token found")
    }

    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }
  }

  static async getAssignedCourses(): Promise<AssignedCoursesResponse> {
    try {
      console.log("🔍 [StudentCoursesService] Fetching assigned courses...")

      const response = await fetch("/api/courses/assigned", {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      console.log("📡 [StudentCoursesService] Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ mensaje: "Error desconocido" }))
        throw new Error(errorData.mensaje || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("✅ [StudentCoursesService] Response data:", data)

      // Asegurar que la respuesta tenga la estructura correcta
      return {
        operacionExitosa: data.operacionExitosa || false,
        mensaje: data.mensaje || "Cursos obtenidos",
        codigo: data.codigo || response.status,
        dato: Array.isArray(data.dato) ? data.dato : [],
      }
    } catch (error) {
      console.error("❌ [StudentCoursesService] Error:", error)
      throw error
    }
  }

  static async getCourseDetails(courseId: number): Promise<AssignedCourse | null> {
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      return data.operacionExitosa ? data.dato : null
    } catch (error) {
      console.error("❌ [StudentCoursesService] Error getting course details:", error)
      return null
    }
  }
}
