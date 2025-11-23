import { NextRequest, NextResponse } from 'next/server'

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5253'

export async function GET(request: NextRequest, { params }: { params: Promise<{ cursoId: string }> }) {
  try {
    console.log('GET /api/modulos/curso/[cursoId] - Iniciando solicitud')
    
    const { cursoId } = await params
    console.log('Curso ID:', cursoId)

    const authHeader = request.headers.get('authorization')
    console.log('Auth header presente:', !!authHeader)

    if (!authHeader) {
      console.error('No se encontró el header de autorización')
      return NextResponse.json({ mensaje: 'No autorizado' }, { status: 401 })
    }

    const backendUrl = `${BACKEND_BASE_URL}/api/Modulos/curso/${cursoId}`
    console.log('Backend URL:', backendUrl)

    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    })

    console.log('Backend response status:', backendResponse.status)
    
    const responseText = await backendResponse.text()
    console.log('Backend response body:', responseText.substring(0, 500))

    if (!backendResponse.ok) {
      console.error('Error del backend:', responseText)
      return NextResponse.json(
        { mensaje: responseText || 'Error del servidor' },
        { status: backendResponse.status }
      )
    }

    const responseData = responseText ? JSON.parse(responseText) : {}
    console.log('Respuesta procesada exitosamente')
    
    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error en GET /api/modulos/curso/[cursoId]:', error)
    return NextResponse.json(
      { mensaje: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
