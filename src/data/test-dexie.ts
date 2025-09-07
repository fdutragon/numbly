import { db } from './db';
import { addChatMessage, getChatMessages } from './dao';
import type { ChatMsg } from './db';

// Função para testar a persistência do Dexie
export async function testDexiePersistence() {
  console.log('🔍 Testando persistência do Dexie...');
  
  try {
    // Teste 1: Verificar se o banco está aberto
    console.log('📊 Status do banco:', db.isOpen() ? 'Aberto' : 'Fechado');
    
    // Teste 2: Tentar abrir o banco explicitamente
    if (!db.isOpen()) {
      await db.open();
      console.log('✅ Banco aberto com sucesso');
    }
    
    // Teste 3: Listar tabelas
    console.log('📋 Tabelas disponíveis:', db.tables.map(t => t.name));
    
    // Teste 4: Testar operação de escrita
    const testDocumentId = 'test-doc-' + Date.now();
    const testMessage: ChatMsg = {
      id: crypto.randomUUID(),
      document_id: testDocumentId,
      role: 'user',
      content: 'Mensagem de teste para verificar persistência',
      created_at: new Date().toISOString(),
    };
    
    console.log('💾 Adicionando mensagem de teste...');
    addChatMessage(testMessage);
    
    // Aguardar um pouco para o flush da queue
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Teste 5: Testar operação de leitura
    console.log('📖 Lendo mensagens...');
    const messages = await getChatMessages(testDocumentId);
    console.log('📨 Mensagens encontradas:', messages.length);
    
    if (messages.length > 0) {
      console.log('✅ Persistência funcionando! Mensagem:', messages[0].content);
    } else {
      console.log('❌ Problema na persistência - nenhuma mensagem encontrada');
    }
    
    // Teste 6: Verificar dados diretamente no IndexedDB
    const directCount = await db.chat_messages.count();
    console.log('🔢 Total de mensagens no banco:', directCount);
    
    // Teste 7: Verificar outbox
    const outboxCount = await db.outbox.count();
    console.log('📤 Itens na outbox:', outboxCount);
    
    return {
      isOpen: db.isOpen(),
      tablesCount: db.tables.length,
      messagesCount: messages.length,
      directCount,
      outboxCount,
      success: messages.length > 0
    };
    
  } catch (error) {
    console.error('❌ Erro no teste do Dexie:', error);
    return {
      error: error instanceof Error ? error.message : String(error),
      success: false
    };
  }
}

// Função para limpar dados de teste
export async function cleanupTestData() {
  try {
    await db.chat_messages.where('document_id').startsWith('test-doc-').delete();
    await db.outbox.where('table').equals('chat_messages').delete();
    console.log('🧹 Dados de teste limpos');
  } catch (error) {
    console.error('❌ Erro ao limpar dados de teste:', error);
  }
}