import { type NextRequest, NextResponse } from "next/server"
import { backendService } from "@/app/lib/backend-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const authHeader = request.headers.get("authorization")

    console.log("=== USERS API DEBUG ===")
    console.log("Auth header:", authHeader ? "Present" : "Missing")
    console.log("Search params:", Object.fromEntries(searchParams.entries()))
    console.log("Backend URL:", process.env.NEXT_PUBLIC_API_URL)

    if (!authHeader) {
      console.log("No auth header provided")
      return NextResponse.json({ mensaje: "Token de autorización requerido" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")

    const paginaActual = Number.parseInt(searchParams.get("PaginaActual") || "1")
    const cantidadPorPagina = Number.parseInt(searchParams.get("CantidadPorPagina") || "10")
    const nombre = searchParams.get("Nombre")
    const correo = searchParams.get("Correo") // Changed from Email to Correo
    const rol = searchParams.get("Rol")

    console.log("Parsed params:", { paginaActual, cantidadPorPagina, nombre, correo, rol })

    try {
      console.log("Calling backendService.getUsers...")
      const data = await backendService.getUsers(
        {
          paginaActual,
          cantidadPorPagina,
          nombre: nombre || undefined,
          email: correo || undefined, // Map correo to email for backend service
          rol: rol || undefined,
        },
        token,
      )

      console.log("Backend response received:", JSON.stringify(data, null, 2))
      return NextResponse.json(data)
    } catch (error) {
      console.error("Error in backendService.getUsers:", error)
      return NextResponse.json(
        { mensaje: `Error de conexión: ${error instanceof Error ? error.message : "Error desconocido"}` },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in users API route:", error)
    return NextResponse.json(
      { mensaje: `Error de conexión: ${error instanceof Error ? error.message : "Error desconocido"}` },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const authHeader = request.headers.get("authorization")

    console.log("Creating user with data:", body)

    if (!authHeader) {
      return NextResponse.json({ mensaje: "Token de autorización requerido" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")

    // Map frontend fields to backend DTO fields
    const backendData = {
      nombre: body.nombre,
      correo: body.correo,
      contraseña: body.contraseña,
      rol: body.rol,
      rut: body.rut,
    }

    console.log("Mapped data for backend:", backendData)

    try {
      const data = await backendService.createUser(backendData, token)
      return NextResponse.json(data)
    } catch (error) {
      console.error("Error creating user:", error)
      return NextResponse.json(
        { mensaje: `Error de conexión: ${error instanceof Error ? error.message : "Error desconocido"}` },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in create user API route:", error)
    return NextResponse.json(
      { mensaje: `Error de conexión: ${error instanceof Error ? error.message : "Error desconocido"}` },
      { status: 500 },
    )
  }
}
