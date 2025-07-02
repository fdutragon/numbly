// Tabela pitagórica tradicional
const TABELA_PITAGORICA: { [key: string]: number } = {
  'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'I': 9,
  'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'O': 6, 'P': 7, 'Q': 8, 'R': 9,
  'S': 1, 'T': 2, 'U': 3, 'V': 4, 'W': 5, 'X': 6, 'Y': 7, 'Z': 8
};

// Função para converter data para formato brasileiro
function formatarDataBrasileira(data: string | Date): string {
  const dataObj = typeof data === 'string' ? new Date(data) : data;
  const dia = dataObj.getDate().toString().padStart(2, '0');
  const mes = (dataObj.getMonth() + 1).toString().padStart(2, '0');
  const ano = dataObj.getFullYear().toString();
  return `${dia}/${mes}/${ano}`;
}

// Função para extrair componentes da data (formato brasileiro DD/MM/YYYY)
function extrairComponentesData(dataNascimento: string): { dia: number, mes: number, ano: number, dataFormatada: string } {
  // Se a data vier no formato brasileiro DD/MM/YYYY ou DD-MM-YYYY
  if (dataNascimento.includes('/') || dataNascimento.includes('-')) {
    const separador = dataNascimento.includes('/') ? '/' : '-';
    const partes = dataNascimento.split(separador);
    
    if (partes.length === 3) {
      const dia = parseInt(partes[0]);
      const mes = parseInt(partes[1]);
      const ano = parseInt(partes[2]);
      
      return {
        dia,
        mes,
        ano,
        dataFormatada: `${dia.toString().padStart(2, '0')}/${mes.toString().padStart(2, '0')}/${ano}`
      };
    }
  }
  
  // Fallback para formato ISO ou outros formatos
  const data = new Date(dataNascimento);
  return {
    dia: data.getDate(),
    mes: data.getMonth() + 1,
    ano: data.getFullYear(),
    dataFormatada: formatarDataBrasileira(data)
  };
}

// Função para separar vogais e consoantes
function separarVogaisConsoantes(nome: string): { vogais: string[], consoantes: string[] } {
  const nomeFormatado = nome.toUpperCase().replace(/[^A-Z]/g, '');
  const vogais = nomeFormatado.split('').filter(letra => 'AEIOU'.includes(letra));
  const consoantes = nomeFormatado.split('').filter(letra => !'AEIOU'.includes(letra));
  
  return { vogais, consoantes };
}

// Função para calcular valor numerológico de uma string
function calcularValorString(texto: string): number {
  return texto.split('').reduce((total, letra) => total + (TABELA_PITAGORICA[letra] || 0), 0);
}

// Função para reduzir número a um único dígito, respeitando números mestres
function reduzirNumero(numero: number, preservarMestres: boolean = true): number {
  if (preservarMestres && (numero === 11 || numero === 22 || numero === 33)) {
    return numero;
  }
  
  while (numero > 9) {
    numero = numero.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0);
    if (preservarMestres && (numero === 11 || numero === 22 || numero === 33)) {
      return numero;
    }
  }
  return numero;
}

// Função para calcular número do destino a partir da data de nascimento
export function calcularNumeroDestino(dataNascimento: string): number {
  const { dia, mes, ano } = extrairComponentesData(dataNascimento);
  
  const numeroCompleto = dia + mes + ano;
  return reduzirNumero(numeroCompleto);
}

// Função para calcular número da sorte baseado no nome
export function calcularNumeroSorte(nome: string): number {
  const nomeFormatado = nome.toUpperCase().replace(/[^A-Z]/g, '');
  const soma = calcularValorString(nomeFormatado);
  return reduzirNumero(soma);
}

// Interpretações numerológicas
const interpretacoes = {
  1: {
    potencial: "Liderança natural, pioneirismo, independência e originalidade",
    bloqueios: ["Arrogância", "Impaciência", "Teimosia"],
    desafios: ["Aprender a trabalhar em equipe", "Desenvolver humildade"],
    fortalezas: ["Iniciativa", "Coragem", "Determinação"],
    amor: "Busca parceiros que admirem sua liderança, mas precisa aprender a ceder",
    carreira: "Empreendedorismo, liderança executiva, inovação, consultorias estratégicas",
    espiritualidade: "Busca pela autodescoberta e liderança espiritual através da ação"
  },
  2: {
    potencial: "Cooperação, diplomacia, sensibilidade e capacidade de mediar conflitos",
    bloqueios: ["Insegurança", "Dependência emocional", "Indecisão"],
    desafios: ["Desenvolver autoconfiança", "Aprender a tomar decisões sozinho"],
    fortalezas: ["Empatia", "Colaboração", "Intuição"],
    amor: "Parceiro ideal para relacionamentos harmoniosos e duradouros",
    carreira: "Diplomacia, recursos humanos, trabalho em equipe, mediação de conflitos",
    espiritualidade: "Desenvolvimento da intuição e conexão emocional com o divino"
  },
  3: {
    potencial: "Criatividade, comunicação, otimismo e expressão artística",
    bloqueios: ["Dispersão", "Superficialidade", "Críticas destrutivas"],
    desafios: ["Focar energia criativa", "Desenvolver disciplina"],
    fortalezas: ["Carisma", "Inspiração", "Alegria"],
    amor: "Precisa de um parceiro que valorize sua criatividade e liberdade",
    carreira: "Arte, comunicação, marketing, entretenimento, educação criativa",
    espiritualidade: "Expressão criativa como forma de conexão com a fonte universal"
  },
  4: {
    potencial: "Organização, praticidade, estabilidade e construção sólida",
    bloqueios: ["Rigidez", "Resistência a mudanças", "Pessimismo"],
    desafios: ["Abraçar flexibilidade", "Encontrar equilíbrio trabalho-vida"],
    fortalezas: ["Confiabilidade", "Persistência", "Método"],
    amor: "Busca relacionamentos estáveis e seguros, mas pode ser possessivo",
    carreira: "Engenharia, arquitetura, administração, gestão de projetos, construção",
    espiritualidade: "Disciplina espiritual através de práticas concretas e constantes"
  },
  5: {
    potencial: "Liberdade, aventura, versatilidade e capacidade de adaptação",
    bloqueios: ["Instabilidade", "Irresponsabilidade", "Impaciência"],
    desafios: ["Encontrar compromisso", "Desenvolver responsabilidade"],
    fortalezas: ["Dinamismo", "Curiosidade", "Adaptabilidade"],
    amor: "Precisa de liberdade no relacionamento, mas deve aprender fidelidade",
    carreira: "Vendas, turismo, jornalismo, tecnologia, trabalhos que exigem versatilidade",
    espiritualidade: "Exploração de diferentes caminhos espirituais com liberdade"
  },
  6: {
    potencial: "Cuidado, responsabilidade familiar, harmonia e cura",
    bloqueios: ["Controle excessivo", "Sacrifício desnecessário", "Crítica"],
    desafios: ["Aprender a receber", "Estabelecer limites saudáveis"],
    fortalezas: ["Compaixão", "Lealdade", "Proteção"],
    amor: "Partner dedicado, mas pode ser superprotetor",
    carreira: "Saúde, educação, serviço social, terapias, cuidado familiar",
    espiritualidade: "Serviço ao próximo como manifestação do amor divino"
  },
  7: {
    potencial: "Espiritualidade, análise profunda, intuição e sabedoria",
    bloqueios: ["Isolamento", "Ceticismo excessivo", "Frieza emocional"],
    desafios: ["Conectar-se emocionalmente", "Compartilhar conhecimento"],
    fortalezas: ["Insight", "Profundidade", "Mistério"],
    amor: "Precisa de um parceiro intelectual que respeite seu espaço",
    carreira: "Pesquisa, ciência, espiritualidade, análise, consultoria especializada",
    espiritualidade: "Busca profunda pela verdade através de estudo e contemplação"
  },
  8: {
    potencial: "Ambição, poder material, liderança executiva e sucesso",
    bloqueios: ["Materialismo", "Autoritarismo", "Obsessão pelo poder"],
    desafios: ["Equilibrar sucesso e relacionamentos", "Usar poder com sabedoria"],
    fortalezas: ["Determinação", "Organização", "Visão de negócios"],
    amor: "Atrai parceiros bem-sucedidos, mas deve equilibrar carreira e amor",
    carreira: "Negócios, finanças, política, direito, posições executivas de alto nível",
    espiritualidade: "Transformação material como reflexo do crescimento espiritual"
  },
  9: {
    potencial: "Humanitarismo, compaixão universal, sabedoria e generosidade",
    bloqueios: ["Idealismo excessivo", "Desilusão", "Mártir"],
    desafios: ["Aceitar imperfeições humanas", "Cuidar de si mesmo"],
    fortalezas: ["Altruísmo", "Visão ampla", "Inspiração"],
    amor: "Ama a humanidade, mas deve aprender a amar indivíduos específicos",
    carreira: "ONGs, trabalho humanitário, educação, arte com propósito social",
    espiritualidade: "Compaixão universal e dedicação ao bem da humanidade"
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

// Interface expandida para mapa numerológico completo
export interface MapaNumerologicoCompleto {
  // Números básicos
  numeroDestino: number;
  numeroAlma: number;
  numeroExpressao: number;
  numeroPersonalidadeExterna: number;
  numeroSorte: number;
  
  // Números avançados
  numeroMaturidade: number;
  desafioPrincipal: number;
  desejoOculto: number;
  poderInterior: number;
  
  // Números especiais
  numerosCarmicos: number[];
  numerosMestres: number[];
  
  // Análise temporal
  anoPessoal: number;
  mesPessoal: number;
  
  // Frequência numérica
  frequenciaNumerica: { [key: number]: number };
  numerosDominantes: number[];
  numerosFaltantes: number[];
  
  // Interpretações
  potencial: string;
  bloqueios: string[];
  desafios: string[];
  fortalezas: string[];
  amor: string;
  carreira: string;
  espiritualidade: string;
  
  // Ciclo de vida
  cicloVida: {
    fase: string;
    descricao: string;
    periodo: string;
    numeroRegente: number;
  };
  
  // Compatibilidade base
  numerosCompatíveis: number[];
  numerosDesafiadores: number[];
  
  // Resumo do perfil
  dominioVibracional: string;
  palavrasChave: string[];
  
  // Detalhes dos cálculos
  calculosDetalhados: {
    destinoCalculo: string;
    almaCalculo: string;
    expressaoCalculo: string;
    personalidadeCalculo: string;
  };
}

// Função principal para gerar mapa completo
export function gerarMapaNumerologicoCompleto(
  nome: string, 
  dataNascimento: string,
  mes: number = new Date().getMonth() + 1,
  ano: number = new Date().getFullYear()
): MapaNumerologicoCompleto {
  // Calcular todos os números
  const numeroDestino = calcularNumeroDestino(dataNascimento);
  const numeroAlma = calcularNumeroAlma(nome);
  const numeroExpressao = calcularNumeroExpressao(nome);
  const numeroPersonalidadeExterna = calcularPersonalidadeExterna(nome);
  const numeroSorte = calcularNumeroSorte(nome);
  const numeroMaturidade = calcularNumeroMaturidade(nome, dataNascimento);
  const desafioPrincipal = calcularDesafioPrincipal(dataNascimento);
  const desejoOculto = calcularDesejoOculto(nome);
  const poderInterior = calcularPoderInterior(nome, dataNascimento);
  
  // Números especiais
  const numerosCarmicos = identificarNumerosCarmicos(nome, dataNascimento);
  const numerosMestres = identificarNumerosMestres(nome, dataNascimento);
  
  // Análise temporal
  const anoPessoal = calcularAnoPessoal(dataNascimento, ano);
  const mesPessoal = calcularMesPessoal(dataNascimento, mes, ano);
  
  // Frequência numérica
  const frequenciaNumerica = calcularFrequenciaNumerica(nome);
  const numerosDominantes = Object.entries(frequenciaNumerica)
    .filter(([_, freq]) => freq >= 3)
    .map(([num, _]) => parseInt(num));
  const numerosFaltantes = Array.from({length: 9}, (_, i) => i + 1)
    .filter(num => !frequenciaNumerica[num]);
  
  // Interpretações base
  const interpretacao = interpretacoes[numeroDestino as keyof typeof interpretacoes];
  const idade = calcularIdade(dataNascimento);
  const ciclo = calcularCicloVidaAvancado(idade, numeroDestino);
  
  // Determinar domínio vibracional
  const dominioVibracional = determinarDominioVibracional(numeroDestino, numeroExpressao, numeroAlma);
  
  // Números compatíveis e desafiadores
  const { compatíveis, desafiadores } = calcularNumerosCompatibilidade(numeroDestino);
  
  return {
    numeroDestino,
    numeroAlma,
    numeroExpressao,
    numeroPersonalidadeExterna,
    numeroSorte,
    numeroMaturidade,
    desafioPrincipal,
    desejoOculto,
    poderInterior,
    numerosCarmicos,
    numerosMestres,
    anoPessoal,
    mesPessoal,
    frequenciaNumerica,
    numerosDominantes,
    numerosFaltantes,
    potencial: interpretacao.potencial,
    bloqueios: interpretacao.bloqueios,
    desafios: interpretacao.desafios,
    fortalezas: interpretacao.fortalezas,
    amor: interpretacao.amor,
    carreira: gerarInterpretacaoCarreira(numeroDestino, numeroExpressao),
    espiritualidade: gerarInterpretacaoEspiritual(numeroAlma, numeroDestino),
    cicloVida: ciclo,
    numerosCompatíveis: compatíveis,
    numerosDesafiadores: desafiadores,
    dominioVibracional,
    palavrasChave: gerarPalavrasChave(numeroDestino, numeroAlma, numeroExpressao),
    calculosDetalhados: {
      destinoCalculo: gerarCalculoDetalhado('destino', dataNascimento),
      almaCalculo: gerarCalculoDetalhado('alma', nome),
      expressaoCalculo: gerarCalculoDetalhado('expressao', nome),
      personalidadeCalculo: gerarCalculoDetalhado('personalidade', nome)
    }
  };
}

function calcularIdade(dataNascimento: string): number {
  const hoje = new Date();
  const { dia, mes, ano } = extrairComponentesData(dataNascimento);
  
  let idade = hoje.getFullYear() - ano;
  const mesAtual = hoje.getMonth() + 1;
  const diaAtual = hoje.getDate();
  
  if (mesAtual < mes || (mesAtual === mes && diaAtual < dia)) {
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

// Função para calcular ciclo de vida avançado
function calcularCicloVidaAvancado(idade: number, numeroDestino: number) {
  let fase: string;
  let descricao: string;
  let periodo: string;
  let numeroRegente: number;
  
  if (idade < 30) {
    fase = "Formação";
    descricao = "Período de descoberta pessoal e estabelecimento de bases sólidas";
    periodo = "0-30 anos";
    numeroRegente = numeroDestino;
  } else if (idade < 60) {
    fase = "Manifestação";
    descricao = "Época de realização profissional e consolidação de objetivos";
    periodo = "30-60 anos";
    numeroRegente = reduzirNumero(numeroDestino + 1, false);
  } else {
    fase = "Transcendência";
    descricao = "Momento de compartilhar sabedoria e orientar a próxima geração";
    periodo = "60+ anos";
    numeroRegente = reduzirNumero(numeroDestino + 2, false);
  }
  
  return { fase, descricao, periodo, numeroRegente };
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

// 2. Número da Personalidade Externa (Consoantes)
export function calcularPersonalidadeExterna(nome: string): number {
  const { consoantes } = separarVogaisConsoantes(nome);
  const soma = calcularValorString(consoantes.join(''));
  return reduzirNumero(soma);
}

// 3. Número da Alma/Motivação Interior (Vogais)
export function calcularNumeroAlma(nome: string): number {
  const { vogais } = separarVogaisConsoantes(nome);
  const soma = calcularValorString(vogais.join(''));
  return reduzirNumero(soma);
}

// 4. Número de Expressão/Personalidade Total (Nome completo)
export function calcularNumeroExpressao(nome: string): number {
  const nomeFormatado = nome.toUpperCase().replace(/[^A-Z]/g, '');
  const soma = calcularValorString(nomeFormatado);
  return reduzirNumero(soma);
}

// 6. Número de Maturidade (Destino + Expressão)
export function calcularNumeroMaturidade(nome: string, dataNascimento: string): number {
  const destino = calcularNumeroDestino(dataNascimento);
  const expressao = calcularNumeroExpressao(nome);
  return reduzirNumero(destino + expressao);
}

// 7. Número do Desafio Principal
export function calcularDesafioPrincipal(dataNascimento: string): number {
  const { dia, mes, ano } = extrairComponentesData(dataNascimento);
  const diaReduzido = reduzirNumero(dia, false);
  const mesReduzido = reduzirNumero(mes, false);
  const anoReduzido = reduzirNumero(ano, false);
  
  const numeros = [diaReduzido, mesReduzido, anoReduzido].sort((a, b) => a - b);
  return Math.abs(numeros[2] - numeros[0]); // Diferença entre maior e menor
}

// 8. Número do Desejo Oculto (Letras mais frequentes)
export function calcularDesejoOculto(nome: string): number {
  const nomeFormatado = nome.toUpperCase().replace(/[^A-Z]/g, '');
  const frequencia: { [key: string]: number } = {};
  
  nomeFormatado.split('').forEach(letra => {
    frequencia[letra] = (frequencia[letra] || 0) + 1;
  });
  
  const letrasMaisFrequentes = Object.entries(frequencia)
    .filter(([_, freq]) => freq > 1)
    .map(([letra, freq]) => letra.repeat(freq))
    .join('');
    
  if (letrasMaisFrequentes.length === 0) {
    return calcularNumeroExpressao(nome); // Fallback
  }
  
  const soma = calcularValorString(letrasMaisFrequentes);
  return reduzirNumero(soma);
}

// 9. Número do Poder Interior (Números mestres e repetições)
export function calcularPoderInterior(nome: string, dataNascimento: string): number {
  const expressao = calcularNumeroExpressao(nome);
  const destino = calcularNumeroDestino(dataNascimento);
  
  // Verifica se há números mestres
  if ([11, 22, 33].includes(expressao) || [11, 22, 33].includes(destino)) {
    return Math.max(expressao, destino);
  }
  
  return reduzirNumero(expressao + destino);
}

// 10. Números Cármicos
export function identificarNumerosCarmicos(nome: string, dataNascimento: string): number[] {
  const numerosCarmicos = [13, 14, 16, 19];
  const encontrados: number[] = [];
  
  // Verifica na data
  const somaData = calcularSomaCompleta(dataNascimento);
  if (numerosCarmicos.includes(somaData)) {
    encontrados.push(somaData);
  }
  
  // Verifica no nome
  const somaNome = calcularSomaCompletaNome(nome);
  if (numerosCarmicos.includes(somaNome)) {
    encontrados.push(somaNome);
  }
  
  return [...new Set(encontrados)]; // Remove duplicatas
}

// 11. Números Mestres
export function identificarNumerosMestres(nome: string, dataNascimento: string): number[] {
  const numerosMestres = [11, 22, 33];
  const encontrados: number[] = [];
  
  const expressao = calcularNumeroExpressao(nome);
  const alma = calcularNumeroAlma(nome);
  const personalidade = calcularPersonalidadeExterna(nome);
  const destino = calcularNumeroDestino(dataNascimento);
  
  [expressao, alma, personalidade, destino].forEach(num => {
    if (numerosMestres.includes(num)) {
      encontrados.push(num);
    }
  });
  
  return [...new Set(encontrados)];
}

// Funções auxiliares para cálculos cármicos
function calcularSomaCompleta(dataNascimento: string): number {
  const { dia, mes, ano } = extrairComponentesData(dataNascimento);
  return dia + mes + ano; // Não reduz para verificar números cármicos
}

function calcularSomaCompletaNome(nome: string): number {
  const nomeFormatado = nome.toUpperCase().replace(/[^A-Z]/g, '');
  return calcularValorString(nomeFormatado); // Não reduz para verificar números cármicos
}

// Função para calcular ano pessoal
export function calcularAnoPessoal(dataNascimento: string, ano: number = new Date().getFullYear()): number {
  const { dia, mes } = extrairComponentesData(dataNascimento);
  
  const soma = dia + mes + ano;
  return reduzirNumero(soma, false);
}

// Função para calcular mês pessoal
export function calcularMesPessoal(dataNascimento: string, mes: number, ano: number): number {
  const anoPessoal = calcularAnoPessoal(dataNascimento, ano);
  return reduzirNumero(anoPessoal + mes, false);
}

// Função para calcular frequência dos números no nome
export function calcularFrequenciaNumerica(nome: string): { [key: number]: number } {
  const nomeFormatado = nome.toUpperCase().replace(/[^A-Z]/g, '');
  const frequencia: { [key: number]: number } = {};
  
  nomeFormatado.split('').forEach(letra => {
    const valor = TABELA_PITAGORICA[letra];
    if (valor) {
      frequencia[valor] = (frequencia[valor] || 0) + 1;
    }
  });
  
  return frequencia;
}

// Função para determinar domínio vibracional
function determinarDominioVibracional(destino: number, expressao: number, alma: number): string {
  const dominios = {
    1: "Liderança e Inovação",
    2: "Mediação e Cooperação", 
    3: "Comunicação e Arte",
    4: "Construção e Estabilidade",
    5: "Aventura e Liberdade",
    6: "Cuidado e Harmonia",
    7: "Espiritualidade e Análise",
    8: "Negócios e Poder",
    9: "Humanitarismo e Sabedoria",
    11: "Inspiração e Intuição",
    22: "Construção Magistral",
    33: "Mestre Curador"
  };
  
  // Prioridade: números mestres > destino > expressão > alma
  if ([11, 22, 33].includes(destino)) return dominios[destino as keyof typeof dominios];
  if ([11, 22, 33].includes(expressao)) return dominios[expressao as keyof typeof dominios];
  if ([11, 22, 33].includes(alma)) return dominios[alma as keyof typeof dominios];
  
  return dominios[destino as keyof typeof dominios] || "Desenvolvimento Integral";
}

// Função para gerar interpretação de carreira
function gerarInterpretacaoCarreira(destino: number, expressao: number): string {
  const carreiras = {
    1: "Empreendedorismo, liderança executiva, inovação, consultorias estratégicas",
    2: "Diplomacia, recursos humanos, trabalho em equipe, mediação de conflitos",
    3: "Arte, comunicação, marketing, entretenimento, educação criativa",
    4: "Engenharia, arquitetura, administração, gestão de projetos, construção",
    5: "Vendas, turismo, jornalismo, tecnologia, trabalhos que exigem versatilidade",
    6: "Saúde, educação, serviço social, terapias, cuidado familiar",
    7: "Pesquisa, ciência, espiritualidade, análise, consultoria especializada",
    8: "Negócios, finanças, política, direito, posições executivas de alto nível",
    9: "ONGs, trabalho humanitário, educação, arte com propósito social",
    11: "Inspiração, motivação, trabalho visionário, liderança espiritual",
    22: "Grandes projetos, arquitetura social, construção de instituições",
    33: "Cura, terapia, orientação espiritual, trabalho transformacional"
  };
  
  return carreiras[destino as keyof typeof carreiras] || "Múltiplas áreas de atuação";
}

// Função para gerar interpretação espiritual
function gerarInterpretacaoEspiritual(alma: number, destino: number): string {
  const caminhos = {
    1: "Busca pela autodescoberta e liderança espiritual através da ação",
    2: "Desenvolvimento da intuição e conexão emocional com o divino",
    3: "Expressão criativa como forma de conexão com a fonte universal",
    4: "Disciplina espiritual através de práticas concretas e constantes",
    5: "Exploração de diferentes caminhos espirituais com liberdade",
    6: "Serviço ao próximo como manifestação do amor divino",
    7: "Busca profunda pela verdade através de estudo e contemplação",
    8: "Transformação material como reflexo do crescimento espiritual",
    9: "Compaixão universal e dedicação ao bem da humanidade",
    11: "Canalização de insights espirituais para inspirar outros",
    22: "Manifestação de ideais espirituais em projetos concretos",
    33: "Cura e transformação através do amor incondicional"
  };
  
  return caminhos[alma as keyof typeof caminhos] || "Caminho espiritual único e integrado";
}

// Função para calcular números compatíveis e desafiadores
function calcularNumerosCompatibilidade(numero: number): { compatíveis: number[], desafiadores: number[] } {
  const compatibilidades = {
    1: { compatíveis: [1, 5, 7], desafiadores: [2, 6, 8] },
    2: { compatíveis: [2, 4, 6, 8], desafiadores: [1, 5, 9] },
    3: { compatíveis: [3, 6, 9], desafiadores: [4, 7, 8] },
    4: { compatíveis: [2, 4, 8], desafiadores: [1, 3, 5] },
    5: { compatíveis: [1, 5, 9], desafiadores: [2, 4, 6] },
    6: { compatíveis: [2, 3, 6, 9], desafiadores: [1, 5, 7] },
    7: { compatíveis: [1, 7], desafiadores: [2, 3, 8] },
    8: { compatíveis: [2, 4, 8], desafiadores: [1, 3, 7] },
    9: { compatíveis: [3, 6, 9], desafiadores: [1, 4, 8] }
  };
  
  return compatibilidades[numero as keyof typeof compatibilidades] || 
         { compatíveis: [numero], desafiadores: [] };
}

// Função para gerar palavras-chave
function gerarPalavrasChave(destino: number, alma: number, expressao: number): string[] {
  const palavras = {
    1: ["Liderança", "Pioneirismo", "Independência", "Originalidade"],
    2: ["Cooperação", "Diplomacia", "Sensibilidade", "Parceria"],
    3: ["Criatividade", "Comunicação", "Alegria", "Expressão"],
    4: ["Estabilidade", "Organização", "Praticidade", "Construção"],
    5: ["Liberdade", "Aventura", "Mudança", "Versatilidade"],
    6: ["Harmonia", "Responsabilidade", "Cuidado", "Família"],
    7: ["Espiritualidade", "Análise", "Introspecção", "Sabedoria"],
    8: ["Sucesso", "Poder", "Ambição", "Materialização"],
    9: ["Humanitarismo", "Compaixão", "Universalidade", "Generosidade"],
    11: ["Inspiração", "Intuição", "Visão", "Iluminação"],
    22: ["Maestria", "Construção", "Visão prática", "Liderança"],
    33: ["Cura", "Amor", "Compaixão", "Transformação"]
  };
  
  const todasPalavras = [
    ...(palavras[destino as keyof typeof palavras] || []),
    ...(palavras[alma as keyof typeof palavras] || []),
    ...(palavras[expressao as keyof typeof palavras] || [])
  ];
  
  return [...new Set(todasPalavras)].slice(0, 6);
}

// Função para gerar cálculo detalhado
function gerarCalculoDetalhado(tipo: string, valor: string): string {
  switch (tipo) {
    case 'destino':
      const data = new Date(valor);
      const dia = data.getDate();
      const mes = data.getMonth() + 1;
      const ano = data.getFullYear();
      return `${dia}/${mes}/${ano} = ${dia} + ${mes} + ${ano} = ${dia + mes + ano} = ${reduzirNumero(dia + mes + ano)}`;
      
    case 'alma':
      const { vogais } = separarVogaisConsoantes(valor);
      const somaVogais = calcularValorString(vogais.join(''));
      return `Vogais: ${vogais.join('')} = ${somaVogais} = ${reduzirNumero(somaVogais)}`;
      
    case 'expressao':
      const nomeCompleto = valor.toUpperCase().replace(/[^A-Z]/g, '');
      const somaCompleta = calcularValorString(nomeCompleto);
      return `Nome: ${nomeCompleto} = ${somaCompleta} = ${reduzirNumero(somaCompleta)}`;
      
    case 'personalidade':
      const { consoantes } = separarVogaisConsoantes(valor);
      const somaConsoantes = calcularValorString(consoantes.join(''));
      return `Consoantes: ${consoantes.join('')} = ${somaConsoantes} = ${reduzirNumero(somaConsoantes)}`;
      
    default:
      return '';
  }
}
