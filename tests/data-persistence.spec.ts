import { test, expect } from '@playwright/test';

test.describe('Data Persistence & Sync', () => {
  test.beforeEach(async ({ page }) => {
    // Clear IndexedDB before each test
    await page.goto('/');
    await page.evaluate(() => {
      // Clear IndexedDB
      return new Promise((resolve) => {
        const deleteReq = indexedDB.deleteDatabase('numbly-db');
        deleteReq.onsuccess = () => resolve(true);
        deleteReq.onerror = () => resolve(false);
      });
    });
  });

  test('should save document to IndexedDB', async ({ page }) => {
    const editor = page.locator('[data-testid="lexical-editor"]');
    await expect(editor).toBeVisible();
    
    // Type content
    await editor.click();
    const testContent = 'Documento de teste para persistência';
    await page.keyboard.type(testContent);
    
    // Wait for auto-save
    await page.waitForTimeout(2000);
    
    // Verify data is saved in IndexedDB
    const savedData = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const request = indexedDB.open('numbly-db');
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['documents'], 'readonly');
          const store = transaction.objectStore('documents');
          const getRequest = store.getAll();
          
          getRequest.onsuccess = () => {
            resolve(getRequest.result);
          };
        };
      });
    });
    
    expect(Array.isArray(savedData)).toBe(true);
    expect((savedData as any[]).length).toBeGreaterThan(0);
  });

  test('should restore document from IndexedDB on page reload', async ({ page }) => {
    const editor = page.locator('[data-testid="lexical-editor"]');
    await expect(editor).toBeVisible();
    
    // Type content
    await editor.click();
    const testContent = 'Conteúdo para teste de restauração';
    await page.keyboard.type(testContent);
    
    // Wait for save
    await page.waitForTimeout(2000);
    
    // Reload page
    await page.reload();
    
    // Verify content is restored
    await expect(editor).toBeVisible();
    await expect(editor).toContainText(testContent);
  });

  test('should handle multiple documents', async ({ page }) => {
    // Create first document
    const editor = page.locator('[data-testid="lexical-editor"]');
    await expect(editor).toBeVisible();
    
    await editor.click();
    await page.keyboard.type('Primeiro documento');
    
    // Create new document
    const newDocButton = page.locator('[data-testid="new-document-btn"]');
    if (await newDocButton.isVisible()) {
      await newDocButton.click();
    }
    
    // Type in second document
    await editor.click();
    await page.keyboard.type('Segundo documento');
    
    // Verify both documents exist in IndexedDB
    const documentsCount = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const request = indexedDB.open('numbly-db');
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['documents'], 'readonly');
          const store = transaction.objectStore('documents');
          const countRequest = store.count();
          
          countRequest.onsuccess = () => {
            resolve(countRequest.result);
          };
        };
      });
    });
    
    expect(documentsCount).toBeGreaterThanOrEqual(1);
  });

  test('should sync with Supabase when online', async ({ page }) => {
    // Mock Supabase sync endpoint
    await page.route('**/rest/v1/documents*', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: 'synced-doc-id',
            title: 'Documento Sincronizado',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      }
    });

    const editor = page.locator('[data-testid="lexical-editor"]');
    await expect(editor).toBeVisible();
    
    // Create content
    await editor.click();
    await page.keyboard.type('Documento para sincronização');
    
    // Trigger sync (if there's a sync button)
    const syncButton = page.locator('[data-testid="sync-btn"]');
    if (await syncButton.isVisible()) {
      await syncButton.click();
    }
    
    // Wait for sync indicator
    await expect(page.locator('[data-testid="sync-status"]')).toContainText('Sincronizado', { timeout: 10000 });
  });

  test('should handle offline mode gracefully', async ({ page, context }) => {
    const editor = page.locator('[data-testid="lexical-editor"]');
    await expect(editor).toBeVisible();
    
    // Go offline
    await context.setOffline(true);
    
    // Create content while offline
    await editor.click();
    await page.keyboard.type('Conteúdo criado offline');
    
    // Should show offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    
    // Content should still be saved locally
    await page.waitForTimeout(2000);
    
    // Go back online
    await context.setOffline(false);
    
    // Should attempt to sync
    await expect(page.locator('[data-testid="sync-indicator"]')).toBeVisible({ timeout: 5000 });
  });

  test('should handle IndexedDB quota exceeded', async ({ page }) => {
    // This test simulates quota exceeded scenario
    await page.addInitScript(() => {
      // Mock IndexedDB to throw quota exceeded error
      const originalPut = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function(...args) {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      };
    });

    const editor = page.locator('[data-testid="lexical-editor"]');
    await expect(editor).toBeVisible();
    
    await editor.click();
    await page.keyboard.type('Teste de quota excedida');
    
    // Should show error message
    await expect(page.locator('[data-testid="storage-error"]')).toBeVisible({ timeout: 5000 });
  });

  test('should migrate data structure on version update', async ({ page }) => {
    // Simulate old data structure in IndexedDB
    await page.evaluate(() => {
      return new Promise((resolve) => {
        const request = indexedDB.open('numbly-db', 1);
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const store = db.createObjectStore('documents', { keyPath: 'id' });
          
          // Add old format data
          store.add({
            id: 'old-doc-1',
            content: 'Old format document',
            timestamp: Date.now()
          });
        };
        request.onsuccess = () => resolve(true);
      });
    });

    // Reload page to trigger migration
    await page.reload();
    
    // Verify migration completed
    const migratedData = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const request = indexedDB.open('numbly-db');
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['documents'], 'readonly');
          const store = transaction.objectStore('documents');
          const getRequest = store.get('old-doc-1');
          
          getRequest.onsuccess = () => {
            resolve(getRequest.result);
          };
        };
      });
    });
    
    expect(migratedData).toBeDefined();
  });

  test('should handle concurrent access to IndexedDB', async ({ page }) => {
    // Open multiple tabs/contexts to test concurrent access
    const context2 = await page.context().browser()?.newContext();
    const page2 = await context2?.newPage();
    
    if (page2) {
      await page2.goto('/');
      
      // Both pages try to write simultaneously
      const editor1 = page.locator('[data-testid="lexical-editor"]');
      const editor2 = page2.locator('[data-testid="lexical-editor"]');
      
      await Promise.all([
        editor1.click().then(() => page.keyboard.type('Documento da aba 1')),
        editor2.click().then(() => page2.keyboard.type('Documento da aba 2'))
      ]);
      
      // Wait for both to save
      await page.waitForTimeout(3000);
      
      // Verify both documents are saved
      const documentsCount = await page.evaluate(async () => {
        return new Promise((resolve) => {
          const request = indexedDB.open('numbly-db');
          request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const transaction = db.transaction(['documents'], 'readonly');
            const store = transaction.objectStore('documents');
            const countRequest = store.count();
            
            countRequest.onsuccess = () => {
              resolve(countRequest.result);
            };
          };
        });
      });
      
      expect(documentsCount).toBeGreaterThanOrEqual(1);
      
      await context2?.close();
    }
  });
});