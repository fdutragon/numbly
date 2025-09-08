const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = 'https://xhrtkfdyxrpossecqjzf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocnRrZmR5eHJwb3NzZWNxanpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjY4MjQ5NSwiZXhwIjoyMDcyMjU4NDk1fQ.f58Me3FdPZdt_XDiPdBpGe9NexmvbcwQNU1NhUAii7A';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Lista de tabelas baseada no schema atual do IndexedDB (db.ts)
// Ordem respeitando dependências para evitar erros de foreign key
const tablesToClear = [
  'autocomplete_cache',
  'chat_messages',
  'ai_edits',
  'clause_index',
  'clauses',
  'documents',
  'flags',
  'outbox'
];

async function clearSupabaseTables() {
  console.log('🧹 Iniciando limpeza das tabelas do Supabase...');
  console.log('⚠️  ATENÇÃO: Esta operação irá apagar TODOS os dados!');
  
  let clearedTables = [];
  let errors = [];
  
  for (const tableName of tablesToClear) {
    try {
      console.log(`\n🗑️  Limpando tabela: ${tableName}`);
      
      // Executa DELETE para limpar a tabela
      const { data, error, count } = await supabase
        .from(tableName)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Condição que sempre será verdadeira
      
      if (error) {
        console.error(`❌ Erro ao limpar tabela ${tableName}:`, error.message);
        errors.push({ table: tableName, error: error.message });
      } else {
        console.log(`✅ Tabela ${tableName} limpa com sucesso!`);
        clearedTables.push(tableName);
      }
      
    } catch (err) {
      console.error(`❌ Erro inesperado ao limpar tabela ${tableName}:`, err.message);
      errors.push({ table: tableName, error: err.message });
    }
  }
  
  // Relatório final
  console.log('\n📊 RELATÓRIO FINAL:');
  console.log('==================');
  
  if (clearedTables.length > 0) {
    console.log(`\n✅ Tabelas limpas com sucesso (${clearedTables.length}):`);
    clearedTables.forEach(table => console.log(`   - ${table}`));
  }
  
  if (errors.length > 0) {
    console.log(`\n❌ Erros encontrados (${errors.length}):`);
    errors.forEach(({ table, error }) => {
      console.log(`   - ${table}: ${error}`);
    });
  }
  
  if (clearedTables.length === tablesToClear.length) {
    console.log('\n🎉 Todas as tabelas foram limpas com sucesso!');
  } else {
    console.log('\n⚠️  Algumas tabelas não puderam ser limpas. Verifique os erros acima.');
  }
  
  console.log('\n🏁 Processo de limpeza finalizado.');
}

// Executa o script
if (require.main === module) {
  clearSupabaseTables()
    .then(() => {
      console.log('\n✨ Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { clearSupabaseTables };