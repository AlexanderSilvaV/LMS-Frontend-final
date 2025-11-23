import { courseService } from "./course-service"
import { moduleService } from "./module-service"
import { materialService } from "./material-service"

export interface DashboardStats {
  totalUsuarios: number
  totalCursos: number
  totalModulos: number
  totalMateriales: number
  cursosActivos: number
  cursosInactivos: number
  loading: boolean
  error: string | null
}

class DashboardService {
  private statsCache: DashboardStats | null = null
  private lastFetchTime = 0
  private readonly CACHE_DURATION = 30000 // 30 segundos

  async getStats(forceRefresh = false): Promise<DashboardStats> {
    // Verificar token antes de hacer cualquier petición
    const token = localStorage.getItem("token")
    if (!token) {
      console.log("📋 [DASHBOARD-SERVICE] No token found, returning demo data")
      return {
        totalUsuarios: 6,
        totalCursos: 4,
        totalModulos: 12,
        totalMateriales: 30,
        cursosActivos: 3,
        cursosInactivos: 1,
        loading: false,
        error: "No hay token de autenticación - mostrando datos de demostración",
      }
    }

    // Inicializar estadísticas
    const stats: DashboardStats = {
      totalUsuarios: 0,
      totalCursos: 0,
      totalModulos: 0,
      totalMateriales: 0,
      cursosActivos: 0,
      cursosInactivos: 0,
      loading: false,
      error: null,
    }

    // Verificar cache primero
    if (!forceRefresh && this.statsCache && Date.now() - this.lastFetchTime < this.CACHE_DURATION) {
      console.log("📋 [DASHBOARD-SERVICE] Returning cached stats")
      return this.statsCache
    }

    try {
      console.log("📊 [DASHBOARD-SERVICE] Fetching fresh stats...")

      // Obtener usuarios
      try {
        const usersResponse = await fetch("/api/users?page=1&limit=50", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          if (usersData.paginacion && usersData.paginacion.totalResultados) {
            stats.totalUsuarios = usersData.paginacion.totalResultados
          } else if (usersData.usuarios && Array.isArray(usersData.usuarios)) {
            stats.totalUsuarios = usersData.usuarios.length
          }
          console.log("👥 [DASHBOARD-SERVICE] Users count:", stats.totalUsuarios)
        }
      } catch (error) {
        console.error("❌ [DASHBOARD-SERVICE] Error fetching users:", error)
      }

  // Obtener cursos usando el courseService
  // Variables para módulos y materiales declaradas en alcance superior para evitar errores de scope
  let courses: any[] = []
  let totalModules = 0
  let totalMaterialsCount = 0
  let materialsFetchFailed = false

  try {
        const coursesResponse = await courseService.getCourses({
          cantidadPorPagina: 50,
          pagina: 1,
        })

        console.log("📚 [DASHBOARD-SERVICE] Courses response:", coursesResponse)

  // Extraer cursos del objeto de respuesta
        if (coursesResponse && coursesResponse.cursos && Array.isArray(coursesResponse.cursos)) {
          courses = coursesResponse.cursos
          // Si hay paginación, usar el total de resultados
          if (coursesResponse.paginacion && coursesResponse.paginacion.totalResultados) {
            stats.totalCursos = coursesResponse.paginacion.totalResultados
          } else {
            stats.totalCursos = courses.length
          }
        } else if (Array.isArray(coursesResponse)) {
          courses = coursesResponse
          stats.totalCursos = courses.length
        }

        // Contar cursos por estado
        courses.forEach((curso) => {
          if (curso.activo === true || curso.activo === 1 || curso.estado === "activo") {
            stats.cursosActivos++
          } else {
            stats.cursosInactivos++
          }
        })

        console.log("📚 [DASHBOARD-SERVICE] Courses stats:", {
          total: stats.totalCursos,
          activos: stats.cursosActivos,
          inactivos: stats.cursosInactivos,
        })

  // Obtener módulos reales por curso y contabilizar también los materiales por módulo

  for (const course of courses) {
          try {
            const modules = await moduleService.getModulesByCourse(course.nrc)
            totalModules += modules.length
            console.log(`📊 [DASHBOARD-SERVICE] Course ${course.nrc} has ${modules.length} modules`)

            // Intentar obtener materiales reales por cada módulo (paralelizar por curso)
            try {
              const moduleMaterialPromises = modules.map(async (m: any) => {
                const moduleId = m.moduloId ?? m.id ?? m.ModuloId ?? m.moduloID
                if (!moduleId) return 0
                try {
                  const mats = await materialService.getMaterialsByModule(Number(moduleId))
                  return Array.isArray(mats) ? mats.length : 0
                } catch (err) {
                  console.error(`❌ [DASHBOARD-SERVICE] Error fetching materials for module ${moduleId}:`, err)
                  throw err
                }
              })

              const perModuleCounts = await Promise.all(moduleMaterialPromises)
              const summed = perModuleCounts.reduce((s: number, v: number) => s + (v || 0), 0)
              totalMaterialsCount += summed
              console.log(`📊 [DASHBOARD-SERVICE] Course ${course.nrc} has approximately ${summed} materials`)
            } catch (err) {
              // marcar fallo para usar fallback heurístico más abajo
              materialsFetchFailed = true
            }
          } catch (error) {
            console.error(`❌ [DASHBOARD-SERVICE] Error fetching modules for course ${course.nrc}:`, error)
          }
        }

        stats.totalModulos = totalModules
        console.log("📊 [DASHBOARD-SERVICE] Total modules count:", stats.totalModulos)
      } catch (error) {
        console.error("❌ [DASHBOARD-SERVICE] Error fetching courses:", error)
      }

      // Calcular materiales reales: intentar usar conteo por módulo; si falla, usar heurística
      if (!materialsFetchFailed && totalMaterialsCount > 0) {
        stats.totalMateriales = totalMaterialsCount
      } else {
        stats.totalMateriales = Math.floor(stats.totalModulos * 2.5)
      }

      // Si no hay datos reales, usar datos demo
      if (stats.totalUsuarios === 0 && stats.totalCursos === 0 && stats.totalModulos === 0) {
        console.log("📊 [DASHBOARD-SERVICE] No real data found, using demo data")
        stats.totalUsuarios = 6
        stats.totalCursos = 4
        stats.cursosActivos = 3
        stats.cursosInactivos = 1
        stats.totalModulos = 12
        stats.totalMateriales = 30
        stats.error = "Mostrando datos de demostración - conecte con el backend para datos reales"
      }

      // Actualizar cache
      this.statsCache = stats
      this.lastFetchTime = Date.now()

      return stats
    } catch (error) {
      console.error("❌ [DASHBOARD-SERVICE] Error getting stats:", error)
      stats.error = error instanceof Error ? error.message : "Error desconocido"
      return stats
    }
  }
}

export const dashboardService = new DashboardService()
