import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Verificar variables de entorno
    const token = process.env.AIRTABLE_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableName = process.env.AIRTABLE_TABLE_REPARACIONES;

    console.log('🔍 Environment variables:');
    console.log('Token:', token ? `${token.substring(0, 10)}...` : 'NOT SET');
    console.log('Base ID:', baseId);
    console.log('Table Name:', tableName);

    if (!token || !baseId || !tableName) {
      return NextResponse.json(
        { 
          error: 'Variables de entorno faltantes',
          details: {
            token: !!token,
            baseId: !!baseId,
            tableName: !!tableName
          }
        },
        { status: 500 }
      );
    }

    // Probar conexión simple con Airtable
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?maxRecords=1`;
    
    console.log('🌐 Request URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      
      return NextResponse.json(
        { 
          error: 'Error de Airtable API',
          status: response.status,
          statusText: response.statusText,
          details: errorText
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Success! Records found:', data.records?.length || 0);

    return NextResponse.json(
      { 
        message: 'Conexión exitosa con Airtable',
        recordCount: data.records?.length || 0,
        sampleRecord: data.records?.[0] || null
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('💥 Test error:', error);
    return NextResponse.json(
      { 
        error: 'Error en el test de conexión',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
