'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ConversationSimulation {
  id: number;
  customerType: string;
  scenario: string;
  messages: Array<{
    sender: 'customer' | 'donna';
    message: string;
    timestamp: string;
  }>;
  outcome: 'converted' | 'abandoned' | 'pending';
  conversionRate: number;
  responseTime: string;
}

const mockConversations: ConversationSimulation[] = [
  {
    id: 1,
    customerType: "Cliente Indeciso",
    scenario: "Interesse em produto premium",
    messages: [
      { sender: 'customer', message: 'Quero saber mais sobre este produto...', timestamp: '14:30' },
      { sender: 'donna', message: 'Claro! Este é nosso produto premium com 95% de satisfação. Posso mostrar os benefícios exclusivos?', timestamp: '14:31' },
      { sender: 'customer', message: 'Qual é o preço?', timestamp: '14:32' },
      { sender: 'donna', message: 'R$ 299,90 com 30% de desconto hoje! Inclui frete grátis e garantia de 1 ano. Finalizamos?', timestamp: '14:32' },
      { sender: 'customer', message: 'Vou finalizar sim!', timestamp: '14:35' }
    ],
    outcome: 'converted',
    conversionRate: 85,
    responseTime: '1.2s'
  },
  {
    id: 2,
    customerType: "Comparador de Preços",
    scenario: "Pesquisando concorrência",
    messages: [
      { sender: 'customer', message: 'Vi este produto mais barato em outro lugar', timestamp: '15:45' },
      { sender: 'donna', message: 'Entendo sua preocupação! Nosso diferencial são os bônus exclusivos: curso premium + suporte 24h. Posso fazer uma oferta especial?', timestamp: '15:46' },
      { sender: 'customer', message: 'Que tipo de oferta?', timestamp: '15:47' },
      { sender: 'donna', message: 'Desconto de 40% + frete grátis + 2 bônus extras. Esta oferta expira em 15 minutos. Garantimos o melhor custo-benefício!', timestamp: '15:47' },
      { sender: 'customer', message: 'Interessante, mas preciso pensar...', timestamp: '15:50' }
    ],
    outcome: 'pending',
    conversionRate: 65,
    responseTime: '0.8s'
  },
  {
    id: 3,
    customerType: "Carrinho Abandonado",
    scenario: "Recuperação automática",
    messages: [
      { sender: 'donna', message: '🛒 Oi! Notei que você esqueceu alguns itens no carrinho. Posso ajudar a finalizar?', timestamp: '16:10' },
      { sender: 'customer', message: 'Ah sim, estava pensando se realmente preciso...', timestamp: '16:25' },
      { sender: 'donna', message: 'Entendo! Que tal um desconto de 20% para decidir agora? Seus itens estão separados e o estoque é limitado.', timestamp: '16:25' },
      { sender: 'customer', message: 'Não, obrigado. Talvez depois.', timestamp: '16:30' },
      { sender: 'donna', message: 'Sem problemas! Vou guardar seus itens por 24h. Se mudar de ideia, é só me chamar! 😊', timestamp: '16:31' }
    ],
    outcome: 'abandoned',
    conversionRate: 40,
    responseTime: '1.0s'
  }
];

const performanceData = {
  totalConversations: 1247,
  conversions: 856,
  conversionRate: 68.6,
  averageResponseTime: '0.9s',
  revenueGenerated: 'R$ 245.380',
  customerSatisfaction: 94.2
};

export function AnalyticsModal() {
  const [selectedConversation, setSelectedConversation] = useState<ConversationSimulation | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'conversations' | 'insights'>('overview');

  const renderConversation = (conversation: ConversationSimulation) => (
    <div className="space-y-3">
      {conversation.messages.map((msg, idx) => (
        <div key={idx} className={`flex ${msg.sender === 'donna' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-xs px-4 py-2 rounded-lg ${
            msg.sender === 'donna' 
              ? 'bg-violet-500 text-white' 
              : 'bg-gray-100 dark:bg-gray-800 text-foreground'
          }`}>
            <p className="text-sm">{msg.message}</p>
            <p className="text-xs opacity-70 mt-1">{msg.timestamp}</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full h-full min-h-screen bg-background relative overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-base">📊</span>
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-base">Analytics</h2>
              <p className="text-xs text-muted-foreground">Insights e simulações</p>
            </div>
          </div>
          <button
            className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('closeAnalyticsModal'));
            }}
            aria-label="Fechar modal"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="max-w-2xl mx-auto p-4">
        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg">
          {[
            { id: 'overview', label: '📈 Métricas' },
            { id: 'conversations', label: '💬 Conversas' },
            { id: 'insights', label: '🧠 Insights' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2 text-foreground">Dashboard</h1>
              <p className="text-muted-foreground text-base">Performance da Donna AI</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="rounded-xl border border-border bg-white/80 dark:bg-zinc-900/80 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <span className="text-xl">💰</span>
                    Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{performanceData.revenueGenerated}</div>
                  <p className="text-muted-foreground text-sm">+28% este mês</p>
                </CardContent>
              </Card>

              <Card className="rounded-xl border border-border bg-white/80 dark:bg-zinc-900/80 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <span className="text-xl">🎯</span>
                    Conversão
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{performanceData.conversionRate}%</div>
                  <p className="text-muted-foreground text-sm">{performanceData.conversions} de {performanceData.totalConversations}</p>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico simplificado */}
            <Card className="rounded-xl border border-border bg-white/80 dark:bg-zinc-900/80 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  Conversões (24h)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-32 flex items-end justify-between gap-1">
                  {[12, 8, 15, 22, 35, 28, 31, 45, 52, 38, 29, 33, 41, 47, 55, 62, 58, 43, 39, 34, 28, 22, 18, 14].map((value, idx) => (
                    <div key={idx} className="flex-1 bg-violet-500 rounded-t-sm opacity-70 hover:opacity-100 transition-opacity" 
                         style={{ height: `${(value / 62) * 100}%` }}>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Conversations Tab */}
        {activeTab === 'conversations' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2 text-foreground">Simulações</h1>
              <p className="text-muted-foreground text-base">Como a Donna AI converte</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Cenários de Atendimento</h3>
              {mockConversations.map((conversation) => (
                <Card 
                  key={conversation.id}
                  className={`rounded-xl border border-border bg-white/80 dark:bg-zinc-900/80 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                    selectedConversation?.id === conversation.id ? 'ring-2 ring-violet-500' : ''
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          conversation.outcome === 'converted' ? 'bg-green-500' : 
                          conversation.outcome === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></span>
                        {conversation.customerType}
                      </span>
                      <span className="text-sm text-muted-foreground">{conversation.conversionRate}%</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground mb-2">{conversation.scenario}</p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Tempo: {conversation.responseTime}</span>
                      <span className={`font-medium ${
                        conversation.outcome === 'converted' ? 'text-green-600' : 
                        conversation.outcome === 'pending' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {conversation.outcome === 'converted' ? '✅ Convertido' : 
                         conversation.outcome === 'pending' ? '⏳ Pendente' : '❌ Perdido'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {selectedConversation && (
                <Card className="rounded-xl border border-border bg-white/80 dark:bg-zinc-900/80 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <span className="text-xl">💬</span>
                      Conversa Detalhada
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium text-foreground">{selectedConversation.customerType}</p>
                      <p className="text-xs text-muted-foreground">{selectedConversation.scenario}</p>
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {selectedConversation.messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.sender === 'donna' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                            msg.sender === 'donna' 
                              ? 'bg-violet-500 text-white' 
                              : 'bg-muted text-foreground'
                          }`}>
                            <p>{msg.message}</p>
                            <p className="text-xs opacity-70 mt-1">{msg.timestamp}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2 text-foreground">Insights</h1>
              <p className="text-muted-foreground text-base">Análises para otimizar conversões</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="rounded-xl border border-border bg-white/80 dark:bg-zinc-900/80 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <span className="text-xl">🔥</span>
                    Horários de Pico
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground">18h - 21h</span>
                      <span className="text-violet-600 font-medium">85%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground">14h - 16h</span>
                      <span className="text-violet-600 font-medium">72%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground">20h - 22h</span>
                      <span className="text-violet-600 font-medium">68%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl border border-border bg-white/80 dark:bg-zinc-900/80 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <span className="text-xl">🎯</span>
                    Palavras-Chave
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground">"desconto"</span>
                      <span className="text-violet-600 font-medium">+45%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground">"limitado"</span>
                      <span className="text-violet-600 font-medium">+38%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground">"garantia"</span>
                      <span className="text-violet-600 font-medium">+32%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-xl border border-border bg-white/80 dark:bg-zinc-900/80 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <span className="text-xl">🧠</span>
                  Análise por Segmento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { segment: "Clientes Novos", behavior: "Respondem melhor a ofertas de primeira compra", conversion: "62%" },
                    { segment: "Clientes Recorrentes", behavior: "Preferem produtos complementares", conversion: "84%" },
                    { segment: "Abandonadores", behavior: "Necessitam de urgência e benefícios", conversion: "45%" }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">{item.segment}</p>
                        <p className="text-xs text-muted-foreground">{item.behavior}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-violet-600">{item.conversion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
