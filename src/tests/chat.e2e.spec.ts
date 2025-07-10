import { test, expect } from '@playwright/test';

// Teste E2E básico para o chat Donna IA

test.describe('Chat Donna IA', () => {
  test('fluxo de mensagem e resposta', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Aguarda o input do chat estar visível
    const input = page.locator('textarea, input[type="text"]');
    await expect(input).toBeVisible();

    // Envia uma mensagem
    await input.fill('Quero automatizar meu atendimento no WhatsApp');
    await input.press('Enter');

    // Aguarda resposta da IA
    const resposta = page.locator('.bg-gray-100, .dark\:bg-gray-800');
    await expect(resposta.first()).toBeVisible({ timeout: 10000 });
    await expect(resposta.first()).not.toHaveText('');
  });

  test('sugestão rápida', async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Aguarda botão de sugestão
    const sugestao = page.locator('button', { hasText: 'Quero contratar o plano Pro' });
    await expect(sugestao).toBeVisible();
    await sugestao.click();
    // Aguarda resposta
    const resposta = page.locator('.bg-gray-100, .dark\:bg-gray-800');
    await expect(resposta.first()).toBeVisible({ timeout: 10000 });
  });
});
