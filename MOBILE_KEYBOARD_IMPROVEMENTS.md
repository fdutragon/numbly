# Melhorias para Teclado Mobile - Dispositivos Antigos

## Problema Identificado

O teclado virtual em celulares antigos estava cobrindo o input de texto, tornando impossível ver o que estava sendo digitado.

## Soluções Implementadas

### 1. Detecção de Viewport e Teclado

- **Arquivo**: `src/components/chat/chat.tsx`
- **Funcionalidade**: Detecta quando a altura da viewport diminui significativamente (>150px), indicando que o teclado está aberto
- **Estados adicionados**:
  - `keyboardHeight`: Altura do teclado em pixels
  - `isKeyboardOpen`: Boolean indicando se o teclado está aberto
  - `viewportHeight`: Altura atual da viewport
  - `initialViewportHeight`: Altura inicial da viewport

### 2. Ajuste Dinâmico do Layout

- **Container principal**: Ajusta altura para `viewportHeight` quando teclado está aberto
- **Área de mensagens**: Reduz altura para `calc(${viewportHeight}px - 160px)` quando teclado aberto
- **Input fixo**: Move para cima pela altura do teclado usando `bottom: ${keyboardHeight}px`

### 3. Scroll Inteligente

- **Auto-scroll**: Quando o teclado abre, automaticamente faz scroll para o input
- **Fallback**: Implementa scroll manual para dispositivos muito antigos
- **Timing**: Usa timeouts apropriados para aguardar animações de teclado

### 4. Melhorias no Input

- **Arquivo**: `src/components/chat/chat-input.tsx`
- **Detecção de dispositivo**: Identifica dispositivos móveis antigos
- **Blur forçado**: Força o fechamento do teclado após envio
- **Scroll para input**: Garante que o input fique visível quando focado

### 5. CSS Otimizado

- **Arquivo**: `src/app/globals.css`
- **Viewport real**: Usa --vh CSS variable para altura real da viewport
- **Acelerar hardware**: Usa transform3d para performance
- **Safari específico**: Tratamento especial para Safari mobile

### 6. Script de Viewport

- **Arquivo**: `src/app/layout.tsx`
- **Execução**: Roda no carregamento da página e em redimensionamentos
- **Funcionalidade**: Atualiza --vh CSS variable com altura real da viewport

## Eventos Monitorados

### Window Events

- `resize`: Detecta mudanças na viewport
- `orientationchange`: Detecta rotação do dispositivo

### Visual Viewport API

- Para navegadores modernos que suportam
- Detecta mudanças na área visível (excluindo teclado)

## Compatibilidade

### Dispositivos Suportados

- ✅ iPhone iOS 9+
- ✅ Android 4.0+
- ✅ Navegadores antigos
- ✅ Safari mobile
- ✅ Chrome mobile

### Fallbacks Implementados

- Scroll manual quando scrollIntoView falha
- Detecção de UserAgent para dispositivos específicos
- Múltiplas tentativas de blur do teclado
- Timeouts ajustáveis para diferentes velocidades de dispositivo

## Como Funciona

1. **Inicialização**: Salva altura inicial da viewport
2. **Detecção**: Monitora mudanças na altura da viewport
3. **Ativação**: Quando altura reduz >150px, considera teclado aberto
4. **Ajuste**: Modifica layout para compensar o teclado
5. **Scroll**: Garante que input permaneça visível
6. **Cleanup**: Restaura layout quando teclado fecha

## Testado Em

- iPhone 6 (iOS 12)
- Samsung Galaxy S5 (Android 6.0)
- Motorola Moto G (Android 5.1)
- LG K10 (Android 7.0)

## Melhorias de Performance

- Uso de `transform3d` para aceleração por hardware
- Timeouts otimizados para diferentes velocidades
- Throttling de eventos de resize
- Lazy loading de scroll listeners
