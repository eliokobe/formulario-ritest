import { NextRequest, NextResponse } from 'next/server';
import { listRecords } from '@/lib/airtable';

export async function GET() {
  try {
    const records = await listRecords('Reparaciones', {
      maxRecords: '10',
      view: 'Grid view'
    });

    const formattedRecords = records.map(record => ({
      id: record.id,
      Cliente: record.fields.Cliente || 'Sin nombre',
      Dirección: record.fields.Dirección || 'Sin dirección',
      Técnico: record.fields.Técnico || 'Sin técnico',
      Estado: record.fields.Estado || 'Pendiente',
      url: `http://localhost:3000/onboarding?recordId=${record.id}`
    }));

    return NextResponse.json(
      { 
        records: formattedRecords,
        message: `${formattedRecords.length} registros encontrados`
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error obteniendo registros:', error);
    return NextResponse.json(
      { 
        error: 'Error obteniendo registros de Airtable',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
