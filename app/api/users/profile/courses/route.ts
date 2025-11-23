import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ mensaje: "Token no proporcionado" }, { status: 401 })
    }

    // Obtener cursos asignados al usuario actual
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"}/api/curso-usuarios/mis-cursos`,
      {
        method: "GET",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      }
    )

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json(data)
    } else {
      const errorData = await response.json()
      return NextResponse.json(errorData, { status: response.status })
    }
  } catch (error) {
    console.error("Profile courses API error:", error)
    return NextResponse.json({ mensaje: "Error interno del servidor" }, { status: 500 })
  }
}
