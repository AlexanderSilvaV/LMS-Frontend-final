import { type NextRequest, NextResponse } from "next/server"
import { backendService } from "@/app/lib/backend-service"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token de autorización requerido" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    console.log("📊 [STATS API] Fetching dashboard statistics...")

    const stats = {
      totalUsers: 0,
      totalCourses: 0,
      totalModules: 0,
      totalMaterials: 0,
    }

    // Obtener estadísticas de cursos
    try {
      console.log("📚 [STATS API] Fetching courses...")
      const coursesResponse = await backendService.getCourses({ cantidadPorPagina: 1, paginaActual: 1 }, token)

      console.log("📚 [STATS API] Courses response:", coursesResponse)

      if (coursesResponse.paginacion?.totalResultados) {
        stats.totalCourses = coursesResponse.paginacion.totalResultados
      } else if (coursesResponse.cursos?.length) {
        stats.totalCourses = coursesResponse.cursos.length
      }

      console.log("📚 [STATS API] Total courses:", stats.totalCourses)
    } catch (error) {
      console.error("❌ [STATS API] Error fetching courses:", error)
    }

    // Obtener estadísticas de usuarios
    try {
      console.log("👥 [STATS API] Fetching users...")
      const usersResponse = await backendService.getUsers({ cantidadPorPagina: 1, paginaActual: 1 }, token)

      console.log("👥 [STATS API] Users response:", usersResponse)

      if (usersResponse.paginacion?.totalResultados) {
        stats.totalUsers = usersResponse.paginacion.totalResultados
      } else if (usersResponse.usuarios?.length) {
        stats.totalUsers = usersResponse.usuarios.length
      }

      console.log("👥 [STATS API] Total users:", stats.totalUsers)
    } catch (error) {
      console.error("❌ [STATS API] Error fetching users:", error)
    }

    // Obtener módulos reales por curso y estimar materiales como hace el cliente
    try {
      console.log("📚 [STATS API] Fetching modules per course for real counts...")

      // Intentar obtener una página amplia de cursos para iterar
      const coursesResponse = await backendService.getCourses({ cantidadPorPagina: 50, paginaActual: 1 }, token)
      let courses: any[] = []
      if (coursesResponse.cursos && Array.isArray(coursesResponse.cursos)) {
        courses = coursesResponse.cursos
        if (coursesResponse.paginacion?.totalResultados) {
          stats.totalCourses = coursesResponse.paginacion.totalResultados
        } else {
          stats.totalCourses = courses.length
        }
      }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"

    let totalModules = 0
    for (const course of courses) {
        try {
      const modulesUrl = `${backendUrl}/api/modulos/curso/${course.nrc}`
          const resp = await fetch(modulesUrl, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          })

          if (resp.ok) {
            const body = await resp.json()
            // Normalizar: backend puede devolver { exito:true, dato: [...] } o directamente array
            let modulos: any[] = []
            if (body.dato && Array.isArray(body.dato)) modulos = body.dato
            else if (Array.isArray(body)) modulos = body
            else if (body.modulos && Array.isArray(body.modulos)) modulos = body.modulos

            totalModules += modulos.length
          } else {
            console.warn(`⚠️ [STATS API] Could not fetch modules for course ${course.nrc}: ${resp.status}`)
          }
        } catch (err) {
          console.error(`❌ [STATS API] Error fetching modules for course ${course.nrc}:`, err)
        }
      }

      stats.totalModules = totalModules
      // Usar la misma heurística que el cliente para materiales
      stats.totalMaterials = Math.floor(stats.totalModules * 2.5)
    } catch (err) {
      console.error('❌ [STATS API] Error obtaining modules:', err)
      // Fallback a la estimación previa si algo falla
      stats.totalModules = Math.floor(stats.totalCourses * 2.5)
      stats.totalMaterials = Math.floor(stats.totalModules * 1.8)
    }

    console.log("📊 [STATS API] Final stats:", stats)

    return NextResponse.json({
      success: true,
      data: stats,
      message: "Estadísticas obtenidas correctamente",
    })
  } catch (error) {
    console.error("❌ [STATS API] Error:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
