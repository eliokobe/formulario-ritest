import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { createRepair } from '@/lib/airtable';

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
    const limit = searchParams.get('limit') || '10';
    
    // TODO: Implement get repairs if needed
    return NextResponse.json({ message: 'Get repairs not implemented yet' });
  } catch (error: any) {
    console.error('Get repairs error:', error);
    return NextResponse.json(
      { error: 'Error al obtener reparaciones' },
      { status: 500 }
    );
  }
}
