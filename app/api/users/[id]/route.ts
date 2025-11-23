import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("authorization")

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/usuarios/${params.id}`, {
      method: "GET",
      headers: {
        Authorization: authHeader || "",
      },
    })

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json(data)
    } else {
      return NextResponse.json(data, { status: response.status })
    }
  } catch (error) {
    return NextResponse.json({ mensaje: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const authHeader = request.headers.get("authorization")

    console.log("Updating user with data:", body)

    // Map frontend fields to backend DTO fields (UsuarioEdicionDTO)
    const backendData = {
      nombre: body.nombre,
      correo: body.correo,
      rol: body.rol,
    }

    console.log("Mapped data for backend:", backendData)

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/usuarios/${params.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader || "",
      },
      body: JSON.stringify(backendData),
    })

    if (response.ok) {
      const data = await response.text()
      return NextResponse.json({ mensaje: data || "Usuario actualizado correctamente" })
    } else {
      const errorText = await response.text()
      console.error("Backend error:", errorText)
      try {
        const errorData = JSON.parse(errorText)
        return NextResponse.json(errorData, { status: response.status })
      } catch {
        return NextResponse.json({ mensaje: errorText || "Error al actualizar usuario" }, { status: response.status })
      }
    }
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ mensaje: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("authorization")

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/usuarios/${params.id}`, {
      method: "DELETE",
      headers: {
        Authorization: authHeader || "",
      },
    })

    if (response.ok) {
      return NextResponse.json({ mensaje: "Usuario eliminado correctamente" })
    } else {
      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    }
  } catch (error) {
    return NextResponse.json({ mensaje: "Error interno del servidor" }, { status: 500 })
  }
}
