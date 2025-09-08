import { test, expect } from '@playwright/test';

test.describe('AI and Paywall Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear any existing data
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should provide autocomplete suggestions', async ({ page }) => {
    // Type in the editor to trigger autocomplete
    await page.fill('[data-testid="editor-input"]', 'Este contrato de');
    
    // Wait for autocomplete suggestion to appear
    await expect(page.locator('[data-testid="autocomplete-ghost"]')).toBeVisible({ timeout: 5000 });
    
    // Verify suggestion content is relevant
    const suggestion = await page.locator('[data-testid="autocomplete-ghost"]').textContent();
    expect(suggestion).toBeTruthy();
  });

  test('should allow one free AI edit', async ({ page }) => {
    // Generate a contract first
    await page.fill('[data-testid="editor-input"]', 'Contrato de prestação de serviços entre as partes');
    await page.click('[data-testid="generate-contract"]');
    
    // Wait for contract generation
    await expect(page.locator('[data-testid="contract-viewer"]')).toBeVisible();
    
    // Try to edit a clause with AI
    await page.click('[data-testid="clause-menu"]');
    await page.click('[data-testid="improve-clause"]');
    
    // Should allow the first edit
    await expect(page.locator('[data-testid="ai-edit-applied"]')).toBeVisible({ timeout: 10000 });
    
    // Verify free edit was used
    const freeEditsUsed = await page.evaluate(() => {
      return localStorage.getItem('ai_edits_used');
    });
    expect(freeEditsUsed).toBe('1');
  });

  test('should show paywall after free AI edit is used', async ({ page }) => {
    // Set up state where free edit is already used
    await page.evaluate(() => {
      localStorage.setItem('ai_edits_used', '1');
    });
    
    // Generate a contract
    await page.fill('[data-testid="editor-input"]', 'Contrato de prestação de serviços');
    await page.click('[data-testid="generate-contract"]');
    
    await expect(page.locator('[data-testid="contract-viewer"]')).toBeVisible();
    
    // Try to edit a clause with AI
    await page.click('[data-testid="clause-menu"]');
    await page.click('[data-testid="improve-clause"]');
    
    // Should show paywall
    await expect(page.locator('[data-testid="paywall-modal"]')).toBeVisible();
    await expect(page.locator('text=Upgrade to Premium')).toBeVisible();
  });

  test('should allow unlimited AI edits for premium users', async ({ page }) => {
    // Set up premium user state
    await page.evaluate(() => {
      localStorage.setItem('user_subscription', 'premium');
      localStorage.setItem('ai_edits_used', '5');
    });
    
    // Generate a contract
    await page.fill('[data-testid="editor-input"]', 'Contrato de prestação de serviços');
    await page.click('[data-testid="generate-contract"]');
    
    await expect(page.locator('[data-testid="contract-viewer"]')).toBeVisible();
    
    // Try to edit a clause with AI
    await page.click('[data-testid="clause-menu"]');
    await page.click('[data-testid="improve-clause"]');
    
    // Should allow edit without paywall
    await expect(page.locator('[data-testid="ai-edit-applied"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="paywall-modal"]')).not.toBeVisible();
  });

  test('should handle AI API errors gracefully', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/ai/**', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'AI service unavailable' })
      });
    });
    
    // Try to use AI feature
    await page.fill('[data-testid="editor-input"]', 'Contrato de prestação de serviços');
    await page.click('[data-testid="generate-contract"]');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('text=Erro ao gerar contrato')).toBeVisible();
  });

  test('should track AI usage analytics', async ({ page }) => {
    let analyticsEvents = [];
    
    // Intercept analytics calls
    await page.route('**/api/analytics', route => {
      analyticsEvents.push(route.request().postDataJSON());
      route.fulfill({ status: 200, body: '{}' });
    });
    
    // Use AI feature
    await page.fill('[data-testid="editor-input"]', 'Contrato de prestação de serviços');
    await page.click('[data-testid="generate-contract"]');
    
    await expect(page.locator('[data-testid="contract-viewer"]')).toBeVisible();
    
    // Verify analytics event was sent
    expect(analyticsEvents).toHaveLength(1);
    expect(analyticsEvents[0]).toMatchObject({
      event: 'contract_generated',
      user_type: 'guest'
    });
  });

  test('should show upgrade flow when clicking paywall CTA', async ({ page }) => {
    // Set up state to trigger paywall
    await page.evaluate(() => {
      localStorage.setItem('ai_edits_used', '1');
    });
    
    // Generate contract and trigger paywall
    await page.fill('[data-testid="editor-input"]', 'Contrato de prestação de serviços');
    await page.click('[data-testid="generate-contract"]');
    await page.click('[data-testid="clause-menu"]');
    await page.click('[data-testid="improve-clause"]');
    
    // Click upgrade button
    await page.click('[data-testid="upgrade-button"]');
    
    // Should show pricing or redirect to payment
    await expect(page.locator('[data-testid="pricing-modal"]')).toBeVisible();
  });

  test('should handle subscription status changes', async ({ page }) => {
    // Start as free user
    await page.evaluate(() => {
      localStorage.setItem('user_subscription', 'free');
    });
    
    // Simulate subscription upgrade
    await page.evaluate(() => {
      localStorage.setItem('user_subscription', 'premium');
      window.dispatchEvent(new Event('subscription-changed'));
    });
    
    // Generate contract
    await page.fill('[data-testid="editor-input"]', 'Contrato de prestação de serviços');
    await page.click('[data-testid="generate-contract"]');
    
    // Should show premium features
    await expect(page.locator('[data-testid="premium-badge"]')).toBeVisible();
  });

  test('should implement rate limiting for AI requests', async ({ page }) => {
    let requestCount = 0;
    
    // Count AI requests
    await page.route('**/api/ai/**', route => {
      requestCount++;
      if (requestCount > 3) {
        route.fulfill({
          status: 429,
          body: JSON.stringify({ error: 'Rate limit exceeded' })
        });
      } else {
        route.continue();
      }
    });
    
    // Make multiple rapid requests
    for (let i = 0; i < 5; i++) {
      await page.fill('[data-testid="editor-input"]', `Contrato ${i}`);
      await page.click('[data-testid="generate-contract"]');
      await page.waitForTimeout(100);
    }
    
    // Should show rate limit message
    await expect(page.locator('text=Muitas solicitações')).toBeVisible();
  });
});