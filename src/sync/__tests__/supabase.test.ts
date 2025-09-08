import { jest } from '@jest/globals';

// Mock do banco de dados
const mockDb = {
  outbox: {
    add: jest.fn(),
    delete: jest.fn(),
    toArray: jest.fn(),
    clear: jest.fn()
  },
  documents: {
    add: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    clear: jest.fn(),
    toArray: jest.fn()
  },
  clauses: {
    add: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    clear: jest.fn(),
    toArray: jest.fn()
  },
  ai_edits: {
    add: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    clear: jest.fn(),
    toArray: jest.fn()
  },
  chat_messages: {
    add: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    clear: jest.fn(),
    toArray: jest.fn()
  },
  autocomplete_cache: {
    add: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    clear: jest.fn(),
    toArray: jest.fn()
  },
  flags: {
    add: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    clear: jest.fn(),
    toArray: jest.fn()
  },
  transaction: jest.fn()
};

jest.mock('../../data/db', () => ({
  db: mockDb
}));

// Mock do cliente Supabase
const mockSupabaseClient = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn()
  }
};

// Mock do módulo supabase-js
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}));

// Importar as funções
import {
  pushOutbox,
  pullSince,
  fullSync,
  checkSupabaseHealth,
  getCurrentUserId,
  migrateGuestToUser
} from '../supabase';

// Mock do localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage
});

// Mock das variáveis de ambiente
const originalEnv = process.env;

describe('Supabase Sync Functions', () => {
  beforeEach(async () => {
    // Reset dos mocks do banco de dados
    mockDb.transaction.mockImplementation(async (mode, tables, callback) => {
      return await callback();
    });
    
    // Reset de todos os mocks
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    
    // Configurar mocks padrão do banco
    mockDb.outbox.toArray.mockResolvedValue([]);
    mockDb.documents.toArray.mockResolvedValue([]);
    mockDb.clauses.toArray.mockResolvedValue([]);
    mockDb.ai_edits.toArray.mockResolvedValue([]);
    mockDb.chat_messages.toArray.mockResolvedValue([]);
    mockDb.autocomplete_cache.toArray.mockResolvedValue([]);
    mockDb.flags.toArray.mockResolvedValue([]);

    // Configurar mock do Supabase com métodos encadeados
    const mockQuery = {
      upsert: jest.fn().mockResolvedValue({ error: null }),
      delete: jest.fn().mockResolvedValue({ error: null }),
      eq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
      update: jest.fn().mockResolvedValue({ data: [], error: null }),
      is: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis()
    };
    
    mockSupabaseClient.from.mockReturnValue(mockQuery);
    
    // Aplicar os mocks aos métodos do cliente para permitir encadeamento
    Object.assign(mockSupabaseClient, mockQuery);

    // Configurar variáveis de ambiente
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('pushOutbox', () => {
    it('should return early if Supabase is not configured', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = '';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';

      const result = await pushOutbox();

      expect(result).toEqual({ success: 0, errors: 0 });
    });

    it('should return early if outbox is empty', async () => {
      const result = await pushOutbox();

      expect(result).toEqual({ success: 0, errors: 0 });
    });

    it('should process upsert operations successfully', async () => {
      // Mock da outbox com item
      const outboxItem = {
        id: 'test-op-1',
        table: 'documents',
        op: 'upsert',
        payload: {
          id: 'doc-1',
          title: 'Test Document',
          status: 'draft'
        },
        updated_at: new Date().toISOString()
      };
      
      mockDb.outbox.toArray.mockResolvedValue([outboxItem]);
      mockDb.outbox.delete.mockResolvedValue(1);

      // Mock de sucesso no Supabase
      mockSupabaseClient.upsert.mockResolvedValue({ error: null });

      const result = await pushOutbox();

      expect(result.success).toBe(1);
      expect(result.errors).toBe(0);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('documents');
      expect(mockSupabaseClient.upsert).toHaveBeenCalled();
      expect(mockDb.outbox.delete).toHaveBeenCalledWith('test-op-1');
    });

    it('should process delete operations successfully', async () => {
      // Mock da outbox com item de delete
      const outboxItem = {
        id: 'test-op-2',
        table: 'documents',
        op: 'delete',
        payload: { id: 'doc-1' },
        updated_at: new Date().toISOString()
      };
      
      mockDb.outbox.toArray.mockResolvedValue([outboxItem]);
      mockDb.outbox.delete.mockResolvedValue(1);

      // Mock de sucesso no Supabase
      mockSupabaseClient.delete.mockResolvedValue({ error: null });

      const result = await pushOutbox();

      expect(result.success).toBe(1);
      expect(result.errors).toBe(0);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('documents');
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'doc-1');
      expect(mockDb.outbox.delete).toHaveBeenCalledWith('test-op-2');
    });

    it('should handle Supabase errors', async () => {
      // Mock da outbox com item
      const outboxItem = {
        id: 'test-op-3',
        table: 'documents',
        op: 'upsert',
        payload: { id: 'doc-1', title: 'Test' },
        updated_at: new Date().toISOString()
      };
      
      mockDb.outbox.toArray.mockResolvedValue([outboxItem]);

      // Mock de erro no Supabase
      mockSupabaseClient.upsert.mockResolvedValue({
        error: { message: 'Database error' }
      });

      const result = await pushOutbox();

      expect(result.success).toBe(0);
      expect(result.errors).toBe(1);
      
      // Verificar que delete não foi chamado (item permanece na outbox)
      expect(mockDb.outbox.delete).not.toHaveBeenCalled();
    });
  });

  describe('pullSince', () => {
    it('should return early if Supabase is not configured', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = '';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';

      const sinceISO = new Date().toISOString();
      const result = await pullSince(sinceISO);

      expect(result).toEqual({
        synced: 0,
        errors: 0,
        lastSync: sinceISO
      });
    });

    it('should pull and sync new documents', async () => {
      const sinceISO = '2024-01-01T00:00:00.000Z';
      const mockData = [
        {
          id: 'doc-1',
          title: 'Remote Document',
          status: 'published',
          updated_at: '2024-01-02T00:00:00.000Z'
        }
      ];

      // Mock da resposta do Supabase
      mockSupabaseClient.select.mockResolvedValue({
        data: mockData,
        error: null
      });

      const result = await pullSince(sinceISO);

      expect(result.synced).toBe(1);
      expect(result.errors).toBe(0);
      expect(result.lastSync).toBe('2024-01-02T00:00:00.000Z');

      // Verificar se documento foi salvo localmente
      expect(mockDb.documents.put).toHaveBeenCalledWith(expect.objectContaining({
        id: 'doc-1',
        title: 'Remote Document'
      }));
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'numbly_last_sync',
        '2024-01-02T00:00:00.000Z'
      );
    });

    it('should handle conflict resolution by updated_at', async () => {
      // Mock documento local mais antigo
      const localDoc = {
        id: 'doc-1',
        title: 'Local Document',
        status: 'draft',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T12:00:00.000Z'
      };
      
      mockDb.documents.get.mockResolvedValue(localDoc);

      const sinceISO = '2024-01-01T00:00:00.000Z';
      const mockData = [
        {
          id: 'doc-1',
          title: 'Remote Document (Newer)',
          status: 'published',
          updated_at: '2024-01-02T00:00:00.000Z'
        }
      ];

      mockSupabaseClient.select.mockResolvedValue({
        data: mockData,
        error: null
      });

      const result = await pullSince(sinceISO);

      expect(result.synced).toBe(1);

      // Verificar se documento local foi atualizado com versão remota
      expect(mockDb.documents.put).toHaveBeenCalledWith(expect.objectContaining({
        id: 'doc-1',
        title: 'Remote Document (Newer)',
        status: 'published'
      }));
    });

    it('should skip older remote data', async () => {
      // Mock documento local mais recente
      const localDoc = {
        id: 'doc-1',
        title: 'Local Document (Newer)',
        status: 'draft',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-02T00:00:00.000Z'
      };
      
      mockDb.documents.get.mockResolvedValue(localDoc);

      const sinceISO = '2024-01-01T00:00:00.000Z';
      const mockData = [
        {
          id: 'doc-1',
          title: 'Remote Document (Older)',
          status: 'published',
          updated_at: '2024-01-01T12:00:00.000Z'
        }
      ];

      mockSupabaseClient.select.mockResolvedValue({
        data: mockData,
        error: null
      });

      const result = await pullSince(sinceISO);

      expect(result.synced).toBe(0);

      // Verificar se documento local não foi alterado (put não foi chamado)
      expect(mockDb.documents.put).not.toHaveBeenCalled();
    });

    it('should handle Supabase query errors', async () => {
      const sinceISO = '2024-01-01T00:00:00.000Z';

      mockSupabaseClient.select.mockResolvedValue({
        data: null,
        error: { message: 'Network error' }
      });

      const result = await pullSince(sinceISO);

      expect(result.synced).toBe(0);
      expect(result.errors).toBeGreaterThan(0);
    });
  });

  describe('fullSync', () => {
    it('should perform complete bidirectional sync', async () => {
      // Mock localStorage para lastSync
      mockLocalStorage.getItem.mockReturnValue('2024-01-01T00:00:00.000Z');

      // Mock da outbox com item
      const outboxItem = {
        id: 'test-op-1',
        table: 'documents',
        op: 'upsert',
        payload: { id: 'doc-1', title: 'Local Doc' },
        updated_at: new Date().toISOString()
      };
      
      mockDb.outbox.toArray.mockResolvedValue([outboxItem]);
      mockDb.outbox.delete.mockResolvedValue(1);

      // Mock de sucesso para push
      mockSupabaseClient.upsert.mockResolvedValue({ error: null });

      // Mock de dados para pull
      mockSupabaseClient.select.mockResolvedValue({
        data: [{
          id: 'doc-2',
          title: 'Remote Doc',
          updated_at: '2024-01-02T00:00:00.000Z'
        }],
        error: null
      });

      const result = await fullSync();

      expect(result.pushed).toBe(1);
      expect(result.pulled).toBe(1);
      expect(result.errors).toBe(0);
    });

    it('should use default lastSync if not in localStorage', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockSupabaseClient.upsert.mockResolvedValue({ error: null });
      mockSupabaseClient.select.mockResolvedValue({ data: [], error: null });

      const result = await fullSync();

      expect(mockSupabaseClient.gt).toHaveBeenCalledWith(
        'updated_at',
        new Date(0).toISOString()
      );
    });
  });

  describe('checkSupabaseHealth', () => {
    it('should return not configured when env vars are missing', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = '';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';

      const result = await checkSupabaseHealth();

      expect(result).toEqual({
        configured: false,
        accessible: false,
        authenticated: false,
        error: 'Variáveis de ambiente não configuradas'
      });
    });

    it('should return accessible when connection works', async () => {
      // Configurar mock para query de teste
      const mockQuery = {
        select: jest.fn().mockResolvedValue({
          data: [{ count: 0 }],
          error: null
        })
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } }
      });

      const result = await checkSupabaseHealth();

      expect(result.configured).toBe(true);
      expect(result.accessible).toBe(true);
      expect(result.authenticated).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle connection errors', async () => {
      // Configurar mock para erro de conexão
      const mockQuery = {
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Connection failed' }
        })
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await checkSupabaseHealth();

      expect(result.configured).toBe(true);
      expect(result.accessible).toBe(false);
      expect(result.authenticated).toBe(false);
      expect(result.error).toBe('Connection failed');
    });
  });

  describe('getCurrentUserId', () => {
    it('should return guest ID when not authenticated', async () => {
      mockLocalStorage.getItem.mockReturnValue('guest_123456');
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null }
      });

      const result = await getCurrentUserId();

      expect(result.userId).toBeNull();
      expect(result.guestId).toBe('guest_123456');
      expect(result.isAuthenticated).toBe(false);
    });

    it('should create new guest ID if not exists', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null }
      });

      const result = await getCurrentUserId();

      expect(result.userId).toBeNull();
      expect(result.guestId).toMatch(/^guest_/);
      expect(result.isAuthenticated).toBe(false);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'numbly_guest_id',
        expect.stringMatching(/^guest_/)
      );
    });
  });

  describe('migrateGuestToUser', () => {
    it('should migrate guest data to authenticated user', async () => {
      const userId = 'user-1';
      const guestId = 'guest_123456';
      
      mockLocalStorage.getItem.mockReturnValue(guestId);
      
      // Mock de sucesso para todas as operações
      mockSupabaseClient.upsert.mockResolvedValue({ error: null });
      mockSupabaseClient.update.mockResolvedValue({ 
        data: [{ id: 'doc-1' }], 
        error: null 
      });
      mockSupabaseClient.select.mockResolvedValue({ 
        data: [], 
        error: null 
      });

      const result = await migrateGuestToUser(userId);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});