import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("📝 [CREATE-TEST-MATERIAL] Creating test material")

    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ mensaje: "Token de autorización requerido" }, { status: 401 })
    }

    const body = await request.json()
    const { moduleId } = body

    if (!moduleId) {
      return NextResponse.json({ mensaje: "moduleId es requerido" }, { status: 400 })
    }

    const token = authHeader.replace("Bearer ", "")
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"

    // Crear material de prueba
    const testMaterial = {
      nombre: `Material de Prueba - ${new Date().toLocaleString()}`,
      descripcion: "Material creado automáticamente para pruebas",
      tipo: "Enlace",
      contenido: "https://www.example.com",
      moduloId: Number.parseInt(moduleId),
    }

    console.log("📝 [CREATE-TEST-MATERIAL] Test material data:", testMaterial)

    const response = await fetch(`${backendUrl}/api/materials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(testMaterial),
    })

    const responseText = await response.text()
    console.log(`📝 [CREATE-TEST-MATERIAL] Response status: ${response.status}`)
    console.log(`📝 [CREATE-TEST-MATERIAL] Response text: ${responseText}`)

    let responseData = null
    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      responseData = responseText
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      data: responseData,
      testMaterial,
    })
  } catch (error) {
    console.error("❌ [CREATE-TEST-MATERIAL] Error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
