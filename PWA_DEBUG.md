# PWA e Push Notifications - Debug Guide

## ✅ Status Atual

### O que está funcionando:
- ✅ **PWA básico**: Service Worker registrado
- ✅ **Notificações locais**: Via Service Worker  
- ✅ **VAPID Keys**: Configuradas corretamente
- ✅ **Push Subscription**: Criada com sucesso
- ✅ **Device ID**: Armazenado no localStorage
- ✅ **Modais Full Screen**: Todos corrigidos

### O que precisa investigar:
- ❌ **Push real via servidor**: Erro 500 em produção

## 🔧 Debug Steps

### 1. Verificar endpoint de debug
```bash
# Teste local
curl http://localhost:3000/api/push/debug

# Teste produção
curl https://www.numbly.life/api/push/debug
```

### 2. Verificar logs do servidor
Os logs agora incluem emojis para fácil identificação:
- 🚀 = Endpoint chamado
- 📋 = Verificando VAPID keys  
- 📦 = Parsing request body
- ✅ = Sucesso
- ❌ = Erro

### 3. Verificar VAPID keys em produção
```bash
# Verificar se as variáveis estão definidas no servidor de produção
echo $VAPID_PUBLIC_KEY
echo $VAPID_PRIVATE_KEY
echo $VAPID_SUBJECT
```

### 4. Testar push notification local
1. Abra o DevTools (F12)
2. Vá para Application > Service Workers
3. Verifique se o SW está registrado
4. Clique no botão "Testar Notificação Push"
5. Veja os logs no console

## 🐛 Possíveis Causas do Erro 500

1. **VAPID keys não configuradas em produção**
   - Verificar se `.env` está correto no servidor
   - VAPID_SUBJECT deve ser um email válido

2. **Runtime do Next.js**
   - Verificar se `runtime = 'nodejs'` está funcionando
   - Edge Runtime não suporta `web-push`

3. **Dependência web-push**
   - Verificar se `web-push` está instalado em produção
   - Pode precisar de rebuild das dependências

4. **CORS em produção**
   - Verificar se o CORS está configurado corretamente
   - Headers de Access-Control

## 🔄 Comandos Úteis

```bash
# Gerar novas VAPID keys
npm run setup:vapid

# Build para testar localmente
npm run build

# Verificar dependências
npm list web-push

# Verificar versão do Node.js
node --version
```

## 🌐 URLs de Teste

- **Local Debug**: http://localhost:3000/api/push/debug
- **Local Push**: http://localhost:3000/api/push/demo
- **Prod Debug**: https://www.numbly.life/api/push/debug
- **Prod Push**: https://www.numbly.life/api/push/demo

## 📱 Funcionalidades PWA Implementadas

### Device ID Management
- ✅ Armazenado como `donna-device-id` no localStorage
- ✅ Compatibilidade com `donna-user-id`
- ✅ Gerado automaticamente com nanoid

### Cart Recovery
- ✅ Início/parada via PWA Manager
- ✅ Informações do produto salvas
- ✅ Timeout automático após 4 dias

### Notificações
- ✅ Locais via Service Worker
- ✅ Push real via web-push (configurado)
- ✅ Permissões solicitadas corretamente

### Modais
- ✅ PWA Integration - Full screen
- ✅ Sales Flow Demo - Full screen
- ✅ Checkout Component - Full screen

## 🔍 Next Steps

1. **Verificar logs em produção** para identificar causa do erro 500
2. **Testar endpoint de debug** em produção
3. **Confirmar VAPID keys** estão corretas no servidor
4. **Testar web-push dependency** no ambiente de produção

## 📞 Emergency Fallback

Se push real não funcionar, o sistema já tem fallback para:
- ✅ Notificações locais via Service Worker
- ✅ Logs detalhados no console
- ✅ Mensagens de erro user-friendly
