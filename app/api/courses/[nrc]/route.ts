import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { nrc: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    const courseNrc = params.nrc

    console.log("=== COURSE GET BY NRC ===")
    console.log("Course NRC:", courseNrc)

    if (!authHeader) {
      return NextResponse.json({ mensaje: "Token de autorización requerido" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"

      // Parse as NRC (number)
      const nrc = Number.parseInt(courseNrc)

      if (isNaN(nrc)) {
        return NextResponse.json({ mensaje: "ID de curso inválido - se requiere un NRC numérico" }, { status: 400 })
      }

      // First, get all assigned courses for the user
      const assignedResponse = await fetch(`${backendUrl}/api/cursos/asignados`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!assignedResponse.ok) {
        const errorText = await assignedResponse.text()
        console.error("Error getting assigned courses:", assignedResponse.status, errorText)
        throw new Error(`HTTP ${assignedResponse.status}: ${errorText}`)
      }

      const assignedData = await assignedResponse.json()
      console.log("Assigned courses raw:", assignedData)

      // assignedData can be an array, or { dato: [...] }, or a ResultadoOperacion wrapper.
      let assignmentsArray: any[] = []
      if (Array.isArray(assignedData)) {
        assignmentsArray = assignedData
      } else if (assignedData.dato && Array.isArray(assignedData.dato)) {
        assignmentsArray = assignedData.dato
      } else if (assignedData.operacionExitosa && Array.isArray(assignedData.dato)) {
        assignmentsArray = assignedData.dato
      } else if (assignedData.cursos && Array.isArray(assignedData.cursos)) {
        assignmentsArray = assignedData.cursos
      } else {
        // Fallback: try to use the object itself when it looks like a single course
        if (assignedData.nrc) assignmentsArray = [assignedData]
      }

      const found = assignmentsArray.find((c: any) => {
        const nrcVal = c.nrc ?? c.curso?.nrc ?? c.cursoNrc ?? c.cursoId
        return Number(nrcVal) === nrc
      })

      if (!found) {
        return NextResponse.json({ mensaje: "Curso no encontrado o no asignado" }, { status: 404 })
      }

      // Normalize shape: if assignment wraps curso, unwrap it
      const normalized = found.curso || found
      normalized.activo = normalized.activo !== undefined ? normalized.activo : true
      // Ensure nrc is numeric
      normalized.nrc = Number(normalized.nrc || normalized.cursoNrc || normalized.cursoId)

      console.log("Course normalized:", normalized)
      return NextResponse.json(normalized)
    } catch (error) {
      console.error("Error fetching course:", error)
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"

      if (errorMessage.includes("404")) {
        return NextResponse.json({ mensaje: "Curso no encontrado" }, { status: 404 })
      } else if (errorMessage.includes("401") || errorMessage.includes("unauthorized")) {
        return NextResponse.json({ mensaje: "No autorizado" }, { status: 401 })
      } else {
        return NextResponse.json({ mensaje: errorMessage }, { status: 500 })
      }
    }
  } catch (error) {
    console.error("Error in get course API route:", error)
    return NextResponse.json(
      { mensaje: `Error de conexión: ${error instanceof Error ? error.message : "Error desconocido"}` },
      { status: 500 },
    )
  }
}
