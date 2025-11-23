import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, token, newPassword } = await request.json()

    if (!token || !newPassword) {
      return NextResponse.json({ mensaje: "Token y nueva contraseña son requeridos" }, { status: 400 })
    }

    // Map to backend DTO expected property names
    const backendBody = {
      Correo: email || "",
      Token: token,
      NuevaContraseña: newPassword,
    }

    // Call the backend API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/Usuarios/restablecer-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendBody),
    })

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json({
        mensaje: "Contraseña restablecida exitosamente",
      })
    } else {
      return NextResponse.json(
        { mensaje: data.mensaje || "Error al restablecer la contraseña" },
        { status: response.status },
      )
    }
  } catch (error) {
    console.error("Error in reset password:", error)
    return NextResponse.json({ mensaje: "Error interno del servidor" }, { status: 500 })
  }
}
