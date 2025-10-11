import { NextRequest, NextResponse } from 'next/server';
import { findFormularioByExpediente, updateFormulario, uploadImageToAirtable } from '@/lib/airtable';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const expediente = searchParams.get('expediente');

  if (!expediente) {
    return NextResponse.json({ error: 'Expediente requerido' }, { status: 400 });
  }

  try {
    // Buscar registro por expediente
    const records = await findFormularioByExpediente(expediente);

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
  console.log('🚀 PUT /api/expediente - Starting request');
  
  const { searchParams } = new URL(request.url);
  const expediente = searchParams.get('expediente');
  console.log('📋 Expediente parameter:', expediente);

  if (!expediente) {
    console.log('❌ No expediente provided');
    return NextResponse.json({ error: 'Expediente requerido' }, { status: 400 });
  }

  try {
    console.log('📥 Parsing request body...');
    const body = await request.json();
    console.log('📥 Request body size:', JSON.stringify(body).length, 'characters');
    console.log('📥 Request body keys:', Object.keys(body));
    
    // Check if there are large base64 images
    Object.keys(body).forEach(key => {
      if (typeof body[key] === 'string' && body[key].startsWith('data:image/')) {
        console.log(`📸 Found image in ${key}: ${body[key].substring(0, 50)}...`);
        console.log(`📸 Image size: ${body[key].length} characters`);
      } else if (Array.isArray(body[key])) {
        console.log(`📸 Found array in ${key} with ${body[key].length} items`);
        console.log(`📸 Array structure:`, JSON.stringify(body[key], null, 2));
      }
    });

    console.log('🔍 Searching for expediente in Airtable...');
    // Buscar registro por expediente
    const records = await findFormularioByExpediente(expediente);
    console.log('🔍 Found records:', records.length);

    if (records.length === 0) {
      console.log('❌ Expediente not found in database');
      return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
    }

    const recordId = records[0].id;
    console.log('✅ Found record ID:', recordId);

    // Preparar campos de texto para actualizar
    const fieldsToUpdate: any = {};
    
    console.log('🔧 Preparing text fields to update...');
    if (body['Problema']) {
      console.log('� Processing Problema');
      fieldsToUpdate['Problema'] = body['Problema'];
    }
    if (body['Detalles']) {
      console.log('� Processing Detalles');
      fieldsToUpdate['Detalles'] = body['Detalles'];
    }
    
    // No actualizamos fecha automáticamente porque el campo no existe en Airtable
    console.log('� Skipping timestamp - field does not exist in Airtable');

    console.log('🔧 Text fields to update keys:', Object.keys(fieldsToUpdate));

    // Actualizar campos de texto primero
    let updatedRecord;
    if (Object.keys(fieldsToUpdate).length > 0) {
      console.log('� Updating text fields in Airtable...');
      updatedRecord = await updateFormulario(recordId, fieldsToUpdate);
      console.log('✅ Text fields updated successfully');
    }

    // Subir imágenes usando el endpoint específico de Airtable
    if (body['Foto general'] && Array.isArray(body['Foto general']) && body['Foto general'].length > 0) {
      console.log('📸 Uploading Foto general...');
      await uploadImageToAirtable(recordId, 'Foto general', body['Foto general'][0]);
    }
    
    if (body['Foto etiqueta'] && Array.isArray(body['Foto etiqueta']) && body['Foto etiqueta'].length > 0) {
      console.log('� Uploading Foto etiqueta...');
      await uploadImageToAirtable(recordId, 'Foto etiqueta', body['Foto etiqueta'][0]);
    }

    if (body['Foto roto'] && Array.isArray(body['Foto roto']) && body['Foto roto'].length > 0) {
      console.log('� Uploading Foto roto...');
      await uploadImageToAirtable(recordId, 'Foto roto', body['Foto roto'][0]);
    }
    console.log('✅ Record updated successfully');

    return NextResponse.json({ 
      success: true, 
      recordId: recordId,
      expediente: expediente 
    });
  } catch (error: any) {
    console.error('❌ DETAILED ERROR in PUT /api/expediente:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    
    // If it's an Airtable-specific error, provide more details
    if (error.message && error.message.includes('Airtable')) {
      console.error('🔍 This appears to be an Airtable API error');
    }
    
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message,
      type: error.name
    }, { status: 500 });
  }
}
