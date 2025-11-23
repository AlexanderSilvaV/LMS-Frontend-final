import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ mensaje: "No autorizado" }, { status: 401 })
    }

    // Decodificar el token para obtener el ID del usuario
    const userId = getUserIdFromToken(token)

    if (!userId) {
      return NextResponse.json({ mensaje: "No se pudo obtener el ID del usuario del token" }, { status: 400 })
    }

  console.log("🔍 [API-STUDENT-COURSES] Fetching assigned courses for user:", userId)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"

  // Usar el endpoint que devuelve los cursos asignados al usuario autenticado
    let response = await fetch(`${apiUrl}/api/cursos/asignados`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    // Fallback: some backends may not implement /api/cursos/asignados for GET
    if (response.status === 404 || response.status === 405) {
      console.warn("⚠️ [API-STUDENT-COURSES] /api/cursos/asignados not available, trying /api/cursos as fallback")
      response = await fetch(`${apiUrl}/api/cursos`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
    }

    console.log("📡 [API-STUDENT-COURSES] Response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ [API-STUDENT-COURSES] Error response:", errorText)
      return NextResponse.json(
        { mensaje: `Error del servidor: ${response.status} ${response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("📚 [API-STUDENT-COURSES] Courses data received")

    // Normalizar y devolver un array de cursos (desenvolvemos `dato` si aplica)
    const coursesArray = Array.isArray(data)
      ? data
      : Array.isArray(data?.dato)
      ? data.dato
      : Array.isArray(data?.cursos)
      ? data.cursos
      : []

    return NextResponse.json(coursesArray)
  } catch (error) {
    console.error("❌ [API-STUDENT-COURSES] Error:", error)
    return NextResponse.json(
      { mensaje: `Error de conexión: ${error instanceof Error ? error.message : "Error desconocido"}` },
      { status: 500 },
    )
  }
}

// Función para extraer el ID del usuario del token JWT
function getUserIdFromToken(token: string): string | null {
  try {
    const parts = token.split(".")
    if (parts.length < 2) return null

    const base64Url = parts[1]
    if (!base64Url) return null

    // Decode Base64 URL safe
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")

    // In Node (server runtime) use Buffer; in browser `atob` may exist but route runs server-side
    let jsonPayload = ""
    if (typeof Buffer !== "undefined") {
      jsonPayload = Buffer.from(base64, "base64").toString("utf8")
    } else if (typeof atob === "function") {
      jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      )
    } else {
      return null
    }

    const payload = JSON.parse(jsonPayload)
    return payload.id || payload.sub || payload.nameid || null
  } catch (error) {
    console.error("Error decoding token:", error)
    return null
  }
}
