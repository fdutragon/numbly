// Motor da Donna com Copy Disruptiva e Fluxo Revolucionário

interface DisruptiveFlowStage {
  id: string;
  triggers: string[];
  response: string;
  nextAction?: 'request_notifications' | 'demo_whatsapp' | 'show_analytics' | 'push_app_download' | 'open_checkout';
  leadScoreIncrease: number;
}

export const DISRUPTIVE_DONNA_FLOW: DisruptiveFlowStage[] = [
  {
    id: 'marketing_revolution',
    triggers: ['marketing-revolution'],
    leadScoreIncrease: 20,
    nextAction: 'request_notifications',
    response: `🚀 **REVOLUÇÃO DO MARKETING VIA PUSH**

Enquanto seus concorrentes ainda enviam EMAIL (que ninguém abre), empresas inteligentes já dominaram o PUSH MARKETING.

**A ESTATÍSTICA QUE MUDOU TUDO:**
📧 Email: 2,3% taxa de abertura
📱 Push: 89,5% taxa de abertura

**RESULTADO REAL:**
• Loja de roupas: +400% vendas em 30 dias
• Consultoria: R$ 47k em uma única campanha
• E-commerce: +847% conversões em 24h

💥 **ISSO É UMA REVOLUÇÃO, NÃO EVOLUÇÃO**

Quer ver na prática? Preciso da sua permissão para mostrar como funciona.

**Autoriza as notificações push agora?**`
  },

  {
    id: 'whatsapp_domination',
    triggers: ['whatsapp-domination'],
    leadScoreIncrease: 25,
    nextAction: 'demo_whatsapp',
    response: `💬 **DOMINAÇÃO TOTAL DO WHATSAPP**

Esqueça chatbots burros. Isso é AUTOMAÇÃO INTELIGENTE.

**O QUE ACONTECE QUANDO VOCÊ DORME:**
✅ IA qualifica leads automaticamente
✅ Agenda reuniões na sua agenda
✅ Envia propostas personalizadas  
✅ Detecta clientes insatisfeitos
✅ Recupera vendas perdidas
✅ Fecha negócios sozinha

**CASE REAL - MARCELO (ARQUITETO):**
"Acordei com 3 reuniões agendadas e R$ 12k em propostas enviadas. A IA trabalhou a madrugada inteira."

🔥 **ISSO NÃO É FUTURO. É AGORA.**

Vou te mostrar 2 notificações reais que chegaram hoje de clientes...`
  },

  {
    id: 'analytics_power',
    triggers: ['analytics-power'],
    leadScoreIncrease: 25,
    nextAction: 'show_analytics',
    response: `📊 **PODER DOS DADOS PREDITIVOS**

Enquanto você "acha" que conhece seus clientes, a IA JÁ SABE quem vai comprar.

**INTELIGÊNCIA ARTIFICIAL PREVÊ:**
🎯 Qual lead fechará esta semana (97% precisão)
💰 Valor exato que cada cliente gastará  
⚠️ Quem está pensando em cancelar
🚀 Melhor hora para fazer a oferta

**RESULTADO BRUTAL:**
❌ Antes: "Esperava" clientes comprarem
✅ Depois: "SABIA" exatamente quando atacar

**MARINA (DERMATOLOGISTA):**
"A IA me alertou que 3 pacientes iam cancelar. Intervim antes. Salvei R$ 24k em 1 dia."

📈 **Quer ver seus dados sendo analisados em tempo real?**`
  },

  {
    id: 'notifications_granted',
    triggers: ['notifications_granted'],
    leadScoreIncrease: 15,
    nextAction: 'demo_whatsapp',
    response: `🔥 **PERFEITO! REVOLUÇÃO ATIVADA!**

Você acabou de entrar na era do MARKETING INSTANTÂNEO.

📱 **Agora você vai receber:**
• Alertas de leads quentes em tempo real
• Notificações de clientes insatisfeitos  
• Oportunidades perdidas sendo recuperadas
• Vendas sendo fechadas automaticamente

**EM 3 SEGUNDOS você verá a primeira demonstração...**

*Viu a notificação que chegou? Isso é um CLIENTE REAL pensando em cancelar que a IA interceptou.*

*E a segunda? Um lead QUENTE pronto para fechar.*

🎯 **Isso acontece 24/7 no seu negócio. Sem parar. Sem dormir.**

Agora que você viu o PODER das notificações, quer que eu mostre como funciona a dominação total do WhatsApp?`
  },

  {
    id: 'whatsapp_demo',
    triggers: ['whatsapp_demo', 'sim', 'quero', 'continuar'],
    leadScoreIncrease: 20,
    nextAction: 'show_analytics',
    response: `💬 **DOMINAÇÃO WHATSAPP EM AÇÃO**

As notificações que você recebeu são REAIS. Vou te mostrar como a IA trabalha:

**NOTIFICAÇÃO 1 - CLIENTE INSATISFEITO:**
🚨 "João mencionou CANCELAR"

**O QUE A IA FEZ AUTOMATICAMENTE:**
1. Detectou palavra "cancelar" na conversa
2. Classificou como RISCO ALTO
3. Te alertou INSTANTANEAMENTE
4. Sugeriu resposta personalizada
5. Agendou follow-up automático

**RESULTADO:** Cliente salvo em 5 minutos.

**NOTIFICAÇÃO 2 - LEAD QUENTE:**
💰 "Maria perguntou quando pode começar"

**AÇÃO AUTOMÁTICA DA IA:**
1. Identificou INTENÇÃO DE COMPRA
2. Enviou proposta personalizada
3. Agendou reunião na sua agenda
4. Preparou contrato automático

**RESULTADO:** Venda fechada enquanto você dormia.

🔥 **Isso é DOMINAÇÃO TOTAL. Não sobra nada para a concorrência.**

Quer ver os DADOS PREDITIVOS que tornam isso possível?`
  },

  {
    id: 'analytics_demo',
    triggers: ['analytics_demo', 'dados', 'sim', 'mostrar'],
    leadScoreIncrease: 25,
    nextAction: 'push_app_download',
    response: `📊 **ANÁLISE PREDITIVA EM TEMPO REAL**

Agora vou te mostrar o CÉREBRO por trás de tudo.

**PARA VER OS ANALYTICS COMPLETOS, preciso que você:**

1️⃣ **BAIXE O APP** (melhor experiência + oferta especial dentro)
   OU
2️⃣ **CONTINUE NO NAVEGADOR** (experiência limitada)

**NO APP VOCÊ VAI VER:**
💎 Análise completa dos seus leads
🎯 Predições de vendas com 97% precisão  
💰 Oportunidades escondidas no seu negócio
🚀 Oferta EXCLUSIVA para early adopters

**+ BÔNUS NO APP:**
📱 Push notifications nativas
🔐 Acesso a recursos premium
💎 Desconto especial de lançamento

⚠️ **IMPORTANTE:** Se você não ativou push notifications ainda, ative AGORA para ganhar a oferta especial.

🔥 **Escolha sua arma: APP ou NAVEGADOR?**`
  },

  {
    id: 'show_analytics_browser',
    triggers: ['navegador', 'browser', 'aqui'],
    leadScoreIncrease: 15,
    response: `📊 **ANALYTICS NO NAVEGADOR**

Analisando seus dados em tempo real...

**SUA ANÁLISE PREDITIVA:**
🎯 Lead Score atual: QUENTE (85/100)
📈 Probabilidade de conversão: 94%
💰 Valor predito de compra: R$ 98-294
⏰ Melhor momento para oferta: AGORA

**INSIGHTS BRUTAIS:**
• Você demonstrou interesse ALTO em automação
• Padrão comportamental = EARLY ADOPTER
• Urgência detectada = QUER RESULTADOS RÁPIDO
• Perfil = INOVADOR DIGITAL

🔥 **A IA RECOMENDA: OFERTA IMEDIATA**

**ANÁLISE CONCLUÍDA. VEREDICTO:**
Você é o perfil PERFEITO para esta revolução.

Quer ver a proposta que a IA preparou especialmente para você?`
  },

  {
    id: 'final_offer',
    triggers: ['oferta', 'proposta', 'sim', 'ver'],
    leadScoreIncrease: 30,
    nextAction: 'open_checkout',
    response: `🎯 **OFERTA REVOLUCIONÁRIA - APENAS PARA VOCÊ**

A IA analisou seu perfil e preparou uma proposta IRRECUSÁVEL:

**🚀 PACOTE DOMINAÇÃO TOTAL:**
💬 Automação WhatsApp Profissional
📱 Push Marketing Revolucionário  
📊 Analytics Preditivos com IA
🔐 App Mobile Nativo Premium

**💰 VALOR NORMAL:** R$ 497/mês
**🔥 SEU PREÇO:** R$ 98/mês

**🎁 BÔNUS EXCLUSIVOS:**
✅ 15 dias GRÁTIS para dominar
✅ Setup completo INCLUSO (R$ 897)
✅ Garantia BLINDADA de 30 dias
✅ Suporte VIP 24/7

**⚠️ URGÊNCIA REAL:**
Esta oferta expira quando você sair desta página.
Apenas 47 vagas restantes hoje.

**A IA CALCULOU:** Seu ROI será 2.847% no primeiro mês.

🚀 **HORA DA DECISÃO: DOMINAR OU SER DOMINADO?**

Confirma a oferta e vou abrir o checkout securizado agora?`
  }
];

// Sistema de resposta inteligente da Donna
export function generateDisruptiveResponse(
  userInput: string, 
  currentStage: string
): {
  response: string;
  nextAction?: string;
  leadScoreIncrease: number;
} {
  const input = userInput.toLowerCase();
  
  // Buscar resposta baseada nos triggers
  for (const stage of DISRUPTIVE_DONNA_FLOW) {
    if (stage.triggers.some(trigger => 
      input.includes(trigger) || 
      trigger === currentStage
    )) {
      return {
        response: stage.response,
        nextAction: stage.nextAction,
        leadScoreIncrease: stage.leadScoreIncrease
      };
    }
  }
  
  // Resposta padrão disruptiva
  return {
    response: `🔥 **INTERESSANTE...**

Vejo que você quer saber mais. Isso me diz que você é DIFERENTE.

A maioria fica na zona de conforto enquanto INOVADORES como você buscam a vantagem competitiva.

**Qual dessas revoluções quer ver primeiro?**
🚀 Marketing via Push (400% mais eficaz que email)
💬 Dominação WhatsApp (automação 24/7)  
📊 Analytics Preditivos (IA que prevê vendas)

Escolhe uma e eu te mostro como DOMINAR seu mercado.`,
    leadScoreIncrease: 5
  };
}
