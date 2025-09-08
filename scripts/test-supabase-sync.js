/**
 * Script de teste para verificar conexão e sincronização Supabase <-> IndexedDB
 * Execute: node scripts/test-supabase-sync.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuração do Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não configuradas!');
  console.log('Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local');
  process.exit(1);
}

// Cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const supabaseAdmin = SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY) : null;

async function testConnection() {
  console.log('🔍 Testando conexão com Supabase...');
  
  try {
    // Teste básico de conexão
    const { data, error } = await supabase.from('documents').select('count').limit(1);
    
    if (error) {
      console.error('❌ Erro na conexão:', error.message);
      return false;
    }
    
    console.log('✅ Conexão com Supabase estabelecida com sucesso!');
    return true;
  } catch (err) {
    console.error('❌ Erro na conexão:', err.message);
    return false;
  }
}

async function testTables() {
  console.log('\n🔍 Verificando estrutura das tabelas...');
  
  const tables = [
    'documents', 'clauses', 'clause_index', 'ai_edits', 
    'chat_messages', 'autocomplete_cache', 'flags', 'outbox'
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      
      if (error) {
        console.log(`❌ Tabela '${table}': ${error.message}`);
      } else {
        console.log(`✅ Tabela '${table}': OK`);
      }
    } catch (err) {
      console.log(`❌ Tabela '${table}': ${err.message}`);
    }
  }
}

async function testGuestAccess() {
  console.log('\n🔍 Testando acesso de usuário guest...');
  
  try {
    const testDoc = {
      id: crypto.randomUUID(),
      title: 'Documento de Teste Guest',
      status: 'draft',
      guest_id: crypto.randomUUID()
    };
    
    const { data, error } = await supabase
      .from('documents')
      .insert(testDoc)
      .select();
    
    if (error) throw error;
    console.log('✅ Documento guest criado com sucesso!');
    
    // Limpar teste
    await supabase.from('documents').delete().eq('id', testDoc.id);
    return true;
  } catch (error) {
    console.log(`❌ Erro ao criar documento guest: ${error.message}`);
    return false;
  }
}

async function testFlags() {
  console.log('\n🔍 Testando sistema de flags...');
  
  try {
    const testFlag = {
      id: crypto.randomUUID(),
      guest_id: crypto.randomUUID(),
      free_ai_used: false,
      feature_unlocked: []
    };
    
    const { data, error } = await supabase
      .from('flags')
      .insert(testFlag)
      .select();
    
    if (error) throw error;
    console.log('✅ Flag criada com sucesso!');
    
    // Limpar teste
    await supabase.from('flags').delete().eq('id', testFlag.id);
    return true;
  } catch (error) {
    console.log(`❌ Erro ao criar flag: ${error.message}`);
    return false;
  }
}

async function showInstructions() {
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('1. Configure suas variáveis de ambiente no arquivo .env.local');
  console.log('2. Execute as migrações SQL no painel do Supabase:');
  console.log('   - supabase/migrations/001_initial_schema.sql');
  console.log('   - supabase/migrations/002_rls_policies.sql');
  console.log('3. Teste a sincronização no frontend');
  console.log('\n🔗 Links úteis:');
  console.log('- Painel Supabase: https://supabase.com/dashboard');
  console.log('- Documentação RLS: https://supabase.com/docs/guides/auth/row-level-security');
}

async function main() {
  console.log('🚀 Iniciando testes de configuração Supabase\n');
  
  const connectionOk = await testConnection();
  
  if (!connectionOk) {
    console.log('\n❌ Falha na conexão. Verifique suas configurações.');
    await showInstructions();
    return;
  }
  
  await testTables();
  await testGuestAccess();
  await testFlags();
  
  console.log('\n🎉 Todos os testes concluídos!');
  await showInstructions();
}

// Executar testes
main().catch(console.error);