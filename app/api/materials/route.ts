import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [MATERIALS-API] Fetching all materials via individual modules")

    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ mensaje: "Token de autorización requerido" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"

    // Primero obtener módulos usando el endpoint que sabemos que funciona
    // Basándome en el sistema existente, voy a usar el endpoint que ya funciona en otras partes
    let modules = []
    try {
      // Intentar con el endpoint que funciona en el sistema actual
      const modulesResponse = await fetch(`${backendUrl}/api/Modulos`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      console.log(`📖 [MATERIALS-API] Modules response status: ${modulesResponse.status}`)

      if (modulesResponse.status === 405) {
        // Si GET no funciona, el endpoint podría no existir o no aceptar GET
        // Vamos a intentar obtener módulos de otra manera
        console.log("⚠️ [MATERIALS-API] GET /api/Modulos not allowed, trying alternative approach")

        // Como alternativa, vamos a devolver una respuesta vacía pero válida
        return NextResponse.json({
          materiales: [],
          total: 0,
          exito: true,
          mensaje: "No se pudieron obtener los módulos. El endpoint GET no está disponible.",
          debug: {
            backendUrl,
            modulesEndpointStatus: 405,
            note: "El backend no permite GET en /api/Modulos",
          },
        })
      }

      if (modulesResponse.ok) {
        const modulesData = await modulesResponse.json()
        console.log("📖 [MATERIALS-API] Modules data structure:", modulesData)

        // Manejar diferentes formatos de respuesta
        if (modulesData.operacionExitosa && Array.isArray(modulesData.dato)) {
          modules = modulesData.dato
        } else if (modulesData.exito && Array.isArray(modulesData.dato)) {
          modules = modulesData.dato
        } else if (Array.isArray(modulesData)) {
          modules = modulesData
        }

        console.log(`📖 [MATERIALS-API] Found ${modules.length} modules`)
      }
    } catch (error) {
      console.error("❌ [MATERIALS-API] Error fetching modules:", error)
      return NextResponse.json({
        materiales: [],
        total: 0,
        exito: false,
        mensaje: "Error al obtener módulos",
        debug: { error: error instanceof Error ? error.message : "Unknown error" },
      })
    }

    // Si no tenemos módulos, no podemos obtener materiales
    if (modules.length === 0) {
      return NextResponse.json({
        materiales: [],
        total: 0,
        exito: true,
        mensaje: "No se encontraron módulos",
        debug: {
          backendUrl,
          totalModules: 0,
        },
      })
    }

    // Obtener materiales de cada módulo usando el endpoint correcto
    const allMaterials = []
    const debugModules = []

    for (const module of modules.slice(0, 20)) {
      // Limitar para evitar demasiadas requests
      try {
        const moduleId = module.moduloId || module.id
        console.log(`📄 [MATERIALS-API] Fetching materials for module ${moduleId} (${module.nombre})`)

        // Usar el endpoint exacto del MaterialesController: GET modulo/{moduloId}
        const materialsResponse = await fetch(`${backendUrl}/api/materiales/modulo/${moduleId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        console.log(`📄 [MATERIALS-API] Module ${moduleId} response status: ${materialsResponse.status}`)

        debugModules.push({
          moduleId,
          moduleName: module.nombre,
          status: materialsResponse.status,
          statusText: materialsResponse.statusText,
        })

        if (materialsResponse.ok) {
          const materialsData = await materialsResponse.json()
          console.log(`📄 [MATERIALS-API] Module ${moduleId} materials:`, materialsData)

          // El backend devuelve directamente el array de MaterialDTO
          let moduleMaterials = []
          if (Array.isArray(materialsData)) {
            moduleMaterials = materialsData
          } else if (materialsData.dato && Array.isArray(materialsData.dato)) {
            moduleMaterials = materialsData.dato
          }

          // Normalizar los materiales
          const normalizedMaterials = moduleMaterials.map((mat: any) => ({
            materialId: mat.materialId || mat.MaterialId,
            nombre: mat.nombre || mat.Nombre,
            tipo: mat.tipo || mat.Tipo,
            ruta: mat.ruta || mat.Ruta,
            moduloId: mat.moduloId || mat.ModuloId || moduleId,
            usuarioId: mat.usuarioId || mat.UsuarioId,
            fechaCreacion: mat.fechaCreacion || new Date().toISOString(),
          }))

          allMaterials.push(...normalizedMaterials)
          console.log(`📄 [MATERIALS-API] Module ${moduleId} added ${normalizedMaterials.length} materials`)
        } else if (materialsResponse.status === 403) {
          console.warn(`⚠️ [MATERIALS-API] No access to module ${moduleId}`)
        } else if (materialsResponse.status === 404) {
          console.warn(`⚠️ [MATERIALS-API] Module ${moduleId} not found`)
        }
      } catch (moduleError) {
        console.warn(`⚠️ [MATERIALS-API] Error fetching materials for module:`, moduleError)
        debugModules.push({
          moduleId: module.moduloId || module.id,
          moduleName: module.nombre,
          error: moduleError instanceof Error ? moduleError.message : "Unknown error",
        })
      }
    }

    console.log(`✅ [MATERIALS-API] Total materials found: ${allMaterials.length}`)

    return NextResponse.json({
      materiales: allMaterials,
      total: allMaterials.length,
      exito: true,
      debug: {
        totalModules: modules.length,
        debugModules: debugModules,
        backendUrl,
      },
    })
  } catch (error) {
    console.error("❌ [MATERIALS-API] Error:", error)
    return NextResponse.json(
      {
        mensaje: `Error de conexión: ${error instanceof Error ? error.message : "Error desconocido"}`,
        materiales: [],
        exito: false,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("📝 [MATERIALS-API] Creating new material")

    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ mensaje: "Token de autorización requerido" }, { status: 401 })
    }

    const body = await request.json()
    const token = authHeader.replace("Bearer ", "")
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"

    // Adaptar los datos al formato esperado por MaterialCreacionDTO
    const createData = {
      nombre: body.nombre,
      tipo: body.tipo === "Enlace" ? 1 : body.tipo === "Video" ? 2 : 0, // Convertir string a enum
      ruta: body.ruta || body.contenido,
      moduloId: body.moduloId,
    }

    console.log("📝 [MATERIALS-API] Sending data to backend:", createData)

    // Usar el endpoint exacto del MaterialesController: POST /api/materiales
    const response = await fetch(`${backendUrl}/api/materiales`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(createData),
    })

    console.log(`📝 [MATERIALS-API] Backend response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ [MATERIALS-API] Backend error:", errorText)

      let errorMessage = `Error del servidor: ${response.status}`
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.mensaje) {
          errorMessage = errorData.mensaje
        }
      } catch (e) {
        errorMessage = errorText || errorMessage
      }

      return NextResponse.json({ mensaje: errorMessage }, { status: response.status })
    }

    const data = await response.json()
    console.log("✅ [MATERIALS-API] Material created successfully:", data)

    return NextResponse.json(data)
  } catch (error) {
    console.error("❌ [MATERIALS-API] Error creating material:", error)
    return NextResponse.json(
      { mensaje: `Error: ${error instanceof Error ? error.message : "Error desconocido"}` },
      { status: 500 },
    )
  }
}
