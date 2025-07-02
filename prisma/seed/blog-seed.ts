import { PrismaClient, BlogPostType, ChallengeType, BadgeType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Plantando sementes místicas no blog...');

  // Criar posts iniciais
  const posts = [
    {
      title: 'Meditação da Aurora: Conectando com seu Dia Pessoal 1',
      content: `🌅 **Bem-vindo(a) ao seu dia de novos começos!**

Hoje, no seu dia pessoal 1, o universo te convida a ser pioneiro(a) da sua própria jornada. Este é um momento sagrado de plantio de sementes que florescerão ao longo do seu ciclo pessoal.

**🧘‍♀️ Prática da Manhã:**
- Sente-se confortavelmente, coluna ereta como uma árvore sagrada
- Respire profundamente 3 vezes, sentindo a energia de liderança despertando
- Visualize uma luz dourada emanando do seu coração
- Declare em silêncio: "Eu sou o criador da minha realidade"

**✨ Afirmação do Dia:**
"Minha coragem interior me guia a novos horizontes de possibilidades infinitas."

**🔥 Reflexão:**
Que novo projeto, hábito ou sonho você gostaria de iniciar hoje? O universo conspira a seu favor nos dias pessoais 1 - use essa energia de pioneirismo para dar o primeiro passo corajoso em direção aos seus sonhos.

Que esta meditação desperte o líder natural que habita em você. 🌟`,
      excerpt: 'Uma jornada guiada para despertar sua energia de liderança e novos começos.',
      type: 'DAILY_MEDITATION' as BlogPostType,
      personalDay: 1,
      lunarPhase: 'Crescente',
      numerologyFocus: 'Liderança e Novos Começos',
      meditationDuration: 900,
      tags: ['meditação', 'dia-pessoal-1', 'liderança', 'novos-começos'],
      category: 'Meditações Diárias'
    },
    
    {
      title: 'Os Mistérios do Número 11: Portal de Iluminação',
      content: `🔮 **O Número Mestre que Conecta Mundos**

O número 11 é conhecido como um dos números mestres mais poderosos da numerologia, representando intuição elevada, espiritualidade e iluminação. Quando este número aparece em sua vida, é um sinal de que você está sendo chamado(a) para despertar dons espirituais latentes.

**🌟 Características do Número 11:**
- **Intuição Amplificada:** Pessoas com forte influência do 11 possuem uma conexão natural com dimensões superiores
- **Sensibilidade Espiritual:** Captam energias sutis e frequentemente têm experiências místicas
- **Missão de Luz:** Vieram para elevar a vibração planetária através de sua presença
- **Dualidade Integrada:** Equilibram perfeitamente o material e o espiritual

**🔥 O Portal 11:11**
Sempre que você vê 11:11 no relógio, o universo está sussurrando: "Desperte! Este é um momento de manifestação poderosa." Use estes momentos para:
- Fazer um pedido ao universo
- Meditar por alguns segundos
- Enviar amor e luz para o mundo
- Afirmar sua conexão divina

**⚡ Trabalhando com a Energia do 11:**
1. **Meditação às 11:11:** Reserve alguns minutos diários para se conectar neste horário sagrado
2. **Journaling Intuitivo:** Escreva livremente, permitindo que mensagens fluam através de você
3. **Cristais Amplificadores:** Quartzo branco e ametista potencializam a energia do 11
4. **Práticas de Visualização:** Imagine-se como um canal de luz divina

**🌙 Mensagem dos Mestres:**
"O número 11 é uma ponte dourada entre a Terra e o Céu. Aqueles que carregam esta vibração são faróis de esperança em tempos sombrios, lembrando à humanidade de sua natureza divina."

Se o 11 aparece frequentemente em sua vida, aceite o chamado. Você é um(a) trabalhador(a) da luz, aqui para assistir na transformação planetária. ✨`,
      excerpt: 'Descubra os segredos místicos por trás do poderoso número mestre 11.',
      type: 'NUMEROLOGY_INSIGHT' as BlogPostType,
      numerologyFocus: 'Número Mestre 11',
      tags: ['numerologia', 'número-mestre', 'intuição', 'espiritualidade', '11:11'],
      category: 'Numerologia Sagrada'
    },

    {
      title: 'Ritual da Lua Nova: Plantando Sementes de Transformação',
      content: `🌑 **O Momento Mais Poderoso do Ciclo Lunar**

A Lua Nova representa o ventre cósmico onde novos sonhos são concebidos. É o momento perfeito para plantar sementes de intenção que florescerão durante o ciclo lunar completo.

**🕯️ Preparação do Espaço Sagrado:**
- Limpe fisicamente o espaço onde realizará o ritual
- Acenda uma vela branca (simbolizando novos começos)
- Queime incenso de sálvia ou palo santo para purificação
- Tenha papel e caneta para escrever suas intenções
- Coloque cristais como quartzo branco ou moonstone ao redor

**✨ O Ritual Passo a Passo:**

**1. Purificação Energética (5 min)**
- Feche os olhos e respire profundamente
- Visualize uma luz prateada da lua limpando sua aura
- Declare: "Libero tudo que não me serve mais"

**2. Conexão com a Lua Nova (5 min)**
- Olhe para onde a lua estaria no céu (mesmo invisível)
- Sinta sua energia receptiva e fértil
- Sussurre: "Grande Mãe Lua, abençoe minhas intenções"

**3. Plantio das Sementes (10 min)**
- Escreva até 3 intenções específicas no papel
- Para cada intenção, visualize-a já manifestada
- Sinta a gratidão como se já fosse real
- Dobre o papel e coloque sob a vela

**4. Selamento Energético (5 min)**
- Coloque as mãos sobre o coração
- Declare: "Entrego minhas intenções ao fluxo divino"
- Permita que a vela queime por mais alguns minutos
- Guarde o papel em local sagrado até a próxima lua nova

**🌱 Pós-Ritual:**
Nos próximos 28 dias, observe sinais do universo relacionados às suas intenções. A lua crescerá, e com ela, suas manifestações. Confie no timing divino.

**💫 Dica Mística:**
Se possível, realize este ritual descalço(a) na terra ou grama. A conexão direta com Gaia amplifica tremendamente o poder de manifestação.

Que suas sementes floresçam em jardins de abundância! 🌸`,
      excerpt: 'Um guia completo para aproveitar a energia sagrada da Lua Nova.',
      type: 'RITUAL_GUIDE' as BlogPostType,
      lunarPhase: 'Nova',
      tags: ['ritual', 'lua-nova', 'manifestação', 'intenções', 'magia-lunar'],
      category: 'Rituais Sagrados'
    },

    {
      title: 'Mensagem do Oráculo: O Chamado da Intuição',
      content: `🔮 **Uma Mensagem Direta dos Reinos Superiores**

*As névoas se abrem, e através do véu cósmico, uma voz sussurra...*

**"Querida alma em jornada,**

O momento presente carrega uma energia especial de despertar. Você tem sentido, não é mesmo? Aquela sensação sutil de que algo está mudando, de que novas portas estão se abrindo no tecido da realidade.

Sua intuição tem tentado se comunicar com você através de sinais sutis: números repetidos, sonhos vívidos, sincronicidades que fazem seu coração acelerar. Não ignore esses sussurros divinos.

**🌟 O Que os Espíritos Revelam:**
- Um ciclo importante está se completando em sua vida
- Novas oportunidades surgirão quando você menos esperar
- Alguém importante entrará em seu caminho nas próximas luas
- Seus dons espirituais estão se intensificando

**⚡ Orientação Prática:**
Nos próximos 7 dias, preste atenção especial aos seus sonhos. Mantenha um caderno ao lado da cama e anote qualquer fragmento que se lembrar ao acordar. As mensagens que você precisa ouvir virão através do mundo onírico.

**🕊️ Afirmação Canalizada:**
*"Eu confio na sabedoria infinita que flui através de mim. Minha intuição é meu guia mais confiável, e eu me abro para receber as orientações divinas que me são oferecidas a cada momento."*

**🌙 Bênção Final:**
Que a luz da lua ilumine seu caminho interior, que as estrelas sussurrem secrets antigos em seus ouvidos, e que seu coração permaneça aberto para receber as infinitas bênçãos que o universo tem reservado para você.

O oráculo se retira agora, mas sua presença permanece envolvendo você em amor e proteção."**

*As névoas se fecham, mas a mensagem ecoa em seu coração...*

💎 **Reflexão:** Como sua intuição tem tentado se comunicar com você ultimamente? Que sinais você pode ter ignorado?`,
      excerpt: 'Uma mensagem canalizada diretamente dos reinos espirituais para sua alma.',
      type: 'ORACLE_MESSAGE' as BlogPostType,
      lunarPhase: 'Crescente',
      cosmicEvent: 'Alinhamento intuitivo intensificado',
      tags: ['oráculo', 'intuição', 'mensagem-canalizada', 'orientação-espiritual'],
      category: 'Mensagens do Oráculo'
    },

    {
      title: 'Desvendando seu Caminho de Vida: A Numerologia da Alma',
      content: `🗝️ **A Chave Mestra da Sua Jornada Terrena**

Seu Caminho de Vida é o número mais importante do seu mapa numerológico. Calculado através da sua data de nascimento completa, ele revela a missão da sua alma nesta encarnação e os dons que você veio desenvolver.

**🧮 Como Calcular Seu Caminho de Vida:**

Exemplo com data 15/08/1990:
- Dia: 1 + 5 = 6
- Mês: 0 + 8 = 8  
- Ano: 1 + 9 + 9 + 0 = 19 → 1 + 9 = 10 → 1 + 0 = 1
- Total: 6 + 8 + 1 = 15 → 1 + 5 = 6

**Caminho de Vida = 6**

**🌟 Os 9 Caminhos Sagrados:**

**Caminho 1 - O Pioneiro** 🔥
*Missão:* Liderar e inovar
*Dons:* Coragem, independência, originalidade
*Desafio:* Equilibrar ego com humildade

**Caminho 2 - O Diplomata** 🤝
*Missão:* Harmonizar e cooperar
*Dons:* Sensibilidade, intuição, capacidade de mediação
*Desafio:* Desenvolver autoconfiança

**Caminho 3 - O Comunicador** 🎭
*Missão:* Inspirar através da criatividade
*Dons:* Expressão artística, otimismo, carisma
*Desafio:* Focar energia dispersa

**Caminho 4 - O Construtor** 🏗️
*Missão:* Criar bases sólidas
*Dons:* Disciplina, organização, confiabilidade
*Desafio:* Flexibilizar rigidez

**Caminho 5 - O Aventureiro** ✈️
*Missão:* Experimentar e ensinar liberdade
*Dons:* Versatilidade, curiosidade, magnetismo
*Desafio:* Encontrar estabilidade sem perder essência

**Caminho 6 - O Cuidador** 💖
*Missão:* Nutrir e curar
*Dons:* Compaixão, responsabilidade, senso de justiça
*Desafio:* Não se sacrificar em excesso

**Caminho 7 - O Místico** 🔮
*Missão:* Buscar e compartilhar sabedoria espiritual
*Dons:* Intuição profunda, análise, conexão com o divino
*Desafio:* Integrar espiritualidade com mundo material

**Caminho 8 - O Magnata** 💎
*Missão:* Dominar o mundo material com ética
*Dons:* Ambição, senso de justiça, poder de realização
*Desafio:* Não deixar o poder corromper

**Caminho 9 - O Humanitário** 🌍
*Missão:* Servir a humanidade
*Dons:* Compaixão universal, sabedoria, generosidade
*Desafio:* Aprender a receber

**🌈 Números Mestres:**

**Caminho 11 - O Iluminador** ⚡
Intuição elevada, inspiração espiritual, missão de despertar consciências

**Caminho 22 - O Mestre Construtor** 🏛️
Visão grandiosa, capacidade de materializar sonhos coletivos

**Caminho 33 - O Mestre Curador** 👼
Amor incondicional, cura através da palavra e exemplo

**💫 Vivendo Seu Caminho:**
Conhecer seu Caminho de Vida não é sobre limitação, mas sobre reconhecer os dons únicos que sua alma escolheu desenvolver. Quando você alinha suas ações com sua missão numerológica, a vida flui com mais propósito e satisfação.

**🔥 Exercício Prático:**
Calcule seu Caminho de Vida e reflita: como você já expressa essas qualidades? Onde ainda há espaço para crescimento? Que aspectos do seu caminho você tem resistido em abraçar?

Lembre-se: você escolheu este caminho antes de nascer. Confie na sabedoria da sua alma. ✨`,
      excerpt: 'Descubra a missão da sua alma através do número mais importante da numerologia.',
      type: 'NUMEROLOGY_INSIGHT' as BlogPostType,
      numerologyFocus: 'Caminho de Vida',
      tags: ['numerologia', 'caminho-de-vida', 'missão-da-alma', 'propósito'],
      category: 'Numerologia Sagrada'
    }
  ];

  // Criar desafios semanais
  const challenges = [
    {
      title: 'Semana da Gratidão Consciente',
      description: 'Durante 7 dias, pratique 1 minuto de gratidão após cada meditação ou leitura espiritual.',
      type: 'GRATITUDE' as ChallengeType,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      badgeReward: 'GUARDIAN_CONSTANCY' as BadgeType,
      creditsReward: 10,
      spiritualTheme: 'Abundância e Reconhecimento',
      personalDayFocus: 6
    },
    {
      title: 'Portal da Escrita Sagrada',
      description: 'Escreva no Diário da Alma por 5 dias consecutivos, conectando-se com sua voz interior.',
      type: 'JOURNALING' as ChallengeType,
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      badgeReward: 'SOUL_SCRIBE' as BadgeType,
      creditsReward: 15,
      spiritualTheme: 'Expressão Autêntica',
      personalDayFocus: 3
    }
  ];

  // Inserir posts
  for (const post of posts) {
    await prisma.blogPost.create({
      data: {
        ...post,
        views: Math.floor(Math.random() * 500) + 50,
        likes: Math.floor(Math.random() * 100) + 10
      }
    });
  }

  // Inserir desafios
  for (const challenge of challenges) {
    await prisma.weeklyChallenge.create({
      data: challenge
    });
  }

  console.log('✨ Blog místico populado com sucesso!');
  console.log(`📝 ${posts.length} posts criados`);
  console.log(`🏆 ${challenges.length} desafios criados`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Erro ao popular blog:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
