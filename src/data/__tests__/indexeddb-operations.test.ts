import { db, type Document, type Clause, type ClauseIndex, type AiEdit, type ChatMsg, type AutocompleteCache, type Flags } from '../db'
import 'fake-indexeddb/auto'

describe('IndexedDB Operations - Complete Coverage', () => {
  beforeEach(async () => {
    await db.open()
    // Clear all tables without initializing defaults
    await db.transaction('rw', db.tables, () => {
      db.tables.forEach(table => table.clear())
    })
  })

  afterEach(async () => {
    await db.close()
  })

  describe('Documents table', () => {
    it('should create document with auto-generated updated_at', async () => {
      const doc: Document = {
        id: 'doc-1',
        title: 'Test Document',
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: '' // Will be auto-generated
      }

      await db.documents.add(doc)
      const saved = await db.documents.get('doc-1')
      
      expect(saved).toBeDefined()
      expect(saved!.updated_at).toBeTruthy()
      expect(saved!.updated_at).not.toBe('')
    })

    it('should update document with new updated_at', async () => {
      const doc: Document = {
        id: 'doc-2',
        title: 'Original Title',
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: ''
      }

      await db.documents.add(doc)
      const original = await db.documents.get('doc-2')
      
      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 100))
      
      await db.documents.update('doc-2', { title: 'Updated Title' })
      const updated = await db.documents.get('doc-2')
      
      expect(updated!.title).toBe('Updated Title')
      expect(updated!.updated_at).toBeTruthy()
      expect(new Date(updated!.updated_at).getTime()).toBeGreaterThanOrEqual(new Date(original!.updated_at).getTime())
    })

    it('should query documents by status', async () => {
      const docs: Document[] = [
        { id: 'doc-draft', title: 'Draft Doc', status: 'draft', created_at: new Date().toISOString(), updated_at: '' },
        { id: 'doc-readonly', title: 'Readonly Doc', status: 'readonly', created_at: new Date().toISOString(), updated_at: '' }
      ]

      await db.documents.bulkAdd(docs)
      
      const draftDocs = await db.documents.where('status').equals('draft').toArray()
      const readonlyDocs = await db.documents.where('status').equals('readonly').toArray()
      
      expect(draftDocs).toHaveLength(1)
      expect(readonlyDocs).toHaveLength(1)
      expect(draftDocs[0].id).toBe('doc-draft')
      expect(readonlyDocs[0].id).toBe('doc-readonly')
    })
  })

  describe('Clauses table', () => {
    beforeEach(async () => {
      // Create a test document first
      const doc: Document = {
        id: 'test-doc',
        title: 'Test Document',
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: ''
      }
      await db.documents.add(doc)
    })

    it('should create and retrieve clauses', async () => {
      const clause: Clause = {
        id: 'clause-1',
        document_id: 'test-doc',
        order_index: 0,
        title: 'First Clause',
        body: 'This is the first clause body',
        hash: 'hash-1',
        updated_at: ''
      }

      await db.clauses.add(clause)
      const saved = await db.clauses.get('clause-1')
      
      expect(saved).toBeDefined()
      expect(saved!.title).toBe('First Clause')
      expect(saved!.updated_at).toBeTruthy()
    })

    it('should query clauses by document_id and order', async () => {
      const clauses: Clause[] = [
        { id: 'c1', document_id: 'test-doc', order_index: 0, title: 'First', body: 'Body 1', hash: 'h1', updated_at: '' },
        { id: 'c2', document_id: 'test-doc', order_index: 1, title: 'Second', body: 'Body 2', hash: 'h2', updated_at: '' },
        { id: 'c3', document_id: 'other-doc', order_index: 0, title: 'Other', body: 'Body 3', hash: 'h3', updated_at: '' }
      ]

      await db.clauses.bulkAdd(clauses)
      
      const testDocClauses = await db.clauses
        .where('document_id')
        .equals('test-doc')
        .sortBy('order_index')
      
      expect(testDocClauses).toHaveLength(2)
      expect(testDocClauses[0].title).toBe('First')
      expect(testDocClauses[1].title).toBe('Second')
    })

    it('should use compound index for document_id + order_index', async () => {
      const clauses: Clause[] = [
        { id: 'c1', document_id: 'doc1', order_index: 0, title: 'D1C1', body: 'Body', hash: 'h1', updated_at: '' },
        { id: 'c2', document_id: 'doc1', order_index: 1, title: 'D1C2', body: 'Body', hash: 'h2', updated_at: '' },
        { id: 'c3', document_id: 'doc2', order_index: 0, title: 'D2C1', body: 'Body', hash: 'h3', updated_at: '' }
      ]

      await db.clauses.bulkAdd(clauses)
      
      const result = await db.clauses
        .where('[document_id+order_index]')
        .equals(['doc1', 1])
        .toArray()
      
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('D1C2')
    })
  })

  describe('ClauseIndex table', () => {
    it('should create and retrieve clause indexes', async () => {
      const index: ClauseIndex = {
        id: 'idx-1',
        clause_id: 'clause-1',
        start_offset: 0,
        end_offset: 100,
        summary: 'This clause covers payment terms'
      }

      await db.clause_index.add(index)
      const saved = await db.clause_index.get('idx-1')
      
      expect(saved).toBeDefined()
      expect(saved!.summary).toBe('This clause covers payment terms')
      expect(saved!.start_offset).toBe(0)
      expect(saved!.end_offset).toBe(100)
    })

    it('should query indexes by clause_id', async () => {
      const indexes: ClauseIndex[] = [
        { id: 'idx-1', clause_id: 'clause-1', start_offset: 0, end_offset: 50, summary: 'First part' },
        { id: 'idx-2', clause_id: 'clause-1', start_offset: 51, end_offset: 100, summary: 'Second part' },
        { id: 'idx-3', clause_id: 'clause-2', start_offset: 0, end_offset: 75, summary: 'Other clause' }
      ]

      await db.clause_index.bulkAdd(indexes)
      
      const clause1Indexes = await db.clause_index
        .where('clause_id')
        .equals('clause-1')
        .toArray()
      
      expect(clause1Indexes).toHaveLength(2)
      expect(clause1Indexes.map(i => i.summary)).toContain('First part')
      expect(clause1Indexes.map(i => i.summary)).toContain('Second part')
    })
  })

  describe('AI Edits table', () => {
    it('should create and retrieve AI edits', async () => {
      const edit: AiEdit = {
        id: 'edit-1',
        document_id: 'doc-1',
        clause_id: 'clause-1',
        diff: '+ Added new text\n- Removed old text',
        applied_by: 'ai',
        created_at: new Date().toISOString()
      }

      await db.ai_edits.add(edit)
      const saved = await db.ai_edits.get('edit-1')
      
      expect(saved).toBeDefined()
      expect(saved!.applied_by).toBe('ai')
      expect(saved!.diff).toContain('Added new text')
    })

    it('should query edits by document and creation date', async () => {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      
      const edits: AiEdit[] = [
        { id: 'e1', document_id: 'doc-1', clause_id: null, diff: 'diff1', applied_by: 'user', created_at: yesterday.toISOString() },
        { id: 'e2', document_id: 'doc-1', clause_id: 'c1', diff: 'diff2', applied_by: 'ai', created_at: now.toISOString() },
        { id: 'e3', document_id: 'doc-2', clause_id: 'c2', diff: 'diff3', applied_by: 'ai', created_at: now.toISOString() }
      ]

      await db.ai_edits.bulkAdd(edits)
      
      const doc1Edits = await db.ai_edits
        .where('document_id')
        .equals('doc-1')
        .reverse()
        .sortBy('created_at')
      
      expect(doc1Edits).toHaveLength(2)
      expect(doc1Edits[0].id).toBe('e2') // Most recent first
    })
  })

  describe('Chat Messages table', () => {
    it('should create and retrieve chat messages', async () => {
      const message: ChatMsg = {
        id: 'msg-1',
        document_id: 'doc-1',
        role: 'user',
        content: 'Please improve this clause',
        created_at: new Date().toISOString()
      }

      await db.chat_messages.add(message)
      const saved = await db.chat_messages.get('msg-1')
      
      expect(saved).toBeDefined()
      expect(saved!.role).toBe('user')
      expect(saved!.content).toBe('Please improve this clause')
    })

    it('should maintain conversation order by created_at', async () => {
      const messages: ChatMsg[] = [
        { id: 'm1', document_id: 'doc-1', role: 'user', content: 'Question', created_at: '2024-01-01T10:00:00Z' },
        { id: 'm2', document_id: 'doc-1', role: 'assistant', content: 'Answer', created_at: '2024-01-01T10:01:00Z' },
        { id: 'm3', document_id: 'doc-1', role: 'user', content: 'Follow-up', created_at: '2024-01-01T10:02:00Z' }
      ]

      await db.chat_messages.bulkAdd(messages)
      
      const conversation = await db.chat_messages
        .where('document_id')
        .equals('doc-1')
        .sortBy('created_at')
      
      expect(conversation).toHaveLength(3)
      expect(conversation[0].role).toBe('user')
      expect(conversation[1].role).toBe('assistant')
      expect(conversation[2].role).toBe('user')
    })
  })

  describe('Autocomplete Cache table', () => {
    it('should cache autocomplete suggestions', async () => {
      const cache: AutocompleteCache = {
        id: 'cache-1',
        clause_id: 'clause-1',
        suggestion: 'The party agrees to...',
        created_at: new Date().toISOString()
      }

      await db.autocomplete_cache.add(cache)
      const saved = await db.autocomplete_cache.get('cache-1')
      
      expect(saved).toBeDefined()
      expect(saved!.suggestion).toBe('The party agrees to...')
    })

    it('should handle global suggestions with null clause_id', async () => {
      const suggestions: AutocompleteCache[] = [
        { id: 'c1', clause_id: 'clause-1', suggestion: 'Specific suggestion', created_at: new Date().toISOString() },
        { id: 'c2', clause_id: null, suggestion: 'Global suggestion', created_at: new Date().toISOString() }
      ]

      await db.autocomplete_cache.bulkAdd(suggestions)
      
      const globalSuggestions = await db.autocomplete_cache
        .filter(item => item.clause_id === null)
        .toArray()
      
      expect(globalSuggestions).toHaveLength(1)
      expect(globalSuggestions[0].suggestion).toBe('Global suggestion')
    })
  })

  describe('Flags table', () => {
    it('should manage usage flags', async () => {
      const flags: Flags = {
        id: 'usage',
        free_ai_used: false,
        guest_id: 'guest-123',
        feature_unlocked: ['basic_editor'],
        updated_at: ''
      }

      await db.flags.add(flags)
      const saved = await db.flags.get('usage')
      
      expect(saved).toBeDefined()
      expect(saved!.free_ai_used).toBe(false)
      expect(saved!.guest_id).toBe('guest-123')
      expect(saved!.feature_unlocked).toContain('basic_editor')
      expect(saved!.updated_at).toBeTruthy()
    })

    it('should update flags and maintain updated_at', async () => {
      const flags: Flags = {
        id: 'usage',
        free_ai_used: false,
        guest_id: 'guest-123',
        feature_unlocked: [],
        updated_at: ''
      }

      await db.flags.add(flags)
      const original = await db.flags.get('usage')
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      await db.flags.update('usage', { 
        free_ai_used: true, 
        feature_unlocked: ['premium_ai'] 
      })
      
      const updated = await db.flags.get('usage')
      
      expect(updated!.free_ai_used).toBe(true)
      expect(updated!.feature_unlocked).toContain('premium_ai')
      expect(updated!.updated_at).toBeTruthy()
      expect(new Date(updated!.updated_at).getTime()).toBeGreaterThanOrEqual(new Date(original!.updated_at).getTime())
    })
  })

  describe('Outbox table', () => {
    it('should queue operations for sync', async () => {
      const operation: Outbox = {
        id: 'op-1',
        table: 'documents',
        op: 'upsert',
        payload: { id: 'doc-1', title: 'Test Doc' },
        updated_at: new Date().toISOString()
      }

      await db.outbox.add(operation)
      const saved = await db.outbox.get('op-1')
      
      expect(saved).toBeDefined()
      expect(saved!.table).toBe('documents')
      expect(saved!.op).toBe('upsert')
      expect(saved!.payload.title).toBe('Test Doc')
    })

    it('should process outbox operations in order', async () => {
      const operations: Outbox[] = [
        { id: 'op1', table: 'documents', op: 'upsert', payload: {}, updated_at: '2024-01-01T10:00:00Z' },
        { id: 'op2', table: 'clauses', op: 'delete', payload: {}, updated_at: '2024-01-01T10:01:00Z' },
        { id: 'op3', table: 'documents', op: 'upsert', payload: {}, updated_at: '2024-01-01T09:59:00Z' }
      ]

      await db.outbox.bulkAdd(operations)
      
      const orderedOps = await db.outbox.orderBy('updated_at').toArray()
      
      expect(orderedOps).toHaveLength(3)
      expect(orderedOps[0].id).toBe('op3') // Oldest first
      expect(orderedOps[1].id).toBe('op1')
      expect(orderedOps[2].id).toBe('op2')
    })
  })

  describe('Database lifecycle', () => {
    it('should clear all data', async () => {
      // Add some data to multiple tables
      await db.documents.add({ id: 'doc', title: 'Test', status: 'draft', created_at: new Date().toISOString(), updated_at: '' })
      await db.clauses.add({ id: 'clause', document_id: 'doc', order_index: 0, title: 'Test', body: 'Body', hash: 'hash', updated_at: '' })
      await db.flags.add({ id: 'usage', free_ai_used: false, guest_id: 'guest', feature_unlocked: [], updated_at: '' })
      
      // Verify data exists
      expect(await db.documents.count()).toBe(1)
      expect(await db.clauses.count()).toBe(1)
      expect(await db.flags.count()).toBe(1)
      
      // Clear all data
      await db.transaction('rw', db.tables, () => {
        db.tables.forEach(table => table.clear())
      })
      
      // Verify all tables are empty
      expect(await db.documents.count()).toBe(0)
      expect(await db.clauses.count()).toBe(0)
      expect(await db.flags.count()).toBe(0)
    })
  })
})