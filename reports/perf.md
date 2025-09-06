# Performance Observações

- **Imagens não otimizadas**: uso de `<img>` em vez de `<Image/>` em `src/components/editor/editor-ui/image-component.tsx`, `src/components/editor/editor-ui/inline-image-component.tsx` e `src/components/editor/editor-ui/katex-renderer.tsx` pode causar LCP mais lento.
- **Hooks com dependências ausentes**: `useEffect` e `useCallback` sem todas as dependências (por exemplo em `use-update-toolbar.ts`, `markdown-toggle-plugin.tsx`, `component-picker-menu-plugin.tsx`) podem gerar renders extras.
- **Hooks fora do escopo padrão**: `useMemo` dentro de `Array.map` em `src/components/ui/chat.tsx` pode disparar re-renderizações desnecessárias.
- **Comentários `@ts-ignore`**: vários arquivos usam `@ts-ignore` sem justificativa, impedindo otimizações de build.
