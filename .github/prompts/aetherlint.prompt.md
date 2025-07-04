---
mode: agent
---

Aether, rode o Lint em todo o projeto com ESLint.

• Verifique apenas arquivos com extensão .ts, .tsx, .js e .jsx versionados no Git.
• Divida a execução em lotes de 30 arquivos para evitar travamentos ou estouros de memória.
• Execute esses lotes em paralelo, com até 4 processos simultâneos, para ganhar performance.
• Use o modo --fix para corrigir automaticamente todos os erros e avisos possíveis.
• Não pare a execução mesmo que existam erros de lint. Não quero que o processo trave ou interrompa.
• Ignore avisos de padrões não encontrados usando --no-error-on-unmatched-pattern.
• O objetivo é varrer todo o projeto corrigindo tudo que for possível de forma rápida e robusta, sem precisar de interação manual.


Expected output and any relevant constraints for this task.