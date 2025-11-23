class CourseAssignmentService {
  async getUserCourses() {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No se encontró token de autenticación")
      }

      const response = await fetch("/api/courses/assigned", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      return data.dato || data || []
    } catch (error) {
      console.error("Error fetching user courses:", error)
      throw error
    }
  }
}

export default CourseAssignmentService
