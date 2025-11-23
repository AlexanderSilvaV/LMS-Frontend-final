export async function getAssignedCourses(userId: string) {
  try {
    const response = await fetch(`/api/assigned-courses/${userId}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch assigned courses: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching assigned courses:", error)
    throw error
  }
}

export async function getCourseDetails(courseId: string) {
  try {
    const response = await fetch(`/api/courses/${courseId}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch course details: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching course details:", error)
    throw error
  }
}

export async function getModulesByCourse(courseId: string) {
  try {
    const response = await fetch(`/api/modules/course/${courseId}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch modules: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching modules:", error)
    throw error
  }
}

export async function getMaterialsByModule(moduleId: string) {
  try {
    const token = localStorage.getItem("token")
    if (!token) {
      console.error("❌ [STUDENT-SERVICE] No token found")
      throw new Error("No authentication token found")
    }

    console.log(`🎓 [STUDENT-SERVICE] Fetching materials for module: ${moduleId}`)

    // Usar el endpoint de la API con el token de autorización
    const response = await fetch(`/api/materiales/modulo/${moduleId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    console.log(`📊 [STUDENT-SERVICE] Response status: ${response.status}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(`❌ [STUDENT-SERVICE] Error:`, errorData)

      if (response.status === 403) {
        console.log("🔒 [STUDENT-SERVICE] Access denied to module materials")
        return { materials: [], error: "No tienes acceso a este módulo" }
      }

      if (response.status === 404) {
        console.log("📭 [STUDENT-SERVICE] Module not found")
        return { materials: [], error: "Módulo no encontrado" }
      }

      throw new Error(`Failed to fetch materials: ${response.status}`)
    }

    const data = await response.json()
    console.log(`📚 [STUDENT-SERVICE] Materials data:`, data)

    // El backend devuelve directamente el array de materiales
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("❌ [STUDENT-SERVICE] Error fetching materials:", error)
    return { materials: [], error: error instanceof Error ? error.message : "Unknown error" }
  }
}
