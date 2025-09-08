// Script para limpar o IndexedDB local
// Este script deve ser executado no contexto do navegador

// Função para limpar o IndexedDB
function clearIndexedDB() {
  console.log('🧹 Iniciando limpeza do IndexedDB...');
  
  // Método 1: Usar o método clearAllData() se disponível
  if (typeof window !== 'undefined' && window.db && window.db.clearAllData) {
    return window.db.clearAllData()
      .then(() => {
        console.log('✅ IndexedDB limpo com sucesso usando db.clearAllData()!');
        return true;
      })
      .catch(error => {
        console.error('❌ Erro ao limpar IndexedDB:', error);
        return false;
      });
  }
  
  // Método 2: Limpar manualmente o banco 'legalEditorDB'
  return new Promise((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase('legalEditorDB');
    
    deleteRequest.onerror = () => {
      console.error('❌ Erro ao deletar banco IndexedDB:', deleteRequest.error);
      reject(deleteRequest.error);
    };
    
    deleteRequest.onsuccess = () => {
      console.log('✅ Banco IndexedDB "legalEditorDB" deletado com sucesso!');
      resolve(true);
    };
    
    deleteRequest.onblocked = () => {
      console.warn('⚠️  Operação bloqueada. Feche todas as abas do aplicativo e tente novamente.');
      reject(new Error('Operação bloqueada'));
    };
  });
}

// Executar a limpeza
if (typeof window !== 'undefined') {
  clearIndexedDB()
    .then(success => {
      if (success) {
        console.log('🎉 Limpeza do IndexedDB concluída!');
        console.log('💡 Recarregue a página para inicializar um banco limpo.');
      }
    })
    .catch(error => {
      console.error('💥 Falha na limpeza do IndexedDB:', error);
    });
} else {
  console.log('📋 Para executar este script:');
  console.log('1. Abra o DevTools do navegador (F12)');
  console.log('2. Vá para a aba Console');
  console.log('3. Cole e execute este código');
  console.log('4. Ou execute: clearIndexedDB()');
}

// Exportar para uso no console do navegador
if (typeof window !== 'undefined') {
  window.clearIndexedDB = clearIndexedDB;
}