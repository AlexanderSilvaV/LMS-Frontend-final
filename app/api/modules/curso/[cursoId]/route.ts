import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { cursoId: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    const cursoId = params.cursoId

    console.log("=== MODULES API GET BY COURSE ===")
    console.log("Getting modules for course:", cursoId)

    if (!authHeader) {
      return NextResponse.json({ mensaje: "Token de autorización requerido" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"
      const url = `${backendUrl}/api/Modulos/curso/${cursoId}`

      console.log("Getting from:", url)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Backend error:", response.status, errorText)

        if (response.status === 404) {
          return NextResponse.json({ mensaje: "Curso no encontrado" }, { status: 404 })
        }

        throw new Error(`Backend error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("Modules retrieved:", data)
  // Normalize response: unwrap `dato` if present, otherwise return array
  const modules = Array.isArray(data) ? data : data?.dato || []
  return NextResponse.json(modules)
    } catch (error) {
      console.error("Error getting modules:", error)
      return NextResponse.json(
        { mensaje: `Error al obtener módulos: ${error instanceof Error ? error.message : "Error desconocido"}` },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in get modules API route:", error)
    return NextResponse.json(
      { mensaje: `Error de conexión: ${error instanceof Error ? error.message : "Error desconocido"}` },
      { status: 500 },
    )
  }
}
