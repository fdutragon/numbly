import { AppDB, type Document, type Clause } from '../db'
import 'fake-indexeddb/auto'

describe('AppDB', () => {
  let db: AppDB

  beforeEach(async () => {
    // Create a new database instance for each test
    db = new AppDB()
    await db.open()
    await db.clearAllData()
  })

  afterEach(async () => {
    await db.close()
  })

  describe('Document operations', () => {
    it('should create a document with auto-generated timestamps', async () => {
      const doc: Omit<Document, 'updated_at'> = {
        id: 'test-doc-1',
        title: 'Test Document',
        status: 'draft',
        created_at: new Date().toISOString()
      }

      await db.documents.add(doc as Document)
      const savedDoc = await db.documents.get('test-doc-1')

      expect(savedDoc).toBeDefined()
      expect(savedDoc?.title).toBe('Test Document')
      expect(savedDoc?.status).toBe('draft')
      expect(savedDoc?.updated_at).toBeDefined()
    })

    it('should update document with new timestamp', async () => {
      const doc: Document = {
        id: 'test-doc-2',
        title: 'Original Title',
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await db.documents.add(doc)
      const originalUpdatedAt = doc.updated_at

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10))

      await db.documents.update('test-doc-2', { title: 'Updated Title' })
      const updatedDoc = await db.documents.get('test-doc-2')

      expect(updatedDoc?.title).toBe('Updated Title')
      expect(updatedDoc?.updated_at).not.toBe(originalUpdatedAt)
    })

    it('should delete document', async () => {
      const doc: Document = {
        id: 'test-doc-3',
        title: 'To Delete',
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await db.documents.add(doc)
      await db.documents.delete('test-doc-3')
      const deletedDoc = await db.documents.get('test-doc-3')

      expect(deletedDoc).toBeUndefined()
    })
  })

  describe('Clause operations', () => {
    it('should create clause with auto-generated timestamps', async () => {
      const clause: Omit<Clause, 'updated_at'> = {
        id: 'test-clause-1',
        document_id: 'test-doc-1',
        order_index: 0,
        title: 'Test Clause',
        body: 'This is a test clause body',
        hash: 'test-hash'
      }

      await db.clauses.add(clause as Clause)
      const savedClause = await db.clauses.get('test-clause-1')

      expect(savedClause).toBeDefined()
      expect(savedClause?.title).toBe('Test Clause')
      expect(savedClause?.body).toBe('This is a test clause body')
      expect(savedClause?.updated_at).toBeDefined()
    })

    it('should get clauses by document_id', async () => {
      const clauses: Clause[] = [
        {
          id: 'clause-1',
          document_id: 'doc-1',
          order_index: 0,
          title: 'Clause 1',
          body: 'Body 1',
          hash: 'hash-1',
          updated_at: new Date().toISOString()
        },
        {
          id: 'clause-2',
          document_id: 'doc-1',
          order_index: 1,
          title: 'Clause 2',
          body: 'Body 2',
          hash: 'hash-2',
          updated_at: new Date().toISOString()
        },
        {
          id: 'clause-3',
          document_id: 'doc-2',
          order_index: 0,
          title: 'Clause 3',
          body: 'Body 3',
          hash: 'hash-3',
          updated_at: new Date().toISOString()
        }
      ]

      await db.clauses.bulkAdd(clauses)
      const doc1Clauses = await db.clauses.where('document_id').equals('doc-1').toArray()

      expect(doc1Clauses).toHaveLength(2)
      expect(doc1Clauses.map(c => c.title)).toEqual(['Clause 1', 'Clause 2'])
    })
  })

  describe('Flags operations', () => {
    it('should initialize default flags', async () => {
      await db.initializeDefaults()
      const flags = await db.flags.get('usage')

      expect(flags).toBeDefined()
      expect(flags?.free_ai_used).toBe(false)
      expect(flags?.guest_id).toBeDefined()
      expect(flags?.feature_unlocked).toEqual([])
      expect(flags?.updated_at).toBeDefined()
    })

    it('should not overwrite existing flags', async () => {
      // First initialization
      await db.initializeDefaults()
      const originalFlags = await db.flags.get('usage')
      
      // Update flags
      await db.flags.update('usage', { free_ai_used: true })
      
      // Second initialization should not overwrite
      await db.initializeDefaults()
      const updatedFlags = await db.flags.get('usage')

      expect(updatedFlags?.free_ai_used).toBe(true)
      expect(updatedFlags?.guest_id).toBe(originalFlags?.guest_id)
    })
  })

  describe('Transaction operations', () => {
    it('should handle transaction rollback on error', async () => {
      const doc: Document = {
        id: 'test-doc-tx',
        title: 'Transaction Test',
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      try {
        await db.transaction('rw', [db.documents, db.clauses], async () => {
          await db.documents.add(doc)
          // Force an error
          throw new Error('Transaction error')
        })
      } catch (error) {
        // Expected error
      }

      const savedDoc = await db.documents.get('test-doc-tx')
      expect(savedDoc).toBeUndefined()
    })
  })
})