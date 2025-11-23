import { NextRequest, NextResponse } from 'next/server'

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5253'

export async function PUT(request: NextRequest, { params }: { params: { moduloId: string } }) {
  try {
    console.log('PUT /api/modulos/[moduloId] - Iniciando solicitud')
    
    const { moduloId } = params
    const body = await request.text()
    console.log('Módulo ID:', moduloId, 'Request body:', body.substring(0, 500))

    const authHeader = request.headers.get('authorization')
    console.log('Auth header presente:', !!authHeader)

    if (!authHeader) {
      console.error('No se encontró el header de autorización')
      return NextResponse.json({ mensaje: 'No autorizado' }, { status: 401 })
    }

    const backendUrl = `${BACKEND_BASE_URL}/api/Modulos/${moduloId}`
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
    console.error('Error en PUT /api/modulos/[moduloId]:', error)
    return NextResponse.json(
      { mensaje: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { moduloId: string } }) {
  try {
    console.log('DELETE /api/modulos/[moduloId] - Iniciando solicitud')
    
    const { moduloId } = params
    console.log('Módulo ID:', moduloId)

    const authHeader = request.headers.get('authorization')
    console.log('Auth header presente:', !!authHeader)

    if (!authHeader) {
      console.error('No se encontró el header de autorización')
      return NextResponse.json({ mensaje: 'No autorizado' }, { status: 401 })
    }

    const backendUrl = `${BACKEND_BASE_URL}/api/Modulos/${moduloId}`
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
    console.error('Error en DELETE /api/modulos/[moduloId]:', error)
    return NextResponse.json(
      { mensaje: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
