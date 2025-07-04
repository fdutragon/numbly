const { execSync, spawnSync } = require('child_process');
const { readdirSync, statSync, writeFileSync } = require('fs');
const path = require('path');

const BATCH_SIZE = 50;

// Função para buscar arquivos recursivamente em um diretório
function getFilesRecursively(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  let files = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Ignorar diretórios node_modules e .next
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next') {
        files = [...files, ...getFilesRecursively(fullPath, extensions)];
      }
    } else if (extensions.includes(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

// Função para verificar quantos erros cada arquivo tem
function getFilesWithErrorCount(files) {
  const result = [];
  
  for (const file of files) {
    try {
      // Execute ESLint sem fazer correções, apenas para contar erros
      const { stderr } = spawnSync('npx', ['eslint', file, '--format', 'json'], { encoding: 'utf8' });
      let errorCount = 0;
      
      try {
        // Tente analisar a saída JSON, se possível
        const output = JSON.parse(stderr);
        if (Array.isArray(output) && output.length > 0) {
          errorCount = output[0].errorCount + output[0].warningCount;
        }
      } catch (e) {
        // Se não conseguir analisar o JSON, só ignorar
      }
      
      result.push({ file, errorCount });
    } catch (error) {
      console.error(`Erro ao verificar o arquivo ${file}:`, error);
      result.push({ file, errorCount: 0 });
    }
  }
  
  // Ordenar por contagem de erros (decrescente)
  return result.sort((a, b) => b.errorCount - a.errorCount);
}

// Diretório principal do projeto
const projectRoot = process.cwd();

// Priorizar os diretórios mais importantes
const priorities = [
  'src/lib',
  'src/hooks',
  'src/app/api',
  'src/app',
  'src/components',
  'scripts',
  'prisma'
];

let allFiles = [];

// Adicionar arquivos priorizados primeiro
priorities.forEach(priority => {
  try {
    const fullPath = path.join(projectRoot, priority);
    if (statSync(fullPath).isDirectory()) {
      allFiles.push(...getFilesRecursively(fullPath));
    }
  } catch (error) {
    console.log(`Diretório não encontrado: ${priority}`);
  }
});

// Adicionar quaisquer outros arquivos no projeto que não foram incluídos
const rootFiles = getFilesRecursively(projectRoot);
allFiles = [...allFiles, ...rootFiles.filter(file => !allFiles.includes(file))];

// Remover arquivos duplicados (caso exista algum)
allFiles = [...new Set(allFiles)];

// Opcionalmente, podemos filtrar para manter apenas arquivos com problemas
// Para isso, precisaríamos executar o ESLint em cada arquivo sem corrigir primeiro
// e manter apenas os que têm problemas

// Dividir em lotes
const batches = [];
for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
  batches.push(allFiles.slice(i, i + BATCH_SIZE));
}

console.log(`Total de arquivos: ${allFiles.length}`);
console.log(`Total de lotes: ${batches.length}`);

// Processar o lote especificado via argumento da linha de comando
const batchIndex = parseInt(process.argv[2] || "0");
if (batchIndex >= 0 && batchIndex < batches.length) {
  const batchFiles = batches[batchIndex];
  console.log(`Processando lote ${batchIndex + 1}/${batches.length} (${batchFiles.length} arquivos)`);
  
  try {
    const filePaths = batchFiles.join(' ');
    execSync(`npx eslint ${filePaths} --fix`, { stdio: 'inherit' });
    console.log(`Lote ${batchIndex + 1} concluído com sucesso.`);
  } catch (error) {
    console.error(`Erro ao processar o lote ${batchIndex + 1}:`, error);
  }
} else {
  console.error(`Lote inválido. Escolha um número entre 0 e ${batches.length - 1}`);
}
