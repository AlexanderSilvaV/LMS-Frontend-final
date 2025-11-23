import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const courseId = params.courseId
    const token = request.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ mensaje: "Token no proporcionado" }, { status: 401 })
    }

    console.log(`🔍 [API] Fetching modules for course ${courseId} using por-curso endpoint...`)

    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/modulos/por-curso/${courseId}`

    console.log(`📡 [API] Calling backend: ${apiUrl}`)

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    console.log(`📡 [API] Backend response status: ${response.status}`)

    if (response.ok) {
    const data = await response.json()
    console.log(`✅ [API] Modules data received successfully`)

    // Unwrap backend wrapper: accept either { dato: [...] } or array directly
    const modules = Array.isArray(data) ? data : data?.dato || []
    return NextResponse.json(modules)
    } else {
      const errorText = await response.text()
      console.error(`❌ [API] Error fetching modules: ${errorText}`)
      return NextResponse.json(
        { mensaje: `Error del backend: ${response.status} - ${errorText}` },
        { status: response.status },
      )
    }
  } catch (error) {
    console.error("[API] Error in modules/por-curso/[courseId]:", error)
    return NextResponse.json({ mensaje: "Error interno del servidor" }, { status: 500 })
  }
}
