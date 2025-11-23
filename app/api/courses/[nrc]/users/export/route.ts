import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { nrc: string } }
) {
  try {
    const courseNrc = params.nrc
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "csv"

    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ mensaje: "Token no proporcionado" }, { status: 401 })
    }

    // Obtener usuarios del curso
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"}/api/curso-usuarios/curso/${courseNrc}`,
      {
        method: "GET",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      return NextResponse.json({ mensaje: "Error al obtener usuarios del curso" }, { status: response.status })
    }

    const data = await response.json()
    const users = data.exito && data.dato ? (Array.isArray(data.dato) ? data.dato : [data.dato]) : []

    // Obtener información del curso
    const courseResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"}/api/cursos/${courseNrc}`,
      {
        method: "GET",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      }
    )

    let courseName = `Curso ${courseNrc}`
    if (courseResponse.ok) {
      const courseData = await courseResponse.json()
      if (courseData.exito && courseData.dato) {
        courseName = courseData.dato.nombre || courseName
      }
    }

    if (format === "csv") {
      // Generar CSV
      const csvHeaders = ["Nombre", "Email", "Rol en Curso", "ID Usuario"]
      const csvRows = users.map((user: any) => [
        user.nombreUsuario || "N/A",
        user.email || "N/A",
        user.rolEnCurso || "N/A",
        user.usuarioId || "N/A",
      ])

      const csvContent = [
        csvHeaders.join(","),
        ...csvRows.map((row: string[]) => row.map((field: string) => `"${field}"`).join(",")),
      ].join("\n")

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="usuarios_${courseName.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    } else if (format === "json") {
      // Generar JSON
      const jsonData = {
        curso: {
          id: courseNrc,
          nombre: courseName,
          fechaExportacion: new Date().toISOString(),
        },
        usuarios: users.map((user: any) => ({
          nombre: user.nombreUsuario || "N/A",
          email: user.email || "N/A",
          rolEnCurso: user.rolEnCurso || "N/A",
          usuarioId: user.usuarioId || "N/A",
        })),
        totalUsuarios: users.length,
      }

      return new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="usuarios_${courseName.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.json"`,
        },
      })
    } else {
      return NextResponse.json({ mensaje: "Formato no soportado" }, { status: 400 })
    }
  } catch (error) {
    console.error("Export users error:", error)
    return NextResponse.json({ mensaje: "Error interno del servidor" }, { status: 500 })
  }
}
