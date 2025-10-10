import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const token = process.env.AIRTABLE_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;
    
    console.log('🔍 Diagnóstico de conexión:');
    console.log('Token existe:', !!token);
    console.log('Token longitud:', token?.length || 0);
    console.log('Base ID:', baseId);
    console.log('Token inicia con "pat":', token?.startsWith('pat'));

    if (!token || !baseId) {
      return NextResponse.json({
        error: 'Variables de entorno no configuradas',
        details: {
          hasToken: !!token,
          hasBaseId: !!baseId,
          tokenLength: token?.length || 0
        }
      }, { status: 500 });
    }

    // Probar una llamada simple a la API de Airtable
    const testUrl = `https://api.airtable.com/v0/${baseId}/Reparaciones?maxRecords=1`;
    
    console.log('🔗 URL de prueba:', testUrl);
    
    const response = await fetch(testUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 Respuesta status:', response.status);
    console.log('📡 Respuesta headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.text();
    console.log('📡 Respuesta body:', data);

    if (!response.ok) {
      return NextResponse.json({
        error: 'Error de Airtable API',
        status: response.status,
        statusText: response.statusText,
        response: data,
        diagnostics: {
          tokenExists: !!token,
          tokenLength: token?.length,
          baseId: baseId,
          url: testUrl
        }
      }, { status: response.status });
    }

    const parsedData = JSON.parse(data);
    
    return NextResponse.json({
      success: true,
      message: '¡Conexión exitosa con Airtable!',
      recordsFound: parsedData.records?.length || 0,
      data: parsedData
    });

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    
    return NextResponse.json({
      error: 'Error interno',
      message: error instanceof Error ? error.message : 'Error desconocido',
      diagnostics: {
        tokenExists: !!process.env.AIRTABLE_TOKEN,
        baseId: process.env.AIRTABLE_BASE_ID
      }
    }, { status: 500 });
  }
}
