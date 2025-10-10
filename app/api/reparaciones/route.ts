import { NextRequest, NextResponse } from 'next/server';
import { getReparacionById } from '@/lib/airtable';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const recordId = searchParams.get('recordId');

  if (!recordId) {
    return NextResponse.json(
      { error: 'Record ID is required' },
      { status: 400 }
    );
  }

  try {
    const reparacion = await getReparacionById(recordId);
    
    if (!reparacion) {
      return NextResponse.json(
        { error: 'Reparación no encontrada' },
        { status: 404 }
      );
    }

    // Devolver solo los campos necesarios para los datos generales
    const responseData = {
      id: reparacion.id,
      Cliente: reparacion.fields.Cliente || '',
      Técnico: reparacion.fields.Técnico || '',
      Dirección: reparacion.fields.Dirección || '',
      // Incluir otros campos si son necesarios
      Reparación: reparacion.fields.Reparación || '',
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error('Error obteniendo datos de reparación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
