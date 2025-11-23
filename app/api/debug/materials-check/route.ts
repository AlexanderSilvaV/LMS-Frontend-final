import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"
  const authHeader = request.headers.get("authorization")

  if (!authHeader) {
    return NextResponse.json({ error: "No authorization token provided" }, { status: 401 })
  }

  const token = authHeader.replace("Bearer ", "")

  const results = {
    backendUrl,
    timestamp: new Date().toISOString(),
    availableEndpoints: {} as Record<string, any>,
    materialEndpointTests: {} as Record<string, any>,
    summary: {
      workingEndpoints: [] as string[],
      errorEndpoints: [] as string[],
      networkErrors: [] as string[],
      totalModules: 0,
      materialsFound: 0,
    },
  }

  console.log(`🔍 [DEBUG] Starting comprehensive backend test at: ${backendUrl}`)

  // Probar endpoints que sabemos que existen basándose en el sistema funcionando
  const knownWorkingEndpoints = [
    { name: "Cursos", method: "GET", path: "/api/Cursos" },
    { name: "Usuarios", method: "GET", path: "/api/Usuarios" },
  ]

  // Probar endpoints conocidos para verificar conectividad
  for (const endpoint of knownWorkingEndpoints) {
    try {
      console.log(`🔍 [DEBUG] Testing known endpoint: ${endpoint.path}`)

      const response = await fetch(`${backendUrl}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      results.availableEndpoints[endpoint.name] = {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        method: endpoint.method,
        path: endpoint.path,
      }

      if (response.ok) {
        results.summary.workingEndpoints.push(endpoint.name)
        console.log(`✅ [DEBUG] ${endpoint.name} is working`)
      } else {
        results.summary.errorEndpoints.push(endpoint.name)
        console.log(`❌ [DEBUG] ${endpoint.name} failed with status ${response.status}`)
      }
    } catch (error) {
      results.availableEndpoints[endpoint.name] = {
        error: error instanceof Error ? error.message : "Unknown error",
        method: endpoint.method,
        path: endpoint.path,
      }
      results.summary.networkErrors.push(endpoint.name)
      console.log(`🔥 [DEBUG] ${endpoint.name} network error:`, error)
    }
  }

  // Ahora probar específicamente los endpoints de materiales que sabemos que existen
  // Basándome en el MaterialesController, estos son los endpoints reales:

  // 1. Primero necesitamos obtener algunos módulos para probar materiales
  let testModules = []

  // Intentar obtener módulos de diferentes maneras
  const moduleEndpointVariations = ["/api/Modulos", "/api/modulos", "/api/Modules"]

  for (const moduleEndpoint of moduleEndpointVariations) {
    try {
      console.log(`📖 [DEBUG] Trying to get modules from: ${moduleEndpoint}`)

      const response = await fetch(`${backendUrl}${moduleEndpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      results.availableEndpoints[`Modules_${moduleEndpoint}`] = {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      }

      if (response.ok) {
        const data = await response.json()

        // Intentar extraer módulos de diferentes formatos
        if (data.operacionExitosa && Array.isArray(data.dato)) {
          testModules = data.dato.slice(0, 3) // Solo los primeros 3 para testing
        } else if (data.exito && Array.isArray(data.dato)) {
          testModules = data.dato.slice(0, 3)
        } else if (Array.isArray(data)) {
          testModules = data.slice(0, 3)
        }

        if (testModules.length > 0) {
          results.summary.totalModules = testModules.length
          console.log(`✅ [DEBUG] Got ${testModules.length} modules from ${moduleEndpoint}`)
          break
        }
      }
    } catch (error) {
      results.availableEndpoints[`Modules_${moduleEndpoint}`] = {
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  // 2. Probar endpoints específicos de materiales con módulos reales
  if (testModules.length > 0) {
    console.log(`📄 [DEBUG] Testing material endpoints with ${testModules.length} modules`)

    for (const module of testModules) {
      const moduleId = module.moduloId || module.id
      const moduleName = module.nombre || "Unknown"

      // Probar el endpoint real del MaterialesController: GET modulo/{moduloId}
      const materialEndpoint = `/api/materials/modulo/${moduleId}`

      try {
        console.log(`📄 [DEBUG] Testing materials for module ${moduleId}: ${materialEndpoint}`)

        const response = await fetch(`${backendUrl}${materialEndpoint}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        const responseText = await response.text()

        results.materialEndpointTests[`Module_${moduleId}`] = {
          moduleId,
          moduleName,
          endpoint: materialEndpoint,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          bodyPreview: responseText.substring(0, 200),
        }

        if (response.ok) {
          try {
            const materialsData = JSON.parse(responseText)
            let materialsCount = 0

            if (Array.isArray(materialsData)) {
              materialsCount = materialsData.length
            } else if (materialsData.dato && Array.isArray(materialsData.dato)) {
              materialsCount = materialsData.dato.length
            }

            results.materialEndpointTests[`Module_${moduleId}`].materialsCount = materialsCount
            results.summary.materialsFound += materialsCount

            console.log(`✅ [DEBUG] Module ${moduleId} has ${materialsCount} materials`)
          } catch (parseError) {
            results.materialEndpointTests[`Module_${moduleId}`].parseError = "Invalid JSON response"
          }
        } else {
          console.log(`❌ [DEBUG] Module ${moduleId} materials failed: ${response.status}`)
        }
      } catch (error) {
        results.materialEndpointTests[`Module_${moduleId}`] = {
          moduleId,
          moduleName,
          endpoint: materialEndpoint,
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
    }
  } else {
    console.log("⚠️ [DEBUG] No modules found, cannot test material endpoints")
  }

  // 3. Probar otros endpoints de materiales del MaterialesController
  const otherMaterialEndpoints = [
    { name: "CreateMaterial", method: "POST", path: "/api/materials", note: "Requires body" },
    {
      name: "UploadFile",
      method: "POST",
      path: "/api/materials/modulo/1/archivo",
      note: "Requires file and valid moduleId",
    },
  ]

  for (const endpoint of otherMaterialEndpoints) {
    results.materialEndpointTests[endpoint.name] = {
      method: endpoint.method,
      path: endpoint.path,
      note: endpoint.note,
      status: "Not tested - requires specific data",
    }
  }

  console.log("📊 [DEBUG] Final results summary:", results.summary)

  return NextResponse.json(results)
}
