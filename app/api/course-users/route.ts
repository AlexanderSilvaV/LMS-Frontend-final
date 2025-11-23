import { type NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("📝 [COURSE-USERS-API] Assignment request:", body)

    // Get the authorization header from the request
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("❌ [COURSE-USERS-API] No valid authorization header")
      return NextResponse.json({ mensaje: "Token de autorización requerido" }, { status: 401 })
    }

    console.log("🔑 [COURSE-USERS-API] Auth header found:", authHeader.substring(0, 20) + "...")

    // Normalize the role to match backend expectations (Alumno or Docente)
    let rolEnCurso = body.rolEnCurso

    console.log("🔍 [COURSE-USERS-API] Original role:", rolEnCurso)

    // Map different role variations to the expected backend values
    if (rolEnCurso === "Estudiante" || rolEnCurso === "Student" || rolEnCurso === "estudiante") {
      rolEnCurso = "Alumno"
    } else if (rolEnCurso === "Profesor" || rolEnCurso === "Teacher" || rolEnCurso === "docente") {
      rolEnCurso = "Docente"
    }

    console.log("🔄 [COURSE-USERS-API] Normalized role:", rolEnCurso)

    // Validate that we have a valid role
    if (!["Alumno", "Docente"].includes(rolEnCurso)) {
      console.error("❌ [COURSE-USERS-API] Invalid role:", rolEnCurso)
      return NextResponse.json(
        {
          mensaje: `Rol inválido: '${body.rolEnCurso}'. Debe ser 'Alumno' o 'Docente'`,
        },
        { status: 400 },
      )
    }

    // Map frontend data to backend format (based on AsignacionUsuarioCursoDTO)
    const backendData = {
      UsuarioId: body.usuarioId,
      CursoId: body.cursoId || body.cursoNrc,
      RolEnCurso: rolEnCurso,
    }

    console.log("🔄 [COURSE-USERS-API] Mapped data for backend:", backendData)

    // Call the backend API
    const backendUrl = `${API_BASE_URL}/api/curso-usuarios/asignar`
    console.log(`🔗 [COURSE-USERS-API] Calling backend: ${backendUrl}`)

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        Authorization: authHeader, // Pass through the authorization header
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendData),
    })

    console.log(`📡 [COURSE-USERS-API] Backend response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [COURSE-USERS-API] Backend error: ${response.status}`, errorText)

      let errorMessage = "Error al asignar usuario al curso"
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.mensaje) {
          errorMessage = errorData.mensaje
        }
      } catch (parseError) {
        console.error("Error parsing error response:", parseError)
        errorMessage = errorText || errorMessage
      }

      return NextResponse.json({ mensaje: errorMessage }, { status: response.status })
    }

    const data = await response.json()
    console.log(`✅ [COURSE-USERS-API] Assignment successful:`, data)

    return NextResponse.json(data)
  } catch (error) {
    console.error("❌ [COURSE-USERS-API] Error:", error)
    return NextResponse.json(
      {
        mensaje: `Error interno del servidor: ${error instanceof Error ? error.message : "Error desconocido"}`,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("🗑️ [COURSE-USERS-API] Remove request:", body)

    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("❌ [COURSE-USERS-API] No valid authorization header")
      return NextResponse.json({ mensaje: "Token de autorización requerido" }, { status: 401 })
    }

    const cursoId = body.cursoId || body.cursoNrc
    const usuarioId = body.usuarioId

    if (!cursoId || !usuarioId) {
      return NextResponse.json({ mensaje: "Faltan parámetros requeridos" }, { status: 400 })
    }

    // Call the backend API
    const backendUrl = `${API_BASE_URL}/api/curso-usuarios/${cursoId}/${usuarioId}`
    console.log(`🔗 [COURSE-USERS-API] Calling backend: ${backendUrl}`)

    const response = await fetch(backendUrl, {
      method: "DELETE",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    })

    console.log(`📡 [COURSE-USERS-API] Backend response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [COURSE-USERS-API] Backend error: ${response.status}`, errorText)

      let errorMessage = "Error al eliminar usuario del curso"
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.mensaje) {
          errorMessage = errorData.mensaje
        }
      } catch (parseError) {
        console.error("Error parsing error response:", parseError)
        errorMessage = errorText || errorMessage
      }

      return NextResponse.json({ mensaje: errorMessage }, { status: response.status })
    }

    let data = { mensaje: "Usuario eliminado del curso exitosamente" }

    try {
      const responseText = await response.text()
      if (responseText) {
        data = JSON.parse(responseText)
      }
    } catch (e) {
      console.log("Using default success message for deletion")
    }

    console.log(`✅ [COURSE-USERS-API] Removal successful:`, data)

    return NextResponse.json(data)
  } catch (error) {
    console.error("❌ [COURSE-USERS-API] Error:", error)
    return NextResponse.json(
      {
        mensaje: `Error interno del servidor: ${error instanceof Error ? error.message : "Error desconocido"}`,
      },
      { status: 500 },
    )
  }
}
