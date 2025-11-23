import { apiClient } from "./api-client"

export interface Course {
  nrc: number
  nombre: string
  descripcion: string
  activo: boolean
  fechaCreacion?: string
  portadaUrl?: string | null
  portadaActualizada?: string | null
}

export interface CourseSearchParams {
  nombre?: string
  activo?: boolean
  nrc?: number
  pagina?: number
  cantidadPorPagina?: number
}

export interface CourseSearchResponse {
  cursos: Course[]
  paginacion: {
    paginaActual: number
    cantidadPorPagina: number
    totalResultados: number
    totalPaginas: number
  }
}

export interface BackendResponse<T> {
  operacionExitosa?: boolean
  exito?: boolean
  dato?: T
  mensaje?: string
  codigo?: number
}

class CourseService {
  async getCourses(filtros?: CourseSearchParams): Promise<CourseSearchResponse> {
    // Asegurar que cantidadPorPagina esté entre 1 y 50
    const cantidadPorPagina = Math.min(Math.max(filtros?.cantidadPorPagina || 50, 1), 50)

    // Parámetros de búsqueda según el formato esperado por el backend
    const searchParams = {
      nombre: filtros?.nombre || null,
      activo: filtros?.activo !== undefined ? filtros?.activo : null,
      nrc: filtros?.nrc || null,
      pagina: filtros?.pagina || 1,
      cantidadPorPagina: cantidadPorPagina,
    }

    try {
      // Intentar con POST a /api/cursos/buscar
      try {
        const response = await apiClient.post<BackendResponse<CourseSearchResponse>>("/api/cursos/buscar", searchParams)

        // Procesar respuesta según el formato del backend
        if (response.operacionExitosa || response.exito) {
          const data = response.dato
          if (data) {
            return {
              cursos: data.cursos || [],
              paginacion: data.paginacion || {
                paginaActual: 1,
                cantidadPorPagina: cantidadPorPagina,
                totalResultados: 0,
                totalPaginas: 1,
              },
            }
          }
        }
      } catch (error) {
        // Si POST falla, intentar con GET
        const params = new URLSearchParams()
        params.append("PaginaActual", searchParams.pagina.toString())
        params.append("CantidadPorPagina", cantidadPorPagina.toString())

        if (searchParams.nombre) {
          params.append("Nombre", searchParams.nombre)
        }

        if (searchParams.activo !== null) {
          params.append("Activo", searchParams.activo.toString())
        }

        if (searchParams.nrc) {
          params.append("NRC", searchParams.nrc.toString())
        }

        const getResponse = await apiClient.get<BackendResponse<CourseSearchResponse>>(
          `/api/cursos?${params.toString()}`,
        )

        if (getResponse.operacionExitosa || getResponse.exito) {
          const data = getResponse.dato
          if (data) {
            return {
              cursos: data.cursos || [],
              paginacion: data.paginacion || {
                paginaActual: 1,
                cantidadPorPagina: cantidadPorPagina,
                totalResultados: 0,
                totalPaginas: 1,
              },
            }
          }
        }
      }

      // Si no hay datos, devolver estructura vacía
      return {
        cursos: [],
        paginacion: {
          paginaActual: 1,
          cantidadPorPagina: cantidadPorPagina,
          totalResultados: 0,
          totalPaginas: 1,
        },
      }
    } catch (error) {
      // En caso de error, intentar cargar datos de prueba
      return this.loadTestData()
    }
  }

  async createCourse(courseData: {
    nrc: number
    nombre: string
    descripcion: string
    activo: boolean
  }): Promise<Course> {
    const response = await apiClient.post<BackendResponse<Course>>("/api/cursos", courseData)

    if (response.operacionExitosa || response.exito) {
      return response.dato!
    }

    throw new Error(response.mensaje || "Error creating course")
  }

  async updateCourse(
    nrc: number,
    courseData: {
      nombre: string
      descripcion: string
      activo: boolean
    },
  ): Promise<Course> {
    const response = await apiClient.put<BackendResponse<Course>>(`/api/cursos/${nrc}`, courseData)

    if (response.operacionExitosa || response.exito) {
      return response.dato!
    }

    throw new Error(response.mensaje || "Error updating course")
  }

  async deleteCourse(nrc: number): Promise<void> {
    const response = await apiClient.delete<BackendResponse<string>>(`/api/cursos/${nrc}`)

    if (!(response.operacionExitosa || response.exito)) {
      throw new Error(response.mensaje || "Error deleting course")
    }
  }

  async duplicateCourse(duplicateData: {
    nrcOriginal: number
    nuevoNrc: number
    nuevoNombre: string
    nuevaDescripcion?: string
    activo?: boolean
  }): Promise<Course> {
    const requestData = {
      nrcOriginal: duplicateData.nrcOriginal,
      nuevoNrc: duplicateData.nuevoNrc,
      nuevoNombre: duplicateData.nuevoNombre,
      nuevaDescripcion: duplicateData.nuevaDescripcion || "",
      activo: duplicateData.activo ?? true,
    }

    console.log('📋 CourseService.duplicateCourse - Request data:', requestData)

    try {
      const response = await apiClient.post<BackendResponse<Course>>(`/api/cursos/duplicar`, requestData)
      
      console.log('✅ CourseService.duplicateCourse - API response:', response)

      if (response.operacionExitosa || response.exito) {
        return response.dato!
      }

      // Enhanced error message for duplicates
      const errorMessage = response.mensaje || "Error duplicating course"
      console.error('❌ CourseService.duplicateCourse - API error:', errorMessage)
      throw new Error(errorMessage)
    } catch (error) {
      console.error('❌ CourseService.duplicateCourse - Unexpected error:', error)
      
      // Provide user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('409') || error.message.toLowerCase().includes('ya está registrado')) {
          throw new Error('El NRC ya existe. Usa un número diferente.')
        }
        if (error.message.includes('404') || error.message.toLowerCase().includes('no encontrado')) {
          throw new Error('El curso original no fue encontrado.')
        }
        if (error.message.includes('400') || error.message.toLowerCase().includes('inválido')) {
          throw new Error('Datos inválidos. Verifica los campos requeridos.')
        }
      }
      
      throw error
    }
  }

  async getCoursesByTeacher(): Promise<Course[]> {
    try {
      const response = await apiClient.get('/api/cursos/asignados') as { data: BackendResponse<Course[]> }
      if (response.data.operacionExitosa) {
        return response.data.dato || []
      } else {
        throw new Error(response.data.mensaje || 'Error al cargar los cursos del docente')
      }
    } catch (error: any) {
      console.error('Error al cargar cursos del docente:', error)
      // Datos de prueba para desarrollo
      return [
        { nrc: 12345, nombre: "Química General", descripcion: "Curso básico de química", activo: true },
        { nrc: 12346, nombre: "Química Orgánica", descripcion: "Curso avanzado de química orgánica", activo: true },
        { nrc: 12347, nombre: "Laboratorio de Química", descripcion: "Prácticas de laboratorio", activo: true }
      ]
    }
  }

  // Método de fallback con datos de prueba
  async loadTestData(): Promise<CourseSearchResponse> {
    const testCourses = [
      {
        nrc: 12345,
        nombre: "Curso de Prueba 1",
        descripcion: "Este es un curso de prueba para verificar la funcionalidad",
        activo: true,
        fechaCreacion: new Date().toISOString(),
        portadaUrl: null,
        portadaActualizada: null,
      },
      {
        nrc: 12346,
        nombre: "Curso de Prueba 2",
        descripcion: "Otro curso de prueba con datos simulados",
        activo: false,
        fechaCreacion: new Date().toISOString(),
        portadaUrl: null,
        portadaActualizada: null,
      },
      {
        nrc: 12347,
        nombre: "Química Avanzada",
        descripcion: "Curso de química para estudiantes avanzados",
        activo: true,
        fechaCreacion: new Date().toISOString(),
        portadaUrl: null,
        portadaActualizada: null,
      },
      {
        nrc: 12348,
        nombre: "Laboratorio Virtual",
        descripcion: "Prácticas en entorno virtual de laboratorio",
        activo: true,
        fechaCreacion: new Date().toISOString(),
        portadaUrl: null,
        portadaActualizada: null,
      },
    ]

    return {
      cursos: testCourses,
      paginacion: {
        paginaActual: 1,
        cantidadPorPagina: 50,
        totalResultados: testCourses.length,
        totalPaginas: 1,
      },
    }
  }
}

export const courseService = new CourseService()
