import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5253';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    
    console.log('[proxy /api/test/backend] GET request');
    console.log('[proxy /api/test/backend] Auth header:', authHeader ? 'Present' : 'Missing');
    console.log('[proxy /api/test/backend] Backend URL:', BACKEND_URL);
    
    // Intentar conectar al backend
    const response = await fetch(`${BACKEND_URL}/api/test`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json'
      }
    });

    const status = response.status;
    console.log('[proxy /api/test/backend] Backend status:', status);

    if (response.ok) {
      try {
        const data = await response.json();
        return NextResponse.json({
          success: true,
          message: 'Backend connection successful',
          backendUrl: BACKEND_URL,
          data
        });
      } catch {
        const text = await response.text();
        return NextResponse.json({
          success: true,
          message: 'Backend connection successful (non-JSON)',
          backendUrl: BACKEND_URL,
          response: text
        });
      }
    } else {
      const errorText = await response.text().catch(() => '');
      return NextResponse.json({
        success: false,
        message: 'Backend connection failed',
        backendUrl: BACKEND_URL,
        status,
        error: errorText
      }, { status });
    }
  } catch (error) {
    console.error('[proxy /api/test/backend] Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Connection error',
      backendUrl: BACKEND_URL,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
