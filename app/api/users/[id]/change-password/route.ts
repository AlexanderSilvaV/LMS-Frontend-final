import { NextRequest, NextResponse } from "next/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ mensaje: "Token no proporcionado" }, { status: 401 })
    }

    const body = await request.json()

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"}/api/usuarios/${userId}/change-password`,
      {
        method: "PUT",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    )

    if (response.ok) {
      const data = await response.text()
      return NextResponse.json({ mensaje: data })
    } else {
      const errorData = await response.json()
      return NextResponse.json(errorData, { status: response.status })
    }
  } catch (error) {
    console.error("Change password API error:", error)
    return NextResponse.json({ mensaje: "Error interno del servidor" }, { status: 500 })
  }
}
