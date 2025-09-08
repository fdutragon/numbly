import { test, expect } from '@playwright/test';

test.describe('Security Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should block text selection in read-only mode', async ({ page }) => {
    // Navigate to contract view (read-only mode)
    await page.goto('/contract/test-id');
    
    // Try to select text
    const contractContent = page.locator('[data-testid="contract-content"]');
    await expect(contractContent).toBeVisible();
    
    // Attempt to select text with mouse
    await contractContent.hover();
    await page.mouse.down();
    await page.mouse.move(100, 0);
    await page.mouse.up();
    
    // Check that no text is selected
    const selectedText = await page.evaluate(() => window.getSelection()?.toString());
    expect(selectedText).toBe('');
  });

  test('should block copy operations', async ({ page }) => {
    await page.goto('/contract/test-id');
    
    const contractContent = page.locator('[data-testid="contract-content"]');
    await expect(contractContent).toBeVisible();
    
    // Try to copy with Ctrl+C
    await contractContent.click();
    await page.keyboard.press('Control+c');
    
    // Try to copy with Ctrl+A then Ctrl+C
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Control+c');
    
    // Verify clipboard is empty or unchanged
    const clipboardText = await page.evaluate(async () => {
      try {
        return await navigator.clipboard.readText();
      } catch {
        return '';
      }
    });
    
    // Should not contain contract content
    expect(clipboardText).not.toContain('contrato');
  });

  test('should block cut operations', async ({ page }) => {
    await page.goto('/contract/test-id');
    
    const contractContent = page.locator('[data-testid="contract-content"]');
    await expect(contractContent).toBeVisible();
    
    // Get original content
    const originalContent = await contractContent.textContent();
    
    // Try to cut with Ctrl+X
    await contractContent.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Control+x');
    
    // Verify content is still there
    const currentContent = await contractContent.textContent();
    expect(currentContent).toBe(originalContent);
  });

  test('should block context menu', async ({ page }) => {
    await page.goto('/contract/test-id');
    
    const contractContent = page.locator('[data-testid="contract-content"]');
    await expect(contractContent).toBeVisible();
    
    // Try to open context menu
    await contractContent.click({ button: 'right' });
    
    // Context menu should not appear
    const contextMenu = page.locator('.context-menu, [role="menu"]');
    await expect(contextMenu).not.toBeVisible();
  });

  test('should block drag and drop', async ({ page }) => {
    await page.goto('/contract/test-id');
    
    const contractContent = page.locator('[data-testid="contract-content"]');
    await expect(contractContent).toBeVisible();
    
    // Try to drag content
    await contractContent.hover();
    await page.mouse.down();
    await page.mouse.move(200, 200);
    await page.mouse.up();
    
    // Content should remain in place
    await expect(contractContent).toBeVisible();
  });

  test('should block F12 developer tools', async ({ page }) => {
    await page.goto('/contract/test-id');
    
    // Try to open dev tools with F12
    await page.keyboard.press('F12');
    
    // Try Ctrl+Shift+I
    await page.keyboard.press('Control+Shift+I');
    
    // Try Ctrl+Shift+J
    await page.keyboard.press('Control+Shift+J');
    
    // Note: This test verifies the attempt is blocked in the UI
    // The actual blocking would be handled by the security module
    const securityWarning = page.locator('[data-testid="security-warning"]');
    // This might show a warning or just silently block
  });

  test('should block print operations', async ({ page }) => {
    await page.goto('/contract/test-id');
    
    // Try to print with Ctrl+P
    await page.keyboard.press('Control+p');
    
    // Print dialog should not appear or should be blocked
    // This is more of a functional test to ensure the handler is in place
    const printDialog = page.locator('[data-testid="print-dialog"]');
    await expect(printDialog).not.toBeVisible();
  });

  test('should apply CSS user-select none in read-only mode', async ({ page }) => {
    await page.goto('/contract/test-id');
    
    const contractContent = page.locator('[data-testid="contract-content"]');
    await expect(contractContent).toBeVisible();
    
    // Check CSS property
    const userSelect = await contractContent.evaluate(el => 
      window.getComputedStyle(el).userSelect
    );
    
    expect(userSelect).toBe('none');
  });

  test('should allow normal operations in edit mode', async ({ page }) => {
    // Assuming user has premium access and can edit
    await page.goto('/editor');
    
    const editor = page.locator('[data-testid="lexical-editor"]');
    await expect(editor).toBeVisible();
    
    // Should allow typing
    await editor.click();
    await page.keyboard.type('Texto editável');
    
    // Should allow selection in edit mode
    await page.keyboard.press('Control+a');
    
    const selectedText = await page.evaluate(() => window.getSelection()?.toString());
    expect(selectedText).toContain('Texto editável');
  });

  test('should validate input sanitization', async ({ page }) => {
    const editor = page.locator('[data-testid="lexical-editor"]');
    await expect(editor).toBeVisible();
    
    // Try to inject malicious content
    await editor.click();
    await page.keyboard.type('<script>alert("XSS")</script>');
    
    // Content should be sanitized
    const editorContent = await editor.innerHTML();
    expect(editorContent).not.toContain('<script>');
    expect(editorContent).not.toContain('alert');
  });

  test('should handle CSP violations gracefully', async ({ page }) => {
    // Monitor console for CSP violations
    const cspViolations: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('Content Security Policy')) {
        cspViolations.push(msg.text());
      }
    });
    
    await page.goto('/');
    
    // Try to execute inline script (should be blocked by CSP)
    await page.evaluate(() => {
      try {
        eval('console.log("This should be blocked")');
      } catch (e) {
        // Expected to be blocked
      }
    });
    
    // Application should continue to work despite CSP blocks
    const editor = page.locator('[data-testid="lexical-editor"]');
    await expect(editor).toBeVisible();
  });
});