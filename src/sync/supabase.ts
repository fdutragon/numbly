import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { db } from '@/data/db';

// Leitura dinâmica de env e cliente lazy para permitir testes alterarem env em runtime
function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return { url, key, configured: Boolean(url && key) };
}

let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

function getSupaClient(): SupabaseClient | null {
  const { url, key, configured } = getSupabaseEnv();
  if (!configured) return null;
  if (!cachedClient || cachedUrl !== url || cachedKey !== key) {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    cachedUrl = url;
    cachedKey = key;
  }
  return cachedClient;
}

// Gerar ou recuperar guest_id
function getOrCreateGuestId(): string {
  let guestId = localStorage.getItem('numbly_guest_id');
  if (!guestId) {
    guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('numbly_guest_id', guestId);
  }
  return guestId;
}

// Obter ID do usuário atual (guest ou autenticado)
export async function getCurrentUserId(): Promise<{ userId: string | null; guestId: string | null; isAuthenticated: boolean }> {
  const guestId = getOrCreateGuestId();
  
  // Verificar se há usuário autenticado
  const client = getSupaClient();
  const { data: { user } } = client ? await client.auth.getUser() : { data: { user: null as any } } as any;
  
  return {
    userId: user?.id || null,
    guestId,
    isAuthenticated: !!user
  };
}

// Export compatível: proxy que delega ao cliente lazy
export const supa: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupaClient();
    if (!client) {
      throw new Error('Supabase não configurado');
    }
    // @ts-expect-error - delegação dinâmica
    return client[prop];
  }
});

// Tabelas que serão sincronizadas
const SYNC_TABLES = ['documents', 'clauses', 'ai_edits', 'chat_messages', 'autocomplete_cache', 'flags'] as const;
type SyncTable = typeof SYNC_TABLES[number];

// Tipo genérico para registro de tabela
type TableRecord = Record<string, any> & {
  id: string;
  updated_at: string;
};

/**
 * Envia todos os dados da fila outbox para o Supabase
 */
export async function pushOutbox(): Promise<{ success: number; errors: number }> {
  const { configured } = getSupabaseEnv();
  if (!configured) {
    console.warn('Supabase não configurado - skip sync');
    return { success: 0, errors: 0 };
  }

  let success = 0;
  let errors = 0;
  const client = getSupaClient();
  if (!client) return { success: 0, errors: 0 };

  try {
    const items = await db.outbox.orderBy('updated_at').toArray();
    if (!items.length) {
      return { success: 0, errors: 0 };
    }

    console.log(`Sincronizando ${items.length} itens da fila outbox...`);

    for (const item of items) {
      try {
        if (item.op === 'upsert') {
          const { error } = await client
            .from(item.table)
            .upsert(item.payload, { 
              onConflict: 'id',
              ignoreDuplicates: false 
            });

          if (error) {
            console.error(`Erro ao fazer upsert na tabela ${item.table}:`, error);
            errors++;
          } else {
            await db.outbox.delete(item.id);
            success++;
          }
        } else if (item.op === 'delete') {
          const { error } = await client
            .from(item.table)
            .delete()
            .eq('id', item.payload.id);

          if (error) {
            console.error(`Erro ao deletar da tabela ${item.table}:`, error);
            errors++;
          } else {
            await db.outbox.delete(item.id);
            success++;
          }
        }
      } catch (error) {
        console.error(`Erro ao processar item da fila:`, error);
        errors++;
      }
    }

    console.log(`Sync outbox concluído: ${success} sucessos, ${errors} erros`);
  } catch (error) {
    console.error('Erro ao processar fila outbox:', error);
    errors++;
  }

  return { success, errors };
}

/**
 * Puxa dados incrementais do Supabase baseado em updated_at
 */
export async function pullSince(sinceISO: string): Promise<{ 
  synced: number; 
  errors: number; 
  lastSync: string;
}> {
  const { configured } = getSupabaseEnv();
  if (!configured) {
    return { synced: 0, errors: 0, lastSync: sinceISO };
  }

  let synced = 0;
  let errors = 0;
  let lastSync = sinceISO;
  const client = getSupaClient();
  if (!client) return { synced: 0, errors: 0, lastSync };

  try {
    for (const table of SYNC_TABLES) {
      try {
        const { data, error } = await client
          .from(table)
          .select('*')
          .gt('updated_at', sinceISO)
          .order('updated_at', { ascending: true });

        if (error) {
          console.error(`Erro ao buscar dados da tabela ${table}:`, error);
          errors++;
          continue;
        }

        if (!data || data.length === 0) {
          continue;
        }

        // Aplicar resolução por updated_at
        await db.transaction('rw', (db as any)[table], async () => {
          for (const row of data as TableRecord[]) {
            const localRow = await (db as any)[table].get(row.id);
            
            // Aplicar apenas se remote é mais recente ou não existe local
            if (!localRow || new Date(row.updated_at) > new Date(localRow.updated_at)) {
              await (db as any)[table].put(row);
              synced++;
            }

            // Atualizar lastSync para o mais recente
            if (row.updated_at > lastSync) {
              lastSync = row.updated_at;
            }
          }
        });

        console.log(`Tabela ${table}: ${data.length} registros processados`);
      } catch (error) {
        console.error(`Erro ao sincronizar tabela ${table}:`, error);
        errors++;
      }
    }

    // Salvar timestamp do último sync
    localStorage.setItem('numbly_last_sync', lastSync);
    
    console.log(`Pull sync concluído: ${synced} registros sincronizados, ${errors} erros`);
  } catch (error) {
    console.error('Erro no pull incremental:', error);
    errors++;
  }

  return { synced, errors, lastSync };
}

/**
 * Migra dados de guest para usuário autenticado
 */
export async function migrateGuestToUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Iniciando migração de dados guest para usuário ${userId}...`);
    
    const guestId = getOrCreateGuestId();
    let migratedCount = 0;
    const client = getSupaClient();
    if (!client) {
      console.warn('Supabase não configurado - skip migrate');
      return { success: true };
    }

    // Primeiro, envia tudo da outbox
    const pushResult = await pushOutbox();
    console.log(`Migração - Push outbox: ${pushResult.success} sucessos, ${pushResult.errors} erros`);

    // Atualizar registros no Supabase para associar guest_id ao user_id
    for (const table of SYNC_TABLES) {
      try {
        const { data, error } = await client
          .from(table)
          .update({ user_id: userId })
          .eq('guest_id', guestId)
          .is('user_id', null);

        if (error) {
          console.error(`Erro ao migrar tabela ${table}:`, error);
        } else {
          console.log(`Tabela ${table}: registros migrados para user_id ${userId}`);
          migratedCount++;
        }
      } catch (error) {
        console.error(`Erro ao processar migração da tabela ${table}:`, error);
      }
    }

    // Fazer um pull completo para sincronizar dados atualizados
    const pullResult = await pullSince(new Date(0).toISOString());
    console.log(`Migração - Pull completo: ${pullResult.synced} registros sincronizados`);
    
    console.log(`Migração concluída: ${migratedCount} tabelas processadas`);
    return { success: true };
  } catch (error) {
    console.error('Erro na migração guest→user:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

/**
 * Sync bidirecional completo
 */
export async function fullSync(): Promise<{
  pushed: number;
  pulled: number;
  errors: number;
}> {
  console.log('Iniciando sincronização completa...');
  
  const lastSync = localStorage.getItem('numbly_last_sync') || new Date(0).toISOString();
  
  // Push first (enviar mudanças locais)
  const pushResult = await pushOutbox();
  
  // Then pull (buscar mudanças remotas)
  const pullResult = await pullSince(lastSync);
  
  console.log('Sync completo finalizado:', {
    pushed: pushResult.success,
    pulled: pullResult.synced,
    errors: pushResult.errors + pullResult.errors
  });

  return {
    pushed: pushResult.success,
    pulled: pullResult.synced,
    errors: pushResult.errors + pullResult.errors
  };
}

/**
 * Verifica se o Supabase está configurado e acessível
 */
export async function checkSupabaseHealth(): Promise<{
  configured: boolean;
  accessible: boolean;
  authenticated: boolean;
  error?: string;
}> {
  const { configured } = getSupabaseEnv();
  if (!configured) {
    return {
      configured: false,
      accessible: false,
      authenticated: false,
      error: 'Variáveis de ambiente não configuradas'
    };
  }

  try {
    const client = getSupaClient();
    if (!client) {
      return {
        configured: false,
        accessible: false,
        authenticated: false,
        error: 'Variáveis de ambiente não configuradas'
      };
    }
    // Teste de conectividade básica
    const { data, error } = await client.from('documents').select('count').limit(1);
    
    if (error) {
      return {
        configured: true,
        accessible: false,
        authenticated: false,
        error: error.message
      };
    }

    // Verificar se usuário está autenticado
    const { data: { user } } = await client.auth.getUser();
    
    return {
      configured: true,
      accessible: true,
      authenticated: !!user,
      error: undefined
    };
  } catch (error) {
    return {
      configured: true,
      accessible: false,
      authenticated: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Configurar sync automático (executar em intervalos)
 */
export function setupAutoSync(intervalMinutes = 5): () => void {
  console.log(`Configurando auto-sync a cada ${intervalMinutes} minutos`);
  
  const intervalMs = intervalMinutes * 60 * 1000;
  const interval = setInterval(() => {
    fullSync().catch(error => {
      console.error('Erro no auto-sync:', error);
    });
  }, intervalMs);

  // Executar sync inicial
  setTimeout(() => {
    fullSync().catch(error => {
      console.error('Erro no sync inicial:', error);
    });
  }, 1000);

  // Retornar função para cancelar
  return () => {
    clearInterval(interval);
    console.log('Auto-sync cancelado');
  };
}

/**
 * Hook React para status de sincronização
 */
export function useSyncStatus() {
  const [syncStatus, setSyncStatus] = React.useState({
    isSyncing: false,
    lastSync: null as Date | null,
    error: null as string | null,
    configured: false
  });

  React.useEffect(() => {
    checkSupabaseHealth().then(health => {
      setSyncStatus(prev => ({
        ...prev,
        configured: health.configured && health.accessible,
        error: health.error || null
      }));
    });

    // Carregar último sync do localStorage
    const lastSyncStr = localStorage.getItem('numbly_last_sync');
    if (lastSyncStr) {
      setSyncStatus(prev => ({
        ...prev,
        lastSync: new Date(lastSyncStr)
      }));
    }
  }, []);

  const triggerSync = React.useCallback(async () => {
    setSyncStatus(prev => ({ ...prev, isSyncing: true, error: null }));
    
    try {
      const result = await fullSync();
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSync: new Date(),
        error: result.errors > 0 ? `${result.errors} erros durante sync` : null
      }));
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Erro no sync'
      }));
    }
  }, []);

  return {
    ...syncStatus,
    triggerSync
  };
}

// Import React para o hook
import React from 'react';

export default {
  supa,
  pushOutbox,
  pullSince,
  migrateGuestToUser,
  fullSync,
  checkSupabaseHealth,
  setupAutoSync,
  useSyncStatus
};
