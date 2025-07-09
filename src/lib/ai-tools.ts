// Biblioteca de AI Tools para uso no chat
// Siga padrão de named exports e interface

export interface AiTool {
  id: string;
  name: string;
  description: string;
  icon?: React.ReactNode;
  run: (input: string) => Promise<string>;
}

export const aiTools: AiTool[] = [
  {
    id: 'summarize',
    name: 'Resumir',
    description: 'Gera um resumo do texto informado.',
    run: async (input) => {
      // Aqui pode integrar com API real de AI
      return `Resumo: ${input.slice(0, 100)}...`;
    },
  },
  {
    id: 'translate',
    name: 'Traduzir',
    description: 'Traduz o texto informado para inglês.',
    run: async (input) => {
      // Aqui pode integrar com API real de AI
      return `Tradução (en): ${input}`;
    },
  },
  {
    id: 'time',
    name: 'Ver Hora',
    description: 'Exibe o horário atual do sistema.',
    run: async () => {
      const now = new Date();
      return `Agora: ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    },
  },
  {
    id: 'sun-time',
    name: 'Tempo Solar',
    description: 'Exibe o horário do nascer e pôr do sol para a localização padrão (São Paulo, BR).',
    run: async () => {
      // Exemplo fixo para São Paulo, BR
      return 'Nascer do sol: 06:45\nPôr do sol: 17:35';
    },
  },
  // Adicione mais ferramentas conforme necessário
];
