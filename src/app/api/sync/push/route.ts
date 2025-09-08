import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SyncPushRequest {
  userId: string;
  guestId?: string;
  data: {
    documents?: DocumentData[];
    clauses?: ClauseData[];
    aiEdits?: AIEditData[];
    chatMessages?: ChatMessageData[];
    autocompleteCache?: AutocompleteCacheData[];
  };
  lastSyncTimestamp?: string;
  deviceId?: string;
}

interface DocumentData {
  id: string;
  title: string;
  content?: any;
  status: string;
  type?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

interface ClauseData {
  id: string;
  document_id: string;
  order_index: number;
  title: string;
  body: any;
  hash?: string;
  created_at: string;
  updated_at: string;
}

interface AIEditData {
  id: string;
  document_id: string;
  clause_id?: string;
  diff: any;
  applied_by: string;
  created_at: string;
}

interface ChatMessageData {
  id: string;
  document_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface AutocompleteCacheData {
  id: string;
  clause_id?: string;
  cache_key: string;
  suggestion: string;
  created_at: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SyncPushRequest = await request.json();
    
    if (!body.userId && !body.guestId) {
      return NextResponse.json(
        { error: 'User identification required' },
        { status: 400 }
      );
    }

    if (!body.data) {
      return NextResponse.json(
        { error: 'Sync data is required' },
        { status: 400 }
      );
    }

    const userId = body.userId || body.guestId!;
    const syncResults = {
      documents: { created: 0, updated: 0, errors: 0 },
      clauses: { created: 0, updated: 0, errors: 0 },
      aiEdits: { created: 0, updated: 0, errors: 0 },
      chatMessages: { created: 0, updated: 0, errors: 0 },
      autocompleteCache: { created: 0, updated: 0, errors: 0 }
    };

    // Sincronizar documentos
    if (body.data.documents && body.data.documents.length > 0) {
      for (const doc of body.data.documents) {
        try {
          // Verificar se documento já existe
          const { data: existingDoc } = await supabase
            .from('documents')
            .select('id, updated_at')
            .eq('id', doc.id)
            .single();

          const docData = {
            ...doc,
            user_id: userId,
            synced_at: new Date().toISOString()
          };

          if (existingDoc) {
            // Verificar se precisa atualizar (comparar timestamps)
            const localTimestamp = new Date(doc.updated_at).getTime();
            const remoteTimestamp = new Date(existingDoc.updated_at).getTime();
            
            if (localTimestamp > remoteTimestamp) {
              const { error } = await supabase
                .from('documents')
                .update(docData)
                .eq('id', doc.id);
              
              if (error) throw error;
              syncResults.documents.updated++;
            }
          } else {
            // Criar novo documento
            const { error } = await supabase
              .from('documents')
              .insert(docData);
            
            if (error) throw error;
            syncResults.documents.created++;
          }
        } catch (error) {
          console.error(`Error syncing document ${doc.id}:`, error);
          syncResults.documents.errors++;
        }
      }
    }

    // Sincronizar cláusulas
    if (body.data.clauses && body.data.clauses.length > 0) {
      for (const clause of body.data.clauses) {
        try {
          const { data: existingClause } = await supabase
            .from('clauses')
            .select('id, updated_at')
            .eq('id', clause.id)
            .single();

          const clauseData = {
            ...clause,
            user_id: userId,
            synced_at: new Date().toISOString()
          };

          if (existingClause) {
            const localTimestamp = new Date(clause.updated_at).getTime();
            const remoteTimestamp = new Date(existingClause.updated_at).getTime();
            
            if (localTimestamp > remoteTimestamp) {
              const { error } = await supabase
                .from('clauses')
                .update(clauseData)
                .eq('id', clause.id);
              
              if (error) throw error;
              syncResults.clauses.updated++;
            }
          } else {
            const { error } = await supabase
              .from('clauses')
              .insert(clauseData);
            
            if (error) throw error;
            syncResults.clauses.created++;
          }
        } catch (error) {
          console.error(`Error syncing clause ${clause.id}:`, error);
          syncResults.clauses.errors++;
        }
      }
    }

    // Sincronizar edições de IA
    if (body.data.aiEdits && body.data.aiEdits.length > 0) {
      for (const aiEdit of body.data.aiEdits) {
        try {
          const { data: existingEdit } = await supabase
            .from('ai_edits')
            .select('id')
            .eq('id', aiEdit.id)
            .single();

          const editData = {
            ...aiEdit,
            user_id: userId,
            synced_at: new Date().toISOString()
          };

          if (!existingEdit) {
            const { error } = await supabase
              .from('ai_edits')
              .insert(editData);
            
            if (error) throw error;
            syncResults.aiEdits.created++;
          }
        } catch (error) {
          console.error(`Error syncing AI edit ${aiEdit.id}:`, error);
          syncResults.aiEdits.errors++;
        }
      }
    }

    // Sincronizar mensagens de chat
    if (body.data.chatMessages && body.data.chatMessages.length > 0) {
      for (const message of body.data.chatMessages) {
        try {
          const { data: existingMessage } = await supabase
            .from('chat_messages')
            .select('id')
            .eq('id', message.id)
            .single();

          const messageData = {
            ...message,
            user_id: userId,
            synced_at: new Date().toISOString()
          };

          if (!existingMessage) {
            const { error } = await supabase
              .from('chat_messages')
              .insert(messageData);
            
            if (error) throw error;
            syncResults.chatMessages.created++;
          }
        } catch (error) {
          console.error(`Error syncing chat message ${message.id}:`, error);
          syncResults.chatMessages.errors++;
        }
      }
    }

    // Sincronizar cache de autocomplete (opcional, pode ser limpo periodicamente)
    if (body.data.autocompleteCache && body.data.autocompleteCache.length > 0) {
      for (const cache of body.data.autocompleteCache) {
        try {
          // Cache tem TTL, só sincronizar se for recente (últimas 24h)
          const cacheAge = Date.now() - new Date(cache.created_at).getTime();
          const maxAge = 24 * 60 * 60 * 1000; // 24 horas
          
          if (cacheAge < maxAge) {
            const { data: existingCache } = await supabase
              .from('autocomplete_cache')
              .select('id')
              .eq('cache_key', cache.cache_key)
              .single();

            const cacheData = {
              ...cache,
              user_id: userId,
              synced_at: new Date().toISOString()
            };

            if (!existingCache) {
              const { error } = await supabase
                .from('autocomplete_cache')
                .insert(cacheData);
              
              if (error) throw error;
              syncResults.autocompleteCache.created++;
            }
          }
        } catch (error) {
          console.error(`Error syncing autocomplete cache ${cache.id}:`, error);
          syncResults.autocompleteCache.errors++;
        }
      }
    }

    // Atualizar timestamp de última sincronização
    const syncTimestamp = new Date().toISOString();
    await supabase
      .from('user_sync_status')
      .upsert({
        user_id: userId,
        last_push_sync: syncTimestamp,
        device_id: body.deviceId || 'unknown',
        sync_count: 1 // Incrementar em implementação real
      });

    return NextResponse.json({
      success: true,
      syncTimestamp,
      results: syncResults,
      message: 'Data synchronized successfully'
    });

  } catch (error) {
    console.error('Error during sync push:', error);
    return NextResponse.json(
      { 
        error: 'Failed to synchronize data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Endpoint GET para verificar status de sincronização
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const guestId = searchParams.get('guestId');
    
    if (!userId && !guestId) {
      return NextResponse.json(
        { error: 'User identification required' },
        { status: 400 }
      );
    }

    const userIdentifier = userId || guestId!;
    
    // Buscar status de sincronização
    const { data: syncStatus } = await supabase
      .from('user_sync_status')
      .select('*')
      .eq('user_id', userIdentifier)
      .single();

    // Contar registros por tipo
    const [documentsCount, clausesCount, aiEditsCount, chatMessagesCount] = await Promise.all([
      supabase.from('documents').select('id', { count: 'exact' }).eq('user_id', userIdentifier),
      supabase.from('clauses').select('id', { count: 'exact' }).eq('user_id', userIdentifier),
      supabase.from('ai_edits').select('id', { count: 'exact' }).eq('user_id', userIdentifier),
      supabase.from('chat_messages').select('id', { count: 'exact' }).eq('user_id', userIdentifier)
    ]);

    return NextResponse.json({
      syncStatus: syncStatus || null,
      counts: {
        documents: documentsCount.count || 0,
        clauses: clausesCount.count || 0,
        aiEdits: aiEditsCount.count || 0,
        chatMessages: chatMessagesCount.count || 0
      },
      lastSync: syncStatus?.last_push_sync || null
    });

  } catch (error) {
    console.error('Error getting sync status:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}