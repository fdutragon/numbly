# Numbly - Guia de Qualidade de Código

Este documento descreve as ferramentas e processos para manter a qualidade do código no projeto Numbly.

## 🔧 Ferramentas Configuradas

### ESLint

- **Configuração**: `eslint.config.mjs`
- **Regras**: Next.js Core Web Vitals + TypeScript
- **Ignora**: Arquivos de build (`.next/`, `build/`, `dist/`)

### Prettier

- **Configuração**: `.prettierrc`
- **Estilo**:
  - Single quotes
  - Semicolons
  - 2 espaços de indentação
  - Linha máxima de 80 caracteres

### TypeScript

- **Configuração**: `tsconfig.json`
- **Verificação de tipos**: `tsc --noEmit`

## 📜 Scripts Disponíveis

### Desenvolvimento

```bash
npm run dev          # Inicia o servidor de desenvolvimento
```

### Linting

```bash
npm run lint         # Executa ESLint básico
npm run lint:fix     # Executa ESLint e corrige automaticamente
npm run lint:strict  # ESLint com zero warnings permitidos
```

### Formatação

```bash
npm run format       # Formata todos os arquivos com Prettier
npm run format:check # Verifica se todos os arquivos estão formatados
```

### Verificação de Tipos

```bash
npm run type-check   # Verifica tipos TypeScript sem gerar arquivos
```

### Verificação Completa

```bash
npm run check-all    # Executa todas as verificações (tipos + lint + format)
```

### Build

```bash
npm run build        # Gera build de produção
npm run start        # Inicia o servidor de produção
```

## 🚀 Fluxo de Trabalho Recomendado

### Antes de Commit

1. Execute a verificação completa:

   ```bash
   npm run check-all
   ```

2. Se houver erros de formatação:

   ```bash
   npm run format
   ```

3. Se houver erros de linting:
   ```bash
   npm run lint:fix
   ```

### Durante o Desenvolvimento

- Use `npm run dev` para desenvolvimento com hot reload
- Execute `npm run type-check` periodicamente para verificar tipos
- Configure seu editor para executar ESLint e Prettier automaticamente

### Antes de Deploy

```bash
npm run check-all && npm run build
```

## 📋 Checklist de Qualidade

- [ ] ✅ Sem erros de TypeScript
- [ ] ✅ Sem erros de ESLint
- [ ] ✅ Zero warnings de ESLint
- [ ] ✅ Código formatado com Prettier
- [ ] ✅ Build de produção funciona
- [ ] ✅ Todos os testes passam (quando implementados)

## 🔧 Configuração do Editor

### VS Code

Instale as extensões:

- ESLint
- Prettier - Code formatter
- TypeScript Importer

Configuração recomendada (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## 📁 Estrutura de Arquivos Ignorados

### ESLint Ignora:

- `.next/**/*` - Arquivos de build do Next.js
- `out/**/*` - Output de build estático
- `build/**/*` - Builds gerais
- `dist/**/*` - Distribuição
- `node_modules/**/*` - Dependências
- `public/sw.js` - Service Worker gerado

### Prettier Ignora:

- Mesmos arquivos do ESLint
- `package-lock.json` - Arquivo de lock do npm
- `*.min.js` - Arquivos minificados
- `*.min.css` - CSS minificado

## 🎯 Metas de Qualidade

- **0 warnings** no ESLint
- **100% formatação** consistente
- **0 erros** de TypeScript
- **Build sempre funcional**

## 🔍 Troubleshooting

### Erro: "No files matching pattern"

- Certifique-se de estar no diretório raiz do projeto
- Verifique se os arquivos existem nos paths configurados

### Prettier não funciona

- Verifique se o arquivo `.prettierrc` existe
- Execute `npm run format` manualmente

### ESLint reclamando de arquivos de build

- Verifique se a configuração `ignores` está correta no `eslint.config.mjs`
- Execute `npm run build` para regenerar os arquivos

---

**Última atualização**: $(Get-Date -Format "yyyy-MM-dd")
**Versão**: 1.0.0
