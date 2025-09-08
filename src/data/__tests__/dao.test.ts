import { upsertDocument, getDocument, deleteDocument, upsertClauses, getClausesByDocument, debounced } from '../dao'
import { db, type Document, type Clause } from '../db'
import 'fake-indexeddb/auto'

describe('DAO Operations', () => {
  beforeEach(async () => {
    await db.open()
    await db.clearAllData()
  })

  afterEach(async () => {
    await db.close()
  })

  describe('Document operations', () => {
    it('should upsert a new document', async () => {
      const docData = {
        id: 'test-doc-1',
        title: 'Test Document',
        status: 'draft' as const,
        created_at: new Date().toISOString()
      }

      const result = await upsertDocument(docData)

      expect(result.id).toBe('test-doc-1')
      expect(result.title).toBe('Test Document')
      expect(result.updated_at).toBeDefined()

      // Verify it was saved to database
      const savedDoc = await db.documents.get('test-doc-1')
      expect(savedDoc).toBeDefined()
      expect(savedDoc?.title).toBe('Test Document')
    })

    it('should update existing document', async () => {
      // Create initial document
      const initialDoc = {
        id: 'test-doc-2',
        title: 'Original Title',
        status: 'draft' as const,
        created_at: new Date().toISOString()
      }

      await upsertDocument(initialDoc)
      const originalDoc = await getDocument('test-doc-2')

      // Update document
      const updatedDoc = await upsertDocument({
        ...initialDoc,
        title: 'Updated Title'
      })

      expect(updatedDoc.title).toBe('Updated Title')
      expect(updatedDoc.updated_at).not.toBe(originalDoc?.updated_at)
    })

    it('should get document by id', async () => {
      const docData = {
        id: 'test-doc-3',
        title: 'Get Test Document',
        status: 'readonly' as const,
        created_at: new Date().toISOString()
      }

      await upsertDocument(docData)
      const retrievedDoc = await getDocument('test-doc-3')

      expect(retrievedDoc).toBeDefined()
      expect(retrievedDoc?.title).toBe('Get Test Document')
      expect(retrievedDoc?.status).toBe('readonly')
    })

    it('should return null for non-existent document', async () => {
      const result = await getDocument('non-existent-id')
      expect(result).toBeUndefined()
    })

    it('should delete document', async () => {
      const docData = {
        id: 'test-doc-4',
        title: 'To Delete',
        status: 'draft' as const,
        created_at: new Date().toISOString()
      }

      await upsertDocument(docData)
      await deleteDocument('test-doc-4')

      const deletedDoc = await getDocument('test-doc-4')
      expect(deletedDoc).toBeUndefined()
    })
  })

  describe('Clause operations', () => {
    beforeEach(async () => {
      // Create a test document first
      await upsertDocument({
        id: 'test-doc-clauses',
        title: 'Document with Clauses',
        status: 'draft',
        created_at: new Date().toISOString()
      })
    })

    it('should upsert a new clause', async () => {
      const clauseData = {
        id: 'test-clause-1',
        document_id: 'test-doc-clauses',
        order_index: 0,
        title: 'Test Clause',
        body: 'This is a test clause body',
        hash: 'test-hash-1'
      }

      const result = await upsertClauses([clauseData])

      expect(result[0].id).toBe('test-clause-1')
      expect(result[0].title).toBe('Test Clause')
      expect(result[0].updated_at).toBeDefined()

      // Verify it was saved to database
      const savedClause = await db.clauses.get('test-clause-1')
      expect(savedClause).toBeDefined()
      expect(savedClause?.body).toBe('This is a test clause body')
    })

    it('should get clauses by document id', async () => {
      const clauses = [
        {
          id: 'clause-1',
          document_id: 'test-doc-clauses',
          order_index: 0,
          title: 'First Clause',
          body: 'First clause body',
          hash: 'hash-1'
        },
        {
          id: 'clause-2',
          document_id: 'test-doc-clauses',
          order_index: 1,
          title: 'Second Clause',
          body: 'Second clause body',
          hash: 'hash-2'
        },
        {
          id: 'clause-3',
          document_id: 'other-doc',
          order_index: 0,
          title: 'Other Clause',
          body: 'Other clause body',
          hash: 'hash-3'
        }
      ]

      // Insert all clauses
      await upsertClauses(clauses)

      const documentClauses = await getClausesByDocument('test-doc-clauses')

      expect(documentClauses).toHaveLength(2)
      expect(documentClauses[0].order_index).toBe(0)
      expect(documentClauses[1].order_index).toBe(1)
      expect(documentClauses.map(c => c.title)).toEqual(['First Clause', 'Second Clause'])
    })

    it('should return empty array for document with no clauses', async () => {
      const clauses = await getClausesByDocument('test-doc-clauses')
      expect(clauses).toEqual([])
    })
  })

  describe('Debounced function', () => {
    it('should debounce function calls', async () => {
      let callCount = 0
      const mockFn = jest.fn(async (value: string) => {
        callCount++
        return `processed-${value}`
      })

      const debouncedFn = debounced(mockFn, 50)

      // Fazer múltiplas chamadas rapidamente
      debouncedFn('test1')
      debouncedFn('test2')
      debouncedFn('test3')

      // Aguardar o debounce
      await new Promise(resolve => setTimeout(resolve, 100))

      // Deve ter sido chamado apenas uma vez com o último valor
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('test3')
      expect(callCount).toBe(1)
    }, 10000)

    it('should handle errors in debounced function', async () => {
      const mockFn = jest.fn(async () => {
        throw new Error('Test error')
      })

      const debouncedFn = debounced(mockFn, 50)

      await expect(debouncedFn()).rejects.toThrow('Test error')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('Outbox operations', () => {
    it('should enqueue operations for sync', async () => {
      const docData = {
        id: 'test-doc-outbox',
        title: 'Outbox Test',
        status: 'draft' as const,
        created_at: new Date().toISOString()
      }

      await upsertDocument(docData)

      // Check if outbox entry was created
      const outboxEntries = await db.outbox.toArray()
      expect(outboxEntries.length).toBeGreaterThan(0)

      const docEntry = outboxEntries.find(entry => 
        entry.table === 'documents' && 
        entry.op === 'upsert' &&
        entry.payload.id === 'test-doc-outbox'
      )

      expect(docEntry).toBeDefined()
      expect(docEntry?.payload.title).toBe('Outbox Test')
    })
  })
})