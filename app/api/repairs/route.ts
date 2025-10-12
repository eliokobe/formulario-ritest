import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { 
  createRepair, 
  findRepairByExpediente, 
  updateRepairRecord, 
  uploadImageToAirtable 
} from '@/lib/airtable';

export async function POST(request: NextRequest) {
  try {
    // Check environment variables first
    console.log('🔧 Environment check:');
    console.log('AIRTABLE_TOKEN:', process.env.AIRTABLE_TOKEN ? 'Set' : 'Missing');
    
    const body = await request.json();
    console.log('📥 Request body:', JSON.stringify(body, null, 2));
    
    // Validation - only require essential fields
    if (!body.Reparación || !body.Cliente || !body.Técnico) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: Reparación, Cliente y Técnico son obligatorios' },
        { status: 400 }
      );
    }

    // Create the repair record
    const result = await createRepair(body);

    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (error: any) {
    console.error('Repair API error:', error);
    const message = typeof error?.message === 'string' ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const expediente = searchParams.get('expediente');

    if (!expediente) {
      return NextResponse.json({ error: 'Expediente requerido' }, { status: 400 });
    }

    const records = await findRepairByExpediente(expediente);

    if (records.length === 0) {
      return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
    }

    const record = records[0];
    const fields = record.fields || {};

    return NextResponse.json({
      id: record.id,
      expediente: fields['Expediente'] || '',
      tecnico: fields['Técnico'] || '',
      cliente: fields['Cliente'] || '',
      direccion: fields['Dirección'] || '',
      reparacion: fields['Reparación'] || '',
      cuadroElectrico: fields['Cuadro eléctrico'] || '',
      factura: fields['Factura'] || [],
      foto: fields['Foto'] || [],
    });
  } catch (error: any) {
    console.error('Get repairs error:', error);
    return NextResponse.json(
      { error: 'Error al obtener reparaciones' },
      { status: 500 }
    );
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

    const records = await findRepairByExpediente(expediente);

    if (records.length === 0) {
      return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
    }

    const recordId = records[0].id;
    const fieldsToUpdate: Record<string, any> = {};

    const textFields: Array<[string, string]> = [
      ['Reparación', 'Reparación'],
      ['Cuadro eléctrico', 'Cuadro eléctrico'],
      ['Técnico', 'Técnico'],
      ['Cliente', 'Cliente'],
      ['Dirección', 'Dirección'],
    ];

    textFields.forEach(([bodyKey, airtableField]) => {
      if (bodyKey in body && typeof body[bodyKey] === 'string') {
        if (body[bodyKey].trim().length > 0) {
          fieldsToUpdate[airtableField] = body[bodyKey];
        }
      }
    });

    if (Object.keys(fieldsToUpdate).length > 0) {
      await updateRepairRecord(recordId, fieldsToUpdate);
    }

    const attachmentFields: Array<[string, string]> = [
      ['Foto', 'Foto'],
      ['Factura', 'Factura'],
    ];

    for (const [bodyKey, airtableField] of attachmentFields) {
      const attachments = Array.isArray(body[bodyKey]) ? body[bodyKey] : [];
      if (attachments.length > 0) {
        // Clear existing attachments before uploading new ones
        await updateRepairRecord(recordId, { [airtableField]: [] });

        for (const attachment of attachments) {
          await uploadImageToAirtable(recordId, airtableField, attachment);
        }
      }
    }

    return NextResponse.json({ success: true, expediente, recordId });
  } catch (error: any) {
    console.error('Update repair error:', error);
    const message = typeof error?.message === 'string' ? error.message : 'Error al actualizar la reparación';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
