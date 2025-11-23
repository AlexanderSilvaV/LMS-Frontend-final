import { NextRequest, NextResponse } from 'next/server'

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5253'

export async function PUT(request: NextRequest, { params }: { params: { nrc: string } }) {
  try {
    console.log('PUT /api/cursos/[nrc] - Iniciando solicitud')
    
    const { nrc } = params
    const body = await request.text()
    console.log('NRC:', nrc, 'Request body:', body.substring(0, 500))

    const authHeader = request.headers.get('authorization')
    console.log('Auth header presente:', !!authHeader)

    if (!authHeader) {
      console.error('No se encontró el header de autorización')
      return NextResponse.json({ mensaje: 'No autorizado' }, { status: 401 })
    }

    const backendUrl = `${BACKEND_BASE_URL}/api/Cursos/${nrc}`
    console.log('Backend URL:', backendUrl)

    const backendResponse = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: body,
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
    console.error('Error en PUT /api/cursos/[nrc]:', error)
    return NextResponse.json(
      { mensaje: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { nrc: string } }) {
  try {
    console.log('DELETE /api/cursos/[nrc] - Iniciando solicitud')
    
    const { nrc } = params
    console.log('NRC:', nrc)

    const authHeader = request.headers.get('authorization')
    console.log('Auth header presente:', !!authHeader)

    if (!authHeader) {
      console.error('No se encontró el header de autorización')
      return NextResponse.json({ mensaje: 'No autorizado' }, { status: 401 })
    }

    const backendUrl = `${BACKEND_BASE_URL}/api/Cursos/${nrc}`
    console.log('Backend URL:', backendUrl)

    const backendResponse = await fetch(backendUrl, {
      method: 'DELETE',
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
    console.error('Error en DELETE /api/cursos/[nrc]:', error)
    return NextResponse.json(
      { mensaje: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
