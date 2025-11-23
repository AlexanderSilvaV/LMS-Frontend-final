import { type NextRequest, NextResponse } from "next/server"

interface EndpointInfo {
  status: string
  count: number
  error: string | null
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")

    if (!token) {
      return NextResponse.json({ error: "No authorization token" }, { status: 401 })
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"

    console.log("🐛 [DEBUG] Starting debug stats fetch...")
    console.log("🐛 [DEBUG] Backend URL:", backendUrl)
    console.log("🐛 [DEBUG] Token present:", !!token)

    const debugInfo = {
      backendUrl,
      timestamp: new Date().toISOString(),
      endpoints: {
        users: { status: "unknown", count: 0, error: null } as EndpointInfo,
        courses: { status: "unknown", count: 0, error: null } as EndpointInfo,
        modules: { status: "unknown", count: 0, error: null } as EndpointInfo,
        modulesGet: { status: "unknown", count: 0, error: null } as EndpointInfo,
        modulesPost: { status: "unknown", count: 0, error: null } as EndpointInfo,
      },
      summary: {
        totalUsers: 0,
        totalCourses: 0,
        totalModules: 0,
        totalMaterials: 0,
      },
    }

    // Test users endpoint (GET method)
    try {
      console.log("🐛 [DEBUG] Testing users endpoint...")
      const usersResponse = await fetch(`${backendUrl}/api/usuarios?PaginaActual=1&CantidadPorPagina=50`, {
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      })

      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        const count = usersData.paginacion?.totalResultados || usersData.usuarios?.length || 0
        debugInfo.endpoints.users = { status: "success", count, error: null }
        debugInfo.summary.totalUsers = count
        console.log("✅ [DEBUG] Users endpoint success:", count)
      } else {
        const errorText = await usersResponse.text()
        debugInfo.endpoints.users = { status: "error", count: 0, error: `${usersResponse.status}: ${errorText}` }
        console.log("❌ [DEBUG] Users endpoint failed:", usersResponse.status, errorText)
      }
    } catch (error) {
      debugInfo.endpoints.users = {
        status: "error",
        count: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      }
      console.log("❌ [DEBUG] Users endpoint exception:", error)
    }

    // Test courses endpoint (POST method with correct parameters)
    try {
      console.log("🐛 [DEBUG] Testing courses endpoint with POST...")
      const coursesResponse = await fetch(`${backendUrl}/api/cursos/buscar`, {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pagina: 1,
          cantidadPorPagina: 50,
          nombre: null,
          activo: null,
          nrc: null,
        }),
      })

      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json()
        console.log("🐛 [DEBUG] Courses raw response:", coursesData)

        let count = 0
        if (coursesData.operacionExitosa && coursesData.dato) {
          if (coursesData.dato.cursos) {
            count = coursesData.dato.paginacion?.totalResultados || coursesData.dato.cursos.length
          } else if (Array.isArray(coursesData.dato)) {
            count = coursesData.dato.length
          }
        } else if (coursesData.cursos) {
          count = coursesData.paginacion?.totalResultados || coursesData.cursos.length
        } else if (Array.isArray(coursesData)) {
          count = coursesData.length
        }

        debugInfo.endpoints.courses = { status: "success", count, error: null }
        debugInfo.summary.totalCourses = count
        console.log("✅ [DEBUG] Courses endpoint success:", count)
      } else {
        const errorText = await coursesResponse.text()
        debugInfo.endpoints.courses = { status: "error", count: 0, error: `${coursesResponse.status}: ${errorText}` }
        console.log("❌ [DEBUG] Courses endpoint failed:", coursesResponse.status, errorText)
      }
    } catch (error) {
      debugInfo.endpoints.courses = {
        status: "error",
        count: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      }
      console.log("❌ [DEBUG] Courses endpoint exception:", error)
    }

    // Test modules endpoint (GET method)
    try {
      console.log("🐛 [DEBUG] Testing modules endpoint with GET...")
      const modulesGetResponse = await fetch(`${backendUrl}/api/modulos?PaginaActual=1&CantidadPorPagina=50`, {
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      })

      if (modulesGetResponse.ok) {
        const modulesData = await modulesGetResponse.json()
        console.log("🐛 [DEBUG] Modules GET raw response:", modulesData)

        let count = 0
        if (modulesData.modulos && Array.isArray(modulesData.modulos)) {
          count = modulesData.paginacion?.totalResultados || modulesData.modulos.length
        } else if (Array.isArray(modulesData)) {
          count = modulesData.length
        }

        debugInfo.endpoints.modulesGet = { status: "success", count, error: null }
        debugInfo.summary.totalModules = count
        console.log("✅ [DEBUG] Modules GET endpoint success:", count)
      } else {
        const errorText = await modulesGetResponse.text()
        debugInfo.endpoints.modulesGet = {
          status: "error",
          count: 0,
          error: `${modulesGetResponse.status}: ${errorText}`,
        }
        console.log("❌ [DEBUG] Modules GET endpoint failed:", modulesGetResponse.status, errorText)
      }
    } catch (error) {
      debugInfo.endpoints.modulesGet = {
        status: "error",
        count: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      }
      console.log("❌ [DEBUG] Modules GET endpoint exception:", error)
    }

    // Test modules endpoint (POST method)
    try {
      console.log("🐛 [DEBUG] Testing modules endpoint with POST...")
      const modulesPostResponse = await fetch(`${backendUrl}/api/modulos/buscar`, {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pagina: 1,
          cantidadPorPagina: 50,
          nombre: null,
          cursoNrc: null,
        }),
      })

      if (modulesPostResponse.ok) {
        const modulesData = await modulesPostResponse.json()
        console.log("🐛 [DEBUG] Modules POST raw response:", modulesData)

        let count = 0
        if (modulesData.operacionExitosa && modulesData.dato) {
          if (modulesData.dato.modulos) {
            count = modulesData.dato.paginacion?.totalResultados || modulesData.dato.modulos.length
          } else if (Array.isArray(modulesData.dato)) {
            count = modulesData.dato.length
          }
        } else if (modulesData.modulos) {
          count = modulesData.paginacion?.totalResultados || modulesData.modulos.length
        } else if (Array.isArray(modulesData)) {
          count = modulesData.length
        }

        debugInfo.endpoints.modulesPost = { status: "success", count, error: null }

        // Si no tenemos módulos del GET pero sí del POST, actualizar el total
        if (debugInfo.summary.totalModules === 0) {
          debugInfo.summary.totalModules = count
        }

        console.log("✅ [DEBUG] Modules POST endpoint success:", count)
      } else {
        const errorText = await modulesPostResponse.text()
        debugInfo.endpoints.modulesPost = {
          status: "error",
          count: 0,
          error: `${modulesPostResponse.status}: ${errorText}`,
        }
        console.log("❌ [DEBUG] Modules POST endpoint failed:", modulesPostResponse.status, errorText)
      }
    } catch (error) {
      debugInfo.endpoints.modulesPost = {
        status: "error",
        count: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      }
      console.log("❌ [DEBUG] Modules POST endpoint exception:", error)
    }

    // Calculate materials estimate
    debugInfo.summary.totalMaterials = Math.floor(debugInfo.summary.totalModules * 2.5)

    console.log("🐛 [DEBUG] Final debug info:", debugInfo)

    return NextResponse.json({
      success: true,
      data: debugInfo,
    })
  } catch (error) {
    console.error("❌ [DEBUG] Debug endpoint error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
