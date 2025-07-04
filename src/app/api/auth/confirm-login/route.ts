import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json({
    error: 'Este endpoint não está mais disponível. Use o login automático via push notification.'
  }, { status: 410 });
}
