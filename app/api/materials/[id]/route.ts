import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const materialId = params.id
    console.log(`🔄 [MATERIALS-UPDATE] Updating material: ${materialId}`)

    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ mensaje: "Token de autorización requerido" }, { status: 401 })
    }

    const body = await request.json()
    const token = authHeader.replace("Bearer ", "")
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"

    // Adaptar los datos al formato esperado por MaterialEdicionDTO
    const updateData = {
      nombre: body.nombre,
      ruta: body.contenido || body.ruta, // Solo se puede editar nombre y ruta
    }

    console.log(`🔄 [MATERIALS-UPDATE] Sending data:`, updateData)

    // Usar la ruta exacta del backend: /api/materiales/{materialId}
    const response = await fetch(`${backendUrl}/api/materiales/${materialId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    })

    console.log(`🔄 [MATERIALS-UPDATE] Backend response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ [MATERIALS-UPDATE] Backend error:", errorText)

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
    console.log("✅ [MATERIALS-UPDATE] Material updated successfully:", data)

    return NextResponse.json(data)
  } catch (error) {
    console.error("❌ [MATERIALS-UPDATE] Error:", error)
    return NextResponse.json(
      { mensaje: `Error: ${error instanceof Error ? error.message : "Error desconocido"}` },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const materialId = params.id
    console.log(`🗑️ [MATERIALS-DELETE] Deleting material: ${materialId}`)

    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ mensaje: "Token de autorización requerido" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"

    // Usar la ruta exacta del backend: /api/materiales/{materialId}
    const response = await fetch(`${backendUrl}/api/materiales/${materialId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    console.log(`🗑️ [MATERIALS-DELETE] Backend response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ [MATERIALS-DELETE] Backend error:", errorText)

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

    const responseText = await response.text()
    console.log("✅ [MATERIALS-DELETE] Material deleted successfully:", responseText)

    return NextResponse.json({ mensaje: "Material eliminado exitosamente" })
  } catch (error) {
    console.error("❌ [MATERIALS-DELETE] Error:", error)
    return NextResponse.json(
      { mensaje: `Error: ${error instanceof Error ? error.message : "Error desconocido"}` },
      { status: 500 },
    )
  }
}
