import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [ASSIGNED-COURSES] Starting request...")

    // Obtener el token del header Authorization
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("❌ [ASSIGNED-COURSES] No authorization header found")
      return NextResponse.json({ mensaje: "Token no proporcionado" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    console.log("🔑 [ASSIGNED-COURSES] Token found, length:", token.length)

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"
    const backendUrl = `${apiUrl}/api/cursos/asignados`
    console.log("🌐 [ASSIGNED-COURSES] Calling backend URL:", backendUrl)

    // Llamar directamente al endpoint que SÍ funciona
    const backendResponse = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    console.log("📡 [ASSIGNED-COURSES] Backend response status:", backendResponse.status)

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text()
      console.error("❌ [ASSIGNED-COURSES] Backend error:", errorText)
      return NextResponse.json(
        { mensaje: `Error del backend: ${backendResponse.status} - ${errorText}` },
        { status: backendResponse.status },
      )
    }

    const data = await backendResponse.json()
    console.log("✅ [ASSIGNED-COURSES] Backend response data:", data)

    // Normalizar: si el backend devuelve la forma { exito: true, dato: [...] } o similar,
    // devolver directamente el array de cursos para que las páginas clientes puedan consumirlo
    // de forma consistente (muchas páginas esperan un Array en la respuesta).
    if (data) {
      if (data.exito !== undefined && data.dato !== undefined) {
        return NextResponse.json(data.dato)
      }

      if (data.operacionExitosa !== undefined && data.dato !== undefined) {
        return NextResponse.json(data.dato)
      }

      if (Array.isArray(data)) {
        return NextResponse.json(data)
      }
    }

    // Fallback: devolver lo que retornó el backend
    return NextResponse.json(data)
  } catch (error) {
    console.error("❌ [ASSIGNED-COURSES] Unexpected error:", error)
    return NextResponse.json(
      { mensaje: `Error de conexión: ${error instanceof Error ? error.message : "Error desconocido"}` },
      { status: 500 },
    )
  }
}
