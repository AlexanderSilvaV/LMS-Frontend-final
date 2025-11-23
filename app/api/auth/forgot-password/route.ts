import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ mensaje: "El correo electrónico es requerido" }, { status: 400 })
    }

    // Call the backend API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/Usuarios/recuperar-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        correo: email,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json({
        mensaje: "Se ha enviado un enlace de recuperación a tu correo electrónico",
      })
    } else {
      return NextResponse.json(
        { mensaje: data.mensaje || "Error al enviar el correo de recuperación" },
        { status: response.status },
      )
    }
  } catch (error) {
    console.error("Error in forgot password:", error)
    return NextResponse.json({ mensaje: "Error interno del servidor" }, { status: 500 })
  }
}
