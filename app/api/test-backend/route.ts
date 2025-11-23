import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("=== BACKEND CONNECTION TEST ===")
    console.log("NEXT_PUBLIC_API_URL:", process.env.NEXT_PUBLIC_API_URL)

    if (!process.env.NEXT_PUBLIC_API_URL) {
      return NextResponse.json(
        {
          error: "NEXT_PUBLIC_API_URL not configured",
          env: process.env,
        },
        { status: 500 },
      )
    }

    // Test basic connection to backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cursos?PaginaActual=1&CantidadPorPagina=1`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const responseText = await response.text()

    return NextResponse.json({
      backendUrl: process.env.NEXT_PUBLIC_API_URL,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      responseText: responseText,
      message: "Backend connection test completed",
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : "No stack trace",
        backendUrl: process.env.NEXT_PUBLIC_API_URL,
      },
      { status: 500 },
    )
  }
}
