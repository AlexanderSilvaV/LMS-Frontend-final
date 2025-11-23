import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5253'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const hasAuth = !!authHeader && authHeader.startsWith('Bearer ');
    
    console.log('[proxy /api/cursos/duplicar] POST request');
    
    if (!hasAuth) {
      return NextResponse.json({ mensaje: 'Token no proporcionado' }, { status: 401 });
    }

    const body = await request.json();
    
    console.log('[proxy /api/cursos/duplicar] Request body:', body);
    
    // Validar que tenemos los campos requeridos
    if (!body.nrcOriginal || !body.nuevoNrc || !body.nuevoNombre) {
      return NextResponse.json({ 
        mensaje: 'Faltan campos requeridos: nrcOriginal, nuevoNrc, nuevoNombre' 
      }, { status: 400 });
    }

    const backendPayload = {
      nrcOriginal: body.nrcOriginal,
      nuevoNrc: body.nuevoNrc,
      nuevoNombre: body.nuevoNombre,
      nuevaDescripcion: body.nuevaDescripcion || '',
      activo: body.activo ?? true
    };

    console.log('[proxy /api/cursos/duplicar] Backend payload:', backendPayload);

    const response = await fetch(`${BACKEND_BASE_URL}/api/Cursos/duplicar`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(backendPayload)
    });

    const contentType = response.headers.get('content-type') || '';
    const status = response.status;

    console.log('[proxy /api/cursos/duplicar] backend URL:', `${BACKEND_BASE_URL}/api/Cursos/duplicar`);
    console.log('[proxy /api/cursos/duplicar] backend status:', status);
    console.log('[proxy /api/cursos/duplicar] backend content-type:', contentType);

    if (!response.ok) {
      const respText = await response.text().catch(() => '');
      console.log('[proxy /api/cursos/duplicar] backend error response:', respText);
      try {
        const parsed = respText ? JSON.parse(respText) : { mensaje: respText || 'Error sin mensaje del backend' };
        return NextResponse.json(parsed, { status });
      } catch {
        return NextResponse.json({ mensaje: respText || 'Error sin mensaje del backend' }, { status });
      }
    }

    // Manejar respuesta exitosa
    try {
      const data = await response.json();
      console.log('[proxy /api/cursos/duplicar] backend success response:', data);
      return NextResponse.json(data, { status: 200 });
    } catch (parseError) {
      const text = await response.text();
      console.log('[proxy /api/cursos/duplicar] backend success response (non-JSON):', text);
      return NextResponse.json({ mensaje: text || 'Operación completada' }, { status: 200 });
    }
  } catch (error) {
    console.error('[proxy /api/cursos/duplicar] POST error:', error);
    return NextResponse.json({ mensaje: 'Error interno del servidor' }, { status: 500 });
  }
}
