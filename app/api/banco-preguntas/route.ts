import { NextRequest, NextResponse } from "next/server"

/* eslint-disable @typescript-eslint/no-explicit-any */

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253"

type ResultadoOperacionPayload = {
  operacionExitosa?: boolean
  exito?: boolean
  mensaje?: string
  dato?: Record<string, unknown>
}

type PagePayload = {
  items?: unknown[]
  Items?: unknown[]
  pageNumber?: number
  PageNumber?: number
  pageSize?: number
  PageSize?: number
  totalItems?: number
  TotalItems?: number
  totalPages?: number
  TotalPages?: number
}

const mapResultadoOperacion = (raw: unknown) => {
  // Be permissive: backend can return several shapes. Handle common ones:
  // - An array of items
  // - { preguntas: [], paginacion: { ... } }
  // - { operacionExitosa: true, dato: { items: [], pageNumber, pageSize, totalItems, totalPages } }
  if (!raw) {
    return {
      preguntas: [],
      paginacion: {
        paginaActual: 1,
        cantidadPorPagina: 10,
        totalResultados: 0,
        totalPaginas: 0,
      },
    }
  }

  // If backend returned a raw array, treat it as all items
  if (Array.isArray(raw)) {
    const total = raw.length
    return {
      preguntas: raw,
      paginacion: {
        paginaActual: 1,
        cantidadPorPagina: total,
        totalResultados: total,
        totalPaginas: 1,
      },
    }
  }

  const data = (typeof raw === 'object' && raw !== null) ? (raw as any) : {}

  // If payload already matches expected shape, return directly
  if (Array.isArray((data as any).preguntas) && (data as any).paginacion) {
    return { preguntas: (data as any).preguntas, paginacion: (data as any).paginacion }
  }

  // Support legacy/other shape where items are inside dato (or data)
  const maybeDato = data.dato ?? data.data ?? {}
  const page = (typeof maybeDato === 'object' && maybeDato !== null) ? maybeDato : {}

  const items = Array.isArray(page.items)
    ? page.items
    : Array.isArray(page.Items)
    ? page.Items
    : Array.isArray(data.items)
    ? data.items
    : Array.isArray(data.Items)
    ? data.Items
    : []

  // If we still have no items but there is a 'preguntas' field, use it
  const finalItems = items.length ? items : Array.isArray((data as any).preguntas) ? (data as any).preguntas : []

  const paginaActual = page.pageNumber || page.PageNumber || 1
  const cantidadPorPagina = page.pageSize || page.PageSize || (finalItems.length || 10)
  const totalResultados = page.totalItems || page.TotalItems || finalItems.length
  const totalPaginas = page.totalPages || page.TotalPages || 1

  return {
    preguntas: finalItems,
    paginacion: {
      paginaActual,
      cantidadPorPagina,
      totalResultados,
      totalPaginas,
    },
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader) {
    return NextResponse.json({ mensaje: "No autorizado" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const numeroPagina = searchParams.get("numeroPagina") || searchParams.get("page") || "1"
  const tamanoPagina = searchParams.get("tamanoPagina") || searchParams.get("pageSize") || "10"
  const categoria = searchParams.get("categoria") || searchParams.get("category") || ""

  const url = new URL(`${BACKEND_BASE_URL}/api/BancoPreguntas`)
  url.searchParams.set("numeroPagina", numeroPagina)
  url.searchParams.set("tamanoPagina", tamanoPagina)
  if (categoria) {
    url.searchParams.set("categoria", categoria)
  }

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
    })

    const responseText = await response.text()
    if (!response.ok) {
      const mensaje = (() => {
        try {
          const data = responseText ? JSON.parse(responseText) : {}
          return data.mensaje || data.Message || `Error ${response.status}`
        } catch {
          return responseText || `Error ${response.status}`
        }
      })()
      return NextResponse.json({ mensaje }, { status: response.status })
    }

    const data = responseText ? JSON.parse(responseText) : {}
    try {
      const payload = mapResultadoOperacion(data)
      return NextResponse.json(payload)
    } catch (processingError) {
      const mensaje =
        processingError instanceof Error
          ? processingError.message
          : "Error al procesar la respuesta del banco de preguntas"
      return NextResponse.json({ mensaje }, { status: 502 })
    }
  } catch (error) {
    console.error("Error en GET /api/banco-preguntas:", error)
    return NextResponse.json(
      { mensaje: error instanceof Error ? error.message : "Error interno del servidor" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader) {
    return NextResponse.json({ mensaje: "No autorizado" }, { status: 401 })
  }

  let bodyText = ""
  try {
    bodyText = await request.text()
    const backendResponse = await fetch(`${BACKEND_BASE_URL}/api/BancoPreguntas`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: bodyText,
    })

    const responseText = await backendResponse.text()
    if (!backendResponse.ok) {
      const mensaje = (() => {
        try {
          const data = responseText ? JSON.parse(responseText) : {}
          return data.mensaje || data.Message || `Error ${backendResponse.status}`
        } catch {
          return responseText || `Error ${backendResponse.status}`
        }
      })()
      return NextResponse.json({ mensaje }, { status: backendResponse.status })
    }

    const data = responseText ? JSON.parse(responseText) : {}
    return NextResponse.json(data, { status: backendResponse.status })
  } catch (error) {
    console.error("Error en POST /api/banco-preguntas:", error)
    return NextResponse.json(
      {
        mensaje:
          error instanceof Error
            ? error.message
            : bodyText
            ? "Error interno del servidor"
            : "Error al procesar la solicitud",
      },
      { status: 500 },
    )
  }
}
