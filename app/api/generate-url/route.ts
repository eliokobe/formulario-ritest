import { NextRequest, NextResponse } from 'next/server';
import { generateWorkOrderUrl } from '@/lib/airtable';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const recordId = searchParams.get('recordId');
  const baseUrl = searchParams.get('baseUrl') || 'http://localhost:3000';

  if (!recordId) {
    return NextResponse.json(
      { error: 'Record ID is required' },
      { status: 400 }
    );
  }

  try {
    const workOrderUrl = generateWorkOrderUrl(recordId, baseUrl);
    
    return NextResponse.json(
      { 
        url: workOrderUrl,
        recordId: recordId,
        message: 'URL generada exitosamente. Copia esta URL y pégala en la columna "Reparación" de tu tabla de Airtable.'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error generando URL:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { recordIds, baseUrl = 'http://localhost:3000' } = await request.json();
    
    if (!recordIds || !Array.isArray(recordIds)) {
      return NextResponse.json(
        { error: 'Se requiere un array de Record IDs' },
        { status: 400 }
      );
    }

    const urls = recordIds.map(recordId => ({
      recordId,
      url: generateWorkOrderUrl(recordId, baseUrl)
    }));

    return NextResponse.json(
      { 
        urls,
        message: `${urls.length} URLs generadas exitosamente`
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error generando URLs múltiples:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
