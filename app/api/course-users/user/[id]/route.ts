import { type NextRequest, NextResponse } from "next/server"
import { backendService } from "@/app/lib/backend-service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("authorization")

    console.log("Getting courses for user:", params.id)

    if (!authHeader) {
      return NextResponse.json({ mensaje: "Token de autorización requerido" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const userId = params.id

    try {
      const data = await backendService.getUserCourses(userId, token)
      console.log("User courses fetched successfully:", data)
      return NextResponse.json(data)
    } catch (error) {
      console.error("Error fetching user courses:", error)
      return NextResponse.json(
        {
          mensaje: `Error al obtener cursos del usuario: ${error instanceof Error ? error.message : "Error desconocido"}`,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in get user courses API route:", error)
    return NextResponse.json(
      { mensaje: `Error de conexión: ${error instanceof Error ? error.message : "Error desconocido"}` },
      { status: 500 },
    )
  }
}
