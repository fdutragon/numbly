// Sistema de Funil de Vendas para Automação de WhatsApp

// Sistema de Funil de Vendas para Automação de WhatsApp
interface SalesFunnelStage {
  id: string;
  name: string;
  objective: string;
  triggers: string[];
  responses: string[];
  nextStage?: string;
  isClosingStage?: boolean;
}

// Funil de Vendas Estruturado para Automação WhatsApp
const WHATSAPP_SALES_FUNNEL: SalesFunnelStage[] = [
  {
    id: 'awareness',
    name: 'Consciência',
    objective: 'Despertar interesse em automação WhatsApp',
    triggers: ['oi', 'olá', 'começar', 'início'],
    responses: [
      `🚀 **Oi! Sou a Donna, especialista em automação WhatsApp**

❌ Você ainda perde vendas às 2h da manhã?
❌ Demora para responder clientes?
❌ Seus concorrentes vendem enquanto você dorme?

💡 **Automação WhatsApp resolve isso.**
Transformo seu WhatsApp numa máquina de vendas 24/7.

Quer descobrir como?`,

      `🤖 **Parou de perder dinheiro dormindo?**

Imagina se todo cliente que manda mensagem:
✅ Recebe resposta em 3 segundos
✅ É qualificado automaticamente  
✅ Agenda reunião sozinho
✅ Recebe proposta personalizada

**Isso é automação WhatsApp profissional.**
+500 empresas já faturam +R$ 5mil/mês comigo.

Quer ser a próxima?`
    ]
  },
  {
    id: 'interest',
    name: 'Interesse',
    objective: 'Demonstrar valor da automação',
    triggers: ['como', 'funciona', 'interesse', 'mais'],
    responses: [
      `⚡ **Olha só que legal! Já apareceu aí as notificações inteligentes** 🔔

Viu como é rápido? Assim você nunca mais perde um cliente!

🎯 **ATENDIMENTO 24/7**
• Respondo qualquer hora (fins de semana, madrugada)
• Nunca perco um lead quente
• Qualifico clientes automaticamente

📊 **VENDAS AUTOMÁTICAS**  
• Envio propostas personalizadas
• Agenda reuniões na sua agenda
• Faço follow-up inteligente

💰 **RESULTADOS REAIS:**
João (Mecânica): +45% vendas em 30 dias
Maria (Estética): 127 agendamentos/mês automáticos  

Quer ver mais recursos?`,

      `🚀 **Agora repara que apareceu a integração WhatsApp!** 💬

É assim que conecto no seu WhatsApp Business e faço toda a mágica acontecer:

**ANTES da automação WhatsApp:**
❌ Cliente manda mensagem às 22h → Não vê
❌ Concorrente responde → Perdeu a venda
❌ Fim de semana = zero vendas

**DEPOIS da automação:**
✅ Resposta automática em 3 segundos
✅ Lead qualificado automaticamente  
✅ Reunião agendada sozinha
✅ Proposta enviada na hora
✅ VENDA FECHADA enquanto você dormia

Que tal testar isso no seu negócio?`
    ]
  },
  {
    id: 'consideration',
    name: 'Consideração',
    objective: 'Mostrar diferencial e qualificar lead',
    triggers: ['dúvida', 'pensar', 'avaliar', 'diferença'],
    responses: [
      `🎯 **Me conta sobre seu negócio:**

Para personalizar a automação WhatsApp perfeitamente:

**Opa! Olha o app mobile aparecendo aí!** 📱

Com ele você monitora tudo pelo celular:
• Push notifications nativas
• Funciona offline  
• Acesso instantâneo

1️⃣ **Que tipo de negócio você tem?**
(Ex: consultoria, loja, serviços, produtos)

2️⃣ **Quantos clientes você atende por mês?**
(Para calibrar o volume de automação)

3️⃣ **Qual sua maior dor hoje?**
• Demora para responder?
• Perder vendas no fim de semana?
• Não conseguir qualificar todos os leads?

Com essas infos, monto uma automação cirúrgica para SEU negócio específico.

Me conta aí! 👇`,

      `💡 **Automação WhatsApp vs Concorrência:**

🥇 **DONNA (Automação Profissional):**
✅ IA treinada no SEU script de vendas
✅ Integra com SUA agenda (Google/Outlook)
✅ Envia SUAS propostas personalizadas
✅ App mobile nativo (viu aparecer ali?)
✅ Analytics completos (próximo a aparecer!)
✅ Setup personalizado incluso
✅ Suporte 24/7 vitalício

🥈 **Outros (Chatbots genéricos):**
❌ Respostas robóticas e limitadas
❌ Não integra com ferramentas
❌ Templates prontos (todos iguais)
❌ Setup por conta própria
❌ Suporte básico por ticket

**Diferença:** Automação profissional vs chatbot amador.

Qual você quer no seu WhatsApp?`
    ]
  },
  {
    id: 'intent',
    name: 'Intenção',
    objective: 'Criar urgência e oferecer solução',
    triggers: ['quero', 'interessado', 'como começar', 'preço'],
    responses: [
      `🎯 **E agora apareceu o analytics! Olha só esses números!** 📊

Viu que legal? É assim que você acompanha:
• Taxa de conversão em tempo real
• Leads quentes identificados
• ROI detalhado por campanha

Com todos esses recursos funcionando juntos, sua automação fica COMPLETA!

� **INVESTIMENTO:** R$ 98/mês 
🎁 **15 DIAS GRÁTIS** para testar tudo
✅ **Garantia de 30 dias** ou dinheiro de volta
🚀 **Sem riscos, sem fidelidade**

**ROI garantido:** Se não aumentar vendas em 30 dias, devolvemos seu dinheiro.

Seus leads estão quentes! Quer automatizar agora?`,

      `⚡ **PERFEITO! Agora que você viu TODOS os recursos funcionando...**

� **Analytics completos** ✅ Apareceu!
📱 **App mobile nativo** ✅ Mostrado!
💬 **Integração WhatsApp** ✅ Demonstrado!
🔔 **Notificações inteligentes** ✅ Funcionando!

🎯 **Seus leads estão na temperatura ideal para fechar!**

💰 **OFERTA ESPECIAL (válida hoje):**
• **R$ 98/mês** (valor normal R$ 197)
• **15 dias grátis** para testar sem riscos
• **Garantia total** de 30 dias
• **Setup incluído** (valor R$ 297)

⏰ **Esta oferta expira hoje às 23:59**

**Que tal experimentar 15 dias sem riscos?**
Seus concorrentes não vão esperar... 🚀`
    ]
  },
  {
    id: 'action',
    name: 'Ação',
    objective: 'Converter em cliente',
    triggers: ['sim', 'quero', 'começar', 'ativar'],
    responses: [
      `� **PERFEITO! Vamos automatizar suas vendas:**

📋 **Para ativar sua automação WhatsApp:**

1️⃣ **Confirme seus dados:**
• Nome completo:
• Email:  
• WhatsApp para automação:
• Tipo de negócio:

2️⃣ **Escolha seu plano:**
🥇 **PREMIUM** - R$ 97/mês
• Automação ilimitada
• Setup em 24h
• Suporte prioritário
• Templates avançados

🥈 **BÁSICO** - R$ 47/mês  
• Automação padrão
• Setup em 48h
• Suporte normal
• Templates básicos

3️⃣ **Garantias:**
✅ 7 dias grátis
✅ Cancela quando quiser
✅ Setup gratuito incluso
✅ Dinheiro de volta se não funcionar

Me passa seus dados para começarmos! 👇`
    ],
    isClosingStage: true
  }
];



// Interface para respostas da Donna
export interface DonnaResponse {
  content: string;
  shouldShowPaymentModal: boolean;
  funnelStage?: string;
  nextAction?: string;
  leadData?: Record<string, unknown>;
}

// Sistema de Automação WhatsApp com IA Avançada
interface DonnaEngineResponse {
  content: string;
  shouldShowPaymentModal: boolean;
  funnelStage: string;
  nextAction?: string;
  leadData?: Record<string, unknown>;
}

interface DonnaState {
  currentStage: string;
  leadData: Record<string, unknown>;
  interactions: number;
  lastStageChange: number;
}

// Engine de Automação WhatsApp com IA
class WhatsAppAutomationEngine {
  private funnelStages = WHATSAPP_SALES_FUNNEL;
  
  async processMessage(
    message: string, 
    threadId: string,
    currentState?: DonnaState
  ): Promise<DonnaEngineResponse> {
    console.log('🤖 Processing with threadId:', threadId);
    
    const state = currentState || {
      currentStage: 'awareness',
      leadData: {},
      interactions: 0,
      lastStageChange: Date.now()
    };
    
    // Incrementa interações
    state.interactions++;
    
    // Detecta intenção e conteúdo
    const intent = this.detectIntent(message);
    const previousStage = state.currentStage;
    const newStage = this.determineStage(intent, state);
    
    // Atualiza stage se mudou
    if (newStage !== state.currentStage) {
      state.currentStage = newStage;
      state.lastStageChange = Date.now();
      console.log(`🚀 Stage progression: ${previousStage} → ${newStage}`);
    }
    
    // Gera resposta baseada no stage e contexto
    const response = this.generateResponse(message, intent, state);
    
    return {
      content: response.content,
      shouldShowPaymentModal: response.shouldShowPaymentModal,
      funnelStage: state.currentStage,
      nextAction: response.nextAction,
      leadData: {
        ...state.leadData,
        lastIntent: intent,
        totalInteractions: state.interactions,
        stageProgression: `${previousStage} → ${newStage}`
      }
    };
  }
  
  private detectIntent(message: string): string {
    const text = message.toLowerCase().trim();
    
    // Intenções de compra/ação
    if (/\b(quero|sim|vamos|começar|ativar|contratar|comprar|bora|aceito|vou|queria)\b/.test(text)) {
      return 'buy_intent';
    }
    
    // Perguntas sobre preço/investimento
    if (/\b(preço|valor|custa|quanto|mensalidade|investimento|plano|pagar|cobrança|grátis|gratuito)\b/.test(text)) {
      return 'price_question';
    }
    
    // Perguntas pessoais (nome, identificação)
    if (/\b(nome|chama|você|quem|pessoa|sou|me chamo)\b/.test(text) || /^[a-zA-ZÀ-ÿ\s]{2,20}$/.test(text)) {
      return 'personal_question';
    }
    
    // Interesse em funcionalidades/como funciona
    if (/\b(como|funciona|features|recursos|automação|whatsapp|bot|sistema|processo|exemplo|demonstração)\b/.test(text)) {
      return 'feature_interest';
    }
    
    // Perguntas sobre tempo/prazo
    if (/\b(tempo|prazo|demora|rápido|rápida|quando|horário|dias|semanas)\b/.test(text)) {
      return 'timing_question';
    }
    
    // Perguntas sobre resultados/casos
    if (/\b(resultado|caso|sucesso|cliente|empresa|funciona|exemplo|prova|testimonio)\b/.test(text)) {
      return 'case_study_request';
    }
    
    // Dúvidas/objeções
    if (/\b(mas|porém|entretanto|dúvida|duvida|não|caro|depois|pensar|talvez|complicado|difícil)\b/.test(text)) {
      return 'objection';
    }
    
    // Comparação com concorrentes
    if (/\b(outro|diferença|concorrente|comparar|melhor|pior|alternativa|similar|parecido)\b/.test(text)) {
      return 'competitor_question';
    }
    
    // Qualificação de negócio
    if (/\b(negócio|empresa|vendas|clientes|atendimento|loja|consultoria|serviço|produto)\b/.test(text)) {
      return 'business_qualification';
    }
    
    // Agradecimentos
    if (/\b(obrigado|obrigada|valeu|thanks|grato|grata|agradeço)\b/.test(text)) {
      return 'thanks';
    }
    
    // Despedidas
    if (/\b(tchau|até|adeus|bye|fui|saindo|vou embora)\b/.test(text)) {
      return 'goodbye';
    }
    
    // Saudações/início
    if (/\b(oi|olá|hey|bom\s+dia|boa\s+tarde|boa\s+noite|eai|e ai)\b/.test(text)) {
      return 'greeting';
    }
    
    return 'general';
  }
  
  private determineStage(intent: string, state: DonnaState): string {
    const currentStage = state.currentStage;
    
    // Progressão baseada na intenção (mais agressiva)
    switch (intent) {
      case 'buy_intent':
        return 'action';
      
      case 'price_question':
        // Se já perguntou preço, vai direto pra intent
        return 'intent';
      
      case 'feature_interest':
      case 'business_qualification':
        // Se estava em awareness, vai pra interest
        if (currentStage === 'awareness') return 'interest';
        // Se estava em interest, vai pra consideration
        if (currentStage === 'interest') return 'consideration';
        return currentStage;
      
      case 'objection':
        // Mantém no intent se já chegou lá, senão vai pra consideration
        return currentStage === 'intent' ? 'intent' : 'consideration';
      
      case 'competitor_question':
        // Vai pra consideration se pergunta sobre concorrentes
        return 'consideration';
      
      default:
        // Progride automaticamente após algumas interações no mesmo stage
        if (state.interactions >= 3 && currentStage === 'awareness') {
          return 'interest';
        }
        if (state.interactions >= 5 && currentStage === 'interest') {
          return 'consideration';
        }
        if (state.interactions >= 7 && currentStage === 'consideration') {
          return 'intent';
        }
        
        return currentStage;
    }
  }
  
  private getNextStage(currentStage: string): string {
    const stages = this.funnelStages.map(s => s.id);
    const currentIndex = stages.indexOf(currentStage);
    
    if (currentIndex >= 0 && currentIndex < stages.length - 1) {
      return stages[currentIndex + 1];
    }
    
    return currentStage;
  }
  
  private generateResponse(
    message: string, 
    intent: string, 
    state: DonnaState
  ): { content: string; shouldShowPaymentModal: boolean; nextAction?: string } {
    
    // Respostas contextuais e personalizadas primeiro
    if (intent === 'personal_question') {
      const userName = this.extractUserName(message);
      return {
        content: `👋 **Prazer, ${userName || 'amigo(a)'}! Sou a Donna, sua futura vendedora digital!**

Minha missão é **simples**: transformar seu WhatsApp numa **máquina de vendas 24/7** que trabalha enquanto você dorme.

🎯 **O que eu faço:**
- Respondo leads em **3 segundos** (nunca mais perde cliente)
- Qualifico automaticamente cada contato
- Agenda reuniões no seu Google Calendar
- Envio propostas personalizadas
- Cobro pagamentos via PIX/cartão

**E você? Qual seu nome e que tipo de negócio tem?**
(Assim personalizo a automação perfeitamente pro seu ramo)`,
        shouldShowPaymentModal: false,
        nextAction: 'qualify_business'
      };
    }
    
    if (intent === 'price_question') {
      return {
        content: `💰 **Ah, direto ao ponto! Gosto disso. Vamos falar números:**

## 🥈 **PLANO BÁSICO** - R$ 47/mês
- ✅ Automação WhatsApp 24/7
- ✅ Respostas em até 3 segundos  
- ✅ Setup completo incluso
- ✅ Templates personalizados pro seu negócio
- ✅ Suporte via chat

## 🥇 **PLANO PREMIUM** - R$ 97/mês
- ✅ Tudo do Básico +
- ✅ **IA avançada** (como eu)
- ✅ Setup prioritário em 24h
- ✅ Fluxos complexos ilimitados
- ✅ Suporte telefônico VIP
- ✅ Integrações sem limite

### 🎁 **BÔNUS HOJE:**
- 7 dias **GRÁTIS** para testar
- **ROI garantido** ou devolvemos tudo
- Setup personalizado incluso (valor R$ 297)

**Matemática simples:** 1 venda recuperada já paga o mês inteiro.

Qual volume de leads você atende por mês? Assim te mostro o ROI exato.`,
        shouldShowPaymentModal: false,
        nextAction: 'qualify_budget'
      };
    }

    if (intent === 'feature_interest') {
      return {
        content: `🚀 **Ótima pergunta! Vou te explicar como funciona na prática:**

## 🤖 **Como a Automação Funciona:**

### **1. Lead chega no seu WhatsApp**
- Cliente manda "Oi" às 2h da manhã
- **IA responde em 3 segundos** (eu nunca durmo!)

### **2. Qualificação Automática**
- Pergunto nome, necessidade, orçamento
- **Classifico** em: Quente 🔥, Morno 🟡, Frio ❄️
- **Separo** por interesse/produto

### **3. Agendamento Inteligente**
- Ofereço horários livres da **SUA agenda**
- Cliente escolhe e **confirma automaticamente**
- Gera meet/zoom e envia lembretes

### **4. Follow-up Cirúrgico**
- Se não responde: **sequência de 3 mensagens**
- Se demonstra interesse: **proposta personalizada**
- Se objeta: **contorno automático**

### **5. Fechamento**
- Envio **proposta PDF** personalizada
- Link de pagamento direto (PIX/cartão)
- **Confirmo** venda e entrego acesso

**Resultado:** Você dorme, eu vendo. Simples assim.

Que parte te interessou mais? Te mostro um exemplo real?`,
        shouldShowPaymentModal: false,
        nextAction: 'show_case_study'
      };
    }

    if (intent === 'objection' && message.toLowerCase().includes('caro')) {
      return {
        content: `💡 **Entendo sua preocupação. Vamos fazer as contas juntos:**

## 🧮 **Análise de Custo vs Benefício:**

### **Seu custo atual (sem automação):**
- Atendente: R$ 1.500-3.000/mês
- Horário limitado: **perde 60% dos leads** (fim de semana/noite)
- Demora para responder: **perde 40% por lentidão**
- Erro humano: **perde 20% por mal atendimento**

**Total de perda: 80% dos seus leads** 😱

### **Com Donna (R$ 47-97/mês):**
- Atendimento **24/7** sem parar
- Resposta em **3 segundos** sempre
- **Zero** erro de comunicação
- **Recupera 60% das vendas perdidas**

### **Exemplo Real:**
Cliente tinha 100 leads/mês → fechava 10 vendas (10%)
Com automação: mesmos 100 leads → fecha 18 vendas (18%)

**8 vendas extras × ticket médio R$ 300 = +R$ 2.400/mês**
**Investimento: R$ 97/mês**
**ROI: +2.200% retorno**

**Pergunta honesta:** Quantas vendas você perde por não responder rápido?`,
        shouldShowPaymentModal: false,
        nextAction: 'overcome_price_objection'
      };
    }

    if (intent === 'competitor_question') {
      return {
        content: `🔥 **Excelente pergunta! Vou ser 100% transparente:**

## ⚖️ **Donna vs "Concorrência":**

### **🤖 Chatbots Básicos (R$ 20-40/mês):**
❌ Respostas robóticas e limitadas
❌ Não integra com agenda/CRM
❌ Templates genéricos (todo mundo igual)
❌ Suporte inexistente
❌ Setup por conta própria
❌ **Resultado: clientes percebem que é bot**

### **👩‍💼 Atendentes Humanos:**
❌ Custo: R$ 1.500-3.000/mês
❌ Trabalha só 8h/dia, 5 dias/semana
❌ Pode ter dia ruim, ficar doente
❌ Esquece de fazer follow-up
❌ **Resultado: 60% das vendas perdidas**

### **🚀 Donna (IA Profissional):**
✅ Conversa **natural** (clientes nem percebem)
✅ Integra com **sua agenda, CRM, pagamentos**
✅ **Personalizada** pro seu script de vendas
✅ Setup **feito pra você** 
✅ Suporte 24/7 vitalício
✅ **Resultado: +60% vendas, -90% custo**

**A diferença?** Outros vendem "chatbot". Eu entrego **vendedora digital**.

Quer ver um teste comparativo ao vivo?`,
        shouldShowPaymentModal: false,
        nextAction: 'differentiate'
      };
    }

    if (intent === 'timing_question') {
      return {
        content: `⏰ **Ótima pergunta! Vou ser bem específica sobre os prazos:**

## 🚀 **Timeline Completa:**

### **📋 Setup Inicial (24-48h):**
- Analiso seu script de vendas atual
- Crio fluxos personalizados pro seu negócio  
- Configuro integrações (agenda, CRM, pagamento)
- Faço testes com seus contatos reais

### **🎯 Primeiros Resultados (72h):**
- Automação já atendendo leads 24/7
- Primeiras qualificações automáticas
- Relatórios de performance em tempo real

### **📊 ROI Completo (7-14 dias):**
- Aumento médio de **40-60% nas conversões**
- Redução de **80% no tempo** de atendimento
- **3-5x mais leads qualificados** por dia

### **🏆 Resultado Máximo (30 dias):**
- Sistema 100% otimizado pro seu perfil de cliente
- **Automação vendendo sozinha** enquanto você dorme
- ROI médio: **300-500% do investimento**

**Urgência?** Setup expresso em 12h por +R$ 97 (só hoje).

Quando quer começar a recuperar vendas perdidas?`,
        shouldShowPaymentModal: false,
        nextAction: 'create_urgency'
      };
    }

    if (intent === 'case_study_request') {
      return {
        content: `📊 **Casos reais que vão te impressionar:**

## 🏆 **Consultoria Digital - Dr. Marcos:**
**Antes:** 50 leads/mês → 8 vendas (16%)
**Depois:** 50 leads/mês → 23 vendas (46%)
**Resultado:** +R$ 12.000/mês extras
**ROI:** 12.000% em 60 dias

## 🏪 **E-commerce - Loja Bella:**
**Antes:** Atendia só das 9h-18h
**Depois:** Vende 24/7 automaticamente  
**Resultado:** +180% vendas noturnas/fim de semana
**ROI:** Pagou o ano inteiro no 1º mês

## 💼 **Agência Marketing - Paulo:**
**Antes:** 2h/dia respondendo WhatsApp
**Depois:** 0h/dia (tudo automatizado)
**Resultado:** +30h/semana para prospectar novos clientes
**ROI:** +R$ 25.000/mês em novos contratos

## 🎯 **Padrão dos Resultados:**
✅ **+40-60% conversões** (média)
✅ **-80% tempo** gasto em atendimento
✅ **+300% leads** qualificados
✅ **ROI médio: 500%** em 90 dias

**Todos eram céticos no início.** Hoje não vivem sem.

Seu negócio tem potencial similar. Quer que eu analise seu caso específico?`,
        shouldShowPaymentModal: false,
        nextAction: 'analyze_business'
      };
    }

    if (intent === 'thanks') {
      return {
        content: `😊 **De nada! Estou aqui para isso mesmo.**

Minha missão é fazer seu negócio **vender mais gastando menos tempo**.

💡 **Dica quente:** Cada minuto que passa sem automação = vendas perdidas para concorrentes que já automatizaram.

Alguma dúvida específica sobre como a automação pode **multiplicar suas vendas**?`,
        shouldShowPaymentModal: false,
        nextAction: 'keep_engaged'
      };
    }

    if (intent === 'goodbye') {
      return {
        content: `👋 **Até mais! Mas antes de ir...**

**Reflexão rápida:** Quantas vendas você vai perder hoje à noite enquanto dorme?

💰 **Lembre-se:**
- Seus concorrentes **não dormem** (automação nunca para)
- Cada lead não respondido em 5min = **70% chance perdida**
- **Fim de semana** = 40% das vendas semanais perdidas

🚀 **Quando mudar de ideia** sobre ter vendas automáticas 24/7, já sabe onde me encontrar.

**PS:** Oferta de 7 dias grátis termina em breve. Só avisando. 😉`,
        shouldShowPaymentModal: false,
        nextAction: 'create_urgency'
      };
    }

    // Se não tem resposta específica, usa resposta contextual baseada no stage
    const currentStageData = this.funnelStages.find(s => s.id === state.currentStage);
    
    if (!currentStageData) {
      return {
        content: this.getPersonalizedFallback(message, state),
        shouldShowPaymentModal: false
      };
    }

    // Gera resposta mais personalizada baseada na mensagem
    const personalizedResponse = this.createPersonalizedResponse(message, currentStageData, state);
    
    return {
      content: personalizedResponse,
      shouldShowPaymentModal: currentStageData.isClosingStage || false,
      nextAction: currentStageData.nextStage
    };
  }

  private extractUserName(message: string): string | null {
    // Extrai nome de mensagens como "qual seu nome?" ou "me chamo João"
    const patterns = [
      /(?:me chamo|sou|eu sou)\s+([a-zA-ZÀ-ÿ]+)/i,
      /(?:nome|chamo)\s+(?:é|eh)?\s*([a-zA-ZÀ-ÿ]+)/i,
      /^([a-zA-ZÀ-ÿ]+)$/i
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1] && match[1].length > 1) {
        return match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
      }
    }
    
    return null;
  }

  private createPersonalizedResponse(message: string, stageData: SalesFunnelStage, state: DonnaState): string {
    const responses = stageData.responses;
    const baseResponse = responses[(state.interactions + message.length) % responses.length];
    
    // Adiciona elementos personalizados baseados na mensagem
    const keywords = message.toLowerCase();
    let personalizedElements = '';
    
    if (keywords.includes('dúvida') || keywords.includes('duvida')) {
      personalizedElements = '\n\n💡 **Vejo que tem dúvidas! Normal, é um investimento importante.**\n';
    } else if (keywords.includes('interessado') || keywords.includes('quero')) {
      personalizedElements = '\n\n🔥 **Perfeito! Vejo que está interessado. Vamos acelerar...**\n';
    } else if (keywords.includes('tempo') || keywords.includes('prazo')) {
      personalizedElements = '\n\n⏰ **Sobre timing, entendo a urgência...**\n';
    } else if (keywords.includes('exemplo') || keywords.includes('caso')) {
      personalizedElements = '\n\n📊 **Quer ver casos reais? Tenho vários...**\n';
    }
    
    return baseResponse + personalizedElements;
  }

  private getPersonalizedFallback(message: string, state: DonnaState): string {
    const keywords = message.toLowerCase();
    
    if (keywords.includes('obrigado') || keywords.includes('obrigada')) {
      return `😊 **De nada! Estou aqui para isso mesmo.**

Minha missão é fazer seu negócio **vender mais gastando menos tempo**.

Alguma dúvida específica sobre automação WhatsApp que posso esclarecer?`;
    }
    
    if (keywords.includes('tchau') || keywords.includes('até logo')) {
      return `👋 **Até mais! Mas antes de ir...**

Se mudar de ideia sobre ter vendas automáticas 24/7, **já sabe onde me encontrar**.

💡 **Lembre-se:** Cada minuto sem automação = vendas perdidas.`;
    }
    
    return `🤖 **Automação WhatsApp que MULTIPLICA vendas:**

## 🎯 **O que eu faço:**
✅ Atendo **24/7** (nunca perde lead)
✅ Respondo em **3 segundos**
✅ Qualifico automaticamente  
✅ Agendo reuniões sozinha
✅ Envio propostas personalizadas

### 💰 **Investimento:** R$ 47/mês
**ROI garantido** na primeira semana.

**${state.interactions > 3 ? 'Já conversamos bastante!' : 'Primeira vez aqui?'}** O que quer saber sobre automação?`;
  }
  
  private getFallbackResponse(): string {
    return `🤖 **Automação WhatsApp que MULTIPLICA vendas:**

✅ Atendo 24/7 (nunca perde lead)
✅ Respondo em 3 segundos
✅ Qualifico automaticamente  
✅ Agendo reuniões sozinha
✅ Envio propostas personalizadas

**R$ 47/mês** - ROI garantido na primeira semana.

O que você quer saber sobre automação?`;
  }
}

// Instância global da engine
const automationEngine = new WhatsAppAutomationEngine();

// Interface para compatibilidade
export interface DonnaResponse {
  content: string;
  shouldShowPaymentModal: boolean;
  funnelStage?: string;
  nextAction?: string;
  leadData?: Record<string, unknown>;
}

// Função principal para processar mensagens
export async function processMessage(
  message: string, 
  threadId?: string,
  currentState?: DonnaState
): Promise<DonnaResponse> {
  console.log('🤖 Processing message:', {
    messagePreview: message.substring(0, 50),
    threadId,
    hasState: !!currentState
  });
  
  return automationEngine.processMessage(
    message, 
    threadId || 'default',
    currentState
  );
}

// Mensagem inicial do funil
export function getInitialMessage(): string {
  return WHATSAPP_SALES_FUNNEL[0].responses[0];
}
