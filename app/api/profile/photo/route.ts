import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ mensaje: "Token no proporcionado" }, { status: 401 })
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"}/api/Profile/me/avatar`,
      {
        method: "GET",
        headers: {
          Authorization: authHeader,
        },
      },
    )

    if (response.ok) {
      // El backend ahora retorna JSON con la URL de S3
      const data = await response.json()
      const s3Url = data.url

      if (!s3Url) {
        return NextResponse.json({ mensaje: "URL de avatar no disponible" }, { status: 404 })
      }

      // Hacer fetch a la URL de S3 (presigned URL)
      const s3Response = await fetch(s3Url)

      if (s3Response.ok) {
        const imageBuffer = await s3Response.arrayBuffer()
        const contentType = s3Response.headers.get("content-type") || "image/png"

        return new NextResponse(imageBuffer, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=300", // Cache por 5 minutos (menos que la expiración de 15 min)
          },
        })
      } else {
        return NextResponse.json({ mensaje: "Error al obtener imagen desde S3" }, { status: 404 })
      }
    } else {
      // Si no hay imagen, retornar 404
      return NextResponse.json({ mensaje: "Avatar no encontrado" }, { status: 404 })
    }
  } catch (error) {
    console.error("Profile photo get API error:", error)
    return NextResponse.json({ mensaje: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ mensaje: "Token no proporcionado" }, { status: 401 })
    }

    const formData = await request.formData()
    const archivo = formData.get("archivo") as File

    if (!archivo) {
      return NextResponse.json({ mensaje: "No se ha proporcionado ninguna imagen" }, { status: 400 })
    }

    // Crear FormData para enviar al backend con el mismo campo que el controller espera
    const backendFormData = new FormData()
    backendFormData.append("archivo", archivo)

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"}/api/Profile/me/avatar`,
      {
        method: "POST",
        headers: {
          Authorization: authHeader,
        },
        body: backendFormData,
      },
    )

    // Try to parse JSON, but gracefully fall back to text if backend returns non-JSON (e.g., exception text)
    let data: any
    const contentType = response.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      try {
        data = await response.json()
      } catch (err) {
        const text = await response.text()
        data = { mensaje: text }
      }
    } else {
      const text = await response.text()
      data = { mensaje: text }
    }

    if (response.ok) {
      // Normalize success payload: some backends return { dato: "/uploads/..." }
      // while others return ResultadoOperacion with dato being a UsuarioPerfilDTO that contains AvatarUrl.
      let normalized: any = data
      try {
        const maybeDato = data?.dato ?? data
        // If dato is an object, try to extract a known avatar property
        if (maybeDato && typeof maybeDato === "object") {
          const avatarPath = maybeDato.AvatarUrl || maybeDato.avatarUrl || maybeDato.fotoPerfil || maybeDato.Avatar || maybeDato.url || maybeDato.Ruta || maybeDato.ruta
          if (avatarPath) {
            normalized = { dato: avatarPath }
          } else if (typeof maybeDato === "string") {
            normalized = { dato: maybeDato }
          } else {
            // fallback: return original data
            normalized = data
          }
        } else if (typeof maybeDato === "string") {
          normalized = { dato: maybeDato }
        }
      } catch (err) {
        console.warn("Could not normalize avatar response:", err)
        normalized = data
      }

      return NextResponse.json(normalized)
    } else {
      return NextResponse.json(data, { status: response.status })
    }
  } catch (error) {
    console.error("Profile photo upload API error:", error)
    return NextResponse.json({ mensaje: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ mensaje: "Token no proporcionado" }, { status: 401 })
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"}/api/Profile/me/avatar`,
      {
        method: "DELETE",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      },
    )

    // Try to parse JSON, but fall back to text if backend returned non-JSON
    let data: any
    const contentTypeDel = response.headers.get("content-type") || ""
    if (contentTypeDel.includes("application/json")) {
      try {
        data = await response.json()
      } catch (err) {
        const text = await response.text()
        data = { mensaje: text }
      }
    } else {
      const text = await response.text()
      data = { mensaje: text }
    }

    if (response.ok) {
      // Normalize successful delete response
      let normalized: any = data
      try {
        const maybeDato = data?.dato ?? data
        if (!maybeDato || typeof maybeDato === "string") {
          normalized = { mensaje: maybeDato || data?.mensaje || "Avatar eliminado" }
        } else {
          normalized = data
        }
      } catch (err) {
        normalized = data
      }

      return NextResponse.json(normalized)
    } else {
      return NextResponse.json(data, { status: response.status })
    }
  } catch (error) {
    console.error("Profile photo delete API error:", error)
    return NextResponse.json({ mensaje: "Error interno del servidor" }, { status: 500 })
  }
}
