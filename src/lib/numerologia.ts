// Função para calcular número do destino a partir da data de nascimento
export function calcularNumeroDestino(dataNascimento: string): number {
  const data = new Date(dataNascimento);
  const dia = data.getDate();
  const mes = data.getMonth() + 1;
  const ano = data.getFullYear();
  
  // Soma todos os dígitos da data
  const numeroCompleto = dia + mes + ano;
  
  // Reduz a um único dígito (1-9)
  return reduzirNumero(numeroCompleto);
}

// Função para reduzir número a um único dígito
function reduzirNumero(numero: number): number {
  while (numero > 9) {
    numero = numero.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0);
  }
  return numero;
}

// Função para calcular número da sorte baseado no nome
export function calcularNumeroSorte(nome: string): number {
  const valores: { [key: string]: number } = {
    'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'I': 9,
    'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'O': 6, 'P': 7, 'Q': 8, 'R': 9,
    'S': 1, 'T': 2, 'U': 3, 'V': 4, 'W': 5, 'X': 6, 'Y': 7, 'Z': 8
  };
  
  const soma = nome.toUpperCase()
    .replace(/[^A-Z]/g, '')
    .split('')
    .reduce((total, letra) => total + (valores[letra] || 0), 0);
    
  return reduzirNumero(soma);
}

// Interpretações numerológicas
const interpretacoes = {
  1: {
    potencial: "Liderança natural, pioneirismo, independência e originalidade",
    bloqueios: ["Arrogância", "Impaciência", "Teimosia"],
    desafios: ["Aprender a trabalhar em equipe", "Desenvolver humildade"],
    fortalezas: ["Iniciativa", "Coragem", "Determinação"],
    amor: "Busca parceiros que admirem sua liderança, mas precisa aprender a ceder"
  },
  2: {
    potencial: "Cooperação, diplomacia, sensibilidade e capacidade de mediar conflitos",
    bloqueios: ["Insegurança", "Dependência emocional", "Indecisão"],
    desafios: ["Desenvolver autoconfiança", "Aprender a tomar decisões sozinho"],
    fortalezas: ["Empatia", "Colaboração", "Intuição"],
    amor: "Parceiro ideal para relacionamentos harmoniosos e duradouros"
  },
  3: {
    potencial: "Criatividade, comunicação, otimismo e expressão artística",
    bloqueios: ["Dispersão", "Superficialidade", "Críticas destrutivas"],
    desafios: ["Focar energia criativa", "Desenvolver disciplina"],
    fortalezas: ["Carisma", "Inspiração", "Alegria"],
    amor: "Precisa de um parceiro que valorize sua criatividade e liberdade"
  },
  4: {
    potencial: "Organização, praticidade, estabilidade e construção sólida",
    bloqueios: ["Rigidez", "Resistência a mudanças", "Pessimismo"],
    desafios: ["Abraçar flexibilidade", "Encontrar equilíbrio trabalho-vida"],
    fortalezas: ["Confiabilidade", "Persistência", "Método"],
    amor: "Busca relacionamentos estáveis e seguros, mas pode ser possessivo"
  },
  5: {
    potencial: "Liberdade, aventura, versatilidade e capacidade de adaptação",
    bloqueios: ["Instabilidade", "Irresponsabilidade", "Impaciência"],
    desafios: ["Encontrar compromisso", "Desenvolver responsabilidade"],
    fortalezas: ["Dinamismo", "Curiosidade", "Adaptabilidade"],
    amor: "Precisa de liberdade no relacionamento, mas deve aprender fidelidade"
  },
  6: {
    potencial: "Cuidado, responsabilidade familiar, harmonia e cura",
    bloqueios: ["Controle excessivo", "Sacrifício desnecessário", "Crítica"],
    desafios: ["Aprender a receber", "Estabelecer limites saudáveis"],
    fortalezas: ["Compaixão", "Lealdade", "Proteção"],
    amor: "Partner dedicado, mas pode ser superprotetor"
  },
  7: {
    potencial: "Espiritualidade, análise profunda, intuição e sabedoria",
    bloqueios: ["Isolamento", "Ceticismo excessivo", "Frieza emocional"],
    desafios: ["Conectar-se emocionalmente", "Compartilhar conhecimento"],
    fortalezas: ["Insight", "Profundidade", "Mistério"],
    amor: "Precisa de um parceiro intelectual que respeite seu espaço"
  },
  8: {
    potencial: "Ambição, poder material, liderança executiva e sucesso",
    bloqueios: ["Materialismo", "Autoritarismo", "Obsessão pelo poder"],
    desafios: ["Equilibrar sucesso e relacionamentos", "Usar poder com sabedoria"],
    fortalezas: ["Determinação", "Organização", "Visão de negócios"],
    amor: "Atrai parceiros bem-sucedidos, mas deve equilibrar carreira e amor"
  },
  9: {
    potencial: "Humanitarismo, compaixão universal, sabedoria e generosidade",
    bloqueios: ["Idealismo excessivo", "Desilusão", "Mártir"],
    desafios: ["Aceitar imperfeições humanas", "Cuidar de si mesmo"],
    fortalezas: ["Altruísmo", "Visão ampla", "Inspiração"],
    amor: "Ama a humanidade, mas deve aprender a amar indivíduos específicos"
  }
};

export interface MapaNumerologico {
  numeroDestino: number;
  numeroSorte: number;
  potencial: string;
  bloqueios: string[];
  desafios: string[];
  fortalezas: string[];
  amor: string;
  cicloVida: {
    fase: string;
    descricao: string;
    periodo: string;
  };
}

export function gerarMapaNumerologico(
  nome: string, 
  dataNascimento: string
): MapaNumerologico {
  const numeroDestino = calcularNumeroDestino(dataNascimento);
  const numeroSorte = calcularNumeroSorte(nome);
  const interpretacao = interpretacoes[numeroDestino as keyof typeof interpretacoes];
  
  // Calcular ciclo de vida baseado na idade
  const idade = calcularIdade(dataNascimento);
  const ciclo = calcularCicloVida(idade);
  
  return {
    numeroDestino,
    numeroSorte,
    potencial: interpretacao.potencial,
    bloqueios: interpretacao.bloqueios,
    desafios: interpretacao.desafios,
    fortalezas: interpretacao.fortalezas,
    amor: interpretacao.amor,
    cicloVida: ciclo
  };
}

function calcularIdade(dataNascimento: string): number {
  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();
  
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  
  return idade;
}

function calcularCicloVida(idade: number) {
  if (idade < 30) {
    return {
      fase: "Descoberta",
      descricao: "Período de autoconhecimento e estabelecimento de bases",
      periodo: "0-30 anos"
    };
  } else if (idade < 60) {
    return {
      fase: "Construção",
      descricao: "Época de realização profissional e consolidação",
      periodo: "30-60 anos"
    };
  } else {
    return {
      fase: "Sabedoria",
      descricao: "Momento de compartilhar experiências e orientar outros",
      periodo: "60+ anos"
    };
  }
}

// Função para calcular compatibilidade entre duas pessoas
export function calcularCompatibilidade(
  pessoa1: { nome: string; dataNascimento: string },
  pessoa2: { nome: string; dataNascimento: string }
) {
  const num1 = calcularNumeroDestino(pessoa1.dataNascimento);
  const num2 = calcularNumeroDestino(pessoa2.dataNascimento);
  
  // Matriz de compatibilidade (simplificada)
  const compatibilidadeMatrix: { [key: string]: number } = {
    '11': 85, '12': 70, '13': 90, '14': 60, '15': 75, '16': 80, '17': 65, '18': 70, '19': 88,
    '22': 95, '23': 85, '24': 90, '25': 65, '26': 92, '27': 70, '28': 75, '29': 80,
    '33': 90, '34': 70, '35': 95, '36': 85, '37': 80, '38': 65, '39': 92,
    '44': 88, '45': 60, '46': 85, '47': 75, '48': 95, '49': 70,
    '55': 80, '56': 70, '57': 85, '58': 60, '59': 75,
    '66': 95, '67': 80, '68': 85, '69': 90,
    '77': 88, '78': 70, '79': 85,
    '88': 90, '89': 75,
    '99': 95
  };
  
  const key1 = `${num1}${num2}`;
  const key2 = `${num2}${num1}`;
  const score = compatibilidadeMatrix[key1] || compatibilidadeMatrix[key2] || 70;
  
  return {
    score,
    areas: {
      amor: Math.max(60, score + Math.floor(Math.random() * 20) - 10),
      comunicacao: Math.max(60, score + Math.floor(Math.random() * 20) - 10),
      financas: Math.max(60, score + Math.floor(Math.random() * 20) - 10),
      familia: Math.max(60, score + Math.floor(Math.random() * 20) - 10),
    },
    descricao: gerarDescricaoCompatibilidade(num1, num2, score),
    sugestoes: gerarSugestoes(num1, num2)
  };
}

function gerarDescricaoCompatibilidade(num1: number, num2: number, score: number): string {
  if (score >= 90) {
    return "Vocês formam uma dupla extraordinária! Há uma sintonia natural que permite crescimento mútuo e realizações conjuntas.";
  } else if (score >= 80) {
    return "Ótima compatibilidade! Vocês se complementam bem e podem construir um relacionamento sólido com comunicação aberta.";
  } else if (score >= 70) {
    return "Boa compatibilidade com potencial de crescimento. Alguns ajustes na comunicação podem fortalecer ainda mais a relação.";
  } else {
    return "Compatibilidade desafiadora, mas não impossível. Exigirá paciência, compreensão e esforço mútuo para funcionar.";
  }
}

function gerarSugestoes(num1: number, num2: number): string[] {
  const sugestoes = [
    "Pratiquem a escuta ativa nas conversas diárias",
    "Reservem tempo de qualidade juntos regularmente",
    "Respeitem as diferenças individuais de cada um",
    "Comuniquem expectativas de forma clara e honesta",
    "Celebrem as conquistas um do outro"
  ];
  
  return sugestoes.slice(0, 3);
}
