import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    const courseId = params.courseId

    console.log("=== MODULES BY COURSE API ===")
    console.log("Getting modules for course:", courseId)

    if (!authHeader) {
      return NextResponse.json({ mensaje: "Token de autorización requerido" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"

      // First verify the user has access to this course
      const assignedResponse = await fetch(`${backendUrl}/api/cursos/asignados`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!assignedResponse.ok) {
        throw new Error("No se pudo verificar el acceso al curso")
      }

      const assignedData = await assignedResponse.json()

      // assignedData may be an array or wrapped in { dato: [...] }
      const assignedArray = Array.isArray(assignedData)
        ? assignedData
        : assignedData?.dato && Array.isArray(assignedData.dato)
        ? assignedData.dato
        : []

      const hasAccess = assignedArray.some((course: any) => {
        const nrcVal = course.nrc ?? course.curso?.nrc ?? course.cursoNrc
        return nrcVal && nrcVal.toString() === courseId
      })

      if (!hasAccess) {
        return NextResponse.json({ mensaje: "No tienes acceso a este curso" }, { status: 403 })
      }

      // Attempt to call backend modules endpoint and normalize output.
  const modulesUrl = `${backendUrl}/api/Modulos/curso/${courseId}`
      const modulesResp = await fetch(modulesUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (modulesResp.ok) {
        const modulesData = await modulesResp.json()
        const modules = Array.isArray(modulesData) ? modulesData : modulesData?.dato || []
        return NextResponse.json(modules)
      }

      // If backend call failed or is not allowed, return empty array
      return NextResponse.json([])
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
