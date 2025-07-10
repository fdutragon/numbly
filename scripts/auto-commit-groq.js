// scripts/auto-commit-groq.js
// Faz commit automático usando mensagem gerada pela Groq API

const { execSync } = require('child_process');
const fetch = require('node:https').request ? require('node:https') : require('https');

require('dotenv').config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  console.error('GROQ_API_KEY não encontrado no .env');
  process.exit(1);
}

function getGitDiff() {
  try {
    return execSync('git diff --cached', { encoding: 'utf8' });
  } catch (e) {
    console.error('Erro ao obter diff do git:', e.message);
    process.exit(1);
  }
}

async function getCommitMessage(diff) {
  const prompt = `Gere apenas a mensagem de commit git, curta, clara e objetiva (máx. 60 caracteres), sem comentários antes ou depois, para as seguintes mudanças de código. Responda apenas com a mensagem de commit, sem aspas, sem prefixo, sem explicação:\n${diff}`;
  const response = await fetchGroq(prompt);
  return response;
}

function fetchGroq(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      messages: [
        { role: 'system', content: 'Você é um gerador de mensagens de commit git.' },
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.1-8b-instant',
      max_tokens: 60
    });
    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      }
    };
    const req = fetch.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (!json.choices || !json.choices[0] || !json.choices[0].message || !json.choices[0].message.content) {
            console.error('Resposta bruta da Groq:', body);
            return reject('Resposta inválida da Groq');
          }
          const msg = json.choices[0].message.content.trim();
          resolve(msg.replace(/^"|"$/g, ''));
        } catch (e) {
          console.error('Resposta bruta da Groq:', body);
          reject('Erro ao processar resposta da Groq: ' + e.message);
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  execSync('git add .');
  const diff = getGitDiff();
  if (!diff.trim()) {
    console.log('Nenhuma mudança para commitar.');
    return;
  }
  console.log('Gerando mensagem de commit via Groq...');
  const commitMsg = await getCommitMessage(diff);
  execSync(`git commit -m "${commitMsg.replace(/"/g, '\"')}"`);
  console.log('Commit realizado com mensagem:', commitMsg);
}

main().catch(e => {
  console.error('Erro:', e);
  process.exit(1);
});
