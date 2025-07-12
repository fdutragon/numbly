import { NextResponse } from 'next/server';

// Forçar uso do Node.js runtime
export const runtime = 'nodejs';

export async function GET() {
  try {
    const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
    const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
    const VAPID_SUBJECT = process.env.VAPID_SUBJECT;

    // Verificar se web-push pode ser importado
    let webpushStatus = 'available';
    try {
      await import('web-push');
    } catch (err) {
      webpushStatus = `error: ${err}`;
    }

    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      runtime: 'nodejs',
      webpushStatus,
      vapidConfig: {
        hasPublicKey: !!VAPID_PUBLIC_KEY,
        hasPrivateKey: !!VAPID_PRIVATE_KEY,
        hasSubject: !!VAPID_SUBJECT,
        publicKeyLength: VAPID_PUBLIC_KEY?.length || 0,
        subject: VAPID_SUBJECT || 'not-set'
      },
      nextJsVersion: process.env.npm_package_version || 'unknown'
    };

    return NextResponse.json({
      success: true,
      debug: debugInfo
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
