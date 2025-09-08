import { test, expect } from '@playwright/test';

test.describe('Editor Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the editor page
    await page.goto('/');
  });

  test('should load the editor page successfully', async ({ page }) => {
    // Check if the page loads without errors
    await expect(page).toHaveTitle(/Numbly/);
    
    // Check if the main editor container is present
    await expect(page.locator('[data-testid="editor-container"]')).toBeVisible();
  });

  test('should allow typing in the editor', async ({ page }) => {
    // Wait for the editor to be ready
    const editor = page.locator('[data-testid="lexical-editor"]');
    await expect(editor).toBeVisible();
    
    // Type some text
    await editor.click();
    await page.keyboard.type('Este é um contrato de prestação de serviços');
    
    // Verify the text appears in the editor
    await expect(editor).toContainText('Este é um contrato de prestação de serviços');
  });

  test('should show autocomplete suggestions', async ({ page }) => {
    // Mock the autocomplete API
    await page.route('**/api/autocomplete', async route => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
        body: 'data: {"content":" que estabelece os direitos e deveres"}\n\ndata: [DONE]\n\n'
      });
    });

    const editor = page.locator('[data-testid="lexical-editor"]');
    await expect(editor).toBeVisible();
    
    // Type text to trigger autocomplete
    await editor.click();
    await page.keyboard.type('Este contrato');
    
    // Wait for autocomplete suggestion to appear
    const suggestion = page.locator('[data-testid="autocomplete-suggestion"]');
    await expect(suggestion).toBeVisible({ timeout: 5000 });
  });

  test('should generate contract from input', async ({ page }) => {
    // Mock the contract generation API
    await page.route('**/api/generate-contract', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          contract: {
            id: 'test-contract-id',
            title: 'Contrato de Prestação de Serviços',
            clauses: [
              {
                id: 'clause-1',
                title: 'Das Partes',
                content: 'Este contrato é celebrado entre as partes...'
              }
            ]
          }
        })
      });
    });

    const editor = page.locator('[data-testid="lexical-editor"]');
    await expect(editor).toBeVisible();
    
    // Fill the initial form
    await editor.click();
    await page.keyboard.type('Contrato de prestação de serviços de desenvolvimento de software');
    
    // Submit to generate contract
    const generateButton = page.locator('[data-testid="generate-contract-btn"]');
    await generateButton.click();
    
    // Wait for contract to be generated and displayed
    await expect(page.locator('[data-testid="contract-viewer"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Das Partes')).toBeVisible();
  });

  test('should handle paywall for AI editing', async ({ page }) => {
    // Navigate to a contract view (assuming we have a contract)
    await page.goto('/contract/test-id');
    
    // Try to use AI editing feature
    const aiEditButton = page.locator('[data-testid="ai-edit-clause"]').first();
    await aiEditButton.click();
    
    // Should show paywall after first free edit
    const paywallModal = page.locator('[data-testid="paywall-modal"]');
    await expect(paywallModal).toBeVisible({ timeout: 5000 });
    
    // Check paywall content
    await expect(paywallModal).toContainText('Upgrade');
    await expect(paywallModal).toContainText('Premium');
  });

  test('should export contract to DOCX', async ({ page }) => {
    // Navigate to a contract view
    await page.goto('/contract/test-id');
    
    // Set up download promise before clicking
    const downloadPromise = page.waitForDownload();
    
    // Click export button
    const exportButton = page.locator('[data-testid="export-docx-btn"]');
    await exportButton.click();
    
    // Wait for download to complete
    const download = await downloadPromise;
    
    // Verify download properties
    expect(download.suggestedFilename()).toMatch(/\.docx$/);
  });

  test('should save document to IndexedDB', async ({ page }) => {
    const editor = page.locator('[data-testid="lexical-editor"]');
    await expect(editor).toBeVisible();
    
    // Type content
    await editor.click();
    await page.keyboard.type('Documento de teste para IndexedDB');
    
    // Wait for auto-save (assuming there's an auto-save indicator)
    await expect(page.locator('[data-testid="save-indicator"]')).toContainText('Salvo', { timeout: 5000 });
    
    // Refresh page to test persistence
    await page.reload();
    
    // Verify content is restored
    await expect(editor).toContainText('Documento de teste para IndexedDB');
  });

  test('should handle offline mode', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);
    
    const editor = page.locator('[data-testid="lexical-editor"]');
    await expect(editor).toBeVisible();
    
    // Should still be able to type and save locally
    await editor.click();
    await page.keyboard.type('Conteúdo offline');
    
    // Check offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    
    // Go back online
    await context.setOffline(false);
    
    // Should sync when back online
    await expect(page.locator('[data-testid="sync-indicator"]')).toContainText('Sincronizado', { timeout: 10000 });
  });
});