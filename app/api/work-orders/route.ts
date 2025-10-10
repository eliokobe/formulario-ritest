import { NextRequest, NextResponse } from 'next/server';
import { createWorkOrder, updateReparacion } from '@/lib/airtable';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log('Parte de trabajo recibido:', data);

    // Preparar los datos para Airtable
    const airtableData = {
      Cliente: data.Cliente,
      Dirección: data.Dirección,
      Técnico: data.Técnico,
      '¿Has conseguido solucionar el problema?': data['¿Has conseguido solucionar el problema?'],
      '¿Qué has tenido que hacer?': data['¿Qué has tenido que hacer?'],
      '¿Qué has tenido que reparar del cuadro eléctrico?': data['¿Qué has tenido que reparar del cuadro eléctrico?'],
      '¿Qué problema has tenido?': data['¿Qué problema has tenido?'],
      'Foto punto de recarga': data['Foto punto de recarga'],
      'Factura del servicio': data['Factura del servicio'],
      'Estado': 'Completado',
      'Fecha de completado': new Date().toISOString(),
    };

    let result;
    
    if (data.recordId) {
      // Actualizar registro existente
      console.log('Actualizando registro existente:', data.recordId);
      result = await updateReparacion(data.recordId, airtableData);
      
      return NextResponse.json(
        { 
          message: 'Parte de trabajo actualizado exitosamente',
          id: result.id
        },
        { status: 200 }
      );
    } else {
      // Crear nuevo registro
      console.log('Creando nuevo registro de parte de trabajo');
      result = await createWorkOrder(airtableData);
      
      return NextResponse.json(
        { 
          message: 'Parte de trabajo creado exitosamente',
          id: result.id
        },
        { status: 201 }
      );
    }

  } catch (error) {
    console.error('Error procesando parte de trabajo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Endpoint para partes de trabajo activo' },
    { status: 200 }
  );
}
