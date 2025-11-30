import { type NextRequest, NextResponse } from "next/server"

export async function GET(_request: NextRequest, { params }: { params: { nrc: string } }) {
  const rawNrc = params.nrc?.trim()

  if (!rawNrc) {
    return NextResponse.json({ mensaje: "NRC no proporcionado" }, { status: 400 })
  }

  if (!/^[0-9]+$/.test(rawNrc)) {
    return NextResponse.json({ mensaje: "NRC inválido" }, { status: 400 })
  }

  const sanitizedNrc = rawNrc

  try {
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"
    const response = await fetch(`${apiUrl}/api/Cursos/${encodeURIComponent(sanitizedNrc)}/portada`, {
      method: "GET",
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ mensaje: "Portada no encontrada" }, { status: 404 })
      }

      const errorText = await response.text()
      console.error("Course cover GET error:", response.status, errorText)
      return NextResponse.json({ mensaje: "Error al obtener la portada" }, { status: response.status })
    }

    const arrayBuffer = await response.arrayBuffer()
    const contentType = response.headers.get("content-type") || "image/png"
    const cacheControl = response.headers.get("cache-control") || "public, max-age=3600"
    const lastModified = response.headers.get("last-modified")

    const headers = new Headers({
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
    })

    if (lastModified) {
      headers.set("Last-Modified", lastModified)
    }

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error("Course cover GET API error:", error)
    return NextResponse.json({ mensaje: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { nrc: string } }) {
  const authHeader = request.headers.get("authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ mensaje: "Token no proporcionado" }, { status: 401 })
  }

  const rawNrc = params.nrc?.trim()
  if (!rawNrc) {
    return NextResponse.json({ mensaje: "NRC no proporcionado" }, { status: 400 })
  }

  if (!/^[0-9]+$/.test(rawNrc)) {
    return NextResponse.json({ mensaje: "NRC inválido" }, { status: 400 })
  }

  const sanitizedNrc = rawNrc

  try {
    const formData = await request.formData()
    const archivo = formData.get("archivo") as File | null

    if (!archivo) {
      return NextResponse.json({ mensaje: "No se adjuntó ninguna imagen" }, { status: 400 })
    }

    const backendFormData = new FormData()
    const fileBuffer = await archivo.arrayBuffer()
    const forwardedFile = new File([fileBuffer], archivo.name, { type: archivo.type || "application/octet-stream" })
    backendFormData.append("archivo", forwardedFile, forwardedFile.name)

    console.log("[COURSE COVER POST] Forwarding file", {
      nrc: sanitizedNrc,
      nombre: forwardedFile.name,
      size: forwardedFile.size,
      tipo: forwardedFile.type,
    })

    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"
    const backendHeaders = new Headers({ Authorization: authHeader })
    const fwdFor = request.headers.get("x-forwarded-for")
    const fwdHost = request.headers.get("x-forwarded-host")
    const fwdProto = request.headers.get("x-forwarded-proto")

    if (fwdFor) backendHeaders.set("x-forwarded-for", fwdFor)
    if (fwdHost) backendHeaders.set("x-forwarded-host", fwdHost)
    if (fwdProto) backendHeaders.set("x-forwarded-proto", fwdProto)

    const response = await fetch(`${apiUrl}/api/Cursos/${encodeURIComponent(sanitizedNrc)}/portada`, {
      method: "POST",
      headers: backendHeaders,
      body: backendFormData,
    })

    const contentType = response.headers.get("content-type") || ""
    let data: any
    if (contentType.includes("application/json")) {
      try {
        data = await response.json()
      } catch (error) {
        const text = await response.text()
        data = { mensaje: text }
      }
    } else {
      const text = await response.text()
      data = { mensaje: text }
    }

    if (!response.ok) {
      console.error("[COURSE COVER POST] Backend error", {
        status: response.status,
        mensaje: data?.mensaje ?? null,
      })
      return NextResponse.json(
        {
          mensaje: data?.mensaje ?? "Error desconocido al subir la portada",
          statusCode: response.status,
        },
        { status: response.status },
      )
    }

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Course cover POST API error:", error)
    return NextResponse.json({ mensaje: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { nrc: string } }) {
  const authHeader = request.headers.get("authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ mensaje: "Token no proporcionado" }, { status: 401 })
  }

  const rawNrc = params.nrc?.trim()
  if (!rawNrc) {
    return NextResponse.json({ mensaje: "NRC no proporcionado" }, { status: 400 })
  }

  if (!/^[0-9]+$/.test(rawNrc)) {
    return NextResponse.json({ mensaje: "NRC inválido" }, { status: 400 })
  }

  const sanitizedNrc = rawNrc

  try {
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"
    const response = await fetch(`${apiUrl}/api/Cursos/${encodeURIComponent(sanitizedNrc)}/portada`, {
      method: "DELETE",
      headers: {
        Authorization: authHeader,
      },
    })

    const contentType = response.headers.get("content-type") || ""
    let data: any
    if (contentType.includes("application/json")) {
      try {
        data = await response.json()
      } catch (error) {
        const text = await response.text()
        data = { mensaje: text }
      }
    } else {
      const text = await response.text()
      data = { mensaje: text }
    }

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Course cover DELETE API error:", error)
    return NextResponse.json({ mensaje: "Error interno del servidor" }, { status: 500 })
  }
}
