import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5253';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const hasAuth = !!authHeader && authHeader.startsWith('Bearer ');
    
    console.log('[proxy /api/profile/info] GET request');
    
    if (!hasAuth) {
      return NextResponse.json({ mensaje: 'Token no proporcionado' }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/api/Profile/me`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json'
      }
    });

    const contentType = response.headers.get('content-type') || '';
    const status = response.status;

    console.log('[proxy /api/profile/info] backend URL:', `${BACKEND_URL}/api/Profile/me`);
    console.log('[proxy /api/profile/info] backend status:', status);

    if (!response.ok) {
      const respText = await response.text().catch(() => '');
      console.log('[proxy /api/profile/info] backend response text:', respText);
      try {
        const parsed = respText ? JSON.parse(respText) : { mensaje: respText || 'Error sin mensaje' };
        return NextResponse.json(parsed, { status });
      } catch {
        return NextResponse.json({ mensaje: respText || 'Error sin mensaje' }, { status });
      }
    }

    if (contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, { status });
    }

    const text = await response.text();
    return NextResponse.json({ mensaje: text }, { status });
  } catch (error) {
    console.error('[proxy /api/profile/info] GET error:', error);
    return NextResponse.json({ mensaje: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    // Log minimal auth info for debugging (do not log full token in production)
    const hasAuth = !!authHeader && authHeader.startsWith('Bearer ');
    
    const body = await request.json();
    console.log('[proxy /api/profile/info] Request body:', JSON.stringify(body));
    
    // Try to decode token to see claims
    if (hasAuth) {
      try {
        const token = authHeader.split(' ')[1];
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('[proxy /api/profile/info] Token claims:', { sub: payload.sub, email: payload.email, exp: payload.exp });
      } catch (e) {
        console.log('[proxy /api/profile/info] Could not decode token:', e);
      }
    }
    
    try {
      console.log('[proxy /api/profile/info] hasAuth:', hasAuth, 'authPrefix:', authHeader ? authHeader.slice(0, 7) : null);
    } catch {}
    if (!hasAuth) {
      return NextResponse.json({ mensaje: 'Token no proporcionado' }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/api/Profile/me`, {
      method: 'PUT',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const contentType = response.headers.get('content-type') || '';
    const status = response.status

    console.log('[proxy /api/profile/info] backend URL:', `${BACKEND_URL}/api/Profile/me`);
    console.log('[proxy /api/profile/info] backend status:', status);

    // If backend returns non-ok, capture text for debugging
    if (!response.ok) {
      const respText = await response.text().catch(() => '')
      console.log('[proxy /api/profile/info] backend response text:', respText)
      console.log('[proxy /api/profile/info] backend content-type:', contentType)
      // Try to forward JSON if possible, otherwise return text in mensaje
      try {
        const parsed = respText ? JSON.parse(respText) : { mensaje: respText || 'Error sin mensaje' }
        return NextResponse.json(parsed, { status })
      } catch {
        return NextResponse.json({ mensaje: respText || 'Error sin mensaje' }, { status })
      }
    }

    if (contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, { status });
    }

    const text = await response.text();
    return NextResponse.json({ mensaje: text }, { status });
  } catch (error) {
    return NextResponse.json({ mensaje: 'Error interno del servidor' }, { status: 500 });
  }
}
