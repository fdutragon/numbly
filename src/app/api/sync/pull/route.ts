import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const guestId = searchParams.get('guest_id');
    const lastSync = searchParams.get('last_sync');

    if (!guestId) {
      return NextResponse.json(
        { error: 'Guest ID é obrigatório' },
        { status: 400 }
      );
    }

    const syncTimestamp = lastSync ? new Date(lastSync) : new Date(0);
    const results: any = {
      documents: [],
      clauses: [],
      ai_edits: [],
      chat_messages: [],
      autocomplete_cache: [],
      deleted_items: [],
      sync_timestamp: new Date().toISOString()
    };

    // Buscar documentos atualizados
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .eq('guest_id', guestId)
      .gt('updated_at', syncTimestamp.toISOString());

    if (docsError) {
      console.error('Erro ao buscar documentos:', docsError);
    } else {
      results.documents = documents || [];
    }

    // Buscar cláusulas atualizadas
    const { data: clauses, error: clausesError } = await supabase
      .from('clauses')
      .select('*')
      .eq('guest_id', guestId)
      .gt('updated_at', syncTimestamp.toISOString());

    if (clausesError) {
      console.error('Erro ao buscar cláusulas:', clausesError);
    } else {
      results.clauses = clauses || [];
    }

    // Buscar edições de IA atualizadas
    const { data: aiEdits, error: aiEditsError } = await supabase
      .from('ai_edits')
      .select('*')
      .eq('guest_id', guestId)
      .gt('created_at', syncTimestamp.toISOString());

    if (aiEditsError) {
      console.error('Erro ao buscar edições de IA:', aiEditsError);
    } else {
      results.ai_edits = aiEdits || [];
    }

    // Buscar mensagens de chat atualizadas
    const { data: chatMessages, error: chatError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('guest_id', guestId)
      .gt('created_at', syncTimestamp.toISOString());

    if (chatError) {
      console.error('Erro ao buscar mensagens de chat:', chatError);
    } else {
      results.chat_messages = chatMessages || [];
    }

    // Buscar cache de autocomplete atualizado
    const { data: autocompleteCache, error: cacheError } = await supabase
      .from('autocomplete_cache')
      .select('*')
      .eq('guest_id', guestId)
      .gt('created_at', syncTimestamp.toISOString());

    if (cacheError) {
      console.error('Erro ao buscar cache de autocomplete:', cacheError);
    } else {
      results.autocomplete_cache = autocompleteCache || [];
    }

    // Buscar itens deletados
    const { data: deletedItems, error: deletedError } = await supabase
      .from('deleted_items')
      .select('*')
      .eq('guest_id', guestId)
      .gt('deleted_at', syncTimestamp.toISOString());

    if (deletedError) {
      console.error('Erro ao buscar itens deletados:', deletedError);
    } else {
      results.deleted_items = deletedItems || [];
    }

    // Atualizar timestamp de sincronização
    await supabase
      .from('sync_status')
      .upsert({
        guest_id: guestId,
        last_pull: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      data: results,
      message: 'Sincronização realizada com sucesso'
    });

  } catch (error) {
    console.error('Erro na sincronização pull:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { guest_id, last_sync } = body;

    if (!guest_id) {
      return NextResponse.json(
        { error: 'Guest ID é obrigatório' },
        { status: 400 }
      );
    }

    const syncTimestamp = last_sync ? new Date(last_sync) : new Date(0);
    const results: any = {
      documents: [],
      clauses: [],
      ai_edits: [],
      chat_messages: [],
      autocomplete_cache: [],
      deleted_items: [],
      sync_timestamp: new Date().toISOString()
    };

    // Buscar todos os dados atualizados desde o último sync
    const [documentsRes, clausesRes, aiEditsRes, chatRes, cacheRes, deletedRes] = await Promise.allSettled([
      supabase.from('documents').select('*').eq('guest_id', guest_id).gt('updated_at', syncTimestamp.toISOString()),
      supabase.from('clauses').select('*').eq('guest_id', guest_id).gt('updated_at', syncTimestamp.toISOString()),
      supabase.from('ai_edits').select('*').eq('guest_id', guest_id).gt('created_at', syncTimestamp.toISOString()),
      supabase.from('chat_messages').select('*').eq('guest_id', guest_id).gt('created_at', syncTimestamp.toISOString()),
      supabase.from('autocomplete_cache').select('*').eq('guest_id', guest_id).gt('created_at', syncTimestamp.toISOString()),
      supabase.from('deleted_items').select('*').eq('guest_id', guest_id).gt('deleted_at', syncTimestamp.toISOString())
    ]);

    // Processar resultados
    if (documentsRes.status === 'fulfilled' && documentsRes.value.data) {
      results.documents = documentsRes.value.data;
    }
    if (clausesRes.status === 'fulfilled' && clausesRes.value.data) {
      results.clauses = clausesRes.value.data;
    }
    if (aiEditsRes.status === 'fulfilled' && aiEditsRes.value.data) {
      results.ai_edits = aiEditsRes.value.data;
    }
    if (chatRes.status === 'fulfilled' && chatRes.value.data) {
      results.chat_messages = chatRes.value.data;
    }
    if (cacheRes.status === 'fulfilled' && cacheRes.value.data) {
      results.autocomplete_cache = cacheRes.value.data;
    }
    if (deletedRes.status === 'fulfilled' && deletedRes.value.data) {
      results.deleted_items = deletedRes.value.data;
    }

    // Atualizar timestamp de sincronização
    await supabase
      .from('sync_status')
      .upsert({
        guest_id,
        last_pull: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      data: results,
      message: 'Dados sincronizados com sucesso'
    });

  } catch (error) {
    console.error('Erro na sincronização pull (POST):', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}