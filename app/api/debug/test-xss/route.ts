import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()

    console.log("🧪 [TEST-XSS] Testing XSS with content:", content)

    // Simular la creación de un post sin sanitización
    const mockPost = {
      postId: 999,
      contenido: content, // Sin sanitizar
      autorId: "test-user",
      fechaCreacion: new Date().toISOString(),
      editado: false,
      softDeleted: false
    }

    console.log("🧪 [TEST-XSS] Mock post created:", mockPost)

    return NextResponse.json({
      success: true,
      message: "Post de prueba creado",
      post: mockPost
    })

  } catch (error) {
    console.error("❌ [TEST-XSS] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    )
  }
}