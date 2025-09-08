import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SecurityLockConfig {
  documentId: string;
  readOnlyMode: boolean;
  disableCopy: boolean;
  disableContextMenu: boolean;
  disableTextSelection: boolean;
  disableDragDrop: boolean;
  disablePrint: boolean;
  disableDevTools: boolean;
  sessionId?: string;
  expiresAt?: string;
}

interface SecurityLockResponse {
  success: boolean;
  lockId?: string;
  config?: SecurityLockConfig;
  message?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SecurityLockConfig = await request.json();
    
    // Validação básica
    if (!body.documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const lockId = crypto.randomUUID();
    const sessionId = body.sessionId || crypto.randomUUID();
    const expiresAt = body.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h default

    // Configuração padrão de segurança para modo read-only
    const securityConfig: SecurityLockConfig = {
      documentId: body.documentId,
      readOnlyMode: body.readOnlyMode ?? true,
      disableCopy: body.disableCopy ?? true,
      disableContextMenu: body.disableContextMenu ?? true,
      disableTextSelection: body.disableTextSelection ?? true,
      disableDragDrop: body.disableDragDrop ?? true,
      disablePrint: body.disablePrint ?? false,
      disableDevTools: body.disableDevTools ?? false,
      sessionId,
      expiresAt
    };

    // Salvar configuração de segurança no Supabase
    const { data, error } = await supabase
      .from('security_locks')
      .insert({
        id: lockId,
        document_id: body.documentId,
        session_id: sessionId,
        config: securityConfig,
        expires_at: expiresAt,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating security lock:', error);
      return NextResponse.json(
        { error: 'Failed to create security lock' },
        { status: 500 }
      );
    }

    const response: SecurityLockResponse = {
      success: true,
      lockId,
      config: securityConfig,
      message: 'Security lock enabled successfully'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing security lock request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    const sessionId = searchParams.get('sessionId');
    const lockId = searchParams.get('lockId');

    if (!documentId && !lockId) {
      return NextResponse.json(
        { error: 'Document ID or Lock ID is required' },
        { status: 400 }
      );
    }

    let query = supabase.from('security_locks').select('*');

    if (lockId) {
      query = query.eq('id', lockId);
    } else if (documentId) {
      query = query.eq('document_id', documentId);
      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }
    }

    // Buscar apenas locks não expirados
    query = query.gt('expires_at', new Date().toISOString());
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching security locks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch security locks' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { 
          success: true, 
          config: null, 
          message: 'No active security locks found' 
        }
      );
    }

    // Retornar o lock mais recente
    const activeLock = data[0];
    
    return NextResponse.json({
      success: true,
      lockId: activeLock.id,
      config: activeLock.config,
      expiresAt: activeLock.expires_at
    });
  } catch (error) {
    console.error('Error processing security lock request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lockId = searchParams.get('lockId');
    const documentId = searchParams.get('documentId');
    const sessionId = searchParams.get('sessionId');

    if (!lockId && !documentId) {
      return NextResponse.json(
        { error: 'Lock ID or Document ID is required' },
        { status: 400 }
      );
    }

    let query = supabase.from('security_locks').delete();

    if (lockId) {
      query = query.eq('id', lockId);
    } else if (documentId) {
      query = query.eq('document_id', documentId);
      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }
    }

    const { error } = await query;

    if (error) {
      console.error('Error removing security lock:', error);
      return NextResponse.json(
        { error: 'Failed to remove security lock' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Security lock removed successfully'
    });
  } catch (error) {
    console.error('Error processing security lock removal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}