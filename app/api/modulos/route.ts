import { NextRequest, NextResponse } from 'next/server'

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5253'

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/modulos - Iniciando solicitud')
    
    const { searchParams } = new URL(request.url)
    const queryString = searchParams.toString()
    console.log('Query params:', queryString)

    const authHeader = request.headers.get('authorization')
    console.log('Auth header presente:', !!authHeader)

    if (!authHeader) {
      console.error('No se encontró el header de autorización')
      return NextResponse.json({ mensaje: 'No autorizado' }, { status: 401 })
    }

    const backendUrl = `${BACKEND_BASE_URL}/api/Modulos${queryString ? `?${queryString}` : ''}`
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
    console.error('Error en GET /api/modulos:', error)
    return NextResponse.json(
      { mensaje: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/modulos - Iniciando solicitud')
    
    const body = await request.text()
    console.log('Request body:', body.substring(0, 500))

    const authHeader = request.headers.get('authorization')
    console.log('Auth header presente:', !!authHeader)

    if (!authHeader) {
      console.error('No se encontró el header de autorización')
      return NextResponse.json({ mensaje: 'No autorizado' }, { status: 401 })
    }

    const backendUrl = `${BACKEND_BASE_URL}/api/Modulos`
    console.log('Backend URL:', backendUrl)

    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
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
    console.error('Error en POST /api/modulos:', error)
    return NextResponse.json(
      { mensaje: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
