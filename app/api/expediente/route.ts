import { NextRequest, NextResponse } from 'next/server';
import { listRecords, updateRecord } from '@/lib/airtable';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const expediente = searchParams.get('expediente');

  if (!expediente) {
    return NextResponse.json({ error: 'Expediente requerido' }, { status: 400 });
  }

  try {
    // Buscar registro por expediente
    const records = await listRecords('Formulario', {
      filterByFormula: `{Expediente} = '${expediente}'`,
      maxRecords: '1',
    });

    if (records.length === 0) {
      return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
    }

    const record = records[0];
    const data = {
      id: record.id,
      expediente: record.fields['Expediente'],
      cliente: record.fields['Cliente'],
      direccion: record.fields['Dirección'],
      fotoGeneral: record.fields['Foto general'],
      fotoEtiqueta: record.fields['Foto etiqueta'],
      problema: record.fields['Problema'],
      detalles: record.fields['Detalles'],
      fotoRoto: record.fields['Foto roto'],
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error al buscar expediente:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const expediente = searchParams.get('expediente');

  if (!expediente) {
    return NextResponse.json({ error: 'Expediente requerido' }, { status: 400 });
  }

  try {
    const body = await request.json();

    // Buscar registro por expediente
    const records = await listRecords('Formulario', {
      filterByFormula: `{Expediente} = '${expediente}'`,
      maxRecords: '1',
    });

    if (records.length === 0) {
      return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
    }

    const recordId = records[0].id;

    // Preparar campos para actualizar (solo los que tienen valor)
    const fieldsToUpdate: any = {};
    
    if (body['Foto general']) fieldsToUpdate['Foto general'] = body['Foto general'];
    if (body['Foto etiqueta']) fieldsToUpdate['Foto etiqueta'] = body['Foto etiqueta'];
    if (body['Problema']) fieldsToUpdate['Problema'] = body['Problema'];
    if (body['Detalles']) fieldsToUpdate['Detalles'] = body['Detalles'];
    if (body['Foto roto']) fieldsToUpdate['Foto roto'] = body['Foto roto'];
    
    // Siempre actualizar fecha de última modificación
    fieldsToUpdate['Fecha Solicitud'] = new Date().toISOString();

    // Actualizar registro
    const updatedRecord = await updateRecord('Formulario', recordId, fieldsToUpdate);

    return NextResponse.json({ 
      success: true, 
      recordId: updatedRecord.id,
      expediente: expediente 
    });
  } catch (error) {
    console.error('Error al actualizar expediente:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
