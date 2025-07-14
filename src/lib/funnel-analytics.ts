// Biblioteca para Tracking de Funil de Vendas WhatsApp
import { useEffect, useState } from 'react';

interface FunnelStage {
  id: string;
  name: string;
  timestamp: number;
}

interface FunnelMetrics {
  threadId: string;
  startTime: number;
  currentStage: string;
  stages: FunnelStage[];
  conversions: string[];
  leadScore: number;
  touchpoints: number;
}

// Analytics do Funil
export class WhatsAppFunnelAnalytics {
  private storageKey = 'whatsapp-funnel-analytics';
  
  // Inicia tracking do funil para uma thread
  initFunnel(threadId: string): void {
    const metrics: FunnelMetrics = {
      threadId,
      startTime: Date.now(),
      currentStage: 'awareness',
      stages: [{
        id: 'awareness',
        name: 'Consciência',
        timestamp: Date.now()
      }],
      conversions: [],
      leadScore: 0,
      touchpoints: 0
    };
    
    this.saveFunnelData(threadId, metrics);
    console.log('🎯 Funil iniciado para thread:', threadId);
  }
  
  // Avança para próxima etapa do funil
  advanceStage(threadId: string, newStage: string): void {
    const metrics = this.getFunnelData(threadId);
    if (!metrics) return;
    
    // Só avança se for um stage diferente
    if (metrics.currentStage === newStage) return;
    
    metrics.currentStage = newStage;
    metrics.stages.push({
      id: newStage,
      name: this.getStageName(newStage),
      timestamp: Date.now()
    });
    
    // Atualiza lead score baseado na progressão
    metrics.leadScore = this.calculateLeadScore(metrics);
    
    this.saveFunnelData(threadId, metrics);
    console.log(`🚀 Funil avançou: ${newStage} (Score: ${metrics.leadScore})`);
  }
  
  // Registra touchpoint (interação)
  recordTouchpoint(threadId: string, type: string): void {
    const metrics = this.getFunnelData(threadId);
    if (!metrics) return;
    
    metrics.touchpoints++;
    
    // Bonus por tipos específicos de touchpoint
    if (['whatsapp_demo', 'notification_request', 'analytics_view'].includes(type)) {
      metrics.leadScore += 10;
    }
    
    this.saveFunnelData(threadId, metrics);
    console.log(`📊 Touchpoint registrado: ${type} (Total: ${metrics.touchpoints})`);
  }
  
  // Registra conversão
  recordConversion(threadId: string, conversionType: string): void {
    const metrics = this.getFunnelData(threadId);
    if (!metrics) return;
    
    metrics.conversions.push(conversionType);
    metrics.leadScore += 50; // Boost significativo para conversões
    
    this.saveFunnelData(threadId, metrics);
    console.log(`💰 Conversão registrada: ${conversionType}`);
  }
  
  // Aumenta lead score diretamente
  increaseLeadScore(threadId: string, points: number): void {
    const metrics = this.getFunnelData(threadId);
    if (!metrics) return;
    
    metrics.leadScore = Math.min(100, (metrics.leadScore || 0) + points);
    this.saveFunnelData(threadId, metrics);
    
    console.log(`🔥 Lead Score aumentado em ${points} pontos. Total: ${metrics.leadScore}`);
  }
  
  // Calcula lead score baseado em múltiplos fatores
  private calculateLeadScore(metrics: FunnelMetrics): number {
    let score = 0;
    
    // Pontos por estágio atual
    const stageScores = {
      'awareness': 10,
      'interest': 25,
      'consideration': 40,
      'intent': 70,
      'action': 100
    };
    
    score += stageScores[metrics.currentStage as keyof typeof stageScores] || 0;
    
    // Pontos por engajamento (touchpoints mais valiosos)
    score += Math.min(metrics.touchpoints * 8, 40);
    
    // Pontos por progressão rápida no funil
    const timeInFunnel = Date.now() - metrics.startTime;
    const minutesInFunnel = timeInFunnel / (1000 * 60);
    
    if (minutesInFunnel < 3) { // Muito engajado
      score += 25;
    } else if (minutesInFunnel < 10) { // Bem engajado
      score += 15;
    } else if (minutesInFunnel < 30) { // Moderadamente engajado
      score += 5;
    }
    
    // Pontos por múltiplos stages visitados
    const uniqueStages = new Set(metrics.stages.map(s => s.id)).size;
    score += uniqueStages * 10;
    
    // Bonificação por conversões
    score += metrics.conversions.length * 50;
    
    return Math.min(score, 100); // Máximo 100
  }
  
  // Obtém dados do funil
  getFunnelData(threadId: string): FunnelMetrics | null {
    try {
      const data = localStorage.getItem(`${this.storageKey}-${threadId}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
  
  // Salva dados do funil
  private saveFunnelData(threadId: string, metrics: FunnelMetrics): void {
    try {
      localStorage.setItem(`${this.storageKey}-${threadId}`, JSON.stringify(metrics));
    } catch (error) {
      console.error('Erro ao salvar dados do funil:', error);
    }
  }
  
  // Helper para nomes dos stages
  private getStageName(stageId: string): string {
    const stageNames: Record<string, string> = {
      awareness: 'Consciência',
      interest: 'Interesse',
      consideration: 'Consideração', 
      intent: 'Intenção',
      action: 'Ação',
      whatsapp_demo: 'Demo WhatsApp',
      notification_granted: 'Permissão Concedida',
      analytics_view: 'Visualização Analytics',
      checkout_view: 'Visualização Checkout'
    };
    
    return stageNames[stageId] || stageId;
  }
  
  // Obtém métricas formatadas
  getFunnelMetrics(threadId: string) {
    const data = this.getFunnelData(threadId);
    if (!data) return null;
    
    const timeInFunnel = Date.now() - data.startTime;
    const completionRate = Math.round((data.stages.length / 5) * 100);
    const conversionRate = data.conversions.length > 0 ? (data.conversions.length / data.touchpoints) * 100 : 0;
    
    return {
      threadId: data.threadId,
      currentStage: data.currentStage,
      stageName: this.getStageName(data.currentStage),
      leadScore: data.leadScore,
      touchpoints: data.touchpoints,
      conversions: data.conversions.length,
      conversionRate,
      timeInFunnel, // em milissegundos
      completionRate,
      stages: data.stages,
      isHotLead: data.leadScore >= 70,
      readyForOffer: data.leadScore >= 50,
      engagementLevel: this.getEngagementLevel(data.leadScore),
      nextRecommendedAction: this.getNextAction(data)
    };
  }
  
  // Níveis de engajamento
  private getEngagementLevel(score: number): string {
    if (score >= 80) return 'Muito Alto';
    if (score >= 60) return 'Alto';
    if (score >= 40) return 'Médio';
    if (score >= 20) return 'Baixo';
    return 'Muito Baixo';
  }
  
  // Próxima ação recomendada
  private getNextAction(metrics: FunnelMetrics): string {
    if (metrics.leadScore >= 80) return 'Oferta Imediata';
    if (metrics.leadScore >= 60) return 'Demo Personalizada';
    if (metrics.leadScore >= 40) return 'Nutrir com Conteúdo';
    if (metrics.leadScore >= 20) return 'Engajar mais';
    return 'Educação Inicial';
  }
}

// Instância singleton
export const funnelAnalytics = new WhatsAppFunnelAnalytics();

// Hook React para usar analytics do funil
export function useFunnelAnalytics(threadId: string) {
  const [metrics, setMetrics] = useState<ReturnType<typeof funnelAnalytics.getFunnelMetrics>>(null);
  
  useEffect(() => {
    if (!threadId) return;
    
    // Inicia o funil se não existir
    if (!funnelAnalytics.getFunnelData(threadId)) {
      funnelAnalytics.initFunnel(threadId);
    }
    
    // Atualiza métricas
    const updateMetrics = () => {
      setMetrics(funnelAnalytics.getFunnelMetrics(threadId));
    };
    
    updateMetrics();
    
    // Atualiza a cada 5 segundos
    const interval = setInterval(updateMetrics, 5000);
    
    return () => clearInterval(interval);
  }, [threadId]);
  
  const advanceStage = (stage: string) => {
    funnelAnalytics.advanceStage(threadId, stage);
    setMetrics(funnelAnalytics.getFunnelMetrics(threadId));
  };
  
  const recordTouchpoint = (type: string) => {
    funnelAnalytics.recordTouchpoint(threadId, type);
    setMetrics(funnelAnalytics.getFunnelMetrics(threadId));
  };
  
  const recordConversion = (type: string) => {
    funnelAnalytics.recordConversion(threadId, type);
    setMetrics(funnelAnalytics.getFunnelMetrics(threadId));
  };
  
  const increaseLeadScore = (points: number) => {
    funnelAnalytics.increaseLeadScore(threadId, points);
    setMetrics(funnelAnalytics.getFunnelMetrics(threadId));
  };
  
  return { 
    metrics, 
    advanceStage, 
    recordTouchpoint, 
    recordConversion,
    increaseLeadScore
  };
}
