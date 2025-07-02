import { NextRequest, NextResponse } from 'next/server';

interface DailyBlogRequest {
  diaPessoal: number;
  numeroDestino: number;
  mesPessoal: number;
  anoPessoal: number;
  nomeUsuario: string;
  palavrasChave: string[];
}

// Dados para geração de conteúdo
const energiasPorNumero = {
  1: {
    energia: 'Liderança e Iniciativa',
    foco: 'novos começos e projetos pioneiros',
    oportunidades: 'assumir o controle, liderar equipes, iniciar empreendimentos',
    desafios: 'evitar o autoritarismo e a impaciência',
    cores: ['vermelho', 'laranja', 'dourado'],
    pedras: ['rubi', 'cornalina', 'citrino']
  },
  2: {
    energia: 'Cooperação e Diplomacia',
    foco: 'relacionamentos e parcerias',
    oportunidades: 'mediar conflitos, formar alianças, trabalhar em equipe',
    desafios: 'não se perder em indecisões ou dependência emocional',
    cores: ['azul', 'verde claro', 'rosa'],
    pedras: ['água-marinha', 'quartzo rosa', 'pedra da lua']
  },
  3: {
    energia: 'Criatividade e Expressão',
    foco: 'comunicação e arte',
    oportunidades: 'expressar talentos artísticos, comunicar ideias, inspirar outros',
    desafios: 'evitar dispersão e superficialidade',
    cores: ['amarelo', 'laranja', 'roxo'],
    pedras: ['citrino', 'ametista', 'topázio']
  },
  4: {
    energia: 'Estabilidade e Construção',
    foco: 'organização e planejamento',
    oportunidades: 'construir bases sólidas, organizar projetos, criar sistemas',
    desafios: 'não se tornar rígido ou resistente a mudanças',
    cores: ['verde', 'marrom', 'azul escuro'],
    pedras: ['esmeralda', 'jaspe', 'safira']
  },
  5: {
    energia: 'Liberdade e Aventura',
    foco: 'mudanças e experiências',
    oportunidades: 'explorar novos horizontes, viajar, experimentar',
    desafios: 'evitar instabilidade e falta de compromisso',
    cores: ['turquesa', 'prata', 'azul claro'],
    pedras: ['turquesa', 'aquamarina', 'aventurina']
  },
  6: {
    energia: 'Harmonia e Cuidado',
    foco: 'família e responsabilidades',
    oportunidades: 'cuidar dos outros, harmonizar ambientes, curar',
    desafios: 'não se sacrificar excessivamente pelos outros',
    cores: ['verde', 'rosa', 'azul'],
    pedras: ['quartzo rosa', 'esmeralda', 'jade']
  },
  7: {
    energia: 'Sabedoria e Introspecção',
    foco: 'estudos e espiritualidade',
    oportunidades: 'aprofundar conhecimentos, meditar, pesquisar',
    desafios: 'evitar isolamento e pessimismo',
    cores: ['violeta', 'índigo', 'prata'],
    pedras: ['ametista', 'fluorita', 'sodalita']
  },
  8: {
    energia: 'Poder e Conquista',
    foco: 'negócios e reconhecimento',
    oportunidades: 'alcançar posições de poder, conquistar objetivos materiais',
    desafios: 'não se tornar dominador ou materialista',
    cores: ['preto', 'dourado', 'vermelho escuro'],
    pedras: ['onix', 'granada', 'pirita']
  },
  9: {
    energia: 'Compaixão e Finalização',
    foco: 'serviço e encerramento de ciclos',
    oportunidades: 'ajudar a humanidade, finalizar projetos, ensinar',
    desafios: 'evitar martírio e ressentimento',
    cores: ['branco', 'ouro', 'todas as cores'],
    pedras: ['quartzo branco', 'opala', 'cristal de rocha']
  }
};

const sincroniasPorCombinacao = {
  1: 'Uma energia de manifestação poderosa se forma, ideal para materializar sonhos',
  2: 'Energia de cooperação cósmica favorece relacionamentos e parcerias',
  3: 'Vibração criativa intensa permite expressão artística excepcional',
  4: 'Força construtiva se amplifica, perfeita para projetos duradouros',
  5: 'Energia de mudança e aventura se intensifica, trazendo oportunidades únicas',
  6: 'Harmonia universal favorece cura e cuidado com outros',
  7: 'Sabedoria ancestral se manifesta, ideal para insights espirituais',
  8: 'Poder de conquista se multiplica, excelente para sucessos materiais',
  9: 'Energia de conclusão e serviço se eleva, tempo de ajudar e finalizar'
};

export async function POST(request: NextRequest) {
  try {
    const body: DailyBlogRequest = await request.json();
    const { diaPessoal, numeroDestino, mesPessoal, anoPessoal, nomeUsuario, palavrasChave } = body;

    // Calcular número de sincronia
    const numeroSincronia = (numeroDestino + diaPessoal) % 9 === 0 ? 9 : (numeroDestino + diaPessoal) % 9;
    
    // Dados do dia pessoal
    const energiaDia = energiasPorNumero[diaPessoal as keyof typeof energiasPorNumero];
    const energiaDestino = energiasPorNumero[numeroDestino as keyof typeof energiasPorNumero];
    
    // Primeira notícia - Energia do Dia
    const primeiraNoticia = {
      titulo: `Sua Energia do Dia Pessoal ${diaPessoal}`,
      subtitulo: energiaDia.energia,
      conteudo: `Hoje, ${nomeUsuario.split(' ')[0]}, você está sob a influência do número ${diaPessoal}, que ressoa com ${energiaDia.energia.toLowerCase()}. 

Esta é uma jornada especial onde o universo conspira para que você possa ${energiaDia.foco}. Sua alma está alinhada com vibrações que favorecem ${energiaDia.oportunidades}.

**Oportunidades do Dia:**
• ${energiaDia.oportunidades}
• Conexão com sua essência numerológica
• Potencialização de talentos naturais

**Pontos de Atenção:**
• ${energiaDia.desafios}
• Manter o equilíbrio entre ação e reflexão

**Cores Favoráveis:** ${energiaDia.cores.join(', ')}
**Pedras Recomendadas:** ${energiaDia.pedras.join(', ')}`,
      categoria: 'Energia Pessoal',
      numeroFoco: diaPessoal,
      momento: 'Manhã - momento ideal para sintonizar com a energia do dia'
    };

    // Segunda notícia - Sincronias
    const segundaNoticia = {
      titulo: `Sincronia Numerológica: ${numeroDestino} + ${diaPessoal} = ${numeroSincronia}`,
      subtitulo: 'Alinhamento Cósmico Especial',
      conteudo: `A combinação mágica entre seu Número do Destino ${numeroDestino} (${energiaDestino.energia}) e o Dia Pessoal ${diaPessoal} (${energiaDia.energia}) cria uma sinergia única representada pelo número ${numeroSincronia}.

${sincroniasPorCombinacao[numeroSincronia as keyof typeof sincroniasPorCombinacao]}

**Esta Sincronia Traz:**
• Alinhamento entre propósito de vida e energia diária
• Potencialização de suas características naturais
• Oportunidades para crescimento acelerado
• Conexão profunda com o fluxo universal

**Seu Ano Pessoal ${anoPessoal}** e **Mês Pessoal ${mesPessoal}** também contribuem para este alinhamento cósmico especial, criando um portal de manifestação único.

**Palavras-chave de Hoje:** ${palavrasChave.slice(0, 3).join(', ')}

**Ritual Sugerido:** Ao acordar, respire profundamente 3 vezes e mentalize o número ${numeroSincronia}, permitindo que sua energia se integre ao seu campo áurico.`,
      categoria: 'Sincronias Cósmicas',
      numeroFoco: numeroSincronia,
      momento: 'Durante o dia - observe os sinais e sincronias'
    };

    // Dica especial baseada no período
    const dicaEspecial = {
      titulo: 'Dica Numerológica Avançada',
      conteudo: `Em um Ano Pessoal ${anoPessoal} e Mês Pessoal ${mesPessoal}, sua sensibilidade numerológica está amplificada. 

Preste atenção aos números que aparecem repetidamente hoje - horários, placas, documentos. Eles podem conter mensagens importantes do universo especificamente para você.

**Números para Observar:** ${numeroDestino}, ${diaPessoal}, ${numeroSincronia}, ${mesPessoal}${anoPessoal}`,
      categoria: 'Insight Místico'
    };

    const response = {
      success: true,
      data: {
        blogPosts: [primeiraNoticia, segundaNoticia],
        dicaEspecial,
        energiaDominante: energiaDia.energia,
        numeroSincronia,
        timestamp: new Date().toISOString(),
        validoAte: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erro ao gerar blog diário:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
