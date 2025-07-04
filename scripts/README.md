# Scripts de Teste para Push Notifications

Este diretório contém scripts Node.js para testar push notifications localmente, contornando as limitações do Next.js App Router.

## 🚀 Scripts Disponíveis

### 1. `setup-test-data.js`

Configura dados de teste no banco de dados.

```bash
node scripts/setup-test-data.js
```

**O que faz:**

- Cria usuário de teste (`teste@numbly.life`)
- Cria device de teste com IP local
- Mostra resumo dos dados configurados
- Lista devices ativos no banco

### 2. `test-push-local.js`

Testa envio de push notification simples.

```bash
# Usar primeira subscription ativa
node scripts/test-push-local.js

# Usar deviceId específico
node scripts/test-push-local.js uuid-do-device
```

**O que faz:**

- Busca subscription ativa no banco
- Envia push notification de teste
- Remove subscriptions expiradas automaticamente

### 3. `simulate-check-device.js`

Simula o fluxo completo do endpoint `/api/auth/check-device`.

```bash
# Usar primeiro device ativo
node scripts/simulate-check-device.js

# Usar deviceId específico
node scripts/simulate-check-device.js uuid-do-device
```

**O que faz:**

- Simula todo o fluxo de check-device
- Cria magic token para autenticação
- Busca devices por IP/subnet
- Envia push para todos devices relacionados
- Testa modo de push local (se configurado)

## 🔧 Configuração

### 1. Variáveis de Ambiente

Adicione ao seu `.env`:

```env
# VAPID Keys (obrigatórias)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_EMAIL=your-email@example.com

# Push de teste local (opcionais)
TEST_PUSH_DEVICE_ID=uuid-do-seu-device
TEST_PUSH_IP=127.0.0.1

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 2. Gerar VAPID Keys

```bash
npx web-push generate-vapid-keys
```

## 📱 Como Testar

### Passo 1: Configurar dados

```bash
node scripts/setup-test-data.js
```

### Passo 2: Configurar push subscription no browser

1. Acesse `http://localhost:3000`
2. Permita notificações quando solicitado
3. O deviceId será mostrado no console

### Passo 3: Testar push

```bash
# Teste simples
node scripts/test-push-local.js

# Simulação completa
node scripts/simulate-check-device.js
```

## 🐛 Troubleshooting

### Erro: "No subscription found"

- Execute `setup-test-data.js` primeiro
- Registre push notification no browser
- Verifique se `VAPID_*` estão configurados

### Erro: "Invalid VAPID keys"

- Gere novas keys: `npx web-push generate-vapid-keys`
- Atualize `.env` com as novas keys
- Reinicie o dev server

### Push não aparece

- Verifique se notificações estão habilitadas no browser
- Teste em uma aba separada (não na mesma do dev)
- Verifique o console para erros

## 📊 Logs Úteis

Os scripts mostram logs detalhados:

- ✅ Sucesso
- ❌ Erro
- ⚠️ Aviso
- 📱 Device/Push info
- 🔧 Configuração
- 📊 Resumo

## 🚀 Próximos Passos

Quando o Next.js resolver as limitações do App Router:

1. Mova a lógica dos scripts para `/src/lib/push.ts`
2. Importe no endpoint do App Router
3. Remove os scripts (se desejar)

Por enquanto, use estes scripts para desenvolvimento e teste local!
